// src-tauri/src/automation.rs

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, State};
use chrono::{DateTime, Utc, Timelike};
use crate::AppState;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AutomationRule {
    pub id: Option<i64>,
    pub user_id: String,
    pub name: String,
    pub trigger_type: String,       // 'study_hours', 'sleep_hours', 'pomodoros_completed', 'tasks_completed', 'current_time'
    pub trigger_operator: String,   // '>', '>=', '<', '<=', '='
    pub trigger_value: f64,
    pub action_type: String,        // 'mark_habit', 'create_task', 'send_notification', 'change_theme'
    pub action_target_id: String,   // ID do hábito, título da tarefa, mensagem personalizada, ou ID do tema
    pub action_target_name: Option<String>,
    pub active: bool,
    pub created_at: Option<String>,
}

pub struct AutomationManager {
    db_path: PathBuf,
}

impl AutomationManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let db_path = crate::config::get_database_path(app_handle);

        let conn = Connection::open(&db_path).expect("Falha ao abrir banco do módulo de automações");

        conn.execute(
            "CREATE TABLE IF NOT EXISTS automation_rules (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id             TEXT NOT NULL,
                name                TEXT NOT NULL,
                trigger_type        TEXT NOT NULL,
                trigger_operator    TEXT NOT NULL DEFAULT '>=',
                trigger_value       REAL NOT NULL,
                action_type         TEXT NOT NULL,
                action_target_id    TEXT NOT NULL,
                action_target_name  TEXT,
                active              INTEGER NOT NULL DEFAULT 1,
                created_at          TEXT NOT NULL DEFAULT (datetime('now'))
            )",
            [],
        )
        .ok();

        // Tabela de log de execuções para evitar disparos duplicados no mesmo dia
        conn.execute(
            "CREATE TABLE IF NOT EXISTS automation_execution_log (
                rule_id      INTEGER NOT NULL,
                executed_at  TEXT NOT NULL,
                PRIMARY KEY(rule_id, executed_at)
            )",
            [],
        )
        .ok();

        // Migration para adicionar a coluna caso a tabela já tenha sido criada na versão anterior
        let _ = conn.execute("ALTER TABLE automation_rules ADD COLUMN trigger_operator TEXT NOT NULL DEFAULT '>='", []);

        Self { db_path }
    }

    fn conn(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Falha ao conectar ao banco de automações");
        conn.busy_timeout(std::time::Duration::from_millis(5000))
            .expect("Falha ao definir timeout de espera para banco de automações");
        conn
    }

    pub fn list_rules(&self, user_id: &str) -> Vec<AutomationRule> {
        let conn = self.conn();
        let mut stmt = match conn.prepare(
            "SELECT id, user_id, name, trigger_type, trigger_operator, trigger_value, action_type, action_target_id, action_target_name, active, created_at 
             FROM automation_rules 
             WHERE user_id = ?1 
             ORDER BY created_at DESC"
        ) {
            Ok(s) => s,
            Err(e) => {
                eprintln!("[AutomationManager] Erro ao preparar query: {}", e);
                return vec![];
            }
        };

        let rows = match stmt.query_map(params![user_id], |row| {
            Ok(AutomationRule {
                id: Some(row.get(0)?),
                user_id: row.get(1)?,
                name: row.get(2)?,
                trigger_type: row.get(3)?,
                trigger_operator: row.get(4)?,
                trigger_value: row.get(5)?,
                action_type: row.get(6)?,
                action_target_id: row.get(7)?,
                action_target_name: row.get(8)?,
                active: row.get::<_, i32>(9)? != 0,
                created_at: Some(row.get(10)?),
            })
        }) {
            Ok(r) => r,
            Err(e) => {
                eprintln!("[AutomationManager] Erro ao executar query: {}", e);
                return vec![];
            }
        };

        rows.filter_map(|r| r.ok()).collect()
    }

    pub fn add_rule(&self, rule: AutomationRule) -> Result<i64, String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO automation_rules (user_id, name, trigger_type, trigger_operator, trigger_value, action_type, action_target_id, action_target_name, active) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                rule.user_id,
                rule.name,
                rule.trigger_type,
                rule.trigger_operator,
                rule.trigger_value,
                rule.action_type,
                rule.action_target_id,
                rule.action_target_name,
                if rule.active { 1 } else { 0 }
            ],
        )
        .map(|_| conn.last_insert_rowid())
        .map_err(|e| e.to_string())
    }

    pub fn delete_rule(&self, id: i64) -> Result<(), String> {
        let conn = self.conn();
        conn.execute("DELETE FROM automation_rules WHERE id = ?1", params![id])
            .map(|_| ())
            .map_err(|e| e.to_string())
    }

    pub fn toggle_rule(&self, id: i64, active: bool) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "UPDATE automation_rules SET active = ?1 WHERE id = ?2",
            params![if active { 1 } else { 0 }, id],
        )
        .map(|_| ())
        .map_err(|e| e.to_string())
    }
}

