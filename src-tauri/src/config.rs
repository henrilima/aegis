use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use rusqlite::{params, Connection};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct AppConfig {
    pub minimize_on_close: bool,
    pub start_at_login: bool,
    pub high_priority_notifications: bool,
    pub start_minimized: bool,
}

pub struct ConfigManager {
    db_path: PathBuf,
}

impl ConfigManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
        std::fs::create_dir_all(&app_dir).ok();
        let db_path = app_dir.join("config.db");
        
        let conn = Connection::open(&db_path).expect("Failed to open config database");
        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )",
            [],
        ).ok();

        
        let defaults = [
            ("minimize_on_close", "true"),
            ("start_at_login", "false"),
            ("high_priority_notifications", "false"),
            ("start_minimized", "false"),
        ];

        for (key, val) in defaults {
            conn.execute(
                "INSERT OR IGNORE INTO settings (key, value) VALUES (?1, ?2)",
                params![key, val],
            ).ok();
        }

        Self { db_path }
    }

    fn get_connection(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Failed to connect to config DB");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Failed to set busy timeout");
        conn
    }

    pub fn get_config(&self) -> AppConfig {
        let conn = self.get_connection();
        let minimize_on_close: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'minimize_on_close'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(true);

        let start_at_login: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'start_at_login'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(false);

        let high_priority_notifications: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'high_priority_notifications'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(false);

        let start_minimized: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'start_minimized'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(false);

        AppConfig {
            minimize_on_close,
            start_at_login,
            high_priority_notifications,
            start_minimized,
        }
    }

    pub fn set_config(&self, config: AppConfig) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "UPDATE settings SET value = ?1 WHERE key = 'minimize_on_close'",
            params![if config.minimize_on_close { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "UPDATE settings SET value = ?1 WHERE key = 'start_at_login'",
            params![if config.start_at_login { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "UPDATE settings SET value = ?1 WHERE key = 'high_priority_notifications'",
            params![if config.high_priority_notifications { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('start_minimized', ?1)",
            params![if config.start_minimized { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        Ok(())
    }
}
