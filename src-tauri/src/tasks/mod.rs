use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: Option<i32>,
    pub user_id: String,
    pub title: String,
    pub description: Option<String>,
    pub completed: bool,
    pub due_date: Option<String>,
    pub created_at: String,
    pub parent_id: Option<i32>,
    pub priority: Option<i32>,
    pub category: Option<String>,
    pub color: Option<String>,
}

pub struct TaskManager {
    db_path: PathBuf,
}

impl TaskManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let db_path = crate::config::get_database_path(app_handle);

        let conn = Connection::open(&db_path).expect("Failed to open database");
        conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                completed INTEGER NOT NULL DEFAULT 0,
                due_date TEXT,
                created_at TEXT NOT NULL,
                parent_id INTEGER,
                priority INTEGER,
                category TEXT,
                color TEXT
            )",
            [],
        ).ok();

        // Tenta adicionar novas colunas de forma retrocompatível
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN priority INTEGER", []);
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN category TEXT", []);
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN color TEXT", []);
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN completed_at TEXT", []);

        // Evita duplicados (mesmo título para o mesmo usuário)
        conn.execute(r#"CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_user_title ON tasks(user_id, title, parent_id)"#, []).ok();

        Self { db_path }
    }

    fn get_connection(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Failed to connect to habit DB");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Failed to set busy timeout");
        conn
    }

    pub fn list_tasks(&self, user_id: &str) -> Vec<Task> {
        let conn = self.get_connection();
        let mut stmt = match conn.prepare("SELECT id, user_id, title, description, completed, due_date, created_at, parent_id, priority, category, color FROM tasks WHERE user_id = ?1 ORDER BY completed ASC, created_at DESC") {
            Ok(s) => s,
            Err(e) => {
                eprintln!("[TaskManager] Erro ao preparar query list_tasks: {}", e);
                return vec![];
            }
        };
        
        let rows = match stmt.query_map(params![user_id], |row| {
            Ok(Task {
                id: Some(row.get(0)?),
                user_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                completed: row.get::<_, i32>(4)? != 0,
                due_date: row.get(5)?,
                created_at: row.get(6)?,
                parent_id: row.get(7)?,
                priority: row.get(8)?,
                category: row.get(9)?,
                color: row.get(10)?,
            })
        }) {
            Ok(r) => r,
            Err(e) => {
                eprintln!("[TaskManager] Erro ao executar query list_tasks: {}", e);
                return vec![];
            }
        };

        rows.filter_map(Result::ok).collect()
    }

    pub fn upsert_task(&self, task: Task, today: Option<String>) -> Result<(), String> {
        let conn = self.get_connection();
        let completed_int = if task.completed { 1 } else { 0 };
        let today_str = today.unwrap_or_else(|| chrono::Local::now().format("%Y-%m-%d").to_string());

        let result = if let Some(id) = task.id {
            conn.execute(
                "UPDATE tasks SET title = ?1, description = ?2, completed = ?3, due_date = ?4, parent_id = ?5, priority = ?6, category = ?7, color = ?8,
                 completed_at = CASE WHEN ?3 = 1 THEN COALESCE(completed_at, ?9) ELSE NULL END 
                 WHERE id = ?10",
                params![task.title, task.description, completed_int, task.due_date, task.parent_id, task.priority, task.category, task.color, today_str, id],
            )
        } else {
            let completed_at = if task.completed {
                Some(today_str)
            } else {
                None
            };
            conn.execute(
                "INSERT INTO tasks (user_id, title, description, completed, due_date, created_at, parent_id, priority, category, color, completed_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                params![task.user_id, task.title, task.description, completed_int, task.due_date, task.created_at, task.parent_id, task.priority, task.category, task.color, completed_at],
            )
        };

        result.map(|_| ()).map_err(|e| {
            let err_msg = e.to_string();
            if err_msg.contains("UNIQUE constraint failed") {
                "Já existe uma tarefa com este título neste contexto.".to_string()
            } else {
                err_msg
            }
        })
    }

    pub fn toggle_task(&self, id: i32, completed: bool, today: Option<String>) -> Result<(), String> {
        let conn = self.get_connection();
        let completed_int = if completed { 1 } else { 0 };
        let completed_at = if completed {
            Some(today.unwrap_or_else(|| chrono::Local::now().format("%Y-%m-%d").to_string()))
        } else {
            None
        };
        conn.execute(
            "UPDATE tasks SET completed = ?1, completed_at = ?2 WHERE id = ?3",
            params![completed_int, completed_at, id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_task(&self, id: i32) -> Result<(), String> {
        let conn = self.get_connection();
        // Delete subtasks first
        conn.execute("DELETE FROM tasks WHERE parent_id = ?1", params![id]).map_err(|e| e.to_string())?;
        // Delete the task itself
        conn.execute("DELETE FROM tasks WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn export_csv(&self, user_id: &str, path: &str) -> Result<(), String> {
        let tasks = self.list_tasks(user_id);
        let mut wtr = csv::Writer::from_path(path).map_err(|e| e.to_string())?;
        wtr.write_record(&["title", "description", "completed", "due_date", "created_at"]).map_err(|e| e.to_string())?;
        for t in tasks {
            wtr.write_record(&[
                t.title,
                t.description.unwrap_or_default(),
                t.completed.to_string(),
                t.due_date.unwrap_or_default(),
                t.created_at,
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
            let task = Task {
                id: None,
                user_id: user_id.to_string(),
                title: record.get(0).unwrap_or_default().to_string(),
                description: record.get(1).map(|s| s.to_string()),
                completed: record.get(2).map(|s| s == "true").unwrap_or(false),
                due_date: record.get(3).map(|s| s.to_string()),
                created_at: record.get(4).unwrap_or_default().to_string(),
                parent_id: None,
                priority: None,
                category: None,
                color: None,
            };
            let _ = self.upsert_task(task, None);
            count += 1;
        }
        Ok(count)
    }
}

#[tauri::command]
pub async fn tasks_list(state: tauri::State<'_, crate::AppState>, user_id: String) -> Result<Vec<Task>, String> {
    Ok(state.tasks.list_tasks(&user_id))
}

#[tauri::command]
pub async fn tasks_upsert(state: tauri::State<'_, crate::AppState>, task: Task) -> Result<(), String> {
    let today = state.config.get_now().with_timezone(&chrono::Local).format("%Y-%m-%d").to_string();
    state.tasks.upsert_task(task, Some(today))
}

#[tauri::command]
pub async fn tasks_toggle(state: tauri::State<'_, crate::AppState>, id: i32, completed: bool) -> Result<(), String> {
    let today = state.config.get_now().with_timezone(&chrono::Local).format("%Y-%m-%d").to_string();
    state.tasks.toggle_task(id, completed, Some(today))
}

#[tauri::command]
pub async fn tasks_delete(state: tauri::State<'_, crate::AppState>, id: i32) -> Result<(), String> {
    state.tasks.delete_task(id)
}

#[tauri::command]
pub async fn export_tasks_csv(state: tauri::State<'_, crate::AppState>, user_id: String, path: String) -> Result<(), String> {
    state.tasks.export_csv(&user_id, &path)
}

#[tauri::command]
pub async fn import_tasks_csv(state: tauri::State<'_, crate::AppState>, user_id: String, path: String) -> Result<usize, String> {
    state.tasks.import_csv(&user_id, &path)
}
