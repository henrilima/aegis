use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, NaiveDate};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
#[serde(default)]
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
    pub tmdb_api_key: String,
    pub weather_location: String,
    pub show_weather_widget: bool,
    pub app_zoom: f64,
    pub show_sidebar_trigger: bool,
    pub show_floating_trigger: bool,
    pub dashboard_clock_style: String,
    pub dashboard_clock_animated: bool,
    pub dashboard_header_style: String,
    pub custom_data_dir: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        AppConfig {
            minimize_on_close: true,
            start_at_login: false,
            high_priority_notifications: false,
            start_minimized: false,
            week_start_day: 1,
            show_holidays: true,
            auto_read_notifications: true,
            notif_sleep_bedtime: true,
            notif_sleep_bedtime_time: "23:00".to_string(),
            notif_sleep_morning: true,
            notif_sleep_morning_time: "09:00".to_string(),
            notif_habit_uncompleted: true,
            notif_habit_time: "22:00".to_string(),
            notif_event_upcoming: true,
            notif_event_upcoming_time: "08:00".to_string(),
            notif_sleep_target_hours: 8.0,
            notification_sound: "Plin.mp3".to_string(),
            tmdb_api_key: "".to_string(),
            weather_location: "".to_string(),
            show_weather_widget: true,
            app_zoom: 100.0,
            show_sidebar_trigger: true,
            show_floating_trigger: true,
            dashboard_clock_style: "default".to_string(),
            dashboard_clock_animated: true,
            dashboard_header_style: "default".to_string(),
            custom_data_dir: "".to_string(),
        }
    }
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
            ("tmdb_api_key", ""),
            ("weather_location", ""),
            ("show_weather_widget", "true"),
            ("app_zoom", "100"),
            ("show_sidebar_trigger", "true"),
            ("show_floating_trigger", "true"),
            ("dashboard_clock_style", "default"),
            ("dashboard_clock_animated", "true"),
            ("dashboard_header_style", "default"),
            ("custom_data_dir", ""),
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

        let tmdb_api_key: String = conn.query_row(
            "SELECT value FROM settings WHERE key = 'tmdb_api_key'",
            [],
            |row| row.get(0)
        ).unwrap_or_default();

        let weather_location: String = conn.query_row(
            "SELECT value FROM settings WHERE key = 'weather_location'",
            [],
            |row| row.get(0)
        ).unwrap_or_default();

        let show_weather_widget: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'show_weather_widget'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(true);

        let app_zoom: f64 = conn.query_row(
            "SELECT value FROM settings WHERE key = 'app_zoom'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s.parse::<f64>().unwrap_or(100.0))
            }
        ).unwrap_or(100.0);
        
        let show_sidebar_trigger: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'show_sidebar_trigger'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(true);

        let show_floating_trigger: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'show_floating_trigger'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(true);

        let dashboard_clock_style: String = conn.query_row(
            "SELECT value FROM settings WHERE key = 'dashboard_clock_style'",
            [],
            |row| row.get(0)
        ).unwrap_or("default".to_string());

        let dashboard_clock_animated: bool = conn.query_row(
            "SELECT value FROM settings WHERE key = 'dashboard_clock_animated'",
            [],
            |row| {
                let s: String = row.get(0)?;
                Ok(s == "true")
            }
        ).unwrap_or(true);

        let dashboard_header_style: String = conn.query_row(
            "SELECT value FROM settings WHERE key = 'dashboard_header_style'",
            [],
            |row| row.get(0)
        ).unwrap_or("default".to_string());

        let custom_data_dir: String = conn.query_row(
            "SELECT value FROM settings WHERE key = 'custom_data_dir'",
            [],
            |row| row.get(0)
        ).unwrap_or_default();

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
            tmdb_api_key,
            weather_location,
            show_weather_widget,
            app_zoom,
            show_sidebar_trigger,
            show_floating_trigger,
            dashboard_clock_style,
            dashboard_clock_animated,
            dashboard_header_style,
            custom_data_dir,
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

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('weather_location', ?1)",
            params![config.weather_location],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('show_weather_widget', ?1)",
            params![if config.show_weather_widget { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('tmdb_api_key', ?1)",
            params![config.tmdb_api_key],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('app_zoom', ?1)",
            params![config.app_zoom.to_string()],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('show_sidebar_trigger', ?1)",
            params![if config.show_sidebar_trigger { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('show_floating_trigger', ?1)",
            params![if config.show_floating_trigger { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('dashboard_clock_style', ?1)",
            params![config.dashboard_clock_style],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('dashboard_clock_animated', ?1)",
            params![if config.dashboard_clock_animated { "true" } else { "false" }],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('dashboard_header_style', ?1)",
            params![config.dashboard_header_style],
        ).map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('custom_data_dir', ?1)",
            params![config.custom_data_dir],
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

    pub fn get_tmdb_api_key(&self) -> String {
        let conn = self.get_connection();
        conn.query_row(
            "SELECT value FROM settings WHERE key = 'tmdb_api_key'",
            [],
            |row| row.get(0),
        ).unwrap_or_default()
    }

    pub fn set_tmdb_api_key(&self, key: &str) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('tmdb_api_key', ?1)",
            params![key],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_now(&self) -> DateTime<Utc> {
        let offset = self.get_time_offset();
        Utc::now() + chrono::Duration::seconds(offset)
    }

    pub fn apply_debug_command(&self, mut command: &str) -> Result<String, String> {
        command = command.trim();
        
        // Suporte retrocompatível e limpeza de prefixos
        if command.starts_with("--dev ") {
            command = &command[6..];
        } else if command.starts_with("/") {
            command = &command[1..];
        }

        if command == "time reset" || command == "@reset" {
            self.set_time_offset(0)?;
            return Ok("Tempo resetado para o real.".to_string());
        }

        if command == "db optimize" {
            let conn = self.get_connection();
            conn.execute("VACUUM", []).map_err(|e| e.to_string())?;
            return Ok("Banco de dados desfragmentado e otimizado (VACUUM concluído).".to_string());
        }

        if command == "sys info" {
            let os = std::env::consts::OS;
            let arch = std::env::consts::ARCH;
            return Ok(format!("Aegis Core rodando em {} ({}).", os, arch));
        }

        if command == "test error" {
            return Err("Isso é um erro simulado disparado pelo backend do Aegis para testar as fronteiras de erro do frontend.".to_string());
        }

        let parse_target = |cmd: &str, tags: &[&str]| -> Result<i64, String> {
            for &tag in tags {
                if let Some(start) = cmd.find(tag) {
                    let mut rest = cmd[start + tag.len()..].trim();
                    // Limpar parênteses se o usuário digitou ex: @skipto(10-10-2020)
                    if rest.starts_with('(') && rest.ends_with(')') {
                        rest = &rest[1..rest.len() - 1];
                    }
                    let date_str = rest.trim();
                    
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

        if command.contains("@skipto") || command.starts_with("time skipto") {
            let diff = parse_target(command, &["@skipto", "time skipto"])?;
            self.set_time_offset(diff)?;
            return Ok("Tempo simulado avançado com sucesso.".to_string());
        }

        if command.contains("@backto") || command.starts_with("time backto") {
            let diff = parse_target(command, &["@backto", "time backto"])?;
            self.set_time_offset(diff)?;
            return Ok("Tempo simulado retrocedido com sucesso.".to_string());
        }

        Err("Comando interno não reconhecido pelo núcleo (Backend).".to_string())
    }
}

pub fn get_database_path(app_handle: &AppHandle) -> PathBuf {
    let app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
    let config_db_path = app_dir.join("config.db");
    let mut db_dir = app_dir.clone();
    
    if let Ok(conn) = Connection::open(&config_db_path) {
        let custom_dir: Option<String> = conn.query_row(
            "SELECT value FROM settings WHERE key = 'custom_data_dir'",
            [],
            |row| row.get(0),
        ).ok();
        
        if let Some(path_str) = custom_dir {
            let path_str = path_str.trim();
            if !path_str.is_empty() {
                let path = std::path::PathBuf::from(path_str);
                if std::fs::create_dir_all(&path).is_ok() {
                    db_dir = path;
                }
            }
        }
    }
    
    std::fs::create_dir_all(&db_dir).ok();
    let profile_db = db_dir.join("profile.db");
    let old_db = db_dir.join("passwords.db");
    if !profile_db.exists() && old_db.exists() {
        let _ = std::fs::rename(&old_db, &profile_db);
    }
    profile_db
}

fn copy_notes_recursive(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let dest_path = dst.join(entry.file_name());
        if ty.is_dir() {
            copy_notes_recursive(&entry.path(), &dest_path)?;
        } else {
            if !dest_path.exists() {
                std::fs::copy(entry.path(), &dest_path)?;
            }
        }
    }
    Ok(())
}

pub fn get_notes_path(app_handle: &AppHandle) -> PathBuf {
    let db_path = get_database_path(app_handle);
    let db_dir = db_path.parent().expect("Failed to get db parent dir");
    let target_notes_dir = db_dir.join("notes");

    // Auto-migration: if we are using a custom data dir, and the target notes directory
    // is empty or does not exist, but the default notes directory has notes, copy them.
    if let Ok(default_dir) = app_handle.path().app_data_dir() {
        let default_notes_dir = default_dir.join("notes");
        if default_notes_dir.exists() && default_notes_dir != target_notes_dir {
            let is_target_empty = if target_notes_dir.exists() {
                if let Ok(mut entries) = std::fs::read_dir(&target_notes_dir) {
                    entries.next().is_none()
                } else {
                    true
                }
            } else {
                true
            };

            if is_target_empty {
                let _ = std::fs::create_dir_all(&target_notes_dir);
                let _ = copy_notes_recursive(&default_notes_dir, &target_notes_dir);
            }
        }
    }

    target_notes_dir
}
