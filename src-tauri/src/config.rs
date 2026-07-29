use chrono::{DateTime, NaiveDate, Utc};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
#[allow(non_snake_case)]
pub struct AppCustomMedia {
    pub id: Option<i64>,
    pub fileName: String,
    pub displayName: String,
    pub filePath: String,
    pub fileSize: u64,
    pub isCustom: bool,
    pub createdAt: String,
}

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
    pub achievements_enabled: bool,
    pub dashboard_cover_image: String,
    pub dashboard_welcoming_glass: bool,
    pub dashboard_cover_position_x: i32,
    pub dashboard_cover_position_y: i32,
    pub dashboard_show_date: bool,
    pub dashboard_cover_blur: i32,
    pub dashboard_cover_grayscale: i32,
    pub dashboard_cover_saturation: i32,
    pub dashboard_cover_zoom: i32,
    pub dashboard_cover_height: i32,
    pub selected_rank_title: String,
    pub show_profile_rank_border: bool,
    pub show_sidebar_rank_border: bool,
    pub show_level_up_modal: bool,
    pub alarm_default_snooze_minutes: i32,
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
            achievements_enabled: true,
            dashboard_cover_image: "".to_string(),
            dashboard_welcoming_glass: true,
            dashboard_cover_position_x: 50,
            dashboard_cover_position_y: 50,
            dashboard_show_date: true,
            dashboard_cover_blur: 0,
            dashboard_cover_grayscale: 0,
            dashboard_cover_saturation: 100,
            dashboard_cover_zoom: 100,
            dashboard_cover_height: 300,
            selected_rank_title: "".to_string(),
            show_profile_rank_border: true,
            show_sidebar_rank_border: true,
            show_level_up_modal: false,
            alarm_default_snooze_minutes: 5,
        }
    }
}

pub struct ConfigManager {
    db_path: PathBuf,
    time_offset: std::sync::Mutex<Option<i64>>,
}

