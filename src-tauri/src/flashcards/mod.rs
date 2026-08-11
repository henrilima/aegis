use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FlashcardFolder {
    pub id: Option<i32>,
    pub user_id: String,
    pub name: String,
    pub parent_id: Option<i32>,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FlashcardDeck {
    pub id: Option<i32>,
    pub user_id: String,
    pub name: String,
    pub description: String,
    pub color: String,
    pub created_at: String,
    #[serde(default)]
    pub icon: Option<String>,
    #[serde(default)]
    pub folder_id: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Flashcard {
    pub id: Option<i32>,
    pub deck_id: i32,
    pub front: String,
    pub back: String,
    pub review_count: i32,
    pub success_count: i32,
    pub last_reviewed: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExportedDeck {
    pub deck: FlashcardDeck,
    pub cards: Vec<Flashcard>,
}

pub struct FlashcardManager {
    db_path: PathBuf,
}

impl FlashcardManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let db_path = crate::config::get_database_path(app_handle);
        
        let conn = Connection::open(&db_path).expect("Falha ao abrir banco de dados");
        
        // Inicializa tabela de pastas se não existir
        conn.execute(
            "CREATE TABLE IF NOT EXISTS flashcard_folders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                parent_id INTEGER,
                color TEXT,
                icon TEXT,
                created_at TEXT NOT NULL
            )",
            [],
        ).ok();

        // Inicializa tabelas se não existirem
        conn.execute(
            "CREATE TABLE IF NOT EXISTS flashcard_decks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                color TEXT NOT NULL,
                created_at TEXT NOT NULL
            )",
            [],
        ).ok();

        // Adiciona colunas silenciosamente caso a tabela já exista e não as possua
        conn.execute("ALTER TABLE flashcard_decks ADD COLUMN icon TEXT", []).ok();
        conn.execute("ALTER TABLE flashcard_decks ADD COLUMN folder_id INTEGER", []).ok();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS flashcards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deck_id INTEGER NOT NULL,
                front TEXT NOT NULL,
                back TEXT NOT NULL,
                review_count INTEGER NOT NULL DEFAULT 0,
                success_count INTEGER NOT NULL DEFAULT 0,
                last_reviewed TEXT,
                created_at TEXT NOT NULL
            )",
            [],
        ).ok();

        Self { db_path }
    }

    fn get_connection(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Falha ao conectar ao banco de dados");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Falha no timeout");
        conn
    }

    pub fn list_folders(&self, user_id: &str) -> Vec<FlashcardFolder> {
        let conn = self.get_connection();
        let mut stmt = match conn.prepare("SELECT id, user_id, name, parent_id, color, icon, created_at FROM flashcard_folders WHERE user_id = ?1 ORDER BY name ASC") {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };
        
        let rows = stmt.query_map(params![user_id], |row| {
            let parent_id_val: Option<i32> = row.get(3).ok();
            let color_val: Option<String> = row.get(4).ok();
            let icon_val: Option<String> = row.get(5).ok();
            Ok(FlashcardFolder {
                id: Some(row.get(0)?),
                user_id: row.get(1)?,
                name: row.get(2)?,
                parent_id: parent_id_val,
                color: color_val,
                icon: icon_val,
                created_at: row.get(6)?,
            })
        }).unwrap();

        rows.filter_map(|r| r.ok()).collect()
    }

    pub fn add_folder(&self, folder: FlashcardFolder) -> Result<i32, String> {
        let conn = self.get_connection();
        conn.execute(
            "INSERT INTO flashcard_folders (user_id, name, parent_id, color, icon, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![folder.user_id, folder.name, folder.parent_id, folder.color, folder.icon, folder.created_at],
        ).map_err(|e| e.to_string())?;
        
        let id = conn.last_insert_rowid() as i32;
        Ok(id)
    }

    pub fn update_folder(&self, folder: FlashcardFolder) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "UPDATE flashcard_folders SET name = ?1, parent_id = ?2, color = ?3, icon = ?4 WHERE id = ?5",
            params![folder.name, folder.parent_id, folder.color, folder.icon, folder.id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_folder(&self, id: i32) -> Result<(), String> {
        let conn = self.get_connection();
        // Mover baralhos da pasta para o nível raiz
        conn.execute("UPDATE flashcard_decks SET folder_id = NULL WHERE folder_id = ?1", params![id]).map_err(|e| e.to_string())?;
        // Mover subpastas para o nível raiz
        conn.execute("UPDATE flashcard_folders SET parent_id = NULL WHERE parent_id = ?1", params![id]).map_err(|e| e.to_string())?;
        // Excluir a pasta
        conn.execute("DELETE FROM flashcard_folders WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn move_deck(&self, deck_id: i32, folder_id: Option<i32>) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "UPDATE flashcard_decks SET folder_id = ?1 WHERE id = ?2",
            params![folder_id, deck_id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_decks(&self, user_id: &str) -> Vec<FlashcardDeck> {
        let conn = self.get_connection();
        let mut stmt = match conn.prepare("SELECT id, user_id, name, description, color, created_at, icon, folder_id FROM flashcard_decks WHERE user_id = ?1 ORDER BY created_at DESC") {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };
        
        let rows = stmt.query_map(params![user_id], |row| {
            let icon_val: Option<String> = row.get(6).ok();
            let folder_id_val: Option<i32> = row.get(7).ok();
            Ok(FlashcardDeck {
                id: Some(row.get(0)?),
                user_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                color: row.get(4)?,
                created_at: row.get(5)?,
                icon: icon_val,
                folder_id: folder_id_val,
            })
        }).unwrap();

        rows.filter_map(|r| r.ok()).collect()
    }

    pub fn add_deck(&self, deck: FlashcardDeck) -> Result<i32, String> {
        let conn = self.get_connection();
        conn.execute(
            "INSERT INTO flashcard_decks (user_id, name, description, color, created_at, icon, folder_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![deck.user_id, deck.name, deck.description, deck.color, deck.created_at, deck.icon, deck.folder_id],
        ).map_err(|e| e.to_string())?;
        
        let id = conn.last_insert_rowid() as i32;
        Ok(id)
    }

    pub fn update_deck(&self, deck: FlashcardDeck) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "UPDATE flashcard_decks SET name = ?1, description = ?2, color = ?3, icon = ?4, folder_id = ?5 WHERE id = ?6",
            params![deck.name, deck.description, deck.color, deck.icon, deck.folder_id, deck.id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_deck_user_id(&self, id: i32) -> Result<String, String> {
        let conn = self.get_connection();
        conn.query_row(
            "SELECT user_id FROM flashcard_decks WHERE id = ?1",
            params![id],
            |row| row.get(0)
        ).map_err(|e| e.to_string())
    }

    pub fn delete_deck(&self, id: i32) -> Result<(), String> {
        let conn = self.get_connection();
        // Deleta os cartões associados ao baralho
        conn.execute("DELETE FROM flashcards WHERE deck_id = ?1", params![id]).map_err(|e| e.to_string())?;
        // Deleta o baralho
        conn.execute("DELETE FROM flashcard_decks WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_cards(&self, deck_id: i32) -> Vec<Flashcard> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare("SELECT id, deck_id, front, back, review_count, success_count, last_reviewed, created_at FROM flashcards WHERE deck_id = ?1 ORDER BY created_at DESC").unwrap();
        
        let rows = stmt.query_map(params![deck_id], |row| {
            Ok(Flashcard {
                id: Some(row.get(0)?),
                deck_id: row.get(1)?,
                front: row.get(2)?,
                back: row.get(3)?,
                review_count: row.get(4)?,
                success_count: row.get(5)?,
                last_reviewed: row.get(6)?,
                created_at: row.get(7)?,
            })
        }).unwrap();

        rows.filter_map(|r| r.ok()).collect()
    }

    pub fn add_card(&self, card: Flashcard) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "INSERT INTO flashcards (deck_id, front, back, review_count, success_count, last_reviewed, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![card.deck_id, card.front, card.back, card.review_count, card.success_count, card.last_reviewed, card.created_at],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn update_card(&self, card: Flashcard) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "UPDATE flashcards SET front = ?1, back = ?2 WHERE id = ?3",
            params![card.front, card.back, card.id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_card(&self, id: i32) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute("DELETE FROM flashcards WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn record_review(&self, id: i32, success: bool, reviewed_at: String) -> Result<(), String> {
        let conn = self.get_connection();
        if success {
            conn.execute(
                "UPDATE flashcards SET review_count = review_count + 1, success_count = success_count + 1, last_reviewed = ?1 WHERE id = ?2",
                params![reviewed_at, id],
            ).map_err(|e| e.to_string())?;
        } else {
            conn.execute(
                "UPDATE flashcards SET review_count = review_count + 1, last_reviewed = ?1 WHERE id = ?2",
                params![reviewed_at, id],
            ).map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn export_json(&self, user_id: &str, path: &str) -> Result<(), String> {
        let decks = self.list_decks(user_id);
        let mut exported = Vec::new();

        for deck in decks {
            if let Some(deck_id) = deck.id {
                let cards = self.list_cards(deck_id);
                exported.push(ExportedDeck {
                    deck,
                    cards,
                });
            }
        }

        let json = serde_json::to_string_pretty(&exported).map_err(|e| e.to_string())?;
        std::fs::write(path, json).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn import_json(&self, user_id: &str, path: &str) -> Result<usize, String> {
        let content = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
        let exported_decks: Vec<ExportedDeck> = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        let mut card_count = 0;

        for mut item in exported_decks {
            item.deck.user_id = user_id.to_string();
            item.deck.id = None;
            
            if let Ok(new_deck_id) = self.add_deck(item.deck) {
                for mut card in item.cards {
                    card.id = None;
                    card.deck_id = new_deck_id;
                    if self.add_card(card).is_ok() {
                        card_count += 1;
                    }
                }
            }
        }

        Ok(card_count)
    }
}

#[tauri::command]
pub async fn flashcards_list_folders(state: tauri::State<'_, crate::AppState>, user_id: String) -> Result<Vec<FlashcardFolder>, String> {
    Ok(state.flashcards.list_folders(&user_id))
}

#[tauri::command]
pub async fn flashcards_add_folder(state: tauri::State<'_, crate::AppState>, folder: FlashcardFolder) -> Result<i32, String> {
    state.flashcards.add_folder(folder)
}

#[tauri::command]
pub async fn flashcards_update_folder(state: tauri::State<'_, crate::AppState>, folder: FlashcardFolder) -> Result<(), String> {
    state.flashcards.update_folder(folder)
}

#[tauri::command]
pub async fn flashcards_delete_folder(state: tauri::State<'_, crate::AppState>, id: i32) -> Result<(), String> {
    state.flashcards.delete_folder(id)
}

#[tauri::command]
pub async fn flashcards_move_deck(state: tauri::State<'_, crate::AppState>, deck_id: i32, folder_id: Option<i32>) -> Result<(), String> {
    state.flashcards.move_deck(deck_id, folder_id)
}

#[tauri::command]
pub async fn flashcards_list_decks(state: tauri::State<'_, crate::AppState>, user_id: String) -> Result<Vec<FlashcardDeck>, String> {
    Ok(state.flashcards.list_decks(&user_id))
}

#[tauri::command]
pub async fn flashcards_add_deck(state: tauri::State<'_, crate::AppState>, deck: FlashcardDeck) -> Result<i32, String> {
    let user_id = deck.user_id.clone();
    let res = state.flashcards.add_deck(deck);
    if let Ok(inserted_id) = res {
        state.stats.add_xp_with_source_and_ref(
            &user_id,
            25,
            "Novo Deck Flashcard",
            Some("flashcard_decks"),
            Some(&inserted_id.to_string()),
        );
    }
    res
}

#[tauri::command]
pub async fn flashcards_update_deck(state: tauri::State<'_, crate::AppState>, deck: FlashcardDeck) -> Result<(), String> {
    state.flashcards.update_deck(deck)
}

#[tauri::command]
pub async fn flashcards_delete_deck(state: tauri::State<'_, crate::AppState>, id: i32) -> Result<(), String> {
    if let Ok(user_id) = state.flashcards.get_deck_user_id(id) {
        let _ = state.stats.delete_xp_for_ref(&user_id, "flashcard_decks", &id.to_string());
    }
    state.flashcards.delete_deck(id)
}

#[tauri::command]
pub async fn flashcards_list_cards(state: tauri::State<'_, crate::AppState>, deck_id: i32) -> Result<Vec<Flashcard>, String> {
    Ok(state.flashcards.list_cards(deck_id))
}

#[tauri::command]
pub async fn flashcards_add_card(state: tauri::State<'_, crate::AppState>, card: Flashcard) -> Result<(), String> {
    state.flashcards.add_card(card)
}

#[tauri::command]
pub async fn flashcards_update_card(state: tauri::State<'_, crate::AppState>, card: Flashcard) -> Result<(), String> {
    state.flashcards.update_card(card)
}

#[tauri::command]
pub async fn flashcards_delete_card(state: tauri::State<'_, crate::AppState>, id: i32) -> Result<(), String> {
    state.flashcards.delete_card(id)
}

#[tauri::command]
pub async fn flashcards_record_review(state: tauri::State<'_, crate::AppState>, id: i32, success: bool, reviewed_at: String) -> Result<(), String> {
    state.flashcards.record_review(id, success, reviewed_at)
}

#[tauri::command]
pub async fn flashcards_export_json(state: tauri::State<'_, crate::AppState>, user_id: String, path: String) -> Result<(), String> {
    state.flashcards.export_json(&user_id, &path)
}

#[tauri::command]
pub async fn flashcards_import_json(state: tauri::State<'_, crate::AppState>, user_id: String, path: String) -> Result<usize, String> {
    state.flashcards.import_json(&user_id, &path)
}

