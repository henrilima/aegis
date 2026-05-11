// ─── Macros de Log Semântico ─────────────────────────────────────────────────
#[macro_export]
macro_rules! log_info {
    ($($arg:tt)*) => { log::info!($($arg)*); };
}
#[macro_export]
macro_rules! log_warn {
    ($($arg:tt)*) => { log::warn!($($arg)*); };
}
#[macro_export]
macro_rules! log_error {
    ($($arg:tt)*) => { log::error!($($arg)*); };
}
#[macro_export]
macro_rules! log_success {
    ($($arg:tt)*) => { log::info!(target: "SUCCESS", $($arg)*); };
}
#[macro_export]
macro_rules! log_status {
    ($($arg:tt)*) => { log::info!(target: "STATUS", $($arg)*); };
}
#[macro_export]
macro_rules! log_notify {
    ($($arg:tt)*) => { log::info!(target: "SYSTEM_NOTIFICATIONS", $($arg)*); };
}

mod passwords;
mod pomodoro;

mod alarms;
mod habits;
mod migration;
mod notes;
mod config;
mod studies;
mod sleep;
mod calendar;
mod statistics;
mod reading;
mod tasks;
mod notifications;
mod dictionary;
mod movies;

use passwords::{PasswordEntry, DecryptedEntry, PasswordManager};
use pomodoro::{PomodoroState, PomodoroManager, PomodoroHistory};

use alarms::{AppAlarm, AlarmManager};
use habits::{Habit, HabitManager};
use config::{AppConfig, ConfigManager};
use studies::{StudiesManager, StudySession, StudyGoal};
use sleep::{SleepManager, SleepEntry, SleepGoal};
use calendar::{CalendarManager, CalendarEvent};
use statistics::{StatisticsManager, CrossMetric, PerformanceSummary};
use reading::{ReadingManager, ReadingBook, ReadingSession, ReadingGoal};
use tasks::{Task, TaskManager};
use notifications::NotificationsManager;

use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_notification::NotificationExt;
use chrono::{Utc, Timelike, Local, DateTime};
use log::{info, warn, error};
use std::thread;
use std::time::Duration;

use migration::*;

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SimulationStatus {
    pub is_active: bool,
    pub simulated_time: String,
    pub offset_seconds: i64,
}

pub struct AppState {
    pm: PasswordManager,
    pomo: PomodoroManager,

    alarm: AlarmManager,
    habit: HabitManager,
    note: notes::NoteManager,
    config: ConfigManager,
    studies: StudiesManager,
    sleep: SleepManager,
    calendar: CalendarManager,
    stats: StatisticsManager,
    reading: ReadingManager,
    tasks: TaskManager,
    notif: NotificationsManager,
    dictionary: dictionary::DictionaryManager,
    movies: movies::MovieManager,
}

#[tauri::command]
async fn verify_master(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    user_id: String,
    master_password: String
) -> Result<bool, String> {
    let result = state.pm.verify_master(&user_id, &master_password).map(|_| true);
    if result.is_ok() {
        let config = state.config.get_config();
        if config.notif_sleep_morning {
            let now = state.config.get_now().with_timezone(&chrono::Local);
            let now_min = now.hour() as i32 * 60 + now.minute() as i32;
            let morning_min = time_to_minutes(&config.notif_sleep_morning_time);
            
            if now_min >= morning_min && now_min < morning_min + 360 {
                let today = now.format("%Y-%m-%d").to_string();
                let now_utc = state.config.get_now();
                let entries = state.sleep.list_entries(&user_id, 1, now_utc);
                let has_today = entries.iter().any(|e| e.date == today);
                
                if !has_today {
                    let title = "Aegis: Sono não registrado";
                    if !state.notif.has_unread_today(&user_id, title) {
                        notify_critical(&app_handle, title, "Você ainda não registrou seu ciclo de sono hoje!");
                        let tag = format!("sleep_aviso_{}", today);
                        let _ = state.notif.push(&user_id, title, "Acesse o módulo de Sono para manter seu histórico de descanso atualizado.", "sleep", Some(&tag), Some("blue"), Some("Moon"));
                        let _ = app_handle.emit("new-notification", ());
                    }
                }
            }
        }
    }
    result
}

#[tauri::command]
async fn send_critical_notification(app_handle: tauri::AppHandle, title: String, body: String) -> Result<(), String> {
    notify_critical(&app_handle, &title, &body);
    Ok(())
}
#[tauri::command]
async fn test_notification(app_handle: tauri::AppHandle) -> Result<(), String> {
    notify_critical(&app_handle, "Aegis Teste", "Se você vê isso, as notificações críticas estão funcionando!");
    Ok(())
}
#[tauri::command]
fn get_app_version(app_handle: tauri::AppHandle) -> String {
    app_handle.package_info().version.to_string()
}

#[tauri::command]
async fn read_changelog(app_handle: tauri::AppHandle) -> Result<String, String> {
    // Primeiro, tenta localizar via diretório de recursos (ideal para produção)
    if let Ok(resource_dir) = app_handle.path().resource_dir() {
        let paths = [
            resource_dir.join("aegis.changelog"),
            resource_dir.join("_up_/aegis.changelog"),
            resource_dir.join("_up_/_up_/aegis.changelog"),
        ];
        for path in &paths {
            if path.exists() {
                return std::fs::read_to_string(path).map_err(|e| e.to_string());
            }
        }
    }

    // Fallback para desenvolvimento: Tenta encontrar na raiz do projeto ou níveis acima
    let paths = [
        "aegis.changelog", 
        "../aegis.changelog", 
        "../../aegis.changelog",
        "../../../aegis.changelog"
    ];
    for p in &paths {
        if std::path::Path::new(p).exists() {
            return std::fs::read_to_string(p).map_err(|e| e.to_string());
        }
    }

    Err("Arquivo aegis.changelog não encontrado em nenhum dos locais esperados.".to_string())
}

