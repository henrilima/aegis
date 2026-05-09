use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GlossaryWord {
    pub id: Option<i32>,
    pub user_id: String,
    pub word: String,
    pub definition: String,
    pub phonetic: Option<String>,
    pub source_url: Option<String>,
    pub is_favorite: bool,
    pub created_at: String,
}

pub struct DictionaryManager {
    db_path: PathBuf,
    cache: std::sync::Mutex<std::collections::HashMap<String, serde_json::Value>>,
}

impl DictionaryManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Falha ao obter diretório de dados do app");
        let db_path = app_dir.join("passwords.db");
        
        let conn = Connection::open(&db_path).expect("Falha ao abrir banco de dados");
        conn.execute(
            "CREATE TABLE IF NOT EXISTS glossary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                word TEXT NOT NULL,
                definition TEXT NOT NULL,
                phonetic TEXT,
                source_url TEXT,
                is_favorite INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )",
            [],
        ).ok();

        Self { 
            db_path,
            cache: std::sync::Mutex::new(std::collections::HashMap::new()),
        }
    }

    pub fn get_cached(&self, query: &str) -> Option<serde_json::Value> {
        let cache = self.cache.lock().unwrap();
        cache.get(query).cloned()
    }

    pub fn set_cache(&self, query: String, result: serde_json::Value) {
        let mut cache = self.cache.lock().unwrap();
        if cache.len() > 100 {
            cache.clear();
        }
        cache.insert(query, result);
    }

    fn get_connection(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Falha ao conectar ao banco de dados");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Falha no timeout");
        conn
    }

    pub fn list_words(&self, user_id: &str) -> Vec<GlossaryWord> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare("SELECT id, user_id, word, definition, phonetic, source_url, is_favorite, created_at FROM glossary WHERE user_id = ?1 ORDER BY is_favorite DESC, created_at DESC").unwrap();
        
        let rows = stmt.query_map(params![user_id], |row| {
            Ok(GlossaryWord {
                id: Some(row.get(0)?),
                user_id: row.get(1)?,
                word: row.get(2)?,
                definition: row.get(3)?,
                phonetic: row.get(4)?,
                source_url: row.get(5)?,
                is_favorite: row.get::<_, i32>(6)? != 0,
                created_at: row.get(7)?,
            })
        }).unwrap();

        rows.filter_map(|r| r.ok()).collect()
    }

    pub fn add_word(&self, word: GlossaryWord) -> Result<bool, String> {
        let conn = self.get_connection();
        
        // Verifica se já existe (Duplicado)
        let mut stmt = conn.prepare("SELECT count(*) FROM glossary WHERE user_id = ?1 AND word = ?2 AND definition = ?3").unwrap();
        let exists: i32 = stmt.query_row(params![word.user_id, word.word, word.definition], |row| row.get(0)).unwrap_or(0);
        
        if exists > 0 {
            return Ok(false); // Já existe, não adiciona
        }

        conn.execute(
            "INSERT INTO glossary (user_id, word, definition, phonetic, source_url, is_favorite, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                word.user_id,
                word.word,
                word.definition,
                word.phonetic,
                word.source_url,
                if word.is_favorite { 1 } else { 0 },
                word.created_at
            ],
        ).map_err(|e| e.to_string())?;
        Ok(true)
    }

    pub fn delete_word(&self, id: i32) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute("DELETE FROM glossary WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn toggle_favorite(&self, id: i32, is_favorite: bool) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "UPDATE glossary SET is_favorite = ?1 WHERE id = ?2",
            params![if is_favorite { 1 } else { 0 }, id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn export_csv(&self, user_id: &str, path: &str) -> Result<(), String> {
        let words = self.list_words(user_id);
        let mut wtr = csv::Writer::from_path(path).map_err(|e| e.to_string())?;
        wtr.write_record(&["word", "definition", "phonetic", "source_url", "is_favorite", "created_at"]).map_err(|e| e.to_string())?;
        
        for w in words {
            wtr.write_record(&[
                w.word,
                w.definition,
                w.phonetic.unwrap_or_default(),
                w.source_url.unwrap_or_default(),
                w.is_favorite.to_string(),
                w.created_at,
            ]).map_err(|e| e.to_string())?;
        }
        wtr.flush().map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn import_csv(&self, user_id: &str, path: &str) -> Result<usize, String> {
        let mut rdr = csv::Reader::from_path(path).map_err(|e| e.to_string())?;
        let mut count = 0;
        for result in rdr.records() {
            let record = result.map_err(|e| e.to_string())?;
            let word = GlossaryWord {
                id: None,
                user_id: user_id.to_string(),
                word: record.get(0).unwrap_or_default().to_string(),
                definition: record.get(1).unwrap_or_default().to_string(),
                phonetic: record.get(2).filter(|s| !s.is_empty()).map(|s| s.to_string()),
                source_url: record.get(3).filter(|s| !s.is_empty()).map(|s| s.to_string()),
                is_favorite: record.get(4).map(|s| s == "true").unwrap_or(false),
                created_at: record.get(5).filter(|s| !s.is_empty()).map(|s| s.to_string()).unwrap_or_else(|| chrono::Local::now().to_rfc3339()),
            };
            if let Ok(true) = self.add_word(word) {
                count += 1;
            }
        }
        Ok(count)
    }
}
