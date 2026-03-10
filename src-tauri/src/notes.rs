use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Note {
    pub id: Option<i32>,
    pub user_id: String,
    pub title: String,
    pub content: String,
    pub created_at: String,
    pub status: String,
    pub pinned: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct NoteMeta {
    pub id: i32,
    pub user_id: String,
    pub created_at: String,
    pub status: String,
    pub pinned: bool,
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
        name.chars().map(|c| if c.is_alphanumeric() { c } else { '_' }).collect()
    }

    fn get_note_path(&self, id: i32, title: &str) -> PathBuf {
        let safe_title = Self::sanitize_filename(title);
        self.notes_dir.join(format!("{}_{}.md", id, safe_title))
    }

    fn find_note_file(&self, id: i32) -> Option<PathBuf> {
        if let Ok(entries) = fs::read_dir(&self.notes_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("md") {
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
        
        if content.starts_with("---\n") {
            if let Some(end_idx) = content[4..].find("\n---\n") {
                let frontmatter_str = &content[4..end_idx + 4];
                let body = &content[end_idx + 9..];
                
                let meta: NoteMeta = serde_yaml::from_str(frontmatter_str).map_err(|e| e.to_string())?;
                
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
                
                return Ok(Note {
                    id: Some(meta.id),
                    user_id: meta.user_id,
                    title,
                    content: stripped_body.trim().to_string(),
                    created_at: meta.created_at,
                    status: meta.status,
                    pinned: meta.pinned,
                });
            }
        }
        
        Err("Formato invalido".to_string())
    }

    fn write_note_file(&self, note: &Note) -> Result<(), String> {
        let id = note.id.unwrap_or(0);
        let path = self.get_note_path(id, &note.title);
        
        let meta = NoteMeta {
            id,
            user_id: note.user_id.clone(),
            created_at: note.created_at.clone(),
            status: note.status.clone(),
            pinned: note.pinned,
        };
        
        let frontmatter = serde_yaml::to_string(&meta).unwrap_or_default();
        let content = format!("---\n{}\n---\n# {}\n\n{}", frontmatter.trim(), note.title, note.content);
        
        fs::write(&path, content).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_notes(&self, user_id: &str) -> Vec<Note> {
        let mut notes = Vec::new();
        if let Ok(entries) = fs::read_dir(&self.notes_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("md") {
                    if let Ok(note) = self.parse_note_file(&path) {
                        if note.user_id == user_id {
                            notes.push(note);
                        }
                    }
                }
            }
        }
        notes.sort_by(|a, b| {
            b.pinned.cmp(&a.pinned).then(b.id.cmp(&a.id))
        });
        notes
    }

    pub fn add_note(&self, note: Note) -> Result<(), String> {
        let mut next_id = 1;
        if let Ok(entries) = fs::read_dir(&self.notes_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("md") {
                    if let Some(file_name) = path.file_name().and_then(|s| s.to_str()) {
                        if let Some(id_str) = file_name.split('_').next() {
                            if let Ok(id) = id_str.parse::<i32>() {
                                if id >= next_id {
                                    next_id = id + 1;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        let mut new_note = note.clone();
        new_note.id = Some(next_id);
        self.write_note_file(&new_note)
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

    pub fn update_note_status(&self, id: i32, status: &str) -> Result<(), String> {
        if let Some(path) = self.find_note_file(id) {
            if let Ok(mut note) = self.parse_note_file(&path) {
                let _ = fs::remove_file(&path);
                note.status = status.to_string();
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
