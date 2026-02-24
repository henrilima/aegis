use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize)]
pub struct Note {
    pub id: Option<i32>,
    pub user_id: String,
    pub title: String,
    pub content: String,
    pub created_at: String,
    
    pub status: String,
    
    pub pinned: bool,
}

pub struct NoteManager {
    db_path: PathBuf,
}

impl NoteManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
        let db_path = app_dir.join("passwords.db");

        let conn = Connection::open(&db_path).expect("Failed to open database");
        
        // Otimização de concorrência: WAL mode permite leitura e escrita simultâneas
        let _ = conn.execute("PRAGMA journal_mode=WAL", []);
        let _ = conn.busy_timeout(std::time::Duration::from_millis(5000));

        conn.execute(
            "CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                pinned INTEGER NOT NULL DEFAULT 0
            )",
            [],
        ).ok();

        
        conn.execute("ALTER TABLE notes ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'", []).ok();
        conn.execute("ALTER TABLE notes ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0", []).ok();

        Self { db_path }
    }

    fn get_connection(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Failed to connect to DB");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Failed to set busy timeout");
        conn
    }

    pub fn list_notes(&self, user_id: &str) -> Vec<Note> {
        let conn = self.get_connection();
        
        let mut stmt = conn.prepare(
            "SELECT id, title, content, created_at, status, pinned FROM notes WHERE user_id = ?1 ORDER BY pinned DESC, id DESC"
        ).unwrap();
        let rows = stmt.query_map(params![user_id], |row| {
            Ok(Note {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                title: row.get(1)?,
                content: row.get(2)?,
                created_at: row.get(3)?,
                status: row.get(4)?,
                pinned: row.get::<_, i32>(5)? != 0,
            })
        }).unwrap();

        rows.map(|r| r.unwrap()).collect()
    }

    pub fn add_note(&self, note: Note) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "INSERT INTO notes (user_id, title, content, created_at, status, pinned) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                note.user_id,
                note.title,
                note.content,
                note.created_at,
                note.status,
                if note.pinned { 1 } else { 0 }
            ],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn update_note_status(&self, id: i32, status: &str) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "UPDATE notes SET status = ?1 WHERE id = ?2",
            params![status, id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn update_note_pinned(&self, id: i32, pinned: bool) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "UPDATE notes SET pinned = ?1 WHERE id = ?2",
            params![if pinned { 1 } else { 0 }, id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_note(&self, id: i32) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute("DELETE FROM notes WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
        Ok(())
    }
}
