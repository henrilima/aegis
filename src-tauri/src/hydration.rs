use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct HydrationReminder {
    pub id: Option<i32>,
    pub user_id: String,
    pub reminder_type: String, 
    pub value: String,         
    pub start_time: Option<String>,
    pub enabled: bool,
}

pub struct HydrationManager {
    db_path: PathBuf,
}

impl HydrationManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
        let db_path = app_dir.join("passwords.db");
        
        let conn = Connection::open(&db_path).expect("Failed to open database");
        let _ = conn.execute("PRAGMA journal_mode=WAL", []);
        let _ = conn.busy_timeout(std::time::Duration::from_millis(5000));

        conn.execute(
            "CREATE TABLE IF NOT EXISTS hydration_reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                reminder_type TEXT NOT NULL,
                value TEXT NOT NULL,
                start_time TEXT,
                enabled INTEGER NOT NULL
            )",
            [],
        ).ok();

        let _ = conn.execute("ALTER TABLE hydration_reminders ADD COLUMN start_time TEXT", []);

        Self { db_path }
    }

    fn get_connection(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Failed to connect to DB");
        let _ = conn.busy_timeout(std::time::Duration::from_millis(5000));
        conn
    }

    pub fn list_reminders(&self, user_id: &str) -> Vec<HydrationReminder> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare("SELECT id, reminder_type, value, start_time, enabled FROM hydration_reminders WHERE user_id = ?1").unwrap();
        let rows = stmt.query_map(params![user_id], |row| {
            Ok(HydrationReminder {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                reminder_type: row.get(1)?,
                value: row.get(2)?,
                start_time: row.get(3)?,
                enabled: row.get::<_, i32>(4)? != 0,
            })
        }).unwrap();

        rows.map(|r| r.unwrap()).collect()
    }

    pub fn add_reminder(&self, reminder: HydrationReminder) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "INSERT INTO hydration_reminders (user_id, reminder_type, value, start_time, enabled) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![reminder.user_id, reminder.reminder_type, reminder.value, reminder.start_time, if reminder.enabled { 1 } else { 0 }],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_reminder(&self, id: i32) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute("DELETE FROM hydration_reminders WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_all_enabled_reminders(&self) -> Vec<HydrationReminder> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare("SELECT id, user_id, reminder_type, value, start_time, enabled FROM hydration_reminders WHERE enabled = 1").unwrap();
        let rows = stmt.query_map([], |row| {
             Ok(HydrationReminder {
                 id: Some(row.get(0)?),
                 user_id: row.get(1)?,
                 reminder_type: row.get(2)?,
                 value: row.get(3)?,
                 start_time: row.get(4)?,
                 enabled: row.get::<_, i32>(5)? != 0,
             })
        }).unwrap();

        rows.map(|r| r.unwrap()).collect()
    }
}