// Funções auxiliares para calcular métricas diárias locais
fn get_daily_study_hours(conn: &Connection, user_id: &str, today: &str) -> f64 {
    conn.query_row(
        "SELECT COALESCE(SUM(hours), 0.0) FROM study_sessions WHERE user_id = ?1 AND date = ?2",
        params![user_id, today],
        |row| row.get(0),
    )
    .unwrap_or(0.0)
}

fn get_daily_sleep_hours(conn: &Connection, user_id: &str, today: &str) -> f64 {
    conn.query_row(
        "SELECT COALESCE(duration_minutes, 0) / 60.0 FROM sleep_entries WHERE user_id = ?1 AND date = ?2",
        params![user_id, today],
        |row| row.get(0),
    )
    .unwrap_or(0.0)
}

fn get_daily_pomodoros(conn: &Connection, user_id: &str, today: &str) -> f64 {
    let pattern = format!("{}%", today);
    conn.query_row(
        "SELECT COALESCE(SUM(cycles_done), 0) FROM pomodoro_history WHERE user_id = ?1 AND end_time LIKE ?2",
        params![user_id, pattern],
        |row| row.get::<_, i64>(0),
    )
    .unwrap_or(0) as f64
}

fn get_daily_completed_tasks(conn: &Connection, user_id: &str, today: &str) -> f64 {
    conn.query_row(
        "SELECT COUNT(*) FROM tasks WHERE user_id = ?1 AND completed = 1 AND completed_at = ?2",
        params![user_id, today],
        |row| row.get::<_, i64>(0),
    )
    .unwrap_or(0) as f64
}

fn get_daily_reading_pages(conn: &Connection, user_id: &str, today: &str) -> f64 {
    conn.query_row(
        "SELECT COALESCE(SUM(pages_read), 0) FROM reading_sessions WHERE user_id = ?1 AND date = ?2",
        params![user_id, today],
        |row| row.get::<_, i64>(0),
    )
    .unwrap_or(0) as f64
}

// Prevenção genérica de disparo duplicado no mesmo dia usando a tabela local de log
fn has_rule_executed_today(conn: &Connection, rule_id: i64, today: &str) -> bool {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM automation_execution_log WHERE rule_id = ?1 AND executed_at = ?2",
        params![rule_id, today],
        |row| row.get(0),
    )
    .unwrap_or(0);
    count > 0
}

fn log_rule_execution(conn: &Connection, rule_id: i64, today: &str) {
    let _ = conn.execute(
        "INSERT OR IGNORE INTO automation_execution_log (rule_id, executed_at) VALUES (?1, ?2)",
        params![rule_id, today],
    );
}

fn evaluate_condition(actual: f64, operator: &str, target: f64) -> bool {
    match operator {
        ">" => actual > target,
        ">=" => actual >= target,
        "<" => actual < target,
        "<=" => actual <= target,
        "=" | "==" => (actual - target).abs() < 1e-9,
        _ => false,
    }
}

// Lógica de avaliação de gatilhos automáticos
pub fn evaluate_rules(
    state: &AppState,
    app_handle: &AppHandle,
    user_id: &str,
) -> Result<(), String> {
    let rules = state.automation.list_rules(user_id);
    let now = state.config.get_now();
    let today = now.with_timezone(&chrono::Local).format("%Y-%m-%d").to_string();

    let conn = Connection::open(&state.automation.db_path)
        .map_err(|e| e.to_string())?;

    let mut any_theme_rule_met = false;
    let mut met_theme = None;

    for rule in rules {
        if !rule.active {
            continue;
        }

        let actual_value = match rule.trigger_type.as_str() {
            "study_hours" => get_daily_study_hours(&conn, user_id, &today),
            "sleep_hours" => get_daily_sleep_hours(&conn, user_id, &today),
            "pomodoros_completed" => get_daily_pomodoros(&conn, user_id, &today),
            "tasks_completed" => get_daily_completed_tasks(&conn, user_id, &today),
            "reading_pages" | "reading_pages_today" => get_daily_reading_pages(&conn, user_id, &today),
            "current_time" => {
                let now_local = now.with_timezone(&chrono::Local);
                now_local.hour() as f64 + (now_local.minute() as f64 / 60.0)
            }
            _ => continue,
        };

        if evaluate_condition(actual_value, &rule.trigger_operator, rule.trigger_value) {
            if rule.action_type == "change_theme" {
                any_theme_rule_met = true;
                met_theme = Some(rule.action_target_id.clone());
            } else {
                let _ = execute_action(&conn, state, app_handle, user_id, &rule, &today, now);
            }
        }
    }

    use tauri::Emitter;
    if any_theme_rule_met {
        if let Some(theme_id) = met_theme {
            let _ = app_handle.emit(
                "change-theme",
                serde_json::json!({ "userId": user_id, "theme": theme_id }),
            );
        }
    } else {
        let _ = app_handle.emit(
            "restore-default-theme",
            serde_json::json!({ "userId": user_id }),
        );
    }

    Ok(())
}