#[tauri::command]
async fn get_log_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    app_handle.path().app_log_dir()
        .map(|p| p.join("Aegis.log").to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn read_app_logs(app_handle: tauri::AppHandle) -> Result<String, String> {
    let log_path = app_handle.path().app_log_dir()
        .map(|p| p.join("Aegis.log"))
        .map_err(|e| e.to_string())?;
    
    if !log_path.exists() {
        return Err("Arquivo de log não encontrado".to_string());
    }

    let content = std::fs::read_to_string(log_path).map_err(|e| e.to_string())?;
    
    // Find the last clear marker and return only what's after it
    let marker = "======== LOGS CLEARED ========";
    if let Some(idx) = content.rfind(marker) {
        let after_marker = content[idx + marker.len()..].trim_start();
        Ok(after_marker.to_string())
    } else {
        Ok(content)
    }
}



#[tauri::command]
async fn capture_screenshot() -> Result<Vec<u8>, String> {
    use screenshots::Screen;
    let screens = Screen::all().map_err(|e| e.to_string())?;
    let screen = screens.first().ok_or("Nenhuma tela encontrada")?;
    let image = screen.capture().map_err(|e| e.to_string())?;
    let mut buffer = Vec::new();
    image.write_to(&mut std::io::Cursor::new(&mut buffer), screenshots::image::ImageFormat::Png)
        .map_err(|e| e.to_string())?;
    Ok(buffer)
}

fn notify_critical(app: &tauri::AppHandle, title: &str, body: &str) {
    log_success!("[Aegis] Notificação enviada: {} — {}", title, body);
    
    // Tenta obter o som do config
    let sound = {
        let config = ConfigManager::new(app);
        config.get_config().notification_sound
    };
    
    let mut builder = app.notification().builder()
        .title(title)
        .body(body);

    if !sound.is_empty() && sound != "None" {
        builder = builder.sound(&sound);
    }

    if let Err(e) = builder.show() {
        log_error!("[Aegis] Falha ao exibir notificação do sistema: {}", e);
    }
}

fn time_to_minutes(time_str: &str) -> i32 {
    let parts: Vec<&str> = time_str.split(':').collect();
    if parts.len() == 2 {
        let h = parts[0].parse::<i32>().unwrap_or(0);
        let m = parts[1].parse::<i32>().unwrap_or(0);
        h * 60 + m
    } else {
        0
    }
}

#[tauri::command]
fn check_dnd_status() -> bool {
    false
}

#[tauri::command]
async fn open_notification_settings() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("powershell")
            .args(&["-Command", "start ms-settings:notifications"])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn add_password(
    state: State<'_, AppState>, 
    user_id: String, 
    master_pwd: String, 
    name: String, 
    url: String, 
    username: String, 
    password_raw: String, 
    note_raw: String
) -> Result<(), String> {
    state.pm.add_password(&user_id, &master_pwd, &name, &url, &username, &password_raw, &note_raw)
}

#[tauri::command]
async fn list_passwords(state: State<'_, AppState>, user_id: String) -> Result<Vec<PasswordEntry>, String> {
    state.pm.list_passwords(&user_id)
}

#[tauri::command]
async fn decrypt_entry(state: State<'_, AppState>, user_id: String, master_pwd: String, entry_id: i32) -> Result<DecryptedEntry, String> {
    state.pm.decrypt_entry(&user_id, &master_pwd, entry_id)
}

#[tauri::command]
async fn import_passwords(state: State<'_, AppState>, user_id: String, master_pwd: String, file_path: String) -> Result<usize, String> {
    state.pm.import_google_csv(&user_id, &master_pwd, &file_path)
}

#[tauri::command]
async fn export_passwords(state: State<'_, AppState>, user_id: String, master_pwd: String, dest_path: String) -> Result<(), String> {
    state.pm.export_google_csv(&user_id, &master_pwd, &dest_path)
}

#[tauri::command]
async fn delete_password(state: State<'_, AppState>, user_id: String, entry_id: i32) -> Result<(), String> {
    state.pm.delete_password(&user_id, entry_id)
}

#[tauri::command]
async fn update_password(
    state: State<'_, AppState>, 
    user_id: String, 
    master_pwd: String, 
    entry_id: i32,
    name: String, 
    url: String, 
    username: String, 
    password_raw: String, 
    note_raw: String
) -> Result<(), String> {
    state.pm.update_password(&user_id, &master_pwd, entry_id, &name, &url, &username, &password_raw, &note_raw)
}

#[tauri::command]
async fn check_vault(state: State<'_, AppState>, user_id: String) -> Result<bool, String> {
    Ok(state.pm.check_user_exists(&user_id))
}

#[tauri::command]
async fn reset_vault(state: State<'_, AppState>, user_id: String) -> Result<(), String> {
    state.pm.delete_user(&user_id)
}



#[tauri::command]
async fn get_pomodoro_state(state: State<'_, AppState>, user_id: String) -> Result<PomodoroState, String> {
    Ok(state.pomo.get_state(&user_id))
}

#[tauri::command]
async fn save_pomodoro_state(state: State<'_, AppState>, user_id: String, pomo_state: PomodoroState) -> Result<(), String> {
    state.pomo.save_state(&user_id, &pomo_state)
}

#[tauri::command]
async fn record_pomodoro_session(state: State<'_, AppState>, session: PomodoroHistory) -> Result<(), String> {
    state.pomo.record_session(session)
}

#[tauri::command]
async fn get_pomodoro_history(state: State<'_, AppState>, user_id: String) -> Result<Vec<PomodoroHistory>, String> {
    Ok(state.pomo.get_history(&user_id))
}

#[tauri::command]
async fn clear_pomodoro_history(state: State<'_, AppState>, user_id: String) -> Result<(), String> {
    state.pomo.clear_history(&user_id)
}



#[tauri::command]
async fn list_alarms(state: State<'_, AppState>, user_id: String) -> Result<Vec<AppAlarm>, String> {
    Ok(state.alarm.list_alarms(&user_id))
}

#[tauri::command]
async fn add_alarm(state: State<'_, AppState>, alarm: AppAlarm) -> Result<(), String> {
    state.alarm.add_alarm(alarm)
}

#[tauri::command]
async fn update_alarm(state: State<'_, AppState>, alarm: AppAlarm) -> Result<(), String> {
    state.alarm.update_alarm(alarm)
}

#[tauri::command]
async fn delete_alarm(state: State<'_, AppState>, id: i32, user_id: String) -> Result<(), String> {
    state.alarm.delete_alarm(id, &user_id)
}

#[tauri::command]
async fn toggle_alarm(state: State<'_, AppState>, id: i32, user_id: String) -> Result<(), String> {
    state.alarm.toggle_alarm(id, &user_id)
}

#[tauri::command]
async fn list_habits(state: State<'_, AppState>, user_id: String) -> Result<Vec<Habit>, String> {
    let now = state.config.get_now();
    Ok(state.habit.list_habits(&user_id, now))
}

#[tauri::command]
async fn add_habit(state: State<'_, AppState>, habit: Habit) -> Result<(), String> {
    state.habit.add_habit(habit)
}

#[tauri::command]
async fn list_notification_sounds(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let mut sounds = Vec::new();
    
    // Tenta localizar via diretório de recursos (produção)
    let mut found_dir = None;
    if let Ok(resource_dir) = app_handle.path().resource_dir() {
        let paths = [
            resource_dir.join("sounds"),
            resource_dir.join("_up_/public/sounds"),
            resource_dir.join("_up_/_up_/public/sounds"),
            resource_dir.join("_up_/sounds"),
        ];
        for path in &paths {
            if path.exists() && path.is_dir() {
                found_dir = Some(path.to_path_buf());
                break;
            }
        }
    }

    // Fallback para desenvolvimento (vários caminhos possíveis dependendo de onde o binário rodar)
    if found_dir.is_none() {
        let dev_paths = [
            "public/sounds", 
            "../public/sounds", 
            "../../public/sounds",
            "../../../public/sounds"
        ];
        for p in &dev_paths {
            let path = std::path::Path::new(p);
            if path.exists() && path.is_dir() {
                found_dir = Some(path.to_path_buf());
                break;
            }
        }
    }

    if let Some(audio_dir) = found_dir {
        if let Ok(entries) = std::fs::read_dir(audio_dir) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if path.is_file() {
                        if let Some(ext) = path.extension() {
                            let ext_str = ext.to_string_lossy().to_lowercase();
                            if ext_str == "mp3" || ext_str == "wav" || ext_str == "ogg" || ext_str == "m4a" {
                                if let Some(name) = path.file_name() {
                                    sounds.push(name.to_string_lossy().to_string());
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    if sounds.is_empty() {
        sounds.push("Plin.mp3".to_string());
    }
    
    sounds.sort();
    Ok(sounds)
}

#[tauri::command]
async fn update_habit(state: State<'_, AppState>, habit: Habit) -> Result<(), String> {
    state.habit.update_habit(habit)
}

#[tauri::command]
async fn mark_habit_done(
    state: State<'_, AppState>, 
    id: i32, 
    _user_id: Option<String>, 
    timestamp: Option<String>
) -> Result<(), String> {
    let now = state.config.get_now();
    let ts = timestamp.unwrap_or_default();
    state.habit.mark_done(id, &ts, now)
}

#[tauri::command]
async fn use_habit_charge(
    state: State<'_, AppState>, 
    id: i32, 
    _user_id: Option<String>
) -> Result<(), String> {
    let now = state.config.get_now();
    state.habit.use_charge(id, now)
}

#[tauri::command]
async fn reset_habit(
    state: State<'_, AppState>, 
    id: i32, 
    _user_id: Option<String>, 
    timestamp: Option<String>
) -> Result<(), String> {
    let now = state.config.get_now();
    let ts = timestamp.unwrap_or_default();
    state.habit.reset_habit(id, &ts, now)
}

#[tauri::command]
async fn hard_reset_habit(state: State<'_, AppState>, id: i32, _user_id: Option<String>, _timestamp: Option<String>) -> Result<(), String> {
    let now = state.config.get_now().to_rfc3339();
    state.habit.hard_reset_habit(id, &now)
}

#[tauri::command]
async fn delete_habit(state: State<'_, AppState>, id: i32, _user_id: Option<String>) -> Result<(), String> {
    state.habit.delete_habit(id)
}

#[tauri::command]
async fn local_register(state: State<'_, AppState>, username: String, email: String, password: String, password_hint: String) -> Result<String, String> {
    state.pm.register_user(&username, &email, &password, &password_hint)
}

#[tauri::command]
async fn check_user_availability(state: State<'_, AppState>, username: String, email: String) -> Result<(), String> {
    state.pm.check_availability(&username, &email)
}

#[tauri::command]
async fn local_login(state: State<'_, AppState>, email: String, password: String) -> Result<String, String> {
    state.pm.login_user(&email, &password)
}

#[tauri::command]
async fn get_local_user(state: State<'_, AppState>, user_id: String) -> Result<serde_json::Value, String> {
    state.pm.get_user_data(&user_id)
}

#[tauri::command]
async fn list_local_users(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    state.pm.list_users()
}

#[tauri::command]
async fn delete_account(state: State<'_, AppState>, user_id: String, password: String) -> Result<(), String> {
    let master_signs = [
        "aquarius", "pisces", "aries", "taurus", "gemini", "cancer",
        "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "ophiuchus"
    ];

    if !master_signs.contains(&password.to_lowercase().as_str()) {
        state.pm.verify_master(&user_id, &password)?;
    }
    
    state.pm.delete_user(&user_id)
}

#[tauri::command]
async fn change_account_password(state: State<'_, AppState>, user_id: String, current_password: String, new_password: String) -> Result<(), String> {
    state.pm.change_account_password(&user_id, &current_password, &new_password)
}

#[tauri::command]
async fn change_username(state: State<'_, AppState>, user_id: String, new_username: String) -> Result<(), String> {
    state.pm.change_username(&user_id, &new_username)
}

#[tauri::command]
async fn change_vault_password(state: State<'_, AppState>, user_id: String, current_vault_password: String, new_vault_password: String) -> Result<(), String> {
    state.pm.change_vault_password(&user_id, &current_vault_password, Some(&new_vault_password))
}

#[tauri::command]
async fn revert_vault_to_master(state: State<'_, AppState>, user_id: String, current_vault_password: String, master_password: String) -> Result<(), String> {
    state.pm.revert_vault_to_master(&user_id, &current_vault_password, &master_password)
}

#[tauri::command]
async fn has_separate_vault_password(state: State<'_, AppState>, user_id: String) -> Result<bool, String> {
    Ok(state.pm.has_separate_vault_password(&user_id))
}

#[tauri::command]
async fn list_notes(state: State<'_, AppState>, user_id: String) -> Result<Vec<notes::Note>, String> {
    Ok(state.note.list_notes(&user_id))
}

#[tauri::command]
async fn list_note_items(state: State<'_, AppState>, user_id: String, _parent_id: Option<i64>) -> Result<Vec<notes::FileSystemItem>, String> {
    Ok(state.note.list_items(&user_id))
}

#[tauri::command]
async fn add_note(state: State<'_, AppState>, note: notes::Note) -> Result<i64, String> {
    state.note.add_note(note)?;
    Ok(0)
}

#[tauri::command]
async fn update_note(state: State<'_, AppState>, note: notes::Note) -> Result<(), String> {
    state.note.update_note(note)
}

#[tauri::command]
async fn create_note_folder(state: State<'_, AppState>, path: String) -> Result<(), String> {
    state.note.create_folder(path)
}

#[tauri::command]
async fn delete_note_folder(state: State<'_, AppState>, path: String) -> Result<(), String> {
    state.note.delete_folder(path)
}

#[tauri::command]
async fn move_note_item(state: State<'_, AppState>, source_path: String, dest_path: String) -> Result<(), String> {
    state.note.move_item(source_path, dest_path)
}

#[tauri::command]
async fn delete_note(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    state.note.delete_note(id)
}

#[tauri::command]
async fn update_note_pinned(state: State<'_, AppState>, id: i32, pinned: bool) -> Result<(), String> {
    state.note.update_note_pinned(id, pinned)
}

#[tauri::command]
async fn open_notes_folder(state: State<'_, AppState>) -> Result<(), String> {
    state.note.open_folder()
}

#[tauri::command]
async fn open_app_data_folder(app: AppHandle) -> Result<(), String> {
    let path = app.path().app_data_dir().map_err(|e: tauri::Error| e.to_string())?;
    
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
async fn get_app_config(state: State<'_, AppState>) -> Result<AppConfig, String> {
    Ok(state.config.get_config())
}

#[tauri::command]
async fn set_app_config(state: State<'_, AppState>, config: AppConfig) -> Result<(), String> {
    state.config.set_config(config)
}

#[tauri::command]
async fn apply_internal_command(_app_handle: tauri::AppHandle, state: State<'_, AppState>, command: String) -> Result<String, String> {
    state.config.apply_debug_command(&command)
}

#[tauri::command]
async fn get_simulation_status(state: State<'_, AppState>) -> Result<SimulationStatus, String> {
    let offset = state.config.get_time_offset();
    Ok(SimulationStatus {
        is_active: offset != 0,
        simulated_time: state.config.get_now().to_rfc3339(),
        offset_seconds: offset,
    })
}


#[tauri::command]
async fn quit_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}

#[tauri::command]
async fn estudos_add_session(state: State<'_, AppState>, session: StudySession) -> Result<i64, String> {
    state.studies.add_session(session)
}

#[tauri::command]
async fn estudos_update_session(state: State<'_, AppState>, session: StudySession) -> Result<(), String> {
    state.studies.update_session(session)
}

#[tauri::command]
async fn estudos_delete_session(state: State<'_, AppState>, id: i64, user_id: String) -> Result<(), String> {
    state.studies.delete_session(id, &user_id)
}

#[tauri::command]
async fn estudos_list_sessions(state: State<'_, AppState>, user_id: String, months_back: i32) -> Result<Vec<StudySession>, String> {
    let now = state.config.get_now();
    Ok(state.studies.list_sessions(&user_id, months_back, now))
}

#[tauri::command]
async fn estudos_upsert_goal(state: State<'_, AppState>, goal: StudyGoal) -> Result<(), String> {
    state.studies.upsert_goal(goal)
}

#[tauri::command]
async fn estudos_list_goals(state: State<'_, AppState>, user_id: String) -> Result<Vec<StudyGoal>, String> {
    Ok(state.studies.list_goals(&user_id))
}

#[tauri::command]
async fn estudos_export_csv(state: State<'_, AppState>, user_id: String, dest_path: String) -> Result<(), String> {
    let now = state.config.get_now();
    state.studies.export_csv(&user_id, &dest_path, now)
}

#[tauri::command]
async fn estudos_import_csv(state: State<'_, AppState>, user_id: String, file_path: String) -> Result<usize, String> {
    state.studies.import_csv(&user_id, &file_path)
}

#[tauri::command]
async fn sono_upsert_entry(state: State<'_, AppState>, entry: SleepEntry) -> Result<i64, String> {
    state.sleep.upsert_entry(entry)
}

#[tauri::command]
async fn sono_delete_entry(state: State<'_, AppState>, id: i64, user_id: String) -> Result<(), String> {
    state.sleep.delete_entry(id, &user_id)
}

#[tauri::command]
async fn sono_list_entries(state: State<'_, AppState>, user_id: String, months_back: i32) -> Result<Vec<SleepEntry>, String> {
    let now = state.config.get_now();
    Ok(state.sleep.list_entries(&user_id, months_back, now))
}

#[tauri::command]
async fn sono_upsert_goal(app_handle: tauri::AppHandle, state: State<'_, AppState>, goal: SleepGoal) -> Result<(), String> {
    state.sleep.upsert_goal(goal, &app_handle)
}

#[tauri::command]
async fn sono_get_goal(app_handle: tauri::AppHandle, state: State<'_, AppState>, user_id: String) -> Result<SleepGoal, String> {
    Ok(state.sleep.get_goal(&user_id, &app_handle))
}

#[tauri::command]
async fn sono_export_csv(state: State<'_, AppState>, user_id: String, dest_path: String) -> Result<(), String> {
    let now = state.config.get_now();
    state.sleep.export_csv(&user_id, &dest_path, now)
}

#[tauri::command]
async fn sono_import_csv(state: State<'_, AppState>, user_id: String, file_path: String) -> Result<usize, String> {
    state.sleep.import_csv(&user_id, &file_path)
}

#[tauri::command]
async fn calendar_add_event(state: State<'_, AppState>, event: CalendarEvent) -> Result<i64, String> {
    state.calendar.add_event(event)
}

#[tauri::command]
async fn calendar_update_event(state: State<'_, AppState>, event: CalendarEvent) -> Result<(), String> {
    state.calendar.update_event(event)
}

#[tauri::command]
async fn sync_br_holidays(state: State<'_, AppState>, user_id: String, year: i32) -> Result<i32, String> {
    state.calendar.sync_holidays(&user_id, year).await
}

#[tauri::command]
async fn calendar_delete_event(state: State<'_, AppState>, id: i64, user_id: String) -> Result<(), String> {
    state.calendar.delete_event(id, &user_id)
}

#[tauri::command]
async fn calendar_list_events(state: State<'_, AppState>, user_id: String) -> Result<Vec<CalendarEvent>, String> {
    Ok(state.calendar.list_events(&user_id))
}

#[tauri::command]
async fn calendar_list_upcoming_deadlines(state: State<'_, AppState>, user_id: String) -> Result<Vec<CalendarEvent>, String> {
    let now = state.config.get_now();
    Ok(state.calendar.list_upcoming_deadlines(&user_id, now))
}

#[tauri::command]
async fn stats_get_cross_metrics(state: State<'_, AppState>, user_id: String, days: i32) -> Result<Vec<CrossMetric>, String> {
    let now = state.config.get_now();
    Ok(state.stats.get_cross_metrics(&user_id, days, now))
}

#[tauri::command]
async fn stats_get_performance_summary(state: State<'_, AppState>, user_id: String, days: i32) -> Result<PerformanceSummary, String> {
    let now = state.config.get_now();
    Ok(state.stats.get_performance_summary(&user_id, days, now))
}

#[tauri::command]
async fn reading_list_books(state: State<'_, AppState>, user_id: String) -> Result<Vec<ReadingBook>, String> {
    Ok(state.reading.list_books(&user_id))
}

#[tauri::command]
async fn reading_upsert_book(state: State<'_, AppState>, book: ReadingBook) -> Result<i64, String> {
    state.reading.upsert_book(book)
}

#[tauri::command]
async fn reading_delete_book(state: State<'_, AppState>, id: i64, user_id: String) -> Result<(), String> {
    state.reading.delete_book(id, &user_id)
}

#[tauri::command]
async fn reading_upsert_session(state: State<'_, AppState>, session: ReadingSession) -> Result<i64, String> {
    state.reading.upsert_session(session)
}

#[tauri::command]
async fn reading_list_sessions(state: State<'_, AppState>, user_id: String, months_back: i32) -> Result<Vec<ReadingSession>, String> {
    let now = state.config.get_now();
    Ok(state.reading.list_sessions(&user_id, months_back, now))
}

#[tauri::command]
async fn reading_delete_session(state: State<'_, AppState>, id: i64, user_id: String) -> Result<(), String> {
    state.reading.delete_session(id, &user_id)
}

#[tauri::command]
async fn reading_upsert_goal(state: State<'_, AppState>, goal: ReadingGoal) -> Result<(), String> {
    state.reading.upsert_goal(goal)
}

#[tauri::command]
async fn reading_list_goals(state: State<'_, AppState>, user_id: String) -> Result<Vec<ReadingGoal>, String> {
    Ok(state.reading.list_goals(&user_id))
}

#[tauri::command]
async fn reading_import_json(state: State<'_, AppState>, user_id: String, file_path: String) -> Result<usize, String> {
    state.reading.import_json(&user_id, &file_path)
}

#[tauri::command]
async fn reading_export_json(state: State<'_, AppState>, user_id: String, dest_path: String) -> Result<(), String> {
    let now = state.config.get_now();
    state.reading.export_json(&user_id, &dest_path, now)
}

#[tauri::command]
async fn reading_search_books(query: String) -> Result<serde_json::Value, String> {
    let url = format!(
        "https://www.googleapis.com/books/v1/volumes?q={}&maxResults=5&langRestrict=pt",
        urlencoding::encode(&query)
    );
    let client = reqwest::Client::builder().user_agent("Aegis").build().map_err(|e| e.to_string())?;
    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(json)
}
#[tauri::command]
async fn movies_search(state: State<'_, AppState>, query: String) -> Result<serde_json::Value, String> {
    let api_key = state.config.get_tmdb_api_key();

    if api_key.is_empty() {
        return Err("tmdb_no_key".to_string());
    }

    let url = format!(
        "https://api.themoviedb.org/3/search/movie?api_key={}&query={}&language=pt-BR&include_adult=false",
        api_key,
        urlencoding::encode(&query)
    );
    let client = reqwest::Client::builder()
        .user_agent("Aegis")
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;
    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let status = res.status();
    if status.as_u16() == 401 {
        return Err("tmdb_invalid_key".to_string());
    }
    if !status.is_success() {
        return Err(format!("TMDb API error {}", status));
    }
    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "source": "tmdb", "data": json }))
}

#[tauri::command]
async fn get_tmdb_api_key(state: State<'_, AppState>) -> Result<String, String> {
    Ok(state.config.get_tmdb_api_key())
}

#[tauri::command]
async fn set_tmdb_api_key(state: State<'_, AppState>, api_key: String) -> Result<(), String> {
    // Validate the key with a TMDb test request before saving
    if !api_key.is_empty() {
        let url = format!(
            "https://api.themoviedb.org/3/configuration?api_key={}",
            api_key
        );
        let client = reqwest::Client::builder()
            .user_agent("Aegis")
            .timeout(std::time::Duration::from_secs(8))
            .build()
            .map_err(|e| e.to_string())?;
        let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
        if res.status().as_u16() == 401 {
            return Err("Chave de API inválida. Verifique e tente novamente.".to_string());
        }
        if !res.status().is_success() {
            return Err(format!("Erro ao validar chave: HTTP {}", res.status()));
        }
    }
    state.config.set_tmdb_api_key(&api_key)
}

#[tauri::command]
async fn movies_list(state: State<'_, AppState>, user_id: String) -> Result<Vec<movies::Movie>, String> {
    Ok(state.movies.list_movies(&user_id))
}

#[tauri::command]
async fn movies_upsert(state: State<'_, AppState>, movie: movies::Movie) -> Result<i64, String> {
    state.movies.upsert_movie(movie).map(|(id, _)| id)
}

#[tauri::command]
async fn movies_delete(state: State<'_, AppState>, id: i64, user_id: String) -> Result<(), String> {
    state.movies.delete_movie(id, &user_id)
}

#[tauri::command]
async fn movies_toggle_favorite(state: State<'_, AppState>, id: i64, user_id: String, is_favorite: bool) -> Result<(), String> {
    state.movies.toggle_favorite_movie(id, &user_id, is_favorite)
}

#[tauri::command]
async fn reading_toggle_favorite(state: State<'_, AppState>, id: i64, user_id: String, is_favorite: bool) -> Result<(), String> {
    state.reading.toggle_favorite_book(id, &user_id, is_favorite)
}

#[tauri::command]
async fn check_github_update() -> Result<serde_json::Value, String> {
    let url = "https://api.github.com/repos/henrilima/aegis/releases/latest";
    let client = reqwest::Client::builder()
        .user_agent("Aegis-App")
        .build()
        .map_err(|e| e.to_string())?;
    let res = client.get(url).send().await.map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        if res.status() == reqwest::StatusCode::FORBIDDEN {
            return Err("Verificação via GitHub em espera (limite atingido). Tente novamente em breve.".to_string());
        }
        return Err(format!("GitHub API error: {}", res.status()));
    }
    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(json)
}

#[tauri::command]
async fn tasks_list(state: State<'_, AppState>, user_id: String) -> Result<Vec<Task>, String> {
    Ok(state.tasks.list_tasks(&user_id))
}

#[tauri::command]
async fn tasks_upsert(state: State<'_, AppState>, task: Task) -> Result<(), String> {
    state.tasks.upsert_task(task)
}

#[tauri::command]
async fn tasks_toggle(state: State<'_, AppState>, id: i32, completed: bool) -> Result<(), String> {
    state.tasks.toggle_task(id, completed)
}

#[tauri::command]
async fn tasks_delete(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    state.tasks.delete_task(id)
}

#[tauri::command]
async fn notif_list(state: State<'_, AppState>, user_id: String) -> Result<Vec<notifications::AppNotification>, String> {
    Ok(state.notif.list(&user_id))
}

#[tauri::command]
async fn notif_unread_count(state: State<'_, AppState>, user_id: String) -> Result<i64, String> {
    Ok(state.notif.unread_count(&user_id))
}

#[tauri::command]
async fn notif_mark_read(state: State<'_, AppState>, id: i64, user_id: String) -> Result<(), String> {
    state.notif.mark_read(id, &user_id)
}

#[tauri::command]
async fn notif_mark_all_read(state: State<'_, AppState>, user_id: String) -> Result<(), String> {
    state.notif.mark_all_read(&user_id)
}

#[tauri::command]
async fn notif_delete(state: State<'_, AppState>, id: i64, user_id: String) -> Result<(), String> {
    state.notif.delete(id, &user_id)
}

#[tauri::command]
async fn notif_clear_read(state: State<'_, AppState>, user_id: String) -> Result<(), String> {
    state.notif.clear_read(&user_id)
}

#[tauri::command]
async fn ensure_discord_invite(app_handle: tauri::AppHandle, state: State<'_, AppState>, user_id: String) -> Result<(), String> {
    if state.notif.check_and_push_discord_invitation(&user_id)? {
        notify_critical(&app_handle, "Comunidade", "Junte-se ao nosso Discord!");
    }
    Ok(())
}

#[tauri::command]
async fn save_avatar(state: State<'_, AppState>, user_id: String, base64_data: String) -> Result<(), String> {
    state.pm.save_avatar(&user_id, &base64_data)
}

#[tauri::command]
async fn get_avatar(state: State<'_, AppState>, user_id: String) -> Result<Option<String>, String> {
    Ok(state.pm.get_avatar(&user_id))
}

#[tauri::command]
async fn delete_avatar(state: State<'_, AppState>, user_id: String) -> Result<(), String> {
    state.pm.delete_avatar(&user_id)
}

#[tauri::command]
async fn export_tasks_csv(state: State<'_, AppState>, user_id: String, path: String) -> Result<(), String> {
    state.tasks.export_csv(&user_id, &path)
}

#[tauri::command]
async fn export_habits_csv(state: State<'_, AppState>, user_id: String, path: String) -> Result<(), String> {
    let now = state.config.get_now();
    state.habit.export_csv(&user_id, &path, now)
}

#[tauri::command]
async fn import_tasks_csv(state: State<'_, AppState>, user_id: String, path: String) -> Result<usize, String> {
    state.tasks.import_csv(&user_id, &path)
}

async fn translate_text(text: &str, from: &str, to: &str) -> Result<String, String> {
    let url = format!(
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl={}&tl={}&dt=t&q={}",
        from,
        to,
        urlencoding::encode(text)
    );
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0")
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;
        
    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    
    // O formato do Google é um array aninhado: [[["traducao", "original", ...]]]
    let mut translated = String::new();
    if let Some(sentences) = json[0].as_array() {
        for sentence in sentences {
            if let Some(t) = sentence[0].as_str() {
                translated.push_str(t);
            }
        }
    }

    if translated.is_empty() {
        return Err("Falha na tradução".to_string());
    }
    
    Ok(translated)
}

#[tauri::command]
async fn dictionary_search(
    state: tauri::State<'_, AppState>,
    query: String
) -> Result<serde_json::Value, String> {
    // 0. Verifica Cache
    if let Some(cached) = state.dictionary.get_cached(&query) {
        return Ok(cached);
    }

    let client = reqwest::Client::builder()
        .user_agent("Aegis-App/2.0")
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    // 1. Traduz termo de busca (PT -> EN)
    let en_query = translate_text(&query, "pt", "en").await.unwrap_or(query.clone());
    let url_en = format!("https://api.dictionaryapi.dev/api/v2/entries/en/{}", urlencoding::encode(&en_query));
    
    let res = client.get(&url_en).send().await.map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err("Palavra não encontrada.".to_string());
    }

    let mut json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    
    if let Some(entries) = json.as_array_mut() {
        let mut batch_texts = vec![];
        let sep = "\n[SEP]\n";

        // 1. Coleta TODOS os textos de TODAS as entradas
        let mut original_words = vec![];
        for entry in entries.iter() {
            if let Some(word) = entry["word"].as_str() {
                original_words.push(word.to_string());
                batch_texts.push(word.to_string());
            }
            if let Some(meanings) = entry["meanings"].as_array() {
                for meaning in meanings {
                    if let Some(pos) = meaning["partOfSpeech"].as_str() {
                        batch_texts.push(pos.to_string());
                    }
                    if let Some(definitions) = meaning["definitions"].as_array() {
                        // Limite de 4 definições
                        for def in definitions.iter().take(4) {
                            if let Some(def_text) = def["definition"].as_str() {
                                batch_texts.push(def_text.to_string());
                            }
                            if let Some(ex_text) = def["example"].as_str() {
                                batch_texts.push(ex_text.to_string());
                            }
                            if let Some(syns) = def["synonyms"].as_array() {
                                for s in syns { if let Some(t) = s.as_str() { batch_texts.push(t.to_string()); } }
                            }
                        }
                    }
                    if let Some(syns) = meaning["synonyms"].as_array() {
                        for s in syns { if let Some(t) = s.as_str() { batch_texts.push(t.to_string()); } }
                    }
                }
            }
        }

        if !batch_texts.is_empty() {
            let combined = batch_texts.join(sep);
            let mut results = vec![];
            let mut success = false;

            if let Ok(translated_combined) = translate_text(&combined, "en", "pt").await {
                let parts: Vec<String> = translated_combined
                    .split("[SEP]")
                    .map(|s| s.trim().to_string())
                    .collect();
                
                if parts.len() == batch_texts.len() {
                    results = parts;
                    success = true;
                }
            }

            if !success {
                for text in &batch_texts {
                    results.push(translate_text(text, "en", "pt").await.unwrap_or_else(|_| text.clone()));
                }
            }

            // 2. Distribui os resultados de volta
            let mut cursor = 0;
            let mut word_cursor = 0;
            for entry in entries.iter_mut() {
                // Remove lixo
                if let Some(obj) = entry.as_object_mut() {
                    obj.remove("sourceUrls");
                    obj.remove("license");
                }

                if entry["word"].is_string() {
                    let translated = &results[cursor];
                    let original = &original_words[word_cursor];
                    // Formato: Traduzido (Original)
                    entry["word"] = if translated.to_lowercase() != original.to_lowercase() {
                        serde_json::json!(format!("{} ({})", translated, original))
                    } else {
                        serde_json::json!(translated)
                    };
                    cursor += 1;
                    word_cursor += 1;
                }

                if let Some(meanings) = entry["meanings"].as_array_mut() {
                    for meaning in meanings {
                        if meaning["partOfSpeech"].is_string() {
                            meaning["partOfSpeech"] = serde_json::json!(results[cursor]);
                            cursor += 1;
                        }
                        if let Some(_definitions) = meaning["definitions"].as_array_mut() {
                            // Limite de 4 no retorno também
                            let mut truncated_defs = vec![];
                            let defs_count = std::cmp::min(meaning["definitions"].as_array().unwrap().len(), 4);
                            
                            for _ in 0..defs_count {
                                let mut def = meaning["definitions"].as_array_mut().unwrap().remove(0);
                                if def["definition"].is_string() {
                                    def["definition"] = serde_json::json!(results[cursor]);
                                    cursor += 1;
                                }
                                if def["example"].is_string() {
                                    def["example"] = serde_json::json!(results[cursor]);
                                    cursor += 1;
                                }
                                if let Some(syns) = def["synonyms"].as_array_mut() {
                                    for s in syns { *s = serde_json::json!(results[cursor]); cursor += 1; }
                                }
                                truncated_defs.push(def);
                            }
                            meaning["definitions"] = serde_json::json!(truncated_defs);
                        }
                        if let Some(syns) = meaning["synonyms"].as_array_mut() {
                            for s in syns { *s = serde_json::json!(results[cursor]); cursor += 1; }
                        }
                    }
                }
            }
        }
    }
    
    // Salva no Cache antes de retornar
    state.dictionary.set_cache(query, json.clone());
    Ok(json)
}

#[tauri::command]
async fn dictionary_suggestions(query: String) -> Result<Vec<String>, String> {
    let url = format!("https://api.dicionario-aberto.net/near/{}", urlencoding::encode(&query));
    let client = reqwest::Client::builder().user_agent("Aegis").build().map_err(|e| e.to_string())?;
    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let suggestions: Vec<String> = res.json().await.map_err(|e| e.to_string())?;
    Ok(suggestions)
}

#[tauri::command]
async fn dictionary_list(state: State<'_, AppState>, user_id: String) -> Result<Vec<dictionary::GlossaryWord>, String> {
    Ok(state.dictionary.list_words(&user_id))
}

#[tauri::command]
async fn dictionary_add(state: State<'_, AppState>, word: dictionary::GlossaryWord) -> Result<(), String> {
    state.dictionary.add_word(word).map(|_| ())
}

#[tauri::command]
async fn dictionary_delete(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    state.dictionary.delete_word(id)
}

#[tauri::command]
async fn dictionary_toggle_favorite(state: State<'_, AppState>, id: i32, is_favorite: bool) -> Result<(), String> {
    state.dictionary.toggle_favorite(id, is_favorite)
}

#[tauri::command]
async fn import_habits_csv(state: State<'_, AppState>, user_id: String, path: String) -> Result<usize, String> {
    state.habit.import_csv(&user_id, &path)
}

#[tauri::command]
async fn movies_export_json(state: State<'_, AppState>, user_id: String, path: String) -> Result<(), String> {
    state.movies.export_json(&user_id, &path)
}

#[tauri::command]
async fn movies_import_json(state: State<'_, AppState>, user_id: String, path: String) -> Result<usize, String> {
    state.movies.import_json(&user_id, &path)
}

#[tauri::command]
async fn dictionary_export_csv(state: State<'_, AppState>, user_id: String, path: String) -> Result<(), String> {
    state.dictionary.export_csv(&user_id, &path)
}

#[tauri::command]
async fn dictionary_import_csv(state: State<'_, AppState>, user_id: String, path: String) -> Result<usize, String> {
    state.dictionary.import_csv(&user_id, &path)
}

#[tauri::command]
async fn pre_update_backup(app_handle: tauri::AppHandle) -> Result<(), String> {
    let data_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let backup_dir = data_dir.join("backups");
    if !backup_dir.exists() { std::fs::create_dir(&backup_dir).map_err(|e| e.to_string())?; }
    let now = Local::now().format("%Y%m%d_%H%M%S").to_string();
    std::fs::copy(data_dir.join("passwords.db"), backup_dir.join(format!("backup_{}.db", now))).map_err(|e| e.to_string())?;
    Ok(())
}

// migration.rs handles export_user_package, import_user_package, export_full_system_bundle, import_full_system_bundle




#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.maximize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let state = window.state::<AppState>();
                let config = state.config.get_config();
                
                if config.minimize_on_close {
                    #[cfg(not(target_os = "macos"))]
                    {
                        let _ = window.hide();
                        api.prevent_close();
                    }
                }
            }
        })
        .setup(move |app| {
            let tray_menu = tauri::menu::Menu::with_items(
                app,
                &[
                    &tauri::menu::MenuItem::with_id(app, "show", "Abrir Aegis", true, None::<&str>).unwrap(),
                    &tauri::menu::PredefinedMenuItem::separator(app).unwrap(),
                    &tauri::menu::MenuItem::with_id(app, "quit", "Sair", true, None::<&str>).unwrap(),
                ],
            ).unwrap();

            let _tray = tauri::tray::TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            let pm = PasswordManager::new(app.handle());
            let pomo = PomodoroManager::new(app.handle());

            let alarm = AlarmManager::new(app.handle());
            let habit = HabitManager::new(app.handle());
            let note = notes::NoteManager::new(app.handle());
            let config = ConfigManager::new(app.handle());
            let initial_config = config.get_config();
            // ... (resto dos managers)

            let args: Vec<String> = std::env::args().collect();
            let is_minimized_arg = args.contains(&"--minimized".to_string());

            if let Some(window) = app.get_webview_window("main") {
                if is_minimized_arg && initial_config.start_minimized {
                    let _ = window.hide();
                } else {
                    let _ = window.show();
                    let _ = window.maximize();
                    let _ = window.set_focus();
                }
            }

            let studies = StudiesManager::new(app.handle());
            let sleep = SleepManager::new(app.handle());
            let calendar = CalendarManager::new(app.handle());
            let stats = StatisticsManager::new(app.handle());
            let reading = ReadingManager::new(app.handle());
            let tasks = TaskManager::new(app.handle());
            let notif = NotificationsManager::new(app.handle());
            let dictionary = dictionary::DictionaryManager::new(app.handle());
            let movies = movies::MovieManager::new(app.handle());

            let app_handle = app.handle().clone();
            let pm_clone = PasswordManager::new(app.handle());
            let sleep_clone = SleepManager::new(app.handle());
            let notif_clone = NotificationsManager::new(app.handle());
            let pomo_clone = PomodoroManager::new(app.handle());
            let alarm_clone = AlarmManager::new(app.handle());
            let config_clone = ConfigManager::new(app.handle());
            let habit_clone = HabitManager::new(app.handle());
            let calendar_clone = CalendarManager::new(app.handle());

            thread::spawn::<_, ()>(move || {
                // Inicializa com -1 para garantir que o primeiro minuto seja processado
                let mut last_notified_min = -1;

                loop {
                    thread::sleep(Duration::from_secs(1)); 
                    
                    // Obtém o tempo atual do Aegis (respeitando offset de simulação se houver)
                    let now_aegis = config_clone.get_now().with_timezone(&Local);
                    let now_min = now_aegis.hour() as i32 * 60 + now_aegis.minute() as i32;
                    let now_str = now_aegis.format("%H:%M").to_string();

                    // Só processamos a lógica se houver mudança de minuto
                    if now_min != last_notified_min {
                        last_notified_min = now_min;
                        
                        let mut new_trigger_iso: Option<String> = None;
                        let alarms = alarm_clone.list_all_enabled_alarms();
                        
                        for a in alarms {
                            let mut trigger = false;
                            let alarm_min = time_to_minutes(&a.time);
                            
                            if a.alarm_type == "fixed" {
                                // Alerta fixo: EXATAMENTE no minuto configurado
                                if alarm_min == now_min {
                                    trigger = true;
                                }
                            } else if a.alarm_type == "interval" {
                                // Alerta de intervalo: exato no grid de minutos
                                if now_min >= alarm_min {
                                    let interval_mins = a.interval_minutes.unwrap_or(30);
                                    let intervals_passed = (now_min - alarm_min) / interval_mins;
                                    let latest_grid_slot = alarm_min + (intervals_passed * interval_mins);
                                    
                                    let grid_time_today = now_aegis.date_naive()
                                        .and_hms_opt(latest_grid_slot as u32 / 60, latest_grid_slot as u32 % 60, 0)
                                        .and_then(|dt| dt.and_local_timezone(Local).single());
                                        
                                    if let Some(grid_dt) = grid_time_today {
                                        let grid_iso = grid_dt.to_rfc3339();
                                        
                                        if let Some(last_iso) = &a.last_triggered {
                                            if let Ok(last_dt) = DateTime::parse_from_rfc3339(last_iso) {
                                                if last_dt.with_timezone(&Local) < grid_dt {
                                                    trigger = true;
                                                    new_trigger_iso = Some(grid_iso);
                                                }
                                            } else {
                                                trigger = true;
                                                new_trigger_iso = Some(grid_iso);
                                            }
                                        } else {
                                            trigger = true;
                                            new_trigger_iso = Some(grid_iso);
                                        }
                                    }
                                }
                            }

                            if trigger {
                                log_notify!("[Aegis Loop] ALARME DISPARADO → '{}' (tipo: {})", a.title, a.alarm_type);
                                // Atualiza estado ANTES de notificar para segurança
                                if a.alarm_type == "interval" {
                                    let iso_to_save = new_trigger_iso.clone().unwrap_or_else(|| now_aegis.to_rfc3339());
                                    alarm_clone.update_last_triggered(a.id.unwrap(), &iso_to_save);
                                }
                                
                                let title = format!("Aegis: {}", a.title);
                                let body = if a.alarm_type == "interval" { 
                                    format!("Lembrete periódico: {}", a.title) 
                                } else { 
                                    "Alerta programado disparado!".to_string() 
                                };
                                
                                notify_critical(&app_handle, &title, &body);
                                if let Err(e) = app_handle.emit("trigger-alarm", a.clone()) {
                                    log_error!("[Aegis Loop] Falha ao emitir trigger-alarm: {}", e);
                                }
                                if let Err(e) = notif_clone.push(&a.user_id, &title, &body, "alarms", None, a.color.as_deref(), Some(&a.icon)) {
                                    log_error!("[Aegis Loop] Falha ao salvar notificação de alarme no banco: {}", e);
                                }
                                if let Err(e) = app_handle.emit("new-notification", ()) {
                                    log_error!("[Aegis Loop] Falha ao emitir new-notification: {}", e);
                                }
                            }
                        }
                        
                        if let Ok(users) = pm_clone.list_users() {
                            for user_val in users {
                                if let Some(uid_val) = user_val.get("id") {
                                    if let Some(uid) = uid_val.as_str() {
                                        // Lembretes de Hábitos Pendentes
                                        let config = config_clone.get_config();
                                        if config.notif_habit_uncompleted && now_str == config.notif_habit_time {
                                            let now_utc = config_clone.get_now();
                                            let habits = habit_clone.list_habits(uid, now_utc);
                                            
                                            let pending = habits.iter().filter(|h| {
                                                let is_pos = h.habit_type.to_lowercase() == "positive" || h.habit_type.to_lowercase() == "good";
                                                if !is_pos { return false; }

                                                match &h.last_done {
                                                    // Converte o timestamp UTC para data local antes de comparar.
                                                    // Sem isso, hábitos feitos às 23h local (02h UTC do dia seguinte)
                                                    // aparecem como pendentes no dia seguinte.
                                                    Some(ld) => {
                                                        let done_local_date = chrono::DateTime::parse_from_rfc3339(ld)
                                                            .map(|dt| dt.with_timezone(&Local).date_naive())
                                                            .ok();
                                                        done_local_date.map_or(true, |d| d != now_aegis.date_naive())
                                                    }
                                                    None => true
                                                }
                                            }).count();

                                            if pending > 0 {
                                                let title = "Aegis: Hábitos Pendentes";
                                                let body = format!("Você ainda tem {} hábitos para concluir hoje. Não quebre sua sequência!", pending);
                                                notify_critical(&app_handle, title, &body);
                                                let _ = notif_clone.push(uid, title, &body, "habits", None, Some("orange"), Some("Activity"));
                                                let _ = app_handle.emit("new-notification", ());
                                            }
                                        }

                                        // Notificações de Compromissos (Resumo e Individuais)
                                        let today = now_aegis.format("%Y-%m-%d").to_string();
                                        let events = calendar_clone.list_events(uid);
                                        
                                        // 1. Resumo da manhã
                                        if config.notif_event_upcoming && now_str == config.notif_event_upcoming_time {
                                            let today_events: Vec<_> = events.iter().filter(|e| e.date == today && e.event_type != "holiday").collect();
                                            if !today_events.is_empty() {
                                                let title = "Aegis: Agenda de Hoje";
                                                let body = format!("Você tem {} compromisso(s) agendado(s) para hoje.", today_events.len());
                                                notify_critical(&app_handle, title, &body);
                                                let _ = notif_clone.push(uid, title, &body, "calendar", None, Some("teal"), Some("Calendar"));
                                                let _ = app_handle.emit("new-notification", ());
                                            }
                                        }

                                        // 2. Notificações individuais no horário do evento
                                        for e in &events {
                                            if e.date == today && e.time == Some(now_str.clone()) {
                                                let title = format!("Aegis: {}", e.title);
                                                let body = e.description.as_deref().unwrap_or("Seu compromisso agendado começou agora.");
                                                notify_critical(&app_handle, &title, body);
                                                let _ = notif_clone.push(uid, &title, body, "calendar", None, e.color.as_deref(), Some("Calendar"));
                                                let _ = app_handle.emit("new-notification", ());
                                            }
                                        }
                                        
                                        // Controle de Sono (Existente)
                                        let goal = sleep_clone.get_goal(uid, &app_handle);
                                        if goal.reminder_enabled && goal.target_bedtime == now_str {
                                            let title = "Aegis: Controle de Sono";
                                            let body = "Seu ponto de recolhimento ideal chegou. Bom descanso!";
                                            notify_critical(&app_handle, title, body);
                                            let _ = notif_clone.push(uid, title, body, "sleep", None, Some("blue"), Some("Moon"));
                                            let _ = app_handle.emit("new-notification", ());
                                        }
                                        if now_str == "09:00" {
                                            let today = now_aegis.format("%Y-%m-%d").to_string();
                                            let entries = sleep_clone.list_entries(uid, 1, Utc::now());
                                            let has_today = entries.iter().any(|e| e.date == today);
                                            if !has_today {
                                                let title = "Aegis: Sono não registrado";
                                                if !notif_clone.has_unread_today(uid, title) {
                                                    notify_critical(&app_handle, title, "Você ainda não registrou seu ciclo de sono hoje!");
                                                    let _ = notif_clone.push(uid, title, "Acesse o módulo de Sono para manter seu histórico de descanso atualizado.", "sleep", None, Some("blue"), Some("Moon"));
                                                    let _ = app_handle.emit("new-notification", ());
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Pomodoro Tick (Independente de minuto, usa tempo real ou simulado)
                    let user_ids = pomo_clone.get_all_user_ids();
                    for user_id in user_ids {
                        let mut state = pomo_clone.get_state(&user_id);
                        if state.is_running {
                            if let Some(start_time) = state.start_time {
                                let elapsed_since_start = Utc::now().signed_duration_since(start_time).num_seconds() as i32;
                                let total_elapsed = state.accumulated_seconds + elapsed_since_start;
                                
                                let duration_mins = if state.cycle_type == "Work" { state.work_minutes } else { state.break_minutes };
                                let total_secs = duration_mins * 60;
                                
                                if total_elapsed >= total_secs {
                                    state.cycles_completed += if state.cycle_type == "Work" { 1 } else { 0 };
                                    state.cycle_type = if state.cycle_type == "Work" { "ShortBreak".to_string() } else { "Work".to_string() };
                                    state.start_time = Some(Utc::now());
                                    state.accumulated_seconds = 0;
                                    
                                    let _ = pomo_clone.save_state(&user_id, &state);
                                    notify_critical(&app_handle, "Aegis Pomodoro", "Ciclo concluído!");
                                }
                            }
                        }
                    }
                    let _ = app_handle.emit("pomo-tick", ());
                }
            });

            app.manage(AppState { pm, pomo, alarm, habit, note, config, studies, sleep, calendar, stats, reading, tasks, notif, dictionary, movies });

            // ─── Startup Data Summary ──────────────────────────────────────────
            {
                let pm_report  = PasswordManager::new(app.handle());
                let note_report = notes::NoteManager::new(app.handle());
                let habit_report = HabitManager::new(app.handle());
                let task_report = TaskManager::new(app.handle());
                let reading_report = ReadingManager::new(app.handle());
                let sleep_report = SleepManager::new(app.handle());
                let calendar_report = CalendarManager::new(app.handle());
                let alarm_report = AlarmManager::new(app.handle());
                let studies_report = StudiesManager::new(app.handle());
                let dict_report = dictionary::DictionaryManager::new(app.handle());
                let movies_report = movies::MovieManager::new(app.handle());
                let config_report = ConfigManager::new(app.handle());
                let now_report = config_report.get_now();

                crate::log_status!("Aegis iniciado — Resumo de Dados");

                if let Ok(users) = pm_report.list_users() {
                    crate::log_status!("Usuários registrados: {}", users.len());
                    for user_val in &users {
                        let uid = user_val.get("id").and_then(|v| v.as_str()).unwrap_or("?");
                        let name = user_val.get("username").and_then(|v| v.as_str()).unwrap_or("?");

                        let pw_count = pm_report.list_passwords(uid).map(|v| v.len()).unwrap_or(0);
                        let note_count = note_report.list_notes(uid).len();
                        let habit_count = habit_report.list_habits(uid, now_report).len();
                        let task_count = task_report.list_tasks(uid).len();
                        let book_count = reading_report.list_books(uid).len();
                        let sleep_count = sleep_report.list_entries(uid, 1, now_report).len();
                        let event_count = calendar_report.list_events(uid).len();
                        let alarm_count = alarm_report.list_alarms(uid).len();
                        let study_count = studies_report.list_sessions(uid, 12, now_report).len(); // ultimos 12 meses
                        let dict_count = dict_report.list_words(uid).len();
                        let movies_count = movies_report.list_movies(uid).len();

                        crate::log_status!("  ┌─ Usuário: {} ({})", name, uid);
                        crate::log_status!("  │  Senhas no cofre : {}", pw_count);
                        crate::log_status!("  │  Notas           : {}", note_count);
                        crate::log_status!("  │  Hábitos         : {}", habit_count);
                        crate::log_status!("  │  Tarefas         : {}", task_count);
                        crate::log_status!("  │  Alertas         : {}", alarm_count);
                        crate::log_status!("  │  Sessões Estudos : {}", study_count);
                        crate::log_status!("  │  Palavras Dic.   : {}", dict_count);
                        crate::log_status!("  │  Filmes/Séries   : {}", movies_count);
                        crate::log_status!("  │  Livros (leitura): {}", book_count);
                        crate::log_status!("  │  Sono (últ. mês) : {} registros", sleep_count);
                        crate::log_status!("  └─ Eventos (agenda): {}", event_count);
                    }
                } else {
                    crate::log_warn!("Não foi possível listar usuários no startup.");
                }

                
            }
            // ──────────────────────────────────────────────────────────────────

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            test_notification, open_notification_settings, send_critical_notification, verify_master,
            add_password, update_password, list_passwords, decrypt_entry, import_passwords, export_passwords, delete_password, check_vault, reset_vault,
            get_pomodoro_state, save_pomodoro_state, record_pomodoro_session, get_pomodoro_history, clear_pomodoro_history,
            list_alarms, add_alarm, delete_alarm, toggle_alarm, update_alarm,
            list_habits, add_habit, update_habit, mark_habit_done, use_habit_charge, reset_habit, hard_reset_habit, delete_habit,
            local_register, check_user_availability, local_login, get_local_user, list_local_users, delete_account, change_account_password, change_username, change_vault_password, revert_vault_to_master, has_separate_vault_password,
            list_notes, list_note_items, add_note, update_note, delete_note, create_note_folder, delete_note_folder, move_note_item, update_note_pinned, open_notes_folder, list_notification_sounds,
            get_app_config, set_app_config, apply_internal_command, get_simulation_status, quit_app,
            get_app_version, read_changelog,
            estudos_add_session, estudos_update_session, estudos_delete_session, estudos_list_sessions, estudos_upsert_goal, estudos_list_goals, estudos_export_csv, estudos_import_csv,
            sono_upsert_entry, sono_delete_entry, sono_list_entries, sono_upsert_goal, sono_get_goal, sono_export_csv, sono_import_csv,
            calendar_add_event, calendar_update_event, calendar_delete_event, sync_br_holidays, calendar_list_events, calendar_list_upcoming_deadlines,
            stats_get_cross_metrics, stats_get_performance_summary,
            reading_list_books, reading_upsert_book, reading_delete_book, reading_upsert_session, reading_list_sessions, reading_delete_session, reading_upsert_goal, reading_list_goals, reading_export_json, reading_import_json, reading_search_books,
            dictionary_search, dictionary_list, dictionary_add, dictionary_delete, dictionary_toggle_favorite, dictionary_suggestions,
            movies_search, movies_list, movies_upsert, movies_delete, movies_toggle_favorite,
            get_tmdb_api_key, set_tmdb_api_key,
            reading_toggle_favorite,
            tasks_list, tasks_upsert, tasks_toggle, tasks_delete,
            notif_list, notif_unread_count, notif_mark_read, notif_mark_all_read, notif_delete, notif_clear_read, ensure_discord_invite,
            get_app_version, get_log_path, read_app_logs, capture_screenshot,
            save_avatar, get_avatar, delete_avatar, export_tasks_csv, export_habits_csv, import_tasks_csv, import_habits_csv,
            movies_export_json, movies_import_json, dictionary_export_csv, dictionary_import_csv,
            pre_update_backup, export_user_package, import_user_package, export_full_system_bundle, import_full_system_bundle, check_dnd_status,
            check_github_update, open_app_data_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}