use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct Task {
    pub id: Option<i32>,
    pub user_id: String,
    pub title: String,
    pub description: Option<String>,
    pub completed: bool,
    pub due_date: Option<String>,
    pub created_at: String,
}

pub struct TaskManager {
    db_path: PathBuf,
}

impl TaskManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
        let db_path = app_dir.join("passwords.db");

        let conn = Connection::open(&db_path).expect("Failed to open database");
        conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                completed INTEGER NOT NULL DEFAULT 0,
                due_date TEXT,
                created_at TEXT NOT NULL
            )",
            [],
        ).ok();

        // Evita duplicados (mesmo título para o mesmo usuário)
        conn.execute(r#"CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_user_title ON tasks(user_id, title)"#, []).ok();

        Self { db_path }
    }

    fn get_connection(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Failed to connect to habit DB");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Failed to set busy timeout");
        conn
    }

    pub fn list_tasks(&self, user_id: &str) -> Vec<Task> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare("SELECT id, user_id, title, description, completed, due_date, created_at FROM tasks WHERE user_id = ?1 ORDER BY completed ASC, created_at DESC").unwrap();
        
        let rows = stmt.query_map(params![user_id], |row| {
            Ok(Task {
                id: Some(row.get(0)?),
                user_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                completed: row.get::<_, i32>(4)? != 0,
                due_date: row.get(5)?,
                created_at: row.get(6)?,
            })
        }).unwrap();

        rows.filter_map(Result::ok).collect()
    }

    pub fn upsert_task(&self, task: Task) -> Result<(), String> {
        let conn = self.get_connection();
        let completed_int = if task.completed { 1 } else { 0 };

        if let Some(id) = task.id {
            conn.execute(
                "UPDATE tasks SET title = ?1, description = ?2, completed = ?3, due_date = ?4 WHERE id = ?5",
                params![task.title, task.description, completed_int, task.due_date, id],
            ).map_err(|e| e.to_string())?;
        } else {
            conn.execute(
                "INSERT OR IGNORE INTO tasks (user_id, title, description, completed, due_date, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![task.user_id, task.title, task.description, completed_int, task.due_date, task.created_at],
            ).map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn toggle_task(&self, id: i32, completed: bool) -> Result<(), String> {
        let conn = self.get_connection();
        let completed_int = if completed { 1 } else { 0 };
        conn.execute(
            "UPDATE tasks SET completed = ?1 WHERE id = ?2",
            params![completed_int, id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_task(&self, id: i32) -> Result<(), String> {
        let conn = self.get_connection();
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
            };
            let _ = self.upsert_task(task);
            count += 1;
        }
        Ok(count)
    }
}
