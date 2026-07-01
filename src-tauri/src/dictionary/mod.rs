use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::AppHandle;

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
        let db_path = crate::config::get_database_path(app_handle);
        
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

    pub fn add_word(&self, word: GlossaryWord) -> Result<Option<i32>, String> {
        let conn = self.get_connection();
        
        // Verifica se já existe (Duplicado)
        let mut stmt = conn.prepare("SELECT count(*) FROM glossary WHERE user_id = ?1 AND word = ?2 AND definition = ?3").unwrap();
        let exists: i32 = stmt.query_row(params![word.user_id, word.word, word.definition], |row| row.get(0)).unwrap_or(0);
        
        if exists > 0 {
            return Ok(None); // Já existe, não adiciona
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
        Ok(Some(conn.last_insert_rowid() as i32))
    }

    pub fn get_word_user_id(&self, id: i32) -> Result<String, String> {
        let conn = self.get_connection();
        conn.query_row(
            "SELECT user_id FROM glossary WHERE id = ?1",
            params![id],
            |row| row.get(0)
        ).map_err(|e| e.to_string())
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
            if let Ok(Some(_)) = self.add_word(word) {
                count += 1;
            }
        }
        Ok(count)
    }
}

async fn translate_text(text: &str, from: &str, to: &str) -> Result<String, String> {
    let url = format!(
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl={}&tl={}&dt=t&q={}",
        from,
        to,
        urlencoding::encode(text)
    );
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0")
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;
        
    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    
    let mut translated = String::new();
    if let Some(sentences) = json[0].as_array() {
        for sentence in sentences {
            if let Some(t) = sentence[0].as_str() {
                translated.push_str(t);
            }
        }
    }

    if translated.is_empty() {
        return Err("Falha na tradução".to_string());
    }
    
    Ok(translated)
}

#[tauri::command]
pub async fn dictionary_search(
    state: tauri::State<'_, crate::AppState>,
    query: String
) -> Result<serde_json::Value, String> {
    if let Some(cached) = state.dictionary.get_cached(&query) {
        return Ok(cached);
    }

    let client = reqwest::Client::builder()
        .user_agent("Aegis-App/2.0")
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let en_query = translate_text(&query, "pt", "en").await.unwrap_or(query.clone());
    let url_en = format!("https://api.dictionaryapi.dev/api/v2/entries/en/{}", urlencoding::encode(&en_query));
    
    let res = client.get(&url_en).send().await.map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err("Palavra não encontrada.".to_string());
    }

    let mut json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    
    if let Some(entries) = json.as_array_mut() {
        let mut batch_texts = vec![];
        let sep = "\n[SEP]\n";

        let mut original_words = vec![];
        for entry in entries.iter() {
            if let Some(word) = entry["word"].as_str() {
                original_words.push(word.to_string());
                batch_texts.push(word.to_string());
            }
            if let Some(meanings) = entry["meanings"].as_array() {
                for meaning in meanings {
                    if let Some(pos) = meaning["partOfSpeech"].as_str() {
                        batch_texts.push(pos.to_string());
                    }
                    if let Some(definitions) = meaning["definitions"].as_array() {
                        for def in definitions.iter().take(4) {
                            if let Some(def_text) = def["definition"].as_str() {
                                batch_texts.push(def_text.to_string());
                            }
                            if let Some(ex_text) = def["example"].as_str() {
                                batch_texts.push(ex_text.to_string());
                            }
                            if let Some(syns) = def["synonyms"].as_array() {
                                for s in syns { if let Some(t) = s.as_str() { batch_texts.push(t.to_string()); } }
                            }
                        }
                    }
                    if let Some(syns) = meaning["synonyms"].as_array() {
                        for s in syns { if let Some(t) = s.as_str() { batch_texts.push(t.to_string()); } }
                    }
                }
            }
        }

        if !batch_texts.is_empty() {
            let combined = batch_texts.join(sep);
            let mut results = vec![];
            let mut success = false;

            if let Ok(translated_combined) = translate_text(&combined, "en", "pt").await {
                let parts: Vec<String> = translated_combined
                    .split("[SEP]")
                    .map(|s| s.trim().to_string())
                    .collect();
                
                if parts.len() == batch_texts.len() {
                    results = parts;
                    success = true;
                }
            }

            if !success {
                for text in &batch_texts {
                    results.push(translate_text(text, "en", "pt").await.unwrap_or_else(|_| text.clone()));
                }
            }

            let mut cursor = 0;
            let mut word_cursor = 0;
            for entry in entries.iter_mut() {
                if let Some(obj) = entry.as_object_mut() {
                    obj.remove("sourceUrls");
                    obj.remove("license");
                }

                if entry["word"].is_string() {
                    let translated = &results[cursor];
                    let original = &original_words[word_cursor];
                    entry["word"] = if translated.to_lowercase() != original.to_lowercase() {
                        serde_json::json!(format!("{} ({})", translated, original))
                    } else {
                        serde_json::json!(translated)
                    };
                    cursor += 1;
                    word_cursor += 1;
                }

                if let Some(meanings) = entry["meanings"].as_array_mut() {
                    for meaning in meanings {
                        if meaning["partOfSpeech"].is_string() {
                            meaning["partOfSpeech"] = serde_json::json!(results[cursor]);
                            cursor += 1;
                        }
                        if let Some(_definitions) = meaning["definitions"].as_array_mut() {
                            let mut truncated_defs = vec![];
                            let defs_count = std::cmp::min(meaning["definitions"].as_array().unwrap().len(), 4);
                            
                            for _ in 0..defs_count {
                                let mut def = meaning["definitions"].as_array_mut().unwrap().remove(0);
                                if def["definition"].is_string() {
                                    def["definition"] = serde_json::json!(results[cursor]);
                                    cursor += 1;
                                }
                                if def["example"].is_string() {
                                    def["example"] = serde_json::json!(results[cursor]);
                                    cursor += 1;
                                }
                                if let Some(syns) = def["synonyms"].as_array_mut() {
                                    for s in syns { *s = serde_json::json!(results[cursor]); cursor += 1; }
                                }
                                truncated_defs.push(def);
                            }
                            meaning["definitions"] = serde_json::json!(truncated_defs);
                        }
                        if let Some(syns) = meaning["synonyms"].as_array_mut() {
                            for s in syns { *s = serde_json::json!(results[cursor]); cursor += 1; }
                        }
                    }
                }
            }
        }
    }
    
    state.dictionary.set_cache(query, json.clone());
    Ok(json)
}

