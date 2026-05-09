use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Movie {
    pub id: Option<i64>,
    pub user_id: String,
    pub title: String,
    pub director: Option<String>,
    pub year: Option<i32>,
    pub status: String,
    pub review: Option<String>,
    pub stars: f64,
    pub thumbnail: Option<String>,
    pub category: String,
    pub created_at: Option<String>,
    #[serde(default)]
    pub is_favorite: bool,
}

pub struct MovieManager {
    db_path: PathBuf,
}

impl MovieManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Falha ao obter diretório de dados");
        let db_path = app_dir.join("passwords.db");

        let conn = Connection::open(&db_path).expect("Falha ao abrir banco");

        let _ = conn.execute(
            "CREATE TABLE IF NOT EXISTS movies (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id      TEXT NOT NULL,
                title        TEXT NOT NULL,
                director     TEXT,
                year         INTEGER,
                status       TEXT NOT NULL DEFAULT 'WantToWatch',
                review       TEXT,
                stars        REAL NOT NULL DEFAULT 0,
                thumbnail    TEXT,
                category     TEXT NOT NULL DEFAULT 'Filme',
                created_at   TEXT NOT NULL DEFAULT (datetime('now')),
                is_favorite  INTEGER NOT NULL DEFAULT 0
            )",
            [],
        );
        // Migration for existing databases
        let _ = conn.execute("ALTER TABLE movies ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0", []);

        Self { db_path }
    }

    fn conn(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Falha ao conectar");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Falha ao definir timeout");
        conn
    }

    pub fn list_movies(&self, user_id: &str) -> Vec<Movie> {
        let conn = self.conn();
        let mut stmt = conn.prepare(
            "SELECT id, title, director, year, status, review, stars, thumbnail, category, created_at, is_favorite 
             FROM movies WHERE user_id=?1 ORDER BY created_at DESC"
        ).unwrap();

        stmt.query_map(params![user_id], |row| {
            Ok(Movie {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                title: row.get(1)?,
                director: row.get(2)?,
                year: row.get(3)?,
                status: row.get(4)?,
                review: row.get(5)?,
                stars: row.get(6)?,
                thumbnail: row.get(7)?,
                category: row.get(8)?,
                created_at: row.get(9)?,
                is_favorite: row.get::<_, i32>(10).unwrap_or(0) != 0,
            })
        }).unwrap().filter_map(|r| r.ok()).collect()
    }

    pub fn upsert_movie(&self, m: Movie) -> Result<(i64, bool), String> {
        let conn = self.conn();
        if let Some(id) = m.id {
            conn.execute(
                "UPDATE movies SET title=?2, director=?3, year=?4, status=?5, review=?6, stars=?7, thumbnail=?8, category=?9, is_favorite=?11 
                 WHERE id=?1 AND user_id=?10",
                params![id, m.title, m.director, m.year, m.status, m.review, m.stars, m.thumbnail, m.category, m.user_id, m.is_favorite as i32],
            ).map_err(|e| e.to_string())?;
            Ok((id, false))
        } else {
            // Check for duplicates (same title and director for the user)
            let mut stmt = conn.prepare("SELECT id FROM movies WHERE user_id = ?1 AND title = ?2 AND director IS ?3").unwrap();
            let existing_id: Option<i64> = stmt.query_row(params![m.user_id, m.title, m.director], |row| row.get(0)).ok();
            
            if let Some(id) = existing_id {
                return Ok((id, false)); // Already exists, return existing ID and false (not new)
            }

            conn.execute(
                "INSERT INTO movies (user_id, title, director, year, status, review, stars, thumbnail, category, is_favorite) 
                 VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
                params![m.user_id, m.title, m.director, m.year, m.status, m.review, m.stars, m.thumbnail, m.category, m.is_favorite as i32],
            ).map_err(|e| e.to_string())?;
            Ok((conn.last_insert_rowid(), true))
        }
    }

    pub fn toggle_favorite_movie(&self, id: i64, user_id: &str, is_favorite: bool) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "UPDATE movies SET is_favorite=?1 WHERE id=?2 AND user_id=?3",
            params![is_favorite as i32, id, user_id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_movie(&self, id: i64, user_id: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute("DELETE FROM movies WHERE id=?1 AND user_id=?2", params![id, user_id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn export_json(&self, user_id: &str, path: &str) -> Result<(), String> {
        let movies = self.list_movies(user_id);
        let json = serde_json::to_string_pretty(&movies).map_err(|e| e.to_string())?;
        std::fs::write(path, json).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn import_json(&self, user_id: &str, path: &str) -> Result<usize, String> {
        let content = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
        let movies: Vec<Movie> = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        let mut count = 0;
        for mut m in movies {
            m.id = None;
            m.user_id = user_id.to_string();
            if let Ok((_, true)) = self.upsert_movie(m) {
                count += 1;
            }
        }
        Ok(count)
    }
}
