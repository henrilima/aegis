use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, NaiveDate};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct AppConfig {
    pub minimize_on_close: bool,
    pub start_at_login: bool,
    pub high_priority_notifications: bool,
    pub start_minimized: bool,
    pub week_start_day: i32,
    pub show_holidays: bool,
    pub auto_read_notifications: bool,
    pub notif_sleep_bedtime: bool,
    pub notif_sleep_bedtime_time: String,
    pub notif_sleep_morning: bool,
    pub notif_sleep_morning_time: String,
    pub notif_habit_uncompleted: bool,
    pub notif_habit_time: String,
    pub notif_event_upcoming: bool,
    pub notif_event_upcoming_time: String,
    pub notif_sleep_target_hours: f64,
    pub notification_sound: String,
}

pub struct ConfigManager {
    db_path: PathBuf,
}

impl ConfigManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
        std::fs::create_dir_all(&app_dir).ok();
        let db_path = app_dir.join("config.db");
        
        let conn = Connection::open(&db_path).expect("Failed to open config database");
        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )",
            [],
        ).ok();

        
        let defaults = [
            ("minimize_on_close", "true"),
            ("start_at_login", "false"),
            ("high_priority_notifications", "false"),
            ("start_minimized", "false"),
            ("week_start_day", "1"),
            ("debug_time_offset", "0"),
            ("show_holidays", "true"),
            ("auto_read_notifications", "true"),
            ("notif_sleep_bedtime", "true"),
            ("notif_sleep_bedtime_time", "23:00"),
            ("notif_sleep_morning", "true"),
            ("notif_sleep_morning_time", "09:00"),
            ("notif_habit_uncompleted", "true"),
            ("notif_habit_time", "22:00"),
            ("notif_event_upcoming", "true"),
            ("notif_event_upcoming_time", "08:00"),
            ("notif_sleep_target_hours", "8.0"),
            ("notification_sound", "Plin.mp3"),
        ];

        for (key, val) in defaults {
            conn.execute(
                "INSERT OR IGNORE INTO settings (key, value) VALUES (?1, ?2)",
                params![key, val],
            ).ok();
        }

        Self { db_path }
    }

    fn get_connection(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Failed to connect to config DB");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Failed to set busy timeout");
        conn
    }

    pub fn get_config(&self) -> AppConfig {
        let conn = self.get_connection();
        let minimize_on_close: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'minimize_on_close'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(true);

        let start_at_login: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'start_at_login'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(false);

        let high_priority_notifications: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'high_priority_notifications'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(false);

        let start_minimized: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'start_minimized'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(false);
        
        let week_start_day: i32 = conn.query_row(
            "SELECT value FROM settings WHERE key = 'week_start_day'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s.parse::<i32>().unwrap_or(1))
            }
        ).unwrap_or(1);

        let show_holidays: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'show_holidays'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(true);

        let auto_read_notifications: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'auto_read_notifications'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(true);

        let notif_sleep_bedtime: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'notif_sleep_bedtime'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(true);

        let notif_sleep_morning: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'notif_sleep_morning'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(true);

        let notif_habit_uncompleted: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'notif_habit_uncompleted'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(true);

        let notif_habit_time: String = conn.query_row(
            "SELECT value FROM settings WHERE key = 'notif_habit_time'",
            [],
            |row| row.get(0)
        ).unwrap_or("22:00".to_string());

        let notif_event_upcoming: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'notif_event_upcoming'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(true);

        let notif_sleep_bedtime_time: String = conn.query_row(
            "SELECT value FROM settings WHERE key = 'notif_sleep_bedtime_time'",
            [],
            |row| row.get(0)
        ).unwrap_or("23:00".to_string());

        let notif_sleep_morning_time: String = conn.query_row(
            "SELECT value FROM settings WHERE key = 'notif_sleep_morning_time'",
            [],
            |row| row.get(0)
        ).unwrap_or("09:00".to_string());

        let notif_event_upcoming_time: String = conn.query_row(
            "SELECT value FROM settings WHERE key = 'notif_event_upcoming_time'",
            [],
            |row| row.get(0)
        ).unwrap_or("08:00".to_string());

        let notif_sleep_target_hours: f64 = conn.query_row(
            "SELECT value FROM settings WHERE key = 'notif_sleep_target_hours'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s.parse::<f64>().unwrap_or(8.0))
            }
        ).unwrap_or(8.0);

        let notification_sound: String = conn.query_row(
            "SELECT value FROM settings WHERE key = 'notification_sound'",
            [],
            |row| row.get(0)
        ).unwrap_or("Plin.mp3".to_string());

        AppConfig {
            minimize_on_close,
            start_at_login,
            high_priority_notifications,
            start_minimized,
            week_start_day,
            show_holidays,
            auto_read_notifications,
            notif_sleep_bedtime,
            notif_sleep_bedtime_time,
            notif_sleep_morning,
            notif_sleep_morning_time,
            notif_habit_uncompleted,
            notif_habit_time,
            notif_event_upcoming,
            notif_event_upcoming_time,
            notif_sleep_target_hours,
            notification_sound,
        }
    }

    pub fn set_config(&self, config: AppConfig) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "UPDATE settings SET value = ?1 WHERE key = 'minimize_on_close'",
            params![if config.minimize_on_close { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "UPDATE settings SET value = ?1 WHERE key = 'start_at_login'",
            params![if config.start_at_login { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "UPDATE settings SET value = ?1 WHERE key = 'high_priority_notifications'",
            params![if config.high_priority_notifications { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('start_minimized', ?1)",
            params![if config.start_minimized { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('week_start_day', ?1)",
            params![config.week_start_day.to_string()],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('show_holidays', ?1)",
            params![if config.show_holidays { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('auto_read_notifications', ?1)",
            params![if config.auto_read_notifications { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('notif_sleep_bedtime', ?1)",
            params![if config.notif_sleep_bedtime { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('notif_sleep_morning', ?1)",
            params![if config.notif_sleep_morning { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('notif_habit_uncompleted', ?1)",
            params![if config.notif_habit_uncompleted { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('notif_habit_time', ?1)",
            params![config.notif_habit_time],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('notif_event_upcoming', ?1)",
            params![if config.notif_event_upcoming { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('notif_sleep_bedtime_time', ?1)",
            params![config.notif_sleep_bedtime_time],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('notif_sleep_morning_time', ?1)",
            params![config.notif_sleep_morning_time],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('notif_event_upcoming_time', ?1)",
            params![config.notif_event_upcoming_time],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('notif_sleep_target_hours', ?1)",
            params![config.notif_sleep_target_hours.to_string()],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('notification_sound', ?1)",
            params![config.notification_sound],
        ).map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn update_config(&self, key: &str, value: serde_json::Value) -> Result<(), String> {
        let conn = self.get_connection();
        let val_str = match value {
            serde_json::Value::String(s) => s,
            serde_json::Value::Bool(b) => b.to_string(),
            serde_json::Value::Number(n) => n.to_string(),
            _ => return Err("Unsupported value type".to_string()),
        };
        
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            params![key, val_str],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }
    pub fn get_time_offset(&self) -> i64 {
        let conn = self.get_connection();
        conn.query_row(
            "SELECT value FROM settings WHERE key = 'debug_time_offset'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s.parse::<i64>().unwrap_or(0))
            }
        ).unwrap_or(0)
    }

    pub fn set_time_offset(&self, offset: i64) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('debug_time_offset', ?1)",
            params![offset.to_string()],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_now(&self) -> DateTime<Utc> {
        let offset = self.get_time_offset();
        Utc::now() + chrono::Duration::seconds(offset)
    }

    pub fn apply_debug_command(&self, command: &str) -> Result<String, String> {
        if !command.starts_with("--dev") {
            return Err("Comando deve começar com --dev".to_string());
        }

        if command == "--dev @reset" {
            self.set_time_offset(0)?;
            return Ok("Tempo resetado para o real.".to_string());
        }

        let parse_target = |cmd: &str, tag: &str| -> Result<i64, String> {
            if let Some(start) = cmd.find(tag) {
                let rest = &cmd[start + tag.len()..];
                if let Some(end) = rest.find(')') {
                    let date_str = &rest[..end].trim();
                    
                    // Tenta DD-MM-YYYY HH:MM
                    let dt_str = format!("{} +0000", date_str);
                    if let Ok(dt) = DateTime::parse_from_str(&dt_str, "%d-%m-%Y %H:%M %z") {
                        let target = dt.with_timezone(&Utc);
                        return Ok(target.signed_duration_since(Utc::now()).num_seconds());
                    }
                    
                    // Tenta apenas DD-MM-YYYY
                    if let Ok(date) = NaiveDate::parse_from_str(date_str, "%d-%m-%Y") {
                        let target = date.and_hms_opt(12, 0, 0).unwrap().and_local_timezone(Utc).unwrap();
                        return Ok(target.signed_duration_since(Utc::now()).num_seconds());
                    }

                    return Err(format!("Formato inválido: {}. Use DD-MM-YYYY ou DD-MM-YYYY HH:MM", date_str));
                }
            }
            Err("Não encontrado".to_string())
        };

        if command.contains("@skipto") {
            let diff = parse_target(command, "@skipto(")?;
            self.set_time_offset(diff)?;
            return Ok("Tempo simulado com sucesso.".to_string());
        }

        if command.contains("@backto") {
            let diff = parse_target(command, "@backto(")?;
            self.set_time_offset(diff)?;
            return Ok("Tempo retrocedido com sucesso.".to_string());
        }

        Err("Comando interno não reconhecido.".to_string())
    }
}
