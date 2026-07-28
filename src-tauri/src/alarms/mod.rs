use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppAlarm {
    pub id: Option<i32>,
    pub user_id: String,
    pub title: String,
    pub alarm_type: String, // "fixed" ou "interval"
    pub time: String,       // HH:MM (Horário fixo ou início do intervalo)
    pub interval_minutes: Option<i32>,
    pub last_triggered: Option<String>, // ISO8601 do último disparo (para intervalos)
    pub sound_file: String,             // Ex: "alarm_1.mp3", "alarm_2.mp3", "Plin.mp3"
    pub icon: String,                   // Ex: "bell", "alarmClock", "coffee"
    pub color: Option<String>,          // Ex: "red", "blue", "teal"
    pub enabled: bool,
    pub trigger_mode: Option<String>,   // "widget", "system", "in_app"
}

#[derive(Clone)]
pub struct AlarmManager {
    db_path: PathBuf,
    app_handle: AppHandle,
    pub active_alarm: Arc<Mutex<Option<AppAlarm>>>,
}

impl AlarmManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data dir");
        let db_path = app_dir.join("config.db");

        let conn = Connection::open(&db_path).expect("Failed to open database");
        let _ = conn.execute("PRAGMA journal_mode=WAL", []);
        let _ = conn.busy_timeout(std::time::Duration::from_millis(5000));

        conn.execute(
            "CREATE TABLE IF NOT EXISTS app_alarms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                time TEXT NOT NULL,
                sound_file TEXT NOT NULL,
                icon TEXT NOT NULL,
                enabled INTEGER NOT NULL
            )",
            [],
        )
        .ok();

        // Migrações de schema
        let _ = conn.execute(
            "ALTER TABLE app_alarms ADD COLUMN alarm_type TEXT NOT NULL DEFAULT 'fixed'",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE app_alarms ADD COLUMN interval_minutes INTEGER",
            [],
        );
        let _ = conn.execute("ALTER TABLE app_alarms ADD COLUMN last_triggered TEXT", []);
        let _ = conn.execute("ALTER TABLE app_alarms ADD COLUMN color TEXT", []);
        let _ = conn.execute(
            "ALTER TABLE app_alarms ADD COLUMN trigger_mode TEXT NOT NULL DEFAULT 'widget'",
            [],
        );

        Self {
            db_path,
            app_handle: app_handle.clone(),
            active_alarm: Arc::new(Mutex::new(None)),
        }
    }

    fn get_connection(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Failed to connect to DB");
        let _ = conn.busy_timeout(std::time::Duration::from_millis(5000));
        conn
    }

    pub fn open_widget_window(&self, alarm: AppAlarm) -> Result<(), String> {
        use tauri::Emitter;

        if let Ok(mut lock) = self.active_alarm.lock() {
            *lock = Some(alarm.clone());
        }

        if let Some(window) = self.app_handle.get_webview_window("alarm-widget") {
            let _ = window.show();
            let _ = window.unminimize();
            let _ = window.set_focus();
            let _ = window.emit("alarm-trigger", alarm);
            return Ok(());
        }

        let win_builder = tauri::WebviewWindowBuilder::new(
            &self.app_handle,
            "alarm-widget",
            tauri::WebviewUrl::App("index.html".into())
        )
        .title("Aegis Alarme")
        .inner_size(260.0, 110.0)
        .min_inner_size(240.0, 95.0)
        .max_inner_size(300.0, 130.0)
        .resizable(false)
        .always_on_top(true)
        .decorations(false);

        let window = win_builder.build().map_err(|e| e.to_string())?;
        let _ = window.emit("alarm-trigger", alarm);
        Ok(())
    }

    fn available_sound_set(&self) -> HashSet<String> {
        let mut sounds = HashSet::new();

        // 1. Localiza os sons nativos da aplicação
        #[cfg(debug_assertions)]
        {
            for p in [
                "public/sounds",
                "../public/sounds",
                "../../public/sounds",
                "../../../public/sounds",
            ] {
                let path = std::path::Path::new(p);
                if path.exists() && path.is_dir() {
                    Self::collect_sounds(path, &mut sounds);
                }
            }
        }

        if let Ok(resource_dir) = self.app_handle.path().resource_dir() {
            let paths = [
                resource_dir.join("sounds"),
                resource_dir.join("_up_/public/sounds"),
                resource_dir.join("_up_/_up_/public/sounds"),
                resource_dir.join("_up_/sounds"),
            ];
            for path in &paths {
                if path.exists() && path.is_dir() {
                    Self::collect_sounds(path, &mut sounds);
                }
            }
        }

        // 2. Inclui sempre os áudios customizados importados salvos na pasta de dados locais do usuário
        if let Ok(app_dir) = self.app_handle.path().app_data_dir() {
            let user_sounds_dir = app_dir.join("sounds");
            if user_sounds_dir.exists() && user_sounds_dir.is_dir() {
                Self::collect_sounds(&user_sounds_dir, &mut sounds);
            }
        }

        sounds
    }

    fn collect_sounds(path: &std::path::Path, sounds: &mut HashSet<String>) {
        if let Ok(entries) = std::fs::read_dir(path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if !path.is_file() {
                    continue;
                }
                let Some(ext) = path.extension().map(|e| e.to_string_lossy().to_lowercase()) else {
                    continue;
                };
                if matches!(ext.as_str(), "mp3" | "wav" | "ogg" | "m4a" | "flac" | "aac") {
                    if let Some(name) = path.file_name() {
                        sounds.insert(name.to_string_lossy().to_string());
                    }
                }
            }
        }
    }

    fn sanitize_alarm_sound(&self, alarm: &mut AppAlarm, available_sounds: &HashSet<String>) {
        if !available_sounds.is_empty() && !available_sounds.contains(&alarm.sound_file) {
            alarm.sound_file = if available_sounds.contains("alarm_1.mp3") {
                "alarm_1.mp3".to_string()
            } else if available_sounds.contains("Plin.mp3") {
                "Plin.mp3".to_string()
            } else {
                available_sounds
                    .iter()
                    .next()
                    .cloned()
                    .unwrap_or_else(|| "alarm_1.mp3".to_string())
            };
        }
    }

    fn sanitize_alarm_sounds(&self, alarms: &mut [AppAlarm]) {
        let available_sounds = self.available_sound_set();
        for alarm in alarms {
            self.sanitize_alarm_sound(alarm, &available_sounds);
        }
    }

    pub fn list_alarms(&self, user_id: &str) -> Vec<AppAlarm> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare("SELECT id, title, time, sound_file, icon, enabled, alarm_type, interval_minutes, last_triggered, color, trigger_mode FROM app_alarms WHERE user_id = ?1").unwrap();
        let rows = stmt
            .query_map(params![user_id], |row| {
                Ok(AppAlarm {
                    id: Some(row.get(0)?),
                    user_id: user_id.to_string(),
                    title: row.get(1)?,
                    time: row.get(2)?,
                    sound_file: row.get(3)?,
                    icon: row.get(4)?,
                    enabled: row.get::<_, i32>(5)? != 0,
                    alarm_type: row.get(6)?,
                    interval_minutes: row.get(7)?,
                    last_triggered: row.get(8)?,
                    color: row.get(9)?,
                    trigger_mode: row.get(10).ok(),
                })
            })
            .unwrap();

        let mut alarms: Vec<AppAlarm> = rows.map(|r| r.unwrap()).collect();
        self.sanitize_alarm_sounds(&mut alarms);
        alarms
    }

    pub fn add_alarm(&self, alarm: AppAlarm) -> Result<(), String> {
        let conn = self.get_connection();
        let mode = alarm.trigger_mode.unwrap_or_else(|| "widget".to_string());
        conn.execute(
            "INSERT INTO app_alarms (user_id, title, time, sound_file, icon, enabled, alarm_type, interval_minutes, last_triggered, color, trigger_mode) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![alarm.user_id, alarm.title, alarm.time, alarm.sound_file, alarm.icon, if alarm.enabled { 1 } else { 0 }, alarm.alarm_type, alarm.interval_minutes, alarm.last_triggered, alarm.color, mode],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn update_alarm(&self, alarm: AppAlarm) -> Result<(), String> {
        let conn = self.get_connection();
        let id = alarm.id.ok_or("ID do alarme ausente")?;
        let mode = alarm.trigger_mode.unwrap_or_else(|| "widget".to_string());
        conn.execute(
            "UPDATE app_alarms SET title = ?1, time = ?2, sound_file = ?3, icon = ?4, enabled = ?5, alarm_type = ?6, interval_minutes = ?7, last_triggered = ?8, color = ?9, trigger_mode = ?10 WHERE id = ?11 AND user_id = ?12",
            params![alarm.title, alarm.time, alarm.sound_file, alarm.icon, if alarm.enabled { 1 } else { 0 }, alarm.alarm_type, alarm.interval_minutes, alarm.last_triggered, alarm.color, mode, id, alarm.user_id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_alarm(&self, id: i32, user_id: &str) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "DELETE FROM app_alarms WHERE id = ?1 AND user_id = ?2",
            params![id, user_id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_user_alarms(&self, user_id: &str) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "DELETE FROM app_alarms WHERE user_id = ?1",
            params![user_id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn toggle_alarm(&self, id: i32, user_id: &str) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "UPDATE app_alarms SET enabled = CASE WHEN enabled = 1 THEN 0 ELSE 1 END WHERE id = ?1 AND user_id = ?2",
            params![id, user_id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn update_last_triggered(&self, id: i32, iso_time: &str) {
        let conn = self.get_connection();
        let _ = conn.execute(
            "UPDATE app_alarms SET last_triggered = ?1 WHERE id = ?2",
            params![iso_time, id],
        );
    }

    pub fn list_all_enabled_alarms(&self) -> Vec<AppAlarm> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare("SELECT id, user_id, title, time, sound_file, icon, enabled, alarm_type, interval_minutes, last_triggered, color, trigger_mode FROM app_alarms WHERE enabled = 1").unwrap();
        let rows = stmt
            .query_map([], |row| {
                Ok(AppAlarm {
                    id: Some(row.get(0)?),
                    user_id: row.get(1)?,
                    title: row.get(2)?,
                    time: row.get(3)?,
                    sound_file: row.get(4)?,
                    icon: row.get(5)?,
                    enabled: row.get::<_, i32>(6)? != 0,
                    alarm_type: row.get(7)?,
                    interval_minutes: row.get(8)?,
                    last_triggered: row.get(9)?,
                    color: row.get(10)?,
                    trigger_mode: row.get(11).ok(),
                })
            })
            .unwrap();

        let mut alarms: Vec<AppAlarm> = rows.filter_map(|r| r.ok()).collect();
        self.sanitize_alarm_sounds(&mut alarms);
        alarms
    }
}

#[tauri::command]
pub async fn alarm_list_alarms(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
) -> Result<Vec<AppAlarm>, String> {
    Ok(state.alarm.list_alarms(&user_id))
}

#[tauri::command]
pub async fn alarm_add_alarm(
    state: tauri::State<'_, crate::AppState>,
    alarm: AppAlarm,
) -> Result<(), String> {
    state.alarm.add_alarm(alarm)
}

#[tauri::command]
pub async fn alarm_update_alarm(
    state: tauri::State<'_, crate::AppState>,
    alarm: AppAlarm,
) -> Result<(), String> {
    state.alarm.update_alarm(alarm)
}

#[tauri::command]
pub async fn alarm_delete_alarm(
    state: tauri::State<'_, crate::AppState>,
    id: i32,
    user_id: String,
) -> Result<(), String> {
    state.alarm.delete_alarm(id, &user_id)
}

#[tauri::command]
pub async fn alarm_toggle_alarm(
    state: tauri::State<'_, crate::AppState>,
    id: i32,
    user_id: String,
) -> Result<(), String> {
    state.alarm.toggle_alarm(id, &user_id)
}

#[tauri::command]
pub async fn alarm_open_widget(
    state: tauri::State<'_, crate::AppState>,
    alarm: AppAlarm,
) -> Result<(), String> {
    state.alarm.open_widget_window(alarm)
}

#[tauri::command]
pub async fn alarm_get_active_widget_alarm(
    state: tauri::State<'_, crate::AppState>,
) -> Result<Option<AppAlarm>, String> {
    if let Ok(lock) = state.alarm.active_alarm.lock() {
        Ok(lock.clone())
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn alarm_clear_active_widget_alarm(
    state: tauri::State<'_, crate::AppState>,
) -> Result<(), String> {
    if let Ok(mut lock) = state.alarm.active_alarm.lock() {
        *lock = None;
    }
    Ok(())
}