#[tauri::command]
pub async fn dictionary_suggestions(query: String) -> Result<Vec<String>, String> {
    let url = format!("https://api.dicionario-aberto.net/near/{}", urlencoding::encode(&query));
    let client = reqwest::Client::builder().user_agent("Aegis").build().map_err(|e| e.to_string())?;
    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let suggestions: Vec<String> = res.json().await.map_err(|e| e.to_string())?;
    Ok(suggestions)
}

#[tauri::command]
pub async fn dictionary_list(state: tauri::State<'_, crate::AppState>, user_id: String) -> Result<Vec<GlossaryWord>, String> {
    Ok(state.dictionary.list_words(&user_id))
}

#[tauri::command]
pub async fn dictionary_add(state: tauri::State<'_, crate::AppState>, word: GlossaryWord) -> Result<(), String> {
    let user_id = word.user_id.clone();
    let res = state.dictionary.add_word(word)?;
    if let Some(id) = res {
        state.stats.add_xp_with_source_and_ref(
            &user_id,
            15,
            "Nova Palavra Dicionário",
            Some("glossary"),
            Some(&id.to_string()),
        );
    }
    Ok(())
}

#[tauri::command]
pub async fn dictionary_delete(state: tauri::State<'_, crate::AppState>, id: i32) -> Result<(), String> {
    if let Ok(user_id) = state.dictionary.get_word_user_id(id) {
        let _ = state.stats.delete_xp_for_ref(&user_id, "glossary", &id.to_string());
    }
    state.dictionary.delete_word(id)
}

#[tauri::command]
pub async fn dictionary_toggle_favorite(state: tauri::State<'_, crate::AppState>, id: i32, is_favorite: bool) -> Result<(), String> {
    state.dictionary.toggle_favorite(id, is_favorite)
}

#[tauri::command]
pub async fn dictionary_export_csv(state: tauri::State<'_, crate::AppState>, user_id: String, path: String) -> Result<(), String> {
    state.dictionary.export_csv(&user_id, &path)
}

#[tauri::command]
pub async fn dictionary_import_csv(state: tauri::State<'_, crate::AppState>, user_id: String, path: String) -> Result<usize, String> {
    state.dictionary.import_csv(&user_id, &path)
}
