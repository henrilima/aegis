use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};


// Estruturas de Dados

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CalendarEvent {
    pub id: Option<i64>,
    pub user_id: String,
    pub title: String,
    pub description: Option<String>,
    pub date: String,            // YYYY-MM-DD
    pub time: Option<String>,    // HH:MM opcional
    pub event_type: String,      // "event" | "deadline"
    pub deadline_category: Option<String>, // "prova" | "trabalho" | "simulado"
    pub color: Option<String>,
    pub created_at: Option<String>,
}


// Gerenciador de Calendário

pub struct CalendarManager {
    db_path: PathBuf,
}

impl CalendarManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Falha ao obter diretório de dados");
        let db_path = app_dir.join("passwords.db");

        let conn = Connection::open(&db_path).expect("Falha ao abrir banco");

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS calendar_events (
                id                 INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id            TEXT NOT NULL,
                title              TEXT NOT NULL,
                description        TEXT,
                date               TEXT NOT NULL,
                time               TEXT,
                event_type         TEXT NOT NULL DEFAULT 'event',
                deadline_category  TEXT,
                color              TEXT,
                created_at         TEXT NOT NULL DEFAULT (datetime('now'))
            );",
        ).ok();

        Self { db_path }
    }

    fn conn(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Falha ao conectar");
        conn.busy_timeout(std::time::Duration::from_millis(5000))
            .expect("failed to set busy timeout");
        conn
    }

    pub fn add_event(&self, ev: CalendarEvent) -> Result<i64, String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO calendar_events
             (user_id, title, description, date, time, event_type, deadline_category, color)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
            params![
                ev.user_id, ev.title, ev.description, ev.date, ev.time,
                ev.event_type, ev.deadline_category, ev.color
            ],
        ).map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    pub fn update_event(&self, ev: CalendarEvent) -> Result<(), String> {
        let id = ev.id.ok_or("missing id")?;
        let conn = self.conn();
        conn.execute(
            "UPDATE calendar_events SET
             title=?2, description=?3, date=?4, time=?5,
             event_type=?6, deadline_category=?7, color=?8
             WHERE id=?1 AND user_id=?9",
            params![
                id, ev.title, ev.description, ev.date, ev.time,
                ev.event_type, ev.deadline_category, ev.color, ev.user_id
            ],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_event(&self, id: i64, user_id: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "DELETE FROM calendar_events WHERE id=?1 AND user_id=?2",
            params![id, user_id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_events(&self, user_id: &str) -> Vec<CalendarEvent> {
        let conn = self.conn();
        let mut stmt = conn.prepare(
            "SELECT id, title, description, date, time, event_type, deadline_category, color, created_at
             FROM calendar_events WHERE user_id=?1
             ORDER BY date ASC, time ASC"
        ).unwrap();

        stmt.query_map(params![user_id], |row| {
            Ok(CalendarEvent {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                title: row.get(1)?,
                description: row.get(2)?,
                date: row.get(3)?,
                time: row.get(4)?,
                event_type: row.get(5)?,
                deadline_category: row.get(6)?,
                color: row.get(7)?,
                created_at: row.get(8)?,
            })
        }).unwrap().filter_map(|r| r.ok()).collect()
    }

    pub fn list_upcoming_deadlines(&self, user_id: &str, now: DateTime<Utc>) -> Vec<CalendarEvent> {
        let conn = self.conn();
        let today_simple = now.format("%Y-%m-%d").to_string();
        let mut stmt = conn.prepare(
            "SELECT id, title, description, date, time, event_type, deadline_category, color, created_at
             FROM calendar_events
             WHERE user_id=?1 AND event_type='deadline' AND date >= ?2
             ORDER BY date ASC"
        ).unwrap();

        stmt.query_map(params![user_id, today_simple], |row| {
            Ok(CalendarEvent {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                title: row.get(1)?,
                description: row.get(2)?,
                date: row.get(3)?,
                time: row.get(4)?,
                event_type: row.get(5)?,
                deadline_category: row.get(6)?,
                color: row.get(7)?,
                created_at: row.get(8)?,
            })
        }).unwrap().filter_map(|r| r.ok()).collect()
    }
}
