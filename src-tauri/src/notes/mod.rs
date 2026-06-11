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
struct NoteMeta {
    pub id: i32,
    #[serde(rename = "userId", alias = "user_id")]
    pub user_id: String,
    #[serde(rename = "createdAt", alias = "created_at")]
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
    pub fn new(app_handle: &AppHandle) -> Self {
        let notes_dir = crate::config::get_notes_path(app_handle);
        let _ = fs::create_dir_all(&notes_dir);

        NoteManager { notes_dir }
    }

    fn sanitize_filename(name: &str) -> String {
        name.chars()
            .map(|c| {
                if c.is_alphanumeric() || c == ' ' || c == '-' || c == '_' {
                    c
                } else {
                    '_'
                }
            })
            .collect()
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

        Err("Formato inválido".to_string())
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
        let content = format!(
            "---\n{}\n---\n# {}\n\n{}",
            frontmatter.trim(),
            note.title,
            note.content
        );

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
                let rel_path = path
                    .strip_prefix(&self.notes_dir)
                    .unwrap_or(&path)
                    .to_string_lossy()
                    .to_string();

                if path.is_dir() {
                    items.push(FileSystemItem {
                        name: path
                            .file_name()
                            .unwrap_or_default()
                            .to_string_lossy()
                            .to_string(),
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
        let full_path = self.notes_dir.join(path.replace('\\', "/"));
        fs::create_dir_all(full_path).map_err(|e| e.to_string())
    }

    pub fn delete_folder(&self, path: String) -> Result<(), String> {
        let full_path = self.notes_dir.join(path.replace('\\', "/"));
        if full_path.exists() && full_path.is_dir() {
            fs::remove_dir_all(full_path).map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn move_item(&self, source_path: String, dest_path: String) -> Result<(), String> {
        let source = self.notes_dir.join(source_path.replace('\\', "/"));
        let mut dest = self.notes_dir.join(dest_path.replace('\\', "/"));

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
        notes.sort_by(|a, b| b.pinned.cmp(&a.pinned).then(b.id.cmp(&a.id)));
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
        #[cfg(target_os = "macos")]
        {
            use std::process::Command;
            Command::new("open")
                .arg(&self.notes_dir)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        #[cfg(target_os = "linux")]
        {
            use std::process::Command;
            Command::new("xdg-open")
                .arg(&self.notes_dir)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        Ok(())
    }
}

#[tauri::command]
pub async fn note_list_notes(state: tauri::State<'_, crate::AppState>, user_id: String) -> Result<Vec<Note>, String> {
    Ok(state.note.list_notes(&user_id))
}

#[tauri::command]
pub async fn note_list_note_items(state: tauri::State<'_, crate::AppState>, user_id: String, _parent_id: Option<i64>) -> Result<Vec<FileSystemItem>, String> {
    Ok(state.note.list_items(&user_id))
}

#[tauri::command]
pub async fn note_add_note(state: tauri::State<'_, crate::AppState>, note: Note) -> Result<i64, String> {
    state.note.add_note(note)?;
    Ok(0)
}

#[tauri::command]
pub async fn note_update_note(state: tauri::State<'_, crate::AppState>, note: Note) -> Result<(), String> {
    state.note.update_note(note)
}

#[tauri::command]
pub async fn note_create_note_folder(state: tauri::State<'_, crate::AppState>, path: String) -> Result<(), String> {
    state.note.create_folder(path)
}

#[tauri::command]
pub async fn note_delete_note_folder(state: tauri::State<'_, crate::AppState>, path: String) -> Result<(), String> {
    state.note.delete_folder(path)
}

#[tauri::command]
pub async fn note_move_note_item(state: tauri::State<'_, crate::AppState>, source_path: String, dest_path: String) -> Result<(), String> {
    state.note.move_item(source_path, dest_path)
}

#[tauri::command]
pub async fn note_delete_note(state: tauri::State<'_, crate::AppState>, id: i32) -> Result<(), String> {
    state.note.delete_note(id)
}

#[tauri::command]
pub async fn note_update_note_pinned(state: tauri::State<'_, crate::AppState>, id: i32, pinned: bool) -> Result<(), String> {
    state.note.update_note_pinned(id, pinned)
}

#[tauri::command]
pub async fn note_open_notes_folder(state: tauri::State<'_, crate::AppState>) -> Result<(), String> {
    state.note.open_folder()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn manager_for_test(name: &str) -> NoteManager {
        let dir =
            std::env::temp_dir().join(format!("aegis_notes_test_{}_{}", name, std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        NoteManager { notes_dir: dir }
    }

    #[test]
    fn le_notas_antigas_sem_cor_e_com_metadados_snake_case() {
        let manager = manager_for_test("snake_case");
        let path = manager.notes_dir.join("1_Antiga.md");
        fs::write(
            &path,
            "---\nid: 1\nuser_id: usuario\ncreated_at: 2026-05-01T00:00:00Z\npinned: true\n---\n# Antiga\n\nConteúdo antigo",
        )
        .unwrap();

        let note = manager.parse_note_file(&path).unwrap();

        assert_eq!(note.id, Some(1));
        assert_eq!(note.user_id, "usuario");
        assert_eq!(note.title, "Antiga");
        assert_eq!(note.content, "Conteúdo antigo");
        assert!(note.pinned);
        assert_eq!(note.color, None);
    }

    #[test]
    fn le_notas_novas_com_cor_e_metadados_camel_case() {
        let manager = manager_for_test("camel_case");
        let path = manager.notes_dir.join("2_Nova.md");
        fs::write(
            &path,
            "---\nid: 2\nuserId: usuario\ncreatedAt: 2026-05-02T00:00:00Z\npinned: false\ncolor: fuchsia\n---\n# Nova\n\nConteúdo novo",
        )
        .unwrap();

        let note = manager.parse_note_file(&path).unwrap();

        assert_eq!(note.id, Some(2));
        assert_eq!(note.user_id, "usuario");
        assert_eq!(note.title, "Nova");
        assert_eq!(note.content, "Conteúdo novo");
        assert!(!note.pinned);
        assert_eq!(note.color, Some("fuchsia".to_string()));
    }
}
