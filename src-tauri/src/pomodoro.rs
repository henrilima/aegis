use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PomodoroState {
    pub is_running: bool,
    pub start_time: Option<DateTime<Utc>>,
    pub work_minutes: i32,
    pub break_minutes: i32,
    pub cycle_type: String, 
    pub cycles_completed: i32,
    pub accumulated_seconds: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PomodoroHistory {
    pub id: Option<i32>,
    pub user_id: String,
    pub work_minutes: i32,
    pub break_minutes: i32,
    pub cycles_done: i32,
    pub start_time: String,
    pub end_time: String,
}

pub struct PomodoroManager {
    db_path: PathBuf,
}

impl PomodoroManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
        let db_path = app_dir.join("passwords.db"); 
        
        let conn = Connection::open(&db_path).expect("Failed to open database");
        let _ = conn.execute("PRAGMA journal_mode=WAL", []);
        let _ = conn.busy_timeout(std::time::Duration::from_millis(5000));

        conn.execute(
            "CREATE TABLE IF NOT EXISTS pomodoro_v2 (
                user_id TEXT PRIMARY KEY,
                is_running INTEGER NOT NULL,
                start_time TEXT,
                work_minutes INTEGER NOT NULL DEFAULT 25,
                break_minutes INTEGER NOT NULL DEFAULT 5,
                cycle_type TEXT NOT NULL,
                cycles_completed INTEGER NOT NULL,
                accumulated_seconds INTEGER NOT NULL DEFAULT 0
            )",
            [],
        ).ok();

        let _ = conn.execute("ALTER TABLE pomodoro_v2 ADD COLUMN accumulated_seconds INTEGER NOT NULL DEFAULT 0", []);

        conn.execute(
            "CREATE TABLE IF NOT EXISTS pomodoro_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                work_minutes INTEGER NOT NULL,
                break_minutes INTEGER NOT NULL,
                cycles_done INTEGER NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL
            )",
            [],
        ).ok();

        Self { db_path }
    }

    fn get_connection(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Failed to connect to DB");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Failed to set busy timeout");
        conn
    }

    pub fn get_state(&self, user_id: &str) -> PomodoroState {
        let conn = self.get_connection();
        let result = conn.query_row(
            "SELECT is_running, start_time, work_minutes, break_minutes, cycle_type, cycles_completed, accumulated_seconds FROM pomodoro_v2 WHERE user_id = ?1",
            params![user_id],
            |row| {
                let is_running: i32 = row.get(0)?;
                let start_time_str: Option<String> = row.get(1)?;
                let start_time = start_time_str.and_then(|s| DateTime::parse_from_rfc3339(&s).ok().map(|dt| dt.with_timezone(&Utc)));
                
                Ok(PomodoroState {
                    is_running: is_running != 0,
                    start_time,
                    work_minutes: row.get(2)?,
                    break_minutes: row.get(3)?,
                    cycle_type: row.get(4)?,
                    cycles_completed: row.get(5)?,
                    accumulated_seconds: row.get(6)?,
                })
            }
        );

        result.unwrap_or(PomodoroState {
            is_running: false,
            start_time: None,
            work_minutes: 25,
            break_minutes: 5,
            cycle_type: "Work".to_string(),
            cycles_completed: 0,
            accumulated_seconds: 0,
        })
    }

    pub fn save_state(&self, user_id: &str, state: &PomodoroState) -> Result<(), String> {
        let conn = self.get_connection();
        let start_time_str = state.start_time.map(|dt| dt.to_rfc3339());
        
        conn.execute(
            "INSERT INTO pomodoro_v2 (user_id, is_running, start_time, work_minutes, break_minutes, cycle_type, cycles_completed, accumulated_seconds)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
             ON CONFLICT(user_id) DO UPDATE SET
                is_running = excluded.is_running,
                start_time = excluded.start_time,
                work_minutes = excluded.work_minutes,
                break_minutes = excluded.break_minutes,
                cycle_type = excluded.cycle_type,
                cycles_completed = excluded.cycles_completed,
                accumulated_seconds = excluded.accumulated_seconds",
            params![
                user_id,
                if state.is_running { 1 } else { 0 },
                start_time_str,
                state.work_minutes,
                state.break_minutes,
                state.cycle_type,
                state.cycles_completed,
                state.accumulated_seconds
            ],
        ).map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn record_session(&self, session: PomodoroHistory) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "INSERT INTO pomodoro_history (user_id, work_minutes, break_minutes, cycles_done, start_time, end_time)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                session.user_id,
                session.work_minutes,
                session.break_minutes,
                session.cycles_done,
                session.start_time,
                session.end_time
            ],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_history(&self, user_id: &str) -> Vec<PomodoroHistory> {
        let conn = self.get_connection();
        let mut stmt = match conn.prepare(
            "SELECT id, work_minutes, break_minutes, cycles_done, start_time, end_time 
             FROM pomodoro_history WHERE user_id = ?1 ORDER BY id DESC LIMIT 5"
        ) {
            Ok(s) => s,
            Err(_) => return vec![],
        };

        let rows = match stmt.query_map(params![user_id], |row| {
            Ok(PomodoroHistory {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                work_minutes: row.get(1)?,
                break_minutes: row.get(2)?,
                cycles_done: row.get(3)?,
                start_time: row.get(4)?,
                end_time: row.get(5)?,
            })
        }) {
            Ok(r) => r,
            Err(_) => return vec![],
        };

        rows.filter_map(|r| r.ok()).collect()
    }

    pub fn clear_history(&self, user_id: &str) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute("DELETE FROM pomodoro_history WHERE user_id = ?1", params![user_id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_all_user_ids(&self) -> Vec<String> {
        let conn = self.get_connection();
        let mut stmt = match conn.prepare("SELECT user_id FROM pomodoro_v2") {
            Ok(s) => s,
            Err(_) => return vec![],
        };
        let rows = match stmt.query_map([], |row| row.get(0)) {
            Ok(r) => r,
            Err(_) => return vec![],
        };
        rows.filter_map(|r| r.ok()).collect()
    }
}
