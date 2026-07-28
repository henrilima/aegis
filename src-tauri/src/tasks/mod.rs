use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
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
    /// Status do kanban: "todo" | "doing" | "done"
    #[serde(default)]
    pub status: Option<String>,
    /// Tempo total acumulado em segundos (soma de todas as sessões do temporizador)
    #[serde(default)]
    pub time_spent_seconds: Option<i64>,
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
        )
        .ok();

        // Tenta adicionar novas colunas de forma retrocompatível
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN parent_id INTEGER", []);
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN priority INTEGER", []);
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN category TEXT", []);
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN color TEXT", []);
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN completed_at TEXT", []);
        // Migração: campo de status para o kanban (todo | doing | done)
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN status TEXT", []);
        // Migração: campo de tempo acumulado em segundos para o temporizador
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN time_spent_seconds INTEGER DEFAULT 0", []);

        // Remove o índice antigo sem parent_id para recriá-lo com a nova estrutura
        let _ = conn.execute("DROP INDEX IF EXISTS idx_tasks_user_title", []);
        // Evita duplicados (mesmo título para o mesmo usuário)
        conn.execute(r#"CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_user_title ON tasks(user_id, title, parent_id)"#, []).ok();

        Self { db_path }
    }

    fn get_connection(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Failed to connect to habit DB");
        conn.busy_timeout(std::time::Duration::from_millis(5000))
            .expect("Failed to set busy timeout");
        conn
    }

    pub fn list_tasks(&self, user_id: &str) -> Vec<Task> {
        let conn = self.get_connection();
        let mut stmt = match conn.prepare("SELECT id, user_id, title, description, completed, due_date, created_at, parent_id, priority, category, color, status, time_spent_seconds FROM tasks WHERE user_id = ?1 ORDER BY completed ASC, created_at DESC") {
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
                status: row.get(11)?,
                time_spent_seconds: row.get(12)?,
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
        let today_str =
            today.unwrap_or_else(|| chrono::Local::now().format("%Y-%m-%d").to_string());

        // Determina o status com base no campo ou no completed
        let status = task.status.clone().unwrap_or_else(|| {
            if task.completed {
                "done".to_string()
            } else {
                "todo".to_string()
            }
        });

        let result = if let Some(id) = task.id {
            conn.execute(
                "UPDATE tasks SET title = ?1, description = ?2, completed = ?3, due_date = ?4, parent_id = ?5, priority = ?6, category = ?7, color = ?8,
                 completed_at = CASE WHEN ?3 = 1 THEN COALESCE(completed_at, ?9) ELSE NULL END,
                 status = ?10
                 WHERE id = ?11",
                params![task.title, task.description, completed_int, task.due_date, task.parent_id, task.priority, task.category, task.color, today_str, status, id],
            )
        } else {
            let completed_at = if task.completed {
                Some(today_str)
            } else {
                None
            };
            conn.execute(
                "INSERT INTO tasks (user_id, title, description, completed, due_date, created_at, parent_id, priority, category, color, completed_at, status, time_spent_seconds) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 0)",
                params![task.user_id, task.title, task.description, completed_int, task.due_date, task.created_at, task.parent_id, task.priority, task.category, task.color, completed_at, status],
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

    pub fn toggle_task(
        &self,
        id: i32,
        completed: bool,
        today: Option<String>,
    ) -> Result<(), String> {
        let conn = self.get_connection();
        let completed_int = if completed { 1 } else { 0 };
        let completed_at = if completed {
            Some(today.unwrap_or_else(|| chrono::Local::now().format("%Y-%m-%d").to_string()))
        } else {
            None
        };
        // Atualiza o status junto com o completed para manter consistência
        let status = if completed { "done" } else { "todo" };
        conn.execute(
            "UPDATE tasks SET completed = ?1, completed_at = ?2, status = ?3 WHERE id = ?4",
            params![completed_int, completed_at, status, id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    /// Atualiza apenas o status do kanban de uma tarefa
    pub fn update_status(&self, id: i32, status: &str) -> Result<(), String> {
        let conn = self.get_connection();
        // Quando mover para "done", marca como concluída; caso contrário, desmarca
        let completed = if status == "done" { 1 } else { 0 };
        let completed_at: Option<String> = if status == "done" {
            Some(chrono::Local::now().format("%Y-%m-%d").to_string())
        } else {
            None
        };
        conn.execute(
            "UPDATE tasks SET status = ?1, completed = ?2, completed_at = ?3 WHERE id = ?4",
            params![status, completed, completed_at, id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    /// Soma segundos ao tempo acumulado de uma tarefa e retorna o novo total
    pub fn add_time(&self, id: i32, seconds: i64) -> Result<i64, String> {
        let conn = self.get_connection();
        conn.execute(
            "UPDATE tasks SET time_spent_seconds = COALESCE(time_spent_seconds, 0) + ?1 WHERE id = ?2",
            params![seconds, id],
        )
        .map_err(|e| e.to_string())?;

        let new_total: i64 = conn
            .query_row(
                "SELECT COALESCE(time_spent_seconds, 0) FROM tasks WHERE id = ?1",
                params![id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;

        Ok(new_total)
    }

    pub fn get_user_id_for_task(&self, id: i32) -> Result<String, String> {
        let conn = self.get_connection();
        let user_id: String = conn.query_row(
            "SELECT user_id FROM tasks WHERE id = ?1",
            params![id],
            |row| row.get(0),
        ).map_err(|e| e.to_string())?;
        Ok(user_id)
    }

    pub fn delete_task(&self, id: i32) -> Result<(), String> {
        let conn = self.get_connection();
        // Remove subtarefas antes
        conn.execute("DELETE FROM tasks WHERE parent_id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        // Remove a tarefa principal
        conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn export_csv(&self, user_id: &str, path: &str) -> Result<(), String> {
        let tasks = self.list_tasks(user_id);
        let mut wtr = csv::Writer::from_path(path).map_err(|e| e.to_string())?;
        wtr.write_record(&[
            "title",
            "description",
            "completed",
            "due_date",
            "created_at",
        ])
        .map_err(|e| e.to_string())?;
        for t in tasks {
            wtr.write_record(&[
                t.title,
                t.description.unwrap_or_default(),
                t.completed.to_string(),
                t.due_date.unwrap_or_default(),
                t.created_at,
            ])
            .map_err(|e| e.to_string())?;
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
                status: None,
                time_spent_seconds: None,
            };
            let _ = self.upsert_task(task, None);
            count += 1;
        }
        Ok(count)
    }
}

#[tauri::command]
pub async fn tasks_list(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
) -> Result<Vec<Task>, String> {
    Ok(state.tasks.list_tasks(&user_id))
}

#[tauri::command]
pub async fn tasks_upsert(
    state: tauri::State<'_, crate::AppState>,
    task: Task,
) -> Result<(), String> {
    let today = state
        .config
        .get_now()
        .with_timezone(&chrono::Local)
        .format("%Y-%m-%d")
        .to_string();
    state.tasks.upsert_task(task, Some(today))
}

#[tauri::command]
pub async fn tasks_toggle(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, crate::AppState>,
    id: i32,
    completed: bool,
) -> Result<(), String> {
    let today = state
        .config
        .get_now()
        .with_timezone(&chrono::Local)
        .format("%Y-%m-%d")
        .to_string();
    let res = state.tasks.toggle_task(id, completed, Some(today));
    if res.is_ok() && completed {
        if let Ok(user_id) = state.tasks.get_user_id_for_task(id) {
            let _ = crate::automation::evaluate_rules(&state, &app_handle, &user_id);
        }
    }
    res
}

#[tauri::command]
pub async fn tasks_delete(state: tauri::State<'_, crate::AppState>, id: i32) -> Result<(), String> {
    state.tasks.delete_task(id)
}

/// Atualiza o status do kanban de uma tarefa (todo | doing | done)
#[tauri::command]
pub async fn tasks_update_status(
    state: tauri::State<'_, crate::AppState>,
    id: i32,
    status: String,
) -> Result<(), String> {
    state.tasks.update_status(id, &status)
}

/// Soma o tempo de uma sessão ao acumulado da tarefa e retorna o novo total
#[tauri::command]
pub async fn tasks_add_time(
    state: tauri::State<'_, crate::AppState>,
    id: i32,
    seconds: i64,
) -> Result<i64, String> {
    state.tasks.add_time(id, seconds)
}

#[tauri::command]
pub async fn export_tasks_csv(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    path: String,
) -> Result<(), String> {
    state.tasks.export_csv(&user_id, &path)
}

#[tauri::command]
pub async fn import_tasks_csv(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    path: String,
) -> Result<usize, String> {
    state.tasks.import_csv(&user_id, &path)
}
