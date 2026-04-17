use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};



#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SleepEntry {
    pub id: Option<i64>,
    pub user_id: String,
    pub date: String,            
    pub bedtime: String,         
    pub wake_time: String,       
    pub duration_minutes: i32,   
    pub quality: i32,            
    pub note: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SleepGoal {
    pub user_id: String,
    pub target_hours: f64,       
    pub target_bedtime: String,
    pub reminder_enabled: bool,
}



pub struct SleepManager {
    db_path: PathBuf,
}

impl SleepManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Falha ao obter diretório de dados");
        let db_path = app_dir.join("passwords.db");

        let conn = Connection::open(&db_path).expect("Falha ao abrir banco");

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS sleep_entries (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id          TEXT NOT NULL,
                date             TEXT NOT NULL,
                bedtime          TEXT NOT NULL,
                wake_time        TEXT NOT NULL,
                duration_minutes INTEGER NOT NULL DEFAULT 0,
                quality          INTEGER NOT NULL DEFAULT 3,
                note             TEXT,
                created_at       TEXT NOT NULL DEFAULT (datetime('now')),
                UNIQUE(user_id, date)
            );
            CREATE TABLE IF NOT EXISTS sleep_goals (
                user_id         TEXT PRIMARY KEY,
                target_hours    REAL NOT NULL DEFAULT 8.0,
                target_bedtime  TEXT NOT NULL DEFAULT '23:00'
            );",
        ).ok();

        conn.execute("ALTER TABLE sleep_goals ADD COLUMN reminder_enabled INTEGER NOT NULL DEFAULT 0", []).ok();

        Self { db_path }
    }

    fn conn(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Falha ao conectar");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Falha ao definir timeout de espera");
        conn
    }

    

    pub fn upsert_entry(&self, e: SleepEntry) -> Result<i64, String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO sleep_entries (user_id, date, bedtime, wake_time, duration_minutes, quality, note)
             VALUES (?1,?2,?3,?4,?5,?6,?7)
             ON CONFLICT(user_id, date) DO UPDATE SET
                bedtime          = excluded.bedtime,
                wake_time        = excluded.wake_time,
                duration_minutes = excluded.duration_minutes,
                quality          = excluded.quality,
                note             = excluded.note",
            params![e.user_id, e.date, e.bedtime, e.wake_time, e.duration_minutes, e.quality, e.note],
        ).map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    pub fn delete_entry(&self, id: i64, user_id: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute("DELETE FROM sleep_entries WHERE id=?1 AND user_id=?2", params![id, user_id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_entries(&self, user_id: &str, months_back: i32, now: DateTime<Utc>) -> Vec<SleepEntry> {
        let conn = self.conn();
        let cutoff_date = (now - chrono::Duration::days((months_back * 30) as i64)).format("%Y-%m-%d").to_string();
        let mut stmt = conn.prepare(
            "SELECT id, date, bedtime, wake_time, duration_minutes, quality, note, created_at
             FROM sleep_entries
             WHERE user_id=?1 AND date >= ?2
             ORDER BY date DESC"
        ).unwrap();

        stmt.query_map(params![user_id, cutoff_date], |row| {
            Ok(SleepEntry {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                date: row.get(1)?,
                bedtime: row.get(2)?,
                wake_time: row.get(3)?,
                duration_minutes: row.get(4)?,
                quality: row.get(5)?,
                note: row.get(6)?,
                created_at: row.get(7)?,
            })
        }).unwrap().filter_map(|r| r.ok()).collect()
    }

    

    pub fn upsert_goal(&self, g: SleepGoal) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO sleep_goals (user_id, target_hours, target_bedtime, reminder_enabled)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(user_id) DO UPDATE SET
                target_hours     = excluded.target_hours,
                target_bedtime   = excluded.target_bedtime,
                reminder_enabled = excluded.reminder_enabled",
            params![g.user_id, g.target_hours, g.target_bedtime, if g.reminder_enabled { 1 } else { 0 }],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_goal(&self, user_id: &str) -> SleepGoal {
        let conn = self.conn();
        conn.query_row(
            "SELECT target_hours, target_bedtime, reminder_enabled FROM sleep_goals WHERE user_id=?1",
            params![user_id],
            |row| Ok(SleepGoal {
                user_id: user_id.to_string(),
                target_hours: row.get(0)?,
                target_bedtime: row.get(1)?,
                reminder_enabled: row.get::<_, i32>(2)? != 0,
            }),
        ).unwrap_or(SleepGoal {
            user_id: user_id.to_string(),
            target_hours: 8.0,
            target_bedtime: "23:00".to_string(),
            reminder_enabled: false,
        })
    }

    pub fn export_csv(&self, user_id: &str, dest_path: &str, now: DateTime<Utc>) -> Result<(), String> {
        let entries = self.list_entries(user_id, 120, now);
        let mut out = String::from(
            "data,hora_dormir,hora_acordar,duracao_minutos,qualidade,nota\n"
        );
        for e in entries {
            out.push_str(&format!(
                "{},{},{},{},{},{}\n",
                e.date,
                e.bedtime,
                e.wake_time,
                e.duration_minutes,
                e.quality,
                e.note.unwrap_or_default().replace(',', ";").replace('\n', " ")
            ));
        }
        std::fs::write(dest_path, out).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn import_csv(&self, user_id: &str, file_path: &str) -> Result<usize, String> {
        let csv = std::fs::read_to_string(file_path).map_err(|e| e.to_string())?;
        let mut count = 0usize;
        for (i, line) in csv.lines().enumerate() {
            if i == 0 { continue; } 
            let cols: Vec<&str> = line.splitn(6, ',').collect();
            if cols.len() < 5 { continue; }
            let e = SleepEntry {
                id: None,
                user_id: user_id.to_string(),
                date: cols[0].trim().to_string(),
                bedtime: cols[1].trim().to_string(),
                wake_time: cols[2].trim().to_string(),
                duration_minutes: cols[3].trim().parse().unwrap_or(0),
                quality: cols[4].trim().parse().unwrap_or(3),
                note: cols.get(5).map(|s| s.trim().to_string()),
                created_at: None,
            };
            self.upsert_entry(e).ok();
            count += 1;
        }
        Ok(count)
    }
}
