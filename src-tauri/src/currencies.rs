use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
pub struct CurrencyRate {
    pub code: String,
    pub rate: f64,
    pub last_updated: String,
}

pub struct CurrencyManager {
    db_path: PathBuf,
}

impl CurrencyManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
        let db_path = app_dir.join("passwords.db");
        
        let conn = Connection::open(&db_path).expect("Failed to open database");
        conn.execute(
            "CREATE TABLE IF NOT EXISTS currency_rates (
                code TEXT PRIMARY KEY,
                rate REAL NOT NULL,
                last_updated TEXT NOT NULL
            )",
            [],
        ).ok();

        Self { db_path }
    }

    fn get_connection(&self) -> Connection {
        Connection::open(&self.db_path).expect("Failed to connect to DB")
    }

    pub fn get_rates(&self) -> Vec<CurrencyRate> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare("SELECT code, rate, last_updated FROM currency_rates").unwrap();
        let rows = stmt.query_map([], |row| {
            Ok(CurrencyRate {
                code: row.get(0)?,
                rate: row.get(1)?,
                last_updated: row.get(2)?,
            })
        }).unwrap();

        rows.map(|r| r.unwrap()).collect()
    }

    pub fn update_rates(&self, rates: Vec<CurrencyRate>) -> Result<(), String> {
        let conn = self.get_connection();
        for rate in rates {
            conn.execute(
                "INSERT INTO currency_rates (code, rate, last_updated)
                 VALUES (?1, ?2, ?3)
                 ON CONFLICT(code) DO UPDATE SET
                    rate = excluded.rate,
                    last_updated = excluded.last_updated",
                params![rate.code, rate.rate, rate.last_updated],
            ).map_err(|e| e.to_string())?;
        }
        Ok(())
    }
}
