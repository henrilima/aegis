use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::AppHandle;

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
        let db_path = crate::config::get_database_path(app_handle);

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
        let _ = conn.execute(
            "ALTER TABLE movies ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0",
            [],
        );

        Self { db_path }
    }

    fn conn(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Falha ao conectar");
        conn.busy_timeout(std::time::Duration::from_millis(5000))
            .expect("Falha ao definir timeout");
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
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect()
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
            let mut stmt = conn
                .prepare(
                    "SELECT id FROM movies WHERE user_id = ?1 AND title = ?2 AND director IS ?3",
                )
                .unwrap();
            let existing_id: Option<i64> = stmt
                .query_row(params![m.user_id, m.title, m.director], |row| row.get(0))
                .ok();

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

    pub fn toggle_favorite_movie(
        &self,
        id: i64,
        user_id: &str,
        is_favorite: bool,
    ) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "UPDATE movies SET is_favorite=?1 WHERE id=?2 AND user_id=?3",
            params![is_favorite as i32, id, user_id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_movie(&self, id: i64, user_id: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "DELETE FROM movies WHERE id=?1 AND user_id=?2",
            params![id, user_id],
        )
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

#[tauri::command]
pub async fn movies_search(
    state: tauri::State<'_, crate::AppState>,
    query: String,
) -> Result<serde_json::Value, String> {
    let api_key = state.config.get_tmdb_api_key();

    if api_key.is_empty() {
        return Err("tmdb_no_key".to_string());
    }

    let url = format!(
        "https://api.themoviedb.org/3/search/movie?api_key={}&query={}&language=pt-BR&include_adult=false",
        api_key,
        urlencoding::encode(&query)
    );
    let client = reqwest::Client::builder()
        .user_agent("Aegis")
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;
    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let status = res.status();
    if status.as_u16() == 401 {
        return Err("tmdb_invalid_key".to_string());
    }
    if !status.is_success() {
        return Err(format!("TMDb API error {}", status));
    }
    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "source": "tmdb", "data": json }))
}

#[tauri::command]
pub async fn get_tmdb_api_key(state: tauri::State<'_, crate::AppState>) -> Result<String, String> {
    Ok(state.config.get_tmdb_api_key())
}

#[tauri::command]
pub async fn set_tmdb_api_key(
    state: tauri::State<'_, crate::AppState>,
    api_key: String,
) -> Result<(), String> {
    if !api_key.is_empty() {
        let url = format!(
            "https://api.themoviedb.org/3/configuration?api_key={}",
            api_key
        );
        let client = reqwest::Client::builder()
            .user_agent("Aegis")
            .timeout(std::time::Duration::from_secs(8))
            .build()
            .map_err(|e| e.to_string())?;
        let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
        if res.status().as_u16() == 401 {
            return Err("Chave de API inválida. Verifique e tente novamente.".to_string());
        }
        if !res.status().is_success() {
            return Err(format!("Erro ao validar chave: HTTP {}", res.status()));
        }
    }
    state.config.set_tmdb_api_key(&api_key)
}

#[tauri::command]
pub async fn movies_list(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
) -> Result<Vec<Movie>, String> {
    Ok(state.movies.list_movies(&user_id))
}

#[tauri::command]
pub async fn movies_upsert(
    state: tauri::State<'_, crate::AppState>,
    movie: Movie,
) -> Result<i64, String> {
    let user_id = movie.user_id.clone();
    let res = state.movies.upsert_movie(movie);
    match res {
        Ok((id, is_new)) => {
            if is_new {
                state.stats.add_xp_with_source_and_ref(
                    &user_id,
                    25,
                    "Filme Assistido",
                    Some("movies"),
                    Some(&id.to_string()),
                );
            }
            Ok(id)
        }
        Err(e) => Err(e),
    }
}

#[tauri::command]
pub async fn movies_delete(
    state: tauri::State<'_, crate::AppState>,
    id: i64,
    user_id: String,
) -> Result<(), String> {
    let result = state.movies.delete_movie(id, &user_id);
    if result.is_ok() {
        let _ = state.stats.delete_xp_for_ref(&user_id, "movies", &id.to_string());
    }
    result
}

#[tauri::command]
pub async fn movies_toggle_favorite(
    state: tauri::State<'_, crate::AppState>,
    id: i64,
    user_id: String,
    is_favorite: bool,
) -> Result<(), String> {
    state
        .movies
        .toggle_favorite_movie(id, &user_id, is_favorite)
}

#[tauri::command]
pub async fn movies_export_json(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    path: String,
) -> Result<(), String> {
    state.movies.export_json(&user_id, &path)
}

#[tauri::command]
pub async fn movies_import_json(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    path: String,
) -> Result<usize, String> {
    state.movies.import_json(&user_id, &path)
}
