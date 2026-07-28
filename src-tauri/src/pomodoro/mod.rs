use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::AppHandle;
use chrono::{DateTime, Utc};
use std::sync::Mutex;
use std::collections::HashMap;

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
    active_states: Mutex<HashMap<String, PomodoroState>>,
}

impl PomodoroManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let db_path = crate::config::get_database_path(app_handle); 
        
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

        // Carrega os estados iniciais do banco para o cache em memória, garantindo que timers ativos fiquem pausados ao abrir o app
        let mut active_states = HashMap::new();
        if let Ok(mut stmt) = conn.prepare("SELECT user_id, is_running, start_time, work_minutes, break_minutes, cycle_type, cycles_completed, accumulated_seconds FROM pomodoro_v2") {
            let now = Utc::now();
            if let Ok(rows) = stmt.query_map([], |row| {
                let user_id: String = row.get(0)?;
                let raw_is_running: i32 = row.get(1)?;
                let start_time_str: Option<String> = row.get(2)?;
                let work_minutes: i32 = row.get(3)?;
                let break_minutes: i32 = row.get(4)?;
                let cycle_type: String = row.get(5)?;
                let cycles_completed: i32 = row.get(6)?;
                let mut accumulated_seconds: i32 = row.get(7)?;

                let start_time = start_time_str.and_then(|s| DateTime::parse_from_rfc3339(&s).ok().map(|dt| dt.with_timezone(&Utc)));

                if raw_is_running != 0 {
                    if let Some(st) = start_time {
                        let elapsed = (now - st).num_seconds();
                        if elapsed > 0 {
                            accumulated_seconds += elapsed as i32;
                        }
                    }
                }

                Ok((
                    user_id,
                    PomodoroState {
                        is_running: false,
                        start_time: None,
                        work_minutes,
                        break_minutes,
                        cycle_type,
                        cycles_completed,
                        accumulated_seconds,
                    }
                ))
            }) {
                for r in rows.flatten() {
                    // Atualiza o estado pausado no banco para persistência
                    let _ = conn.execute(
                        "UPDATE pomodoro_v2 SET is_running = 0, start_time = NULL, accumulated_seconds = ?1 WHERE user_id = ?2",
                        params![r.1.accumulated_seconds, r.0],
                    );
                    active_states.insert(r.0, r.1);
                }
            }
        }

        Self {
            db_path,
            active_states: Mutex::new(active_states),
        }
    }

    fn get_connection(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Failed to connect to DB");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Failed to set busy timeout");
        conn
    }

    fn get_state_from_db(&self, user_id: &str) -> PomodoroState {
        let conn = self.get_connection();
        let result = conn.query_row(
            "SELECT is_running, start_time, work_minutes, break_minutes, cycle_type, cycles_completed, accumulated_seconds FROM pomodoro_v2 WHERE user_id = ?1",
            params![user_id],
            |row| {
                let is_running: i32 = row.get(0)?;
                let start_time_str: Option<String> = row.get(1)?;
                let work_minutes: i32 = row.get(2)?;
                let break_minutes: i32 = row.get(3)?;
                let cycle_type: String = row.get(4)?;
                let cycles_completed: i32 = row.get(5)?;
                let mut accumulated_seconds: i32 = row.get(6)?;

                let start_time = start_time_str.and_then(|s| DateTime::parse_from_rfc3339(&s).ok().map(|dt| dt.with_timezone(&Utc)));

                if is_running != 0 {
                    if let Some(st) = start_time {
                        let elapsed = (Utc::now() - st).num_seconds();
                        if elapsed > 0 {
                            accumulated_seconds += elapsed as i32;
                        }
                    }
                    let _ = conn.execute(
                        "UPDATE pomodoro_v2 SET is_running = 0, start_time = NULL, accumulated_seconds = ?1 WHERE user_id = ?2",
                        params![accumulated_seconds, user_id],
                    );
                }

                Ok(PomodoroState {
                    is_running: false,
                    start_time: None,
                    work_minutes,
                    break_minutes,
                    cycle_type,
                    cycles_completed,
                    accumulated_seconds,
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

    pub fn get_state(&self, user_id: &str) -> PomodoroState {
        {
            let lock = self.active_states.lock().unwrap();
            if let Some(state) = lock.get(user_id) {
                return state.clone();
            }
        }

        let state = self.get_state_from_db(user_id);
        let mut lock = self.active_states.lock().unwrap();
        lock.insert(user_id.to_string(), state.clone());
        state
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

        let mut lock = self.active_states.lock().unwrap();
        lock.insert(user_id.to_string(), state.clone());
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
        let lock = self.active_states.lock().unwrap();
        lock.keys().cloned().collect()
    }

    pub fn advance_cycle(&self, user_id: &str, now: DateTime<Utc>) -> PomodoroState {
        let mut state = self.get_state(user_id);
        if state.is_running {
            let was_work = state.cycle_type == "Work";
            state.cycles_completed += if was_work { 1 } else { 0 };
            state.cycle_type = if was_work { "ShortBreak".to_string() } else { "Work".to_string() };
            state.start_time = Some(now);
            state.accumulated_seconds = 0;
            let _ = self.save_state(user_id, &state);
        }
        state
    }
}

#[tauri::command]
pub async fn pomodoro_get_pomodoro_state(state: tauri::State<'_, crate::AppState>, user_id: String) -> Result<PomodoroState, String> {
    Ok(state.pomo.get_state(&user_id))
}

#[tauri::command]
pub async fn pomodoro_next_cycle(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
) -> Result<PomodoroState, String> {
    use tauri::Emitter;
    let now = state.config.get_now();
    let new_state = state.pomo.advance_cycle(&user_id, now);
    let _ = app_handle.emit("pomo-tick", ());
    let notif_msg = if new_state.cycle_type == "ShortBreak" {
        "Ciclo de foco concluído! Hora do descanso."
    } else {
        "Descanso concluído! Hora de focar."
    };
    crate::notify_critical(&app_handle, "Aegis Pomodoro", notif_msg);
    Ok(new_state)
}

#[tauri::command]
pub async fn pomodoro_save_pomodoro_state(state: tauri::State<'_, crate::AppState>, user_id: String, pomo_state: PomodoroState) -> Result<(), String> {
    state.pomo.save_state(&user_id, &pomo_state)
}

#[tauri::command]
pub async fn pomodoro_record_pomodoro_session(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, crate::AppState>,
    session: PomodoroHistory,
) -> Result<(), String> {
    let res = state.pomo.record_session(session.clone());
    if res.is_ok() {
        let _ = crate::automation::evaluate_rules(&state, &app_handle, &session.user_id);
    }
    res
}

#[tauri::command]
pub async fn pomodoro_get_pomodoro_history(state: tauri::State<'_, crate::AppState>, user_id: String) -> Result<Vec<PomodoroHistory>, String> {
    Ok(state.pomo.get_history(&user_id))
}

#[tauri::command]
pub async fn pomodoro_clear_pomodoro_history(state: tauri::State<'_, crate::AppState>, user_id: String) -> Result<(), String> {
    state.pomo.clear_history(&user_id)
}

#[tauri::command]
pub async fn pomodoro_open_widget(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;
    
    if let Some(window) = app.get_webview_window("pomo-widget") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
        return Ok(());
    }

    let win_builder = tauri::WebviewWindowBuilder::new(
        &app,
        "pomo-widget",
        tauri::WebviewUrl::App("index.html".into())
    )
    .title("Aegis Pomodoro")
    .inner_size(240.0, 180.0)
    .min_inner_size(120.0, 100.0)
    .max_inner_size(320.0, 260.0)
    .resizable(true)
    .always_on_top(true)
    .decorations(false);

    let _window = win_builder.build().map_err(|e| e.to_string())?;
    Ok(())
}
