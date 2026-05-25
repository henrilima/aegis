use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppNotification {
    pub id: Option<i64>,
    pub user_id: String,
    pub title: String,
    pub body: String,
    pub category: String,  // "sleep", "habit", "alarms", "system"
    pub tag: Option<String>, // Tag única para evitar duplicatas
    pub color: Option<String>, // Cor customizada (ex: "red", "blue")
    pub icon: Option<String>,  // Ícone customizado (ex: "Bell", "Coffee")
    pub persistent: bool,   // Notificações persistentes não podem ser deletadas
    pub is_read: bool,
    pub created_at: String,
}

pub struct NotificationsManager {
    db_path: PathBuf,
}

impl NotificationsManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Falha ao obter diretório de dados");
        let db_path = app_dir.join("passwords.db");

        let conn = Connection::open(&db_path).expect("Falha ao abrir banco");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).ok();
        let _ = conn.execute_batch("PRAGMA journal_mode=WAL;");

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS app_notifications (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     TEXT NOT NULL,
                title       TEXT NOT NULL,
                body        TEXT NOT NULL,
                category    TEXT NOT NULL DEFAULT 'system',
                is_read     INTEGER NOT NULL DEFAULT 0,
                created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
            );",
        ).expect("Falha ao criar tabela app_notifications");

        // Migrações de schema
        let _ = conn.execute("ALTER TABLE app_notifications ADD COLUMN tag TEXT", []);
        let _ = conn.execute("ALTER TABLE app_notifications ADD COLUMN persistent INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE app_notifications ADD COLUMN color TEXT", []);
        let _ = conn.execute("ALTER TABLE app_notifications ADD COLUMN icon TEXT", []);

        // Limpa todas as notificações persistentes legadas do banco de dados ao inicializar
        let _ = conn.execute("DELETE FROM app_notifications WHERE persistent = 1", []);

        // Garante constraint UNIQUE em (user_id, tag) para idempotência
        let _ = conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_user_tag ON app_notifications(user_id, tag) WHERE tag IS NOT NULL",
            []
        );
        let _ = conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notifications_user_tag ON app_notifications(user_id, tag) WHERE tag IS NOT NULL",
            []
        );

        // Tabela separada para rastrear eventos de sistema permanentes
        // (independente de o usuário apagar a notificação do painel)
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS system_events (
                user_id     TEXT NOT NULL,
                event_key   TEXT NOT NULL,
                created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                PRIMARY KEY (user_id, event_key)
            );",
        ).expect("Falha ao criar tabela system_events");

        Self { db_path }
    }

    fn conn(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Falha ao conectar");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Failed to set busy timeout");
        conn.execute_batch("PRAGMA journal_mode=WAL;").ok();
        conn
    }

    /// Verifica se um evento de sistema já foi disparado para este usuário.
    fn has_system_event(&self, user_id: &str, event_key: &str) -> bool {
        let conn = self.conn();
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM system_events WHERE user_id=?1 AND event_key=?2",
            params![user_id, event_key],
            |row| row.get(0),
        ).unwrap_or(0);
        count > 0
    }

    /// Registra um evento de sistema permanentemente.
    fn mark_system_event(&self, user_id: &str, event_key: &str) {
        let conn = self.conn();
        let _ = conn.execute(
            "INSERT OR IGNORE INTO system_events (user_id, event_key) VALUES (?1, ?2)",
            params![user_id, event_key],
        );
    }

    /// Cria uma nova notificação in-app para o usuário.
    pub fn push(&self, user_id: &str, title: &str, body: &str, category: &str, tag: Option<&str>, color: Option<&str>, icon: Option<&str>) -> Result<i64, String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO app_notifications (user_id, title, body, category, tag, color, icon) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![user_id, title, body, category, tag, color, icon],
        ).map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    /// Verifica se já existe qualquer notificação enviada hoje com o mesmo título (evita duplicatas no mesmo dia).
    pub fn has_unread_today(&self, user_id: &str, title: &str) -> bool {
        let conn = self.conn();
        let today = Utc::now().format("%Y-%m-%d").to_string();
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM app_notifications WHERE user_id=?1 AND title=?2 AND DATE(created_at)=?3",
            params![user_id, title, today],
            |row| row.get(0),
        ).unwrap_or(0);
        count > 0
    }

    /// Verifica e envia o convite do Discord uma única vez na vida útil do usuário.
    /// Usa system_events para rastrear permanentemente, independente de o usuário apagar a notificação.
    pub fn check_and_push_discord_invitation(&self, user_id: &str) -> Result<bool, String> {
        let event_key = "discord-invite";
        if self.has_system_event(user_id, event_key) {
            return Ok(false);
        }
        self.mark_system_event(user_id, event_key);
        Ok(true)
    }

    /// Lista todas as notificações de um usuário (mais recentes primeiro).
    pub fn list(&self, user_id: &str) -> Vec<AppNotification> {
        let conn = self.conn();
        let mut stmt = match conn.prepare(
            "SELECT id, title, body, category, is_read, created_at, tag, persistent, color, icon
             FROM app_notifications
             WHERE user_id=?1
             ORDER BY created_at DESC
             LIMIT 50"
        ) {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };

        let x: Vec<AppNotification> = match stmt.query_map(params![user_id], |row| {
            Ok(AppNotification {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                title: row.get(1)?,
                body: row.get(2)?,
                category: row.get(3)?,
                is_read: row.get::<_, i32>(4)? != 0,
                created_at: row.get(5)?,
                tag: row.get(6)?,
                persistent: row.get::<_, i32>(7).unwrap_or(0) != 0,
                color: row.get(8)?,
                icon: row.get(9)?,
            })
        }) {
            Ok(rows) => rows.filter_map(|r| r.ok()).collect(),
            Err(_) => Vec::new(),
        };
        x
    }

    /// Conta notificações não lidas.
    pub fn unread_count(&self, user_id: &str) -> i64 {
        let conn = self.conn();
        conn.query_row(
            "SELECT COUNT(*) FROM app_notifications WHERE user_id=?1 AND is_read=0",
            params![user_id],
            |row| row.get(0),
        ).unwrap_or(0)
    }

    /// Marca uma notificação específica como lida.
    pub fn mark_read(&self, id: i64, user_id: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "UPDATE app_notifications SET is_read=1 WHERE id=?1 AND user_id=?2",
            params![id, user_id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    /// Marca todas as notificações do usuário como lidas.
    pub fn mark_all_read(&self, user_id: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "UPDATE app_notifications SET is_read=1 WHERE user_id=?1",
            params![user_id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    /// Remove uma notificação permanentemente (exceto notificações persistentes).
    pub fn delete(&self, id: i64, user_id: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "DELETE FROM app_notifications WHERE id=?1 AND user_id=?2 AND persistent=0",
            params![id, user_id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    /// Remove todas as notificações lidas do usuário (exceto persistentes).
    pub fn clear_read(&self, user_id: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "DELETE FROM app_notifications WHERE user_id=?1 AND is_read=1 AND persistent=0",
            params![user_id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }
    pub fn add_notification_direct(&self, n: AppNotification) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO app_notifications (user_id, title, body, category, tag, is_read, created_at, persistent, color, icon) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![n.user_id, n.title, n.body, n.category, n.tag, if n.is_read { 1 } else { 0 }, n.created_at, if n.persistent { 1 } else { 0 }, n.color, n.icon],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }
}