impl ConfigManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data dir");
        std::fs::create_dir_all(&app_dir).ok();
        let db_path = app_dir.join("config.db");

        let conn = Connection::open(&db_path).expect("Failed to open config database");
        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )",
            [],
        )
        .ok();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS custom_media (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_name TEXT NOT NULL UNIQUE,
                display_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
            )",
            [],
        )
        .ok();

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
            ("achievements_enabled", "true"),
            ("dashboard_cover_image", ""),
            ("dashboard_welcoming_glass", "true"),
            ("dashboard_cover_position_x", "50"),
            ("dashboard_cover_position_y", "50"),
            ("dashboard_show_date", "true"),
            ("dashboard_cover_blur", "0"),
            ("dashboard_cover_grayscale", "0"),
            ("dashboard_cover_saturation", "100"),
            ("dashboard_cover_zoom", "100"),
            ("dashboard_cover_height", "300"),
            ("selected_rank_title", ""),
            ("show_profile_rank_border", "true"),
            ("show_sidebar_rank_border", "true"),
        ];

        for (key, val) in defaults {
            conn.execute(
                "INSERT OR IGNORE INTO settings (key, value) VALUES (?1, ?2)",
                params![key, val],
            )
            .ok();
        }

        Self {
            db_path,
            time_offset: std::sync::Mutex::new(None),
        }
    }

    fn get_connection(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Failed to connect to config DB");
        conn.busy_timeout(std::time::Duration::from_millis(5000))
            .expect("Failed to set busy timeout");
        conn
    }

    fn query_setting(&self, conn: &Connection, key: &str, user_id: Option<&str>) -> Option<String> {
        if let Some(uid) = user_id {
            if !uid.is_empty() {
                let user_key = format!("{}:{}", uid, key);
                if let Ok(v) = conn.query_row(
                    "SELECT value FROM settings WHERE key = ?1",
                    params![user_key],
                    |row| row.get(0),
                ) {
                    return Some(v);
                }
            }
        }
        conn.query_row(
            "SELECT value FROM settings WHERE key = ?1",
            params![key],
            |row| row.get(0),
        )
        .ok()
    }

    fn update_setting(
        &self,
        conn: &Connection,
        key: &str,
        val: &str,
        user_id: Option<&str>,
        is_user_scoped: bool,
    ) {
        let target_key = if is_user_scoped {
            if let Some(uid) = user_id {
                if !uid.is_empty() {
                    format!("{}:{}", uid, key)
                } else {
                    key.to_string()
                }
            } else {
                key.to_string()
            }
        } else {
            key.to_string()
        };

        let _ = conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![target_key, val],
        );
    }

    #[allow(dead_code)]
    pub fn get_config(&self) -> AppConfig {
        self.get_config_for_user(None)
    }

    pub fn get_config_for_user(&self, user_id: Option<&str>) -> AppConfig {
        let conn = self.get_connection();
        let get_b = |k: &str, def: bool| -> bool {
            self.query_setting(&conn, k, user_id)
                .map(|s| s == "true")
                .unwrap_or(def)
        };
        let get_i = |k: &str, def: i32| -> i32 {
            self.query_setting(&conn, k, user_id)
                .and_then(|s| s.parse().ok())
                .unwrap_or(def)
        };
        let get_f = |k: &str, def: f64| -> f64 {
            self.query_setting(&conn, k, user_id)
                .and_then(|s| s.parse().ok())
                .unwrap_or(def)
        };
        let get_s = |k: &str, def: &str| -> String {
            self.query_setting(&conn, k, user_id)
                .unwrap_or_else(|| def.to_string())
        };

        AppConfig {
            minimize_on_close: get_b("minimize_on_close", true),
            start_at_login: get_b("start_at_login", false),
            high_priority_notifications: get_b("high_priority_notifications", false),
            start_minimized: get_b("start_minimized", false),
            week_start_day: get_i("week_start_day", 1),
            show_holidays: get_b("show_holidays", true),
            auto_read_notifications: get_b("auto_read_notifications", true),
            notif_sleep_bedtime: get_b("notif_sleep_bedtime", true),
            notif_sleep_bedtime_time: get_s("notif_sleep_bedtime_time", "23:00"),
            notif_sleep_morning: get_b("notif_sleep_morning", true),
            notif_sleep_morning_time: get_s("notif_sleep_morning_time", "09:00"),
            notif_habit_uncompleted: get_b("notif_habit_uncompleted", true),
            notif_habit_time: get_s("notif_habit_time", "22:00"),
            notif_event_upcoming: get_b("notif_event_upcoming", true),
            notif_event_upcoming_time: get_s("notif_event_upcoming_time", "08:00"),
            notif_sleep_target_hours: get_f("notif_sleep_target_hours", 8.0),
            notification_sound: get_s("notification_sound", "Plin.mp3"),
            tmdb_api_key: get_s("tmdb_api_key", ""),
            weather_location: get_s("weather_location", ""),
            show_weather_widget: get_b("show_weather_widget", true),
            app_zoom: get_f("app_zoom", 100.0),
            show_sidebar_trigger: get_b("show_sidebar_trigger", true),
            show_floating_trigger: get_b("show_floating_trigger", true),
            dashboard_clock_style: get_s("dashboard_clock_style", "default"),
            dashboard_clock_animated: get_b("dashboard_clock_animated", true),
            dashboard_header_style: get_s("dashboard_header_style", "default"),
            custom_data_dir: get_s("custom_data_dir", ""),
            achievements_enabled: get_b("achievements_enabled", true),
            dashboard_cover_image: get_s("dashboard_cover_image", ""),
            dashboard_welcoming_glass: get_b("dashboard_welcoming_glass", true),
            dashboard_cover_position_x: get_i("dashboard_cover_position_x", 50),
            dashboard_cover_position_y: get_i("dashboard_cover_position_y", 50),
            dashboard_show_date: get_b("dashboard_show_date", true),
            dashboard_cover_blur: get_i("dashboard_cover_blur", 0),
            dashboard_cover_grayscale: get_i("dashboard_cover_grayscale", 0),
            dashboard_cover_saturation: get_i("dashboard_cover_saturation", 100),
            dashboard_cover_zoom: get_i("dashboard_cover_zoom", 100),
            dashboard_cover_height: get_i("dashboard_cover_height", 300),
            selected_rank_title: get_s("selected_rank_title", ""),
            show_profile_rank_border: get_b("show_profile_rank_border", true),
            show_sidebar_rank_border: get_b("show_sidebar_rank_border", true),
            show_level_up_modal: get_b("show_level_up_modal", false),
            alarm_default_snooze_minutes: get_i("alarm_default_snooze_minutes", 5),
        }
    }

    #[allow(dead_code)]
    pub fn set_config(&self, config: AppConfig) -> Result<(), String> {
        self.set_config_for_user(None, config)
    }

    pub fn set_config_for_user(
        &self,
        user_id: Option<&str>,
        config: AppConfig,
    ) -> Result<(), String> {
        let conn = self.get_connection();
        let set_g = |k: &str, v: &str| self.update_setting(&conn, k, v, user_id, false);
        let set_u = |k: &str, v: &str| self.update_setting(&conn, k, v, user_id, true);

        set_g(
            "minimize_on_close",
            if config.minimize_on_close {
                "true"
            } else {
                "false"
            },
        );
        set_g(
            "start_at_login",
            if config.start_at_login {
                "true"
            } else {
                "false"
            },
        );
        set_g(
            "high_priority_notifications",
            if config.high_priority_notifications {
                "true"
            } else {
                "false"
            },
        );
        set_g(
            "start_minimized",
            if config.start_minimized {
                "true"
            } else {
                "false"
            },
        );
        set_g("custom_data_dir", &config.custom_data_dir);

        set_u("week_start_day", &config.week_start_day.to_string());
        set_u(
            "show_holidays",
            if config.show_holidays {
                "true"
            } else {
                "false"
            },
        );
        set_u(
            "auto_read_notifications",
            if config.auto_read_notifications {
                "true"
            } else {
                "false"
            },
        );
        set_u(
            "notif_sleep_bedtime",
            if config.notif_sleep_bedtime {
                "true"
            } else {
                "false"
            },
        );
        set_u("notif_sleep_bedtime_time", &config.notif_sleep_bedtime_time);
        set_u(
            "notif_sleep_morning",
            if config.notif_sleep_morning {
                "true"
            } else {
                "false"
            },
        );
        set_u("notif_sleep_morning_time", &config.notif_sleep_morning_time);
        set_u(
            "notif_habit_uncompleted",
            if config.notif_habit_uncompleted {
                "true"
            } else {
                "false"
            },
        );
        set_u("notif_habit_time", &config.notif_habit_time);
        set_u(
            "notif_event_upcoming",
            if config.notif_event_upcoming {
                "true"
            } else {
                "false"
            },
        );
        set_u(
            "notif_event_upcoming_time",
            &config.notif_event_upcoming_time,
        );
        set_u(
            "notif_sleep_target_hours",
            &config.notif_sleep_target_hours.to_string(),
        );
        set_u("notification_sound", &config.notification_sound);
        set_u("tmdb_api_key", &config.tmdb_api_key);
        set_u("weather_location", &config.weather_location);
        set_u(
            "show_weather_widget",
            if config.show_weather_widget {
                "true"
            } else {
                "false"
            },
        );
        set_u("app_zoom", &config.app_zoom.to_string());
        set_u(
            "show_sidebar_trigger",
            if config.show_sidebar_trigger {
                "true"
            } else {
                "false"
            },
        );
        set_u(
            "show_floating_trigger",
            if config.show_floating_trigger {
                "true"
            } else {
                "false"
            },
        );
        set_u("dashboard_clock_style", &config.dashboard_clock_style);
        set_u(
            "dashboard_clock_animated",
            if config.dashboard_clock_animated {
                "true"
            } else {
                "false"
            },
        );
        set_u("dashboard_header_style", &config.dashboard_header_style);
        set_u(
            "achievements_enabled",
            if config.achievements_enabled {
                "true"
            } else {
                "false"
            },
        );
        set_u("dashboard_cover_image", &config.dashboard_cover_image);
        set_u(
            "dashboard_welcoming_glass",
            if config.dashboard_welcoming_glass {
                "true"
            } else {
                "false"
            },
        );
        set_u(
            "dashboard_cover_position_x",
            &config.dashboard_cover_position_x.to_string(),
        );
        set_u(
            "dashboard_cover_position_y",
            &config.dashboard_cover_position_y.to_string(),
        );
        set_u(
            "dashboard_show_date",
            if config.dashboard_show_date {
                "true"
            } else {
                "false"
            },
        );
        set_u(
            "dashboard_cover_blur",
            &config.dashboard_cover_blur.to_string(),
        );
        set_u(
            "dashboard_cover_grayscale",
            &config.dashboard_cover_grayscale.to_string(),
        );
        set_u(
            "dashboard_cover_saturation",
            &config.dashboard_cover_saturation.to_string(),
        );
        set_u(
            "dashboard_cover_zoom",
            &config.dashboard_cover_zoom.to_string(),
        );
        set_u(
            "dashboard_cover_height",
            &config.dashboard_cover_height.to_string(),
        );
        set_u("selected_rank_title", &config.selected_rank_title);
        set_u(
            "show_profile_rank_border",
            if config.show_profile_rank_border {
                "true"
            } else {
                "false"
            },
        );
        set_u(
            "show_sidebar_rank_border",
            if config.show_sidebar_rank_border {
                "true"
            } else {
                "false"
            },
        );
        set_u(
            "show_level_up_modal",
            if config.show_level_up_modal {
                "true"
            } else {
                "false"
            },
        );
        set_u(
            "alarm_default_snooze_minutes",
            &config.alarm_default_snooze_minutes.to_string(),
        );

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
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }
    pub fn get_time_offset(&self) -> i64 {
        {
            let lock = self.time_offset.lock().unwrap();
            if let Some(val) = *lock {
                return val;
            }
        }

        let conn = self.get_connection();
        let val = conn
            .query_row(
                "SELECT value FROM settings WHERE key = 'debug_time_offset'",
                [],
                |row| {
                    let s: String = row.get(0)?;
                    Ok(s.parse::<i64>().unwrap_or(0))
                },
            )
            .unwrap_or(0);

        let mut lock = self.time_offset.lock().unwrap();
        *lock = Some(val);
        val
    }

    pub fn set_time_offset(&self, offset: i64) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('debug_time_offset', ?1)",
            params![offset.to_string()],
        )
        .map_err(|e| e.to_string())?;

        let mut lock = self.time_offset.lock().unwrap();
        *lock = Some(offset);
        Ok(())
    }

    pub fn get_tmdb_api_key(&self) -> String {
        let conn = self.get_connection();
        conn.query_row(
            "SELECT value FROM settings WHERE key = 'tmdb_api_key'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default()
    }

    pub fn set_tmdb_api_key(&self, key: &str) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('tmdb_api_key', ?1)",
            params![key],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_now(&self) -> DateTime<Utc> {
        let offset = self.get_time_offset();
        Utc::now() + chrono::Duration::seconds(offset)
    }

    pub fn list_custom_media(&self) -> Vec<AppCustomMedia> {
        let conn = match Connection::open(&self.db_path) {
            Ok(c) => c,
            Err(_) => return Vec::new(),
        };

        let mut stmt = match conn.prepare(
            "SELECT id, file_name, display_name, file_path, file_size, created_at FROM custom_media ORDER BY id DESC",
        ) {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };

        let rows = stmt.query_map([], |row| {
            Ok(AppCustomMedia {
                id: Some(row.get(0)?),
                fileName: row.get(1)?,
                displayName: row.get(2)?,
                filePath: row.get(3)?,
                fileSize: row.get::<_, i64>(4)? as u64,
                isCustom: true,
                createdAt: row.get(5)?,
            })
        });

        match rows {
            Ok(iter) => iter.filter_map(|r| r.ok()).collect(),
            Err(_) => Vec::new(),
        }
    }

    pub fn import_custom_media(
        &self,
        app_handle: &AppHandle,
        source_path_str: &str,
        display_name_opt: Option<String>,
    ) -> Result<AppCustomMedia, String> {
        let source_path = std::path::Path::new(source_path_str);
        if !source_path.exists() || !source_path.is_file() {
            return Err("Arquivo de origem não encontrado".to_string());
        }

        let ext = source_path
            .extension()
            .map(|e| e.to_string_lossy().to_lowercase())
            .unwrap_or_default();

        if !matches!(ext.as_str(), "mp3" | "wav" | "ogg" | "m4a" | "flac" | "aac") {
            return Err(
                "Formato de áudio não suportado. Use MP3, WAV, OGG, M4A, FLAC ou AAC.".to_string(),
            );
        }

        let file_stem = source_path
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "audio".to_string());

        let display_name = display_name_opt
            .filter(|s| !s.trim().is_empty())
            .unwrap_or_else(|| file_stem.clone());

        let app_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| e.to_string())?;
        let sounds_dir = app_dir.join("sounds");
        std::fs::create_dir_all(&sounds_dir).map_err(|e| e.to_string())?;

        let timestamp = chrono::Utc::now().timestamp_millis();
        let sanitized_stem: String = file_stem
            .chars()
            .map(|c| {
                if c.is_alphanumeric() || c == '_' || c == '-' {
                    c
                } else {
                    '_'
                }
            })
            .collect();
        let unique_file_name = format!("{}_{}.{}", sanitized_stem, timestamp, ext);
        let target_path = sounds_dir.join(&unique_file_name);

        std::fs::copy(source_path, &target_path)
            .map_err(|e| format!("Falha ao copiar arquivo de áudio: {}", e))?;

        let file_size = std::fs::metadata(&target_path)
            .map(|m| m.len())
            .unwrap_or(0);
        let target_path_str = target_path.to_string_lossy().to_string();
        let now_iso = chrono::Utc::now().to_rfc3339();

        let conn = Connection::open(&self.db_path).map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO custom_media (file_name, display_name, file_path, file_size, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![unique_file_name, display_name, target_path_str, file_size as i64, now_iso],
        )
        .map_err(|e| e.to_string())?;

        let id = conn.last_insert_rowid();

        Ok(AppCustomMedia {
            id: Some(id),
            fileName: unique_file_name,
            displayName: display_name,
            filePath: target_path_str,
            fileSize: file_size,
            isCustom: true,
            createdAt: now_iso,
        })
    }

    pub fn rename_custom_media(&self, id: i64, new_display_name: &str) -> Result<(), String> {
        let conn = Connection::open(&self.db_path).map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE custom_media SET display_name = ?1 WHERE id = ?2",
            params![new_display_name, id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_custom_media(&self, id: i64) -> Result<(), String> {
        let conn = Connection::open(&self.db_path).map_err(|e| e.to_string())?;
        let path_to_remove: Option<String> = conn
            .query_row(
                "SELECT file_path FROM custom_media WHERE id = ?1",
                params![id],
                |row| row.get(0),
            )
            .ok();

        if let Some(path_str) = path_to_remove {
            let p = std::path::Path::new(&path_str);
            if p.exists() {
                let _ = std::fs::remove_file(p);
            }
        }

        conn.execute("DELETE FROM custom_media WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn apply_debug_command(
        &self,
        app_handle: &tauri::AppHandle,
        user_id_opt: Option<String>,
        mut command: &str,
    ) -> Result<String, String> {
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

        if command.starts_with("db query ") {
            let sql = &command[9..];
            let db_path = get_database_path(app_handle);
            let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
            let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
            let column_count = stmt.column_count();
            let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
            let mut result = String::new();
            while let Some(row) = rows.next().map_err(|e| e.to_string())? {
                let mut row_str = String::new();
                for i in 0..column_count {
                    let val = match row.get_ref(i).map_err(|e| e.to_string())? {
                        rusqlite::types::ValueRef::Null => "NULL".to_string(),
                        rusqlite::types::ValueRef::Integer(n) => n.to_string(),
                        rusqlite::types::ValueRef::Real(r) => r.to_string(),
                        rusqlite::types::ValueRef::Text(t) => {
                            String::from_utf8_lossy(t).into_owned()
                        }
                        rusqlite::types::ValueRef::Blob(b) => format!("BLOB ({} bytes)", b.len()),
                    };
                    if i > 0 {
                        row_str.push_str(" | ");
                    }
                    row_str.push_str(&val);
                }
                result.push_str(&row_str);
                result.push_str("\n");
            }
            if result.is_empty() {
                return Ok("Sucesso. Nenhuma linha retornada.".to_string());
            }
            return Ok(result);
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
                    if let Ok(naive_dt) =
                        chrono::NaiveDateTime::parse_from_str(date_str, "%d-%m-%Y %H:%M")
                    {
                        if let Some(target) = naive_dt
                            .and_local_timezone(chrono::Local)
                            .earliest()
                            .map(|dt| dt.with_timezone(&Utc))
                            .or_else(|| naive_dt.and_local_timezone(Utc).earliest())
                        {
                            return Ok(target.signed_duration_since(Utc::now()).num_seconds());
                        }
                    }

                    // Tenta apenas DD-MM-YYYY
                    if let Ok(date) = NaiveDate::parse_from_str(date_str, "%d-%m-%Y") {
                        let naive_dt = date.and_hms_opt(12, 0, 0).unwrap();
                        if let Some(target) = naive_dt
                            .and_local_timezone(chrono::Local)
                            .earliest()
                            .map(|dt| dt.with_timezone(&Utc))
                            .or_else(|| naive_dt.and_local_timezone(Utc).earliest())
                        {
                            return Ok(target.signed_duration_since(Utc::now()).num_seconds());
                        }
                    }

                    return Err(format!(
                        "Formato inválido: {}. Use DD-MM-YYYY ou DD-MM-YYYY HH:MM",
                        date_str
                    ));
                }
            }
            Err("Não encontrado".to_string())
        };

        let get_target_user_id = |conn: &Connection| -> String {
            if let Some(ref uid) = user_id_opt {
                if !uid.trim().is_empty() {
                    return uid.clone();
                }
            }
            conn.query_row("SELECT user_id FROM user_xp LIMIT 1", [], |r| r.get(0))
                .unwrap_or_else(|_| "default_user".to_string())
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

        // --- COMANDOS DO SISTEMA DE RANK / USUÁRIO ---
        if command.starts_with("user setlevel ")
            || command.starts_with("rank setlevel ")
            || command.starts_with("rank set ")
            || command.starts_with("level set ")
        {
            let parts: Vec<&str> = command.split_whitespace().collect();
            let level_idx = if parts.len() >= 3 {
                parts.len() - 1
            } else {
                return Err("Formato inválido. Use: rank set <nivel>".to_string());
            };
            let level: i32 = parts[level_idx]
                .parse()
                .map_err(|_| "Nível inválido".to_string())?;

            let db_path = get_database_path(app_handle);
            let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
            let user_id = get_target_user_id(&conn);

            conn.execute(
                "INSERT INTO user_xp (user_id, xp, level, tree_xp, tree_level) 
                 VALUES (?1, 0, ?2, 0, 1) 
                 ON CONFLICT(user_id) DO UPDATE SET level = ?2",
                params![user_id, level],
            )
            .map_err(|e| e.to_string())?;

            return Ok(format!(
                "Nível do usuário atualizado para {} com sucesso.",
                level
            ));
        }

        // --- COMANDOS DO SISTEMA DE MASCOTE (PET) ---
        if command.starts_with("pet setlevel ") {
            let parts: Vec<&str> = command.split_whitespace().collect();
            if parts.len() < 3 {
                return Err("Formato inválido. Use: pet setlevel <nivel> [xp]".to_string());
            }
            let level: i32 = parts[2].parse().map_err(|_| "Nível inválido".to_string())?;
            let xp: i32 = if parts.len() >= 4 {
                parts[3].parse().map_err(|_| "XP inválido".to_string())?
            } else {
                0
            };

            let db_path = get_database_path(app_handle);
            let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
            let user_id = get_target_user_id(&conn);

            conn.execute(
                "INSERT INTO user_xp (user_id, xp, level, tree_xp, tree_level) 
                 VALUES (?1, 0, 1, ?2, ?3) 
                 ON CONFLICT(user_id) DO UPDATE SET tree_xp = ?2, tree_level = ?3",
                params![user_id, xp, level],
            )
            .map_err(|e| e.to_string())?;

            return Ok(format!(
                "Nível do Pet atualizado para {} (XP: {}).",
                level, xp
            ));
        }

        if command.starts_with("pet addxp ") {
            let parts: Vec<&str> = command.split_whitespace().collect();
            if parts.len() < 3 {
                return Err("Formato inválido. Use: pet addxp <quantidade>".to_string());
            }
            let amount: i32 = parts[2]
                .parse()
                .map_err(|_| "Quantidade de XP inválida".to_string())?;

            let db_path = get_database_path(app_handle);
            let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
            let user_id = get_target_user_id(&conn);

            let (mut current_tree_xp, mut current_tree_level): (i32, i32) = conn
                .query_row(
                    "SELECT tree_xp, tree_level FROM user_xp WHERE user_id = ?1",
                    params![user_id],
                    |r| Ok((r.get(0)?, r.get(1)?)),
                )
                .unwrap_or((0, 1));

            current_tree_xp += amount;

            let get_xp_for_level = |level: i32| -> i32 {
                if level <= 5 {
                    200
                } else if level <= 10 {
                    400
                } else if level <= 15 {
                    800
                } else if level <= 20 {
                    1500
                } else if level <= 25 {
                    2500
                } else if level <= 30 {
                    4000
                } else if level <= 35 {
                    6000
                } else if level <= 40 {
                    9000
                } else {
                    12000
                }
            };

            loop {
                let needed = get_xp_for_level(current_tree_level);
                if current_tree_xp >= needed {
                    current_tree_xp -= needed;
                    current_tree_level += 1;
                } else {
                    break;
                }
            }

            conn.execute(
                "INSERT INTO user_xp (user_id, xp, level, tree_xp, tree_level) 
                 VALUES (?1, 0, 1, ?2, ?3) 
                 ON CONFLICT(user_id) DO UPDATE SET tree_xp = ?2, tree_level = ?3",
                params![user_id, current_tree_xp, current_tree_level],
            )
            .map_err(|e| e.to_string())?;

            return Ok(format!(
                "Adicionado {} XP ao Pet. Novo estado: Nível {}, XP: {}.",
                amount, current_tree_level, current_tree_xp
            ));
        }

        if command == "pet die" || command == "pet kill" {
            let db_path = get_database_path(app_handle);
            let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
            let user_id = get_target_user_id(&conn);

            conn.execute(
                "DELETE FROM daily_challenges_completed WHERE user_id = ?1",
                params![user_id],
            )
            .map_err(|e| e.to_string())?;

            conn.execute(
                "INSERT INTO user_xp (user_id, xp, level, tree_xp, tree_level) 
                 VALUES (?1, 0, 1, 0, 1) 
                 ON CONFLICT(user_id) DO UPDATE SET tree_xp = 0, tree_level = 1",
                params![user_id],
            )
            .map_err(|e| e.to_string())?;

            conn.execute(
                "DELETE FROM xp_history WHERE user_id = ?1 AND xp_type = 'Pet'",
                params![user_id],
            )
            .map_err(|e| e.to_string())?;

            conn.execute(
                "DELETE FROM xp_ledger WHERE user_id = ?1 AND xp_type = 'Pet'",
                params![user_id],
            )
            .map_err(|e| e.to_string())?;

            return Ok(
                "Pet desmaiado: progresso, missões e histórico de XP foram eliminados.".to_string(),
            );
        }

        if command == "pet revive" {
            let db_path = get_database_path(app_handle);
            let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
            let user_id = get_target_user_id(&conn);

            // Garante que o pet não fique em estado 0 XP e Nível 1 (que é considerado desmaiado)
            conn.execute(
                "INSERT INTO user_xp (user_id, xp, level, tree_xp, tree_level) 
                 VALUES (?1, 0, 1, 10, 1) 
                 ON CONFLICT(user_id) DO UPDATE SET tree_xp = CASE WHEN tree_xp = 0 AND tree_level = 1 THEN 10 ELSE tree_xp END",
                params![user_id],
            ).map_err(|e| e.to_string())?;

            let today = self.get_now().format("%Y-%m-%d").to_string();

            conn.execute(
                "INSERT INTO daily_challenges_completed (user_id, challenge_id, completed_date, xp_awarded) 
                 VALUES (?1, 'revive_dummy_challenge', ?2, 0)",
                params![user_id, today],
            ).map_err(|e| e.to_string())?;

            return Ok("Pet revivido: missão de hoje simulada e concluída.".to_string());
        }

        if command == "pet reset" {
            let db_path = get_database_path(app_handle);
            let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
            let user_id = get_target_user_id(&conn);

            conn.execute(
                "INSERT INTO user_xp (user_id, xp, level, tree_xp, tree_level) 
                 VALUES (?1, 0, 1, 0, 1) 
                 ON CONFLICT(user_id) DO UPDATE SET tree_xp = 0, tree_level = 1",
                params![user_id],
            )
            .map_err(|e| e.to_string())?;

            conn.execute(
                "DELETE FROM daily_challenges_completed WHERE user_id = ?1",
                params![user_id],
            )
            .map_err(|e| e.to_string())?;

            conn.execute(
                "DELETE FROM xp_history WHERE user_id = ?1 AND xp_type = 'Pet'",
                params![user_id],
            )
            .map_err(|e| e.to_string())?;

            conn.execute(
                "DELETE FROM xp_ledger WHERE user_id = ?1 AND xp_type = 'Pet'",
                params![user_id],
            )
            .map_err(|e| e.to_string())?;

            return Ok(
                "Pet resetado com sucesso para Nível 1, XP 0 e histórico de XP limpo.".to_string(),
            );
        }

        Err("Comando interno não reconhecido pelo núcleo (Backend).".to_string())
    }
}

pub fn get_database_path(app_handle: &AppHandle) -> PathBuf {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");
    let config_db_path = app_dir.join("config.db");
    let mut db_dir = app_dir.clone();

    if let Ok(conn) = Connection::open(&config_db_path) {
        let custom_dir: Option<String> = conn
            .query_row(
                "SELECT value FROM settings WHERE key = 'custom_data_dir'",
                [],
                |row| row.get(0),
            )
            .ok();

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

    // Auto-migration from legacy executable-relative directory to target_notes_dir
    let current_exe = std::env::current_exe().unwrap_or_default();
    let current_dir = std::env::current_dir().unwrap_or_default();
    let path_str = current_exe.to_string_lossy();
    let base_dir = if path_str.contains("target/debug")
        || path_str.contains("target/release")
        || path_str.contains("target\\debug")
        || path_str.contains("target\\release")
    {
        current_dir
    } else {
        current_exe.parent().unwrap_or(&current_dir).to_path_buf()
    };
    let legacy_notes_dir = base_dir.join("notes");

    if legacy_notes_dir.exists() && legacy_notes_dir != target_notes_dir {
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
            let _ = copy_notes_recursive(&legacy_notes_dir, &target_notes_dir);
        }
    }

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
