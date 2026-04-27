use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct AppAlarm {
    pub id: Option<i32>,
    pub user_id: String,
    pub title: String,
    pub alarm_type: String,           // "fixed" ou "interval"
    pub time: String,                 // HH:MM (Horário fixo ou início do intervalo)
    pub interval_minutes: Option<i32>,
    pub last_triggered: Option<String>, // ISO8601 do último disparo (para intervalos)
    pub sound_file: String,           // Ex: "Plin.mp3"
    pub icon: String,                 // Ex: "Bell", "Droplet", "Activity"
    pub color: Option<String>,        // Ex: "red", "blue", "teal"
    pub enabled: bool,
}

pub struct AlarmManager {
    db_path: PathBuf,
}

impl AlarmManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
        let db_path = app_dir.join("config.db");
        
        let conn = Connection::open(&db_path).expect("Failed to open database");
        let _ = conn.execute("PRAGMA journal_mode=WAL", []);
        let _ = conn.busy_timeout(std::time::Duration::from_millis(5000));

        conn.execute(
            "CREATE TABLE IF NOT EXISTS app_alarms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                time TEXT NOT NULL,
                sound_file TEXT NOT NULL,
                icon TEXT NOT NULL,
                enabled INTEGER NOT NULL
            )",
            [],
        ).ok();

        // Migrações de schema
        let _ = conn.execute("ALTER TABLE app_alarms ADD COLUMN alarm_type TEXT NOT NULL DEFAULT 'fixed'", []);
        let _ = conn.execute("ALTER TABLE app_alarms ADD COLUMN interval_minutes INTEGER", []);
        let _ = conn.execute("ALTER TABLE app_alarms ADD COLUMN last_triggered TEXT", []);
        let _ = conn.execute("ALTER TABLE app_alarms ADD COLUMN color TEXT", []);

        Self { db_path }
    }

    fn get_connection(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Failed to connect to DB");
        let _ = conn.busy_timeout(std::time::Duration::from_millis(5000));
        conn
    }

    pub fn list_alarms(&self, user_id: &str) -> Vec<AppAlarm> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare("SELECT id, title, time, sound_file, icon, enabled, alarm_type, interval_minutes, last_triggered, color FROM app_alarms WHERE user_id = ?1").unwrap();
        let rows = stmt.query_map(params![user_id], |row| {
            Ok(AppAlarm {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                title: row.get(1)?,
                time: row.get(2)?,
                sound_file: row.get(3)?,
                icon: row.get(4)?,
                enabled: row.get::<_, i32>(5)? != 0,
                alarm_type: row.get(6)?,
                interval_minutes: row.get(7)?,
                last_triggered: row.get(8)?,
                color: row.get(9)?,
            })
        }).unwrap();

        rows.map(|r| r.unwrap()).collect()
    }

    pub fn add_alarm(&self, alarm: AppAlarm) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "INSERT INTO app_alarms (user_id, title, time, sound_file, icon, enabled, alarm_type, interval_minutes, last_triggered, color) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![alarm.user_id, alarm.title, alarm.time, alarm.sound_file, alarm.icon, if alarm.enabled { 1 } else { 0 }, alarm.alarm_type, alarm.interval_minutes, alarm.last_triggered, alarm.color],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn update_alarm(&self, alarm: AppAlarm) -> Result<(), String> {
        let conn = self.get_connection();
        let id = alarm.id.ok_or("ID do alarme ausente")?;
        conn.execute(
            "UPDATE app_alarms SET title = ?1, time = ?2, sound_file = ?3, icon = ?4, enabled = ?5, alarm_type = ?6, interval_minutes = ?7, last_triggered = ?8, color = ?9 WHERE id = ?10 AND user_id = ?11",
            params![alarm.title, alarm.time, alarm.sound_file, alarm.icon, if alarm.enabled { 1 } else { 0 }, alarm.alarm_type, alarm.interval_minutes, alarm.last_triggered, alarm.color, id, alarm.user_id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_alarm(&self, id: i32, user_id: &str) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute("DELETE FROM app_alarms WHERE id = ?1 AND user_id = ?2", params![id, user_id]).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn toggle_alarm(&self, id: i32, user_id: &str) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "UPDATE app_alarms SET enabled = CASE WHEN enabled = 1 THEN 0 ELSE 1 END WHERE id = ?1 AND user_id = ?2",
            params![id, user_id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn update_last_triggered(&self, id: i32, iso_time: &str) {
        let conn = self.get_connection();
        let _ = conn.execute("UPDATE app_alarms SET last_triggered = ?1 WHERE id = ?2", params![iso_time, id]);
    }

    pub fn list_all_enabled_alarms(&self) -> Vec<AppAlarm> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare("SELECT id, user_id, title, time, sound_file, icon, enabled, alarm_type, interval_minutes, last_triggered, color FROM app_alarms WHERE enabled = 1").unwrap();
        let rows = stmt.query_map([], |row| {
            Ok(AppAlarm {
                id: Some(row.get(0)?),
                user_id: row.get(1)?,
                title: row.get(2)?,
                time: row.get(3)?,
                sound_file: row.get(4)?,
                icon: row.get(5)?,
                enabled: row.get::<_, i32>(6)? != 0,
                alarm_type: row.get(7)?,
                interval_minutes: row.get(8)?,
                last_triggered: row.get(9)?,
                color: row.get(10)?,
            })
        }).unwrap();

        rows.map(|r| r.unwrap()).collect()
    }
}
