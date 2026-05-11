use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Note {
    pub id: Option<i32>,
    pub user_id: String,
    pub title: String,
    pub content: String,
    pub created_at: String,
    pub pinned: bool,
    pub path: Option<String>, // Caminho relativo a partir de notes_dir
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileSystemItem {
    pub name: String,
    pub is_dir: bool,
    pub path: String, // Caminho relativo a partir de notes_dir
    pub note: Option<Note>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NoteMeta {
    pub id: i32,
    pub user_id: String,
    pub created_at: String,
    #[serde(default)]
    pub pinned: bool,
    #[serde(default)]
    pub color: Option<String>,
}

pub struct NoteManager {
    notes_dir: PathBuf,
}

impl NoteManager {
    pub fn new(_app_handle: &AppHandle) -> Self {
        let current_exe = std::env::current_exe().unwrap_or_default();
        let current_dir = std::env::current_dir().unwrap_or_default();
        
        let path_str = current_exe.to_string_lossy();
        let base_dir = if path_str.contains("target\\debug") || path_str.contains("target\\release") {
            current_dir
        } else {
            current_exe.parent().unwrap_or(&current_dir).to_path_buf()
        };
        
        let notes_dir = base_dir.join("notes");
        let _ = fs::create_dir_all(&notes_dir);
        
        NoteManager { notes_dir }
    }

    fn sanitize_filename(name: &str) -> String {
        name.chars().map(|c| if c.is_alphanumeric() || c == ' ' || c == '-' || c == '_' { c } else { '_' }).collect()
    }

    fn get_note_path(&self, id: i32, title: &str, parent_path: Option<&str>) -> PathBuf {
        let safe_title = Self::sanitize_filename(title);
        let mut path = self.notes_dir.clone();
        if let Some(p) = parent_path {
            if !p.is_empty() {
                path = path.join(p);
            }
        }
        path.join(format!("{}_{}.md", id, safe_title))
    }

    fn find_note_file(&self, id: i32) -> Option<PathBuf> {
        self.find_note_file_recursive(&self.notes_dir, id)
    }

    fn find_note_file_recursive(&self, dir: &PathBuf, id: i32) -> Option<PathBuf> {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Some(found) = self.find_note_file_recursive(&path, id) {
                        return Some(found);
                    }
                } else if path.extension().and_then(|s| s.to_str()) == Some("md") {
                    if let Some(file_name) = path.file_name().and_then(|s| s.to_str()) {
                        if file_name.starts_with(&format!("{}_", id)) {
                            return Some(path);
                        }
                    }
                }
            }
        }
        None
    }

    fn parse_note_file(&self, path: &PathBuf) -> Result<Note, String> {
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let content = content.replace("\r\n", "\n");

    if content.starts_with("---\n") {
        if let Some(end_idx) = content[4..].find("\n---\n") {
            let frontmatter_str = &content[4..end_idx + 4];
            let body = &content[end_idx + 9..];

            let meta: NoteMeta =
                serde_yaml::from_str(frontmatter_str).map_err(|e| e.to_string())?;

            let mut title = String::new();
            let mut stripped_body = body;
            if let Some(first_line) = body.lines().next() {
                if first_line.starts_with("# ") {
                    title = first_line[2..].trim().to_string();
                    if let Some(rest_idx) = body.find('\n') {
                        stripped_body = &body[rest_idx + 1..];
                    }
                }
            }

            let relative_path = path
                .strip_prefix(&self.notes_dir)
                .ok()
                .and_then(|p| p.parent())
                .map(|p| p.to_string_lossy().to_string());

            return Ok(Note {
                id: Some(meta.id),
                user_id: meta.user_id,
                title,
                content: stripped_body.trim().to_string(),
                created_at: meta.created_at,
                pinned: meta.pinned,
                path: relative_path,
                color: meta.color,
            });
        }
    }
        
        Err("Formato invalido".to_string())
    }

    fn write_note_file(&self, note: &Note) -> Result<(), String> {
        let id = note.id.unwrap_or(0);
        let path = self.get_note_path(id, &note.title, note.path.as_deref());
        
        // Garante que o diretório pai existe
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }

        let meta = NoteMeta {
            id,
            user_id: note.user_id.clone(),
            created_at: note.created_at.clone(),
            pinned: note.pinned,
            color: note.color.clone(),
        };
        
        let frontmatter = serde_yaml::to_string(&meta).unwrap_or_default();
        let content = format!("---\n{}\n---\n# {}\n\n{}", frontmatter.trim(), note.title, note.content);
        
        fs::write(&path, content).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_items(&self, user_id: &str) -> Vec<FileSystemItem> {
        let mut items = Vec::new();
        self.list_items_recursive(&self.notes_dir, user_id, &mut items);
        items
    }

    fn list_items_recursive(&self, dir: &PathBuf, user_id: &str, items: &mut Vec<FileSystemItem>) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                let rel_path = path.strip_prefix(&self.notes_dir)
                    .unwrap_or(&path)
                    .to_string_lossy()
                    .to_string();

                if path.is_dir() {
                    items.push(FileSystemItem {
                        name: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
                        is_dir: true,
                        path: rel_path,
                        note: None,
                    });
                    self.list_items_recursive(&path, user_id, items);
                } else if path.extension().and_then(|s| s.to_str()) == Some("md") {
                    if let Ok(note) = self.parse_note_file(&path) {
                        if note.user_id == user_id {
                            items.push(FileSystemItem {
                                name: note.title.clone(),
                                is_dir: false,
                                path: rel_path,
                                note: Some(note),
                            });
                        }
                    }
                }
            }
        }
    }

    pub fn add_note(&self, note: Note) -> Result<(), String> {
        let mut next_id = 1;
        self.find_max_id(&self.notes_dir, &mut next_id);
        
        let mut new_note = note.clone();
        new_note.id = Some(next_id);
        self.write_note_file(&new_note)
    }

    fn find_max_id(&self, dir: &PathBuf, max_id: &mut i32) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    self.find_max_id(&path, max_id);
                } else if path.extension().and_then(|s| s.to_str()) == Some("md") {
                    if let Some(file_name) = path.file_name().and_then(|s| s.to_str()) {
                        if let Some(id_str) = file_name.split('_').next() {
                            if let Ok(id) = id_str.parse::<i32>() {
                                if id >= *max_id {
                                    *max_id = id + 1;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    pub fn update_note(&self, note: Note) -> Result<(), String> {
        if let Some(id) = note.id {
            if let Some(path) = self.find_note_file(id) {
                let _ = fs::remove_file(&path);
                return self.write_note_file(&note);
            }
        }
        Err("Not found".to_string())
    }

    pub fn update_note_pinned(&self, id: i32, pinned: bool) -> Result<(), String> {
        if let Some(path) = self.find_note_file(id) {
            if let Ok(mut note) = self.parse_note_file(&path) {
                let _ = fs::remove_file(&path);
                note.pinned = pinned;
                return self.write_note_file(&note);
            }
        }
        Err("Not found".to_string())
    }

    pub fn delete_note(&self, id: i32) -> Result<(), String> {
        if let Some(path) = self.find_note_file(id) {
            let _ = fs::remove_file(path);
        }
        Ok(())
    }

    pub fn create_folder(&self, path: String) -> Result<(), String> {
        let full_path = self.notes_dir.join(path);
        fs::create_dir_all(full_path).map_err(|e| e.to_string())
    }

    pub fn delete_folder(&self, path: String) -> Result<(), String> {
        let full_path = self.notes_dir.join(path);
        if full_path.exists() && full_path.is_dir() {
            fs::remove_dir_all(full_path).map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn move_item(&self, source_path: String, dest_path: String) -> Result<(), String> {
        let source = self.notes_dir.join(&source_path);
        let mut dest = self.notes_dir.join(&dest_path);
        
        if !source.exists() {
            return Err("Origem não encontrada".to_string());
        }

        // Se o destino for um diretório, movemos a origem para dentro dele
        if dest.exists() && dest.is_dir() {
            if let Some(file_name) = source.file_name() {
                dest = dest.join(file_name);
            }
        }

        // Garante que o diretório pai do destino existe
        if let Some(parent) = dest.parent() {
            let _ = fs::create_dir_all(parent);
        }

        fs::rename(source, dest).map_err(|e| e.to_string())
    }

    pub fn list_notes(&self, user_id: &str) -> Vec<Note> {
        let mut notes = Vec::new();
        self.list_notes_recursive(&self.notes_dir, user_id, &mut notes);
        notes.sort_by(|a, b| {
            b.pinned.cmp(&a.pinned).then(b.id.cmp(&a.id))
        });
        notes
    }

    fn list_notes_recursive(&self, dir: &PathBuf, user_id: &str, notes: &mut Vec<Note>) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    self.list_notes_recursive(&path, user_id, notes);
                } else if path.extension().and_then(|s| s.to_str()) == Some("md") {
                    if let Ok(note) = self.parse_note_file(&path) {
                        if note.user_id == user_id {
                            notes.push(note);
                        }
                    }
                }
            }
        }
    }

    pub fn open_folder(&self) -> Result<(), String> {
        #[cfg(target_os = "windows")]
        {
            use std::process::Command;
            Command::new("explorer")
                .arg(&self.notes_dir)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        Ok(())
    }
}

