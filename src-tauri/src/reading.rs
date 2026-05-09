// Módulo de Leitura - v1.1
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ReadingBook {
    pub id: Option<i64>,
    pub user_id: String,
    pub title: String,
    pub author: String,
    pub total_pages: i32,
    pub current_page: i32,
    pub status: String,
    pub category: String,
    pub thumbnail: Option<String>,
    #[serde(default)]
    pub stars: f64,
    pub review: Option<String>,
    pub created_at: Option<String>,
    #[serde(default)]
    pub is_favorite: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ReadingSession {
    pub id: Option<i64>,
    pub user_id: String,
    pub book_id: Option<i64>,
    pub date: String,
    pub pages_read: i32,
    pub duration_minutes: i32,
    pub note: Option<String>,
    pub focus: i32,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ReadingGoal {
    pub id: Option<i64>,
    pub user_id: String,
    pub goal_type: String, // "weekly_pages", "monthly_pages", "weekly_minutes", "monthly_minutes"
    pub target_value: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ReadingModuleData {
    pub books: Vec<ReadingBook>,
    pub sessions: Vec<ReadingSession>,
    pub goals: Vec<ReadingGoal>,
}

pub struct ReadingManager {
    db_path: PathBuf,
}

impl ReadingManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Falha ao obter diretório de dados");
        let db_path = app_dir.join("passwords.db");

        let conn = Connection::open(&db_path).expect("Falha ao abrir banco");

        let _ = conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS reading_books (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id      TEXT NOT NULL,
                title        TEXT NOT NULL,
                author       TEXT NOT NULL,
                total_pages  INTEGER NOT NULL DEFAULT 0,
                current_page INTEGER NOT NULL DEFAULT 0,
                status       TEXT NOT NULL DEFAULT 'WantToRead',
                category     TEXT NOT NULL DEFAULT 'Outros',
                thumbnail    TEXT,
                stars        INTEGER NOT NULL DEFAULT 0,
                review       TEXT,
                created_at   TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS reading_sessions (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id          TEXT NOT NULL,
                book_id          INTEGER,
                date             TEXT NOT NULL,
                pages_read       INTEGER NOT NULL DEFAULT 0,
                duration_minutes INTEGER NOT NULL DEFAULT 0,
                note             TEXT,
                created_at       TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY(book_id) REFERENCES reading_books(id) ON DELETE SET NULL
            );
            CREATE TABLE IF NOT EXISTS reading_goals (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id      TEXT NOT NULL,
                goal_type    TEXT NOT NULL,
                target_value REAL NOT NULL DEFAULT 0,
                UNIQUE(user_id, goal_type)
            );"
        );

        // Migrations for columns added after initial release
        let _ = conn.execute("ALTER TABLE reading_books ADD COLUMN stars REAL NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE reading_books ADD COLUMN review TEXT", []);
        let _ = conn.execute("ALTER TABLE reading_books ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE reading_sessions ADD COLUMN focus INTEGER NOT NULL DEFAULT 3", []);

        Self { db_path }
    }

    fn conn(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Falha ao conectar");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Falha ao definir timeout de espera");
        conn
    }

    // Livros
    pub fn list_books(&self, user_id: &str) -> Vec<ReadingBook> {
        let conn = self.conn();
        let mut stmt = conn.prepare(
            "SELECT id, title, author, total_pages, current_page, status, category, thumbnail, stars, review, created_at, is_favorite 
             FROM reading_books WHERE user_id=?1 ORDER BY created_at DESC"
        ).unwrap();

        stmt.query_map(params![user_id], |row| {
            Ok(ReadingBook {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                title: row.get(1)?,
                author: row.get(2)?,
                total_pages: row.get(3)?,
                current_page: row.get(4)?,
                status: row.get(5)?,
                category: row.get(6)?,
                thumbnail: row.get(7)?,
                stars: row.get::<_, Option<f64>>(8)?.unwrap_or(0.0),
                review: row.get(9)?,
                created_at: row.get(10)?,
                is_favorite: row.get::<_, i32>(11).unwrap_or(0) != 0,
            })
        }).unwrap().filter_map(|r| r.ok()).collect()
    }

    pub fn upsert_book(&self, b: ReadingBook) -> Result<i64, String> {
        let conn = self.conn();
        if let Some(id) = b.id {
            conn.execute(
                "UPDATE reading_books SET title=?2, author=?3, total_pages=?4, current_page=?5, status=?6, category=?7, thumbnail=?8, stars=?9, review=?10, is_favorite=?12 
                 WHERE id=?1 AND user_id=?11",
                params![id, b.title, b.author, b.total_pages, b.current_page, b.status, b.category, b.thumbnail, b.stars, b.review, b.user_id, b.is_favorite as i32],
            ).map_err(|e| e.to_string())?;
            Ok(id)
        } else {
            conn.execute(
                "INSERT INTO reading_books (user_id, title, author, total_pages, current_page, status, category, thumbnail, stars, review, is_favorite) 
                 VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
                params![b.user_id, b.title, b.author, b.total_pages, b.current_page, b.status, b.category, b.thumbnail, b.stars, b.review, b.is_favorite as i32],
            ).map_err(|e| e.to_string())?;
            Ok(conn.last_insert_rowid())
        }
    }

    pub fn toggle_favorite_book(&self, id: i64, user_id: &str, is_favorite: bool) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "UPDATE reading_books SET is_favorite=?1 WHERE id=?2 AND user_id=?3",
            params![is_favorite as i32, id, user_id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_book(&self, id: i64, user_id: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute("DELETE FROM reading_books WHERE id=?1 AND user_id=?2", params![id, user_id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // Sessions
    pub fn upsert_session(&self, s: ReadingSession) -> Result<i64, String> {
        let conn = self.conn();
        
        if let Some(id) = s.id {
            // Se for edição, primeiro reverter o progresso anterior se houver
            let mut stmt = conn.prepare("SELECT book_id, pages_read FROM reading_sessions WHERE id=?1").unwrap();
            let old_data = stmt.query_row(params![id], |row| {
                Ok((row.get::<_, Option<i64>>(0)?, row.get::<_, i32>(1)?))
            }).ok();

            if let Some((Some(bid), pages)) = old_data {
                let _ = conn.execute(
                    "UPDATE reading_books SET current_page = MAX(0, current_page - ?2) WHERE id = ?1",
                    params![bid, pages]
                );
            }

            // Atualizar sessão
            conn.execute(
                "UPDATE reading_sessions SET book_id=?2, date=?3, pages_read=?4, duration_minutes=?5, note=?6, focus=?8 
                 WHERE id=?1 AND user_id=?7",
                params![id, s.book_id, s.date, s.pages_read, s.duration_minutes, s.note, s.user_id, s.focus],
            ).map_err(|e| e.to_string())?;

            // Aplicar novo progresso
            if let Some(bid) = s.book_id {
                let _ = conn.execute(
                    "UPDATE reading_books SET current_page = current_page + ?2 WHERE id = ?1",
                    params![bid, s.pages_read]
                );
            }

            Ok(id)
        } else {
            // Inserção simples
            conn.execute(
                "INSERT INTO reading_sessions (user_id, book_id, date, pages_read, duration_minutes, note, focus) 
                 VALUES (?1,?2,?3,?4,?5,?6,?7)",
                 params![s.user_id, s.book_id, s.date, s.pages_read, s.duration_minutes, s.note, s.focus],
            ).map_err(|e| e.to_string())?;
            
            let session_id = conn.last_insert_rowid();

            if let Some(bid) = s.book_id {
                let _ = conn.execute(
                    "UPDATE reading_books SET current_page = current_page + ?2 WHERE id = ?1",
                    params![bid, s.pages_read]
                );
            }

            Ok(session_id)
        }
    }

    pub fn add_session_direct(&self, s: ReadingSession) -> Result<i64, String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO reading_sessions (user_id, book_id, date, pages_read, duration_minutes, note, focus) 
             VALUES (?1,?2,?3,?4,?5,?6,?7)",
             params![s.user_id, s.book_id, s.date, s.pages_read, s.duration_minutes, s.note, s.focus],
        ).map_err(|e| e.to_string())?;
        
        Ok(conn.last_insert_rowid())
    }

    pub fn list_sessions(&self, user_id: &str, months_back: i32, now: DateTime<Utc>) -> Vec<ReadingSession> {
        let conn = self.conn();
        let cutoff_date = (now - chrono::Duration::days((months_back * 30) as i64)).format("%Y-%m-%d").to_string();
        
        let mut stmt = conn.prepare(
            "SELECT id, book_id, date, pages_read, duration_minutes, note, created_at, focus 
             FROM reading_sessions WHERE user_id=?1 AND date >= ?2 ORDER BY date DESC, id DESC"
        ).unwrap();

        stmt.query_map(params![user_id, cutoff_date], |row| {
            Ok(ReadingSession {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                book_id: row.get(1)?,
                date: row.get(2)?,
                pages_read: row.get(3)?,
                duration_minutes: row.get(4)?,
                note: row.get(5)?,
                focus: row.get::<_, Option<i32>>(7)?.unwrap_or(3),
                created_at: row.get(6)?,
            })
        }).unwrap().filter_map(|r| r.ok()).collect()
    }

    pub fn delete_session(&self, id: i64, user_id: &str) -> Result<(), String> {
        let conn = self.conn();
        
        // Buscar dados da sessão antes de deletar para reverter progresso
        let mut stmt = conn.prepare("SELECT book_id, pages_read FROM reading_sessions WHERE id=?1 AND user_id=?2").unwrap();
        let session_info = stmt.query_row(params![id, user_id], |row| {
            Ok((row.get::<_, Option<i64>>(0)?, row.get::<_, i32>(1)?))
        }).ok();

        if let Some((Some(bid), pages)) = session_info {
            let _ = conn.execute(
                "UPDATE reading_books SET current_page = MAX(0, current_page - ?2) WHERE id = ?1",
                params![bid, pages]
            );
        }

        conn.execute("DELETE FROM reading_sessions WHERE id=?1 AND user_id=?2", params![id, user_id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // Goals
    pub fn upsert_goal(&self, g: ReadingGoal) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO reading_goals (user_id, goal_type, target_value)
             VALUES (?1, ?2, ?3)
             ON CONFLICT(user_id, goal_type) DO UPDATE SET target_value = excluded.target_value",
            params![g.user_id, g.goal_type, g.target_value],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_goals(&self, user_id: &str) -> Vec<ReadingGoal> {
        let conn = self.conn();
        let mut stmt = conn.prepare("SELECT id, goal_type, target_value FROM reading_goals WHERE user_id=?1").unwrap();
        stmt.query_map(params![user_id], |row| {
            Ok(ReadingGoal {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                goal_type: row.get(1)?,
                target_value: row.get(2)?,
            })
        }).unwrap().filter_map(|r| r.ok()).collect()
    }

    pub fn export_json(&self, user_id: &str, dest_path: &str, now: DateTime<Utc>) -> Result<(), String> {
        let books = self.list_books(user_id);
        let sessions = self.list_sessions(user_id, 120, now);
        let goals = self.list_goals(user_id);

        let data = ReadingModuleData {
            books,
            sessions,
            goals,
        };

        let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
        std::fs::write(dest_path, json).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn import_json(&self, user_id: &str, file_path: &str) -> Result<usize, String> {
        let json = std::fs::read_to_string(file_path).map_err(|e| e.to_string())?;
        let data: ReadingModuleData = serde_json::from_str(&json).map_err(|e| e.to_string())?;
        let conn = self.conn();
        let mut count = 0usize;

        // Importar Livros (usando título e autor como chave de unicidade para evitar duplicatas ao importar várias vezes)
        let mut book_id_map = std::collections::HashMap::new();

        for b in data.books {
            // Verifica se o livro já existe por título e autor
            let existing_id: Option<i64> = conn.query_row(
                "SELECT id FROM reading_books WHERE user_id=?1 AND title=?2 AND author=?3",
                params![user_id, b.title, b.author],
                |row| row.get(0)
            ).ok();

            let bid = if let Some(id) = existing_id {
                // Atualiza livro existente
                conn.execute(
                    "UPDATE reading_books SET total_pages=?2, current_page=?3, status=?4, category=?5, thumbnail=?6, stars=?7, review=?8 WHERE id=?1",
                    params![id, b.total_pages, b.current_page, b.status, b.category, b.thumbnail, b.stars, b.review]
                ).ok();
                id
            } else {
                // Insere novo livro
                conn.execute(
                    "INSERT INTO reading_books (user_id, title, author, total_pages, current_page, status, category, thumbnail, stars, review) 
                     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
                    params![user_id, b.title, b.author, b.total_pages, b.current_page, b.status, b.category, b.thumbnail, b.stars, b.review],
                ).ok();
                conn.last_insert_rowid()
            };

            if let Some(old_id) = b.id {
                book_id_map.insert(old_id, bid);
            }
        }

        // Importar Sessões
        for s in data.sessions {
            let new_book_id = s.book_id.and_then(|id| book_id_map.get(&id)).copied();
            
            // Verifica se a sessão já existe
            let exists: bool = conn.query_row(
                "SELECT EXISTS(SELECT 1 FROM reading_sessions WHERE user_id=?1 AND book_id IS ?2 AND date=?3 AND pages_read=?4 AND duration_minutes=?5)",
                params![user_id, new_book_id, s.date, s.pages_read, s.duration_minutes],
                |row| row.get(0)
            ).unwrap_or(false);

            if !exists {
                conn.execute(
                    "INSERT INTO reading_sessions (user_id, book_id, date, pages_read, duration_minutes, note) 
                     VALUES (?1,?2,?3,?4,?5,?6)",
                    params![user_id, new_book_id, s.date, s.pages_read, s.duration_minutes, s.note],
                ).ok();
                count += 1;
            }
        }

        // Importar Metas
        for g in data.goals {
            let _ = self.upsert_goal(ReadingGoal {
                id: None,
                user_id: user_id.to_string(),
                goal_type: g.goal_type,
                target_value: g.target_value,
            });
        }

        Ok(count)
    }
}