fn execute_action(
    conn: &Connection,
    state: &AppState,
    app_handle: &AppHandle,
    user_id: &str,
    rule: &AutomationRule,
    today: &str,
    now: DateTime<Utc>,
) -> Result<(), String> {
    use tauri::Emitter;

    let rule_id = match rule.id {
        Some(id) => id,
        None => return Ok(()),
    };

    // Evita execuções duplicadas no mesmo dia
    if has_rule_executed_today(conn, rule_id, today) {
        return Ok(());
    }

    match rule.action_type.as_str() {
        "mark_habit" => {
            if let Ok(habit_id) = rule.action_target_id.parse::<i32>() {
                let _ = state.habit.toggle_date(habit_id, today, true, now);
                
                let habit_name = rule.action_target_name.clone().unwrap_or_else(|| "Hábito".to_string());
                let title = "Automação executada".to_string();
                let body = format!(
                    "O hábito '{}' foi marcado automaticamente por atingir o critério da regra '{}'.", 
                    habit_name, 
                    rule.name
                );
                let _ = state.notif.push(user_id, &title, &body, "habits", None, Some("green"), Some("Activity"));
                let _ = app_handle.emit("new-notification", serde_json::json!({ "skipSound": false }));
            }
        }
        "create_task" => {
            let task_title = rule.action_target_name.clone().unwrap_or_else(|| rule.action_target_id.clone());
            
            let new_task = crate::tasks::Task {
                id: None,
                user_id: user_id.to_string(),
                title: task_title.clone(),
                description: Some(format!("Criado automaticamente pela regra de automação '{}'.", rule.name)),
                completed: false,
                due_date: Some(today.to_string()),
                created_at: now.to_rfc3339(),
                parent_id: None,
                priority: Some(2), // Média
                category: Some("Automação".to_string()),
                color: Some("#4f46e5".to_string()),
                status: Some("todo".to_string()),
                time_spent_seconds: Some(0),
            };
            let _ = state.tasks.upsert_task(new_task, Some(today.to_string()));

            let title = "Automação executada".to_string();
            let body = format!(
                "A tarefa '{}' foi criada automaticamente pela regra de automação '{}'.", 
                task_title, 
                rule.name
            );
            let _ = state.notif.push(user_id, &title, &body, "tasks", None, Some("blue"), Some("Activity"));
            let _ = app_handle.emit("new-notification", serde_json::json!({ "skipSound": false }));
        }
        "send_notification" => {
            let msg_body = rule.action_target_id.clone();
            let title = format!("Automação: {}", rule.name);
            let _ = state.notif.push(user_id, &title, &msg_body, "automations", None, Some("purple"), Some("Alert"));
            let _ = app_handle.emit("new-notification", serde_json::json!({ "skipSound": false }));
        }
        _ => return Ok(()),
    }

    log_rule_execution(conn, rule_id, today);
    Ok(())
}

// Comandos Tauri expostos
#[tauri::command]
pub async fn automation_list_rules(
    state: State<'_, AppState>,
    user_id: String,
) -> Result<Vec<AutomationRule>, String> {
    Ok(state.automation.list_rules(&user_id))
}

#[tauri::command]
pub async fn automation_add_rule(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    rule: AutomationRule,
) -> Result<i64, String> {
    let user_id = rule.user_id.clone();
    let id = state.automation.add_rule(rule)?;
    let _ = evaluate_rules(&state, &app_handle, &user_id);
    Ok(id)
}

#[tauri::command]
pub async fn automation_delete_rule(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    id: i64,
) -> Result<(), String> {
    let conn = Connection::open(&state.automation.db_path).map_err(|e| e.to_string())?;
    let user_id: String = conn.query_row(
        "SELECT user_id FROM automation_rules WHERE id = ?1",
        params![id],
        |row| row.get(0),
    ).unwrap_or_default();

    state.automation.delete_rule(id)?;

    if !user_id.is_empty() {
        let _ = evaluate_rules(&state, &app_handle, &user_id);
    }
    Ok(())
}

#[tauri::command]
pub async fn automation_toggle_rule(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    id: i64,
    active: bool,
) -> Result<(), String> {
    state.automation.toggle_rule(id, active)?;

    let conn = Connection::open(&state.automation.db_path).map_err(|e| e.to_string())?;
    let user_id: String = conn.query_row(
        "SELECT user_id FROM automation_rules WHERE id = ?1",
        params![id],
        |row| row.get(0),
    ).unwrap_or_default();

    if !user_id.is_empty() {
        let _ = evaluate_rules(&state, &app_handle, &user_id);
    }
    Ok(())
}
