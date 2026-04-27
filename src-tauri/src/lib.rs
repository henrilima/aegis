mod passwords;
mod pomodoro;
mod currencies;
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

use passwords::{PasswordEntry, DecryptedEntry, PasswordManager};
use pomodoro::{PomodoroState, PomodoroManager, PomodoroHistory};
use currencies::{CurrencyRate, CurrencyManager};
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
use speedtest_rs::speedtest;
use tauri::{Emitter, Manager, Window, State, tray::TrayIconBuilder};
use std::thread;
use std::time::Duration;
use tauri_plugin_notification::NotificationExt;
use chrono::{Utc, Timelike, Local, DateTime};


use migration::*;

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct SimulationStatus {
    pub is_active: bool,
    pub simulated_time: String,
    pub offset_seconds: i64,
}

pub struct AppState {
    pm: PasswordManager,
    pomo: PomodoroManager,
    curr: CurrencyManager,
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
                let entries = state.sleep.list_entries(&user_id, 1, chrono::Utc::now());
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
    let _ = app.notification().builder()
        .title(title)
        .body(body)
        .show();
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
async fn get_currency_rates(state: State<'_, AppState>) -> Result<Vec<CurrencyRate>, String> {
    Ok(state.curr.get_rates())
}

#[tauri::command]
async fn update_currency_rates(state: State<'_, AppState>, rates: Vec<CurrencyRate>) -> Result<(), String> {
    state.curr.update_rates(rates)
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
async fn mark_habit_done(state: State<'_, AppState>, id: i32, user_id: Option<String>, _timestamp: Option<String>) -> Result<(), String> {
    let now = state.config.get_now();
    let uid = user_id.unwrap_or_default();
    state.habit.mark_done(id, &uid, now)
}

#[tauri::command]
async fn use_habit_charge(state: State<'_, AppState>, id: i32, _user_id: Option<String>) -> Result<(), String> {
    let now = state.config.get_now();
    state.habit.use_charge(id, now)
}

#[tauri::command]
async fn reset_habit(state: State<'_, AppState>, id: i32, _user_id: Option<String>, _timestamp: Option<String>) -> Result<(), String> {
    let now = state.config.get_now();
    state.habit.reset_habit(id, "", now)
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
async fn get_app_config(state: State<'_, AppState>) -> Result<AppConfig, String> {
    Ok(state.config.get_config())
}

#[tauri::command]
async fn set_app_config(state: State<'_, AppState>, config: AppConfig) -> Result<(), String> {
    state.config.set_config(config)
}

#[tauri::command]
async fn apply_internal_command(_app_handle: tauri::AppHandle, state: State<'_, AppState>, command: String) -> Result<(), String> {
    state.config.apply_debug_command(&command).map(|_| ())
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
        "https://openlibrary.org/search.json?q={}&limit=5&fields=title,author_name,number_of_pages_median,cover_i,subject,isbn",
        urlencoding::encode(&query)
    );
    let client = reqwest::Client::builder().user_agent("Aegis").build().map_err(|e| e.to_string())?;
    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(json)
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

#[tauri::command]
async fn import_habits_csv(state: State<'_, AppState>, user_id: String, path: String) -> Result<usize, String> {
    state.habit.import_csv(&user_id, &path)
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


#[tauri::command]
async fn teste_velocidade_aegis(window: Window) -> Result<(), String> {
    let w = window.clone();

    tauri::async_runtime::spawn_blocking(move || {
        let mut config = speedtest::get_configuration()
            .map_err(|e| format!("Erro de Configuração: {:?}", e))?;
        
        let server_list = speedtest::get_server_list_with_config(&config)
            .map_err(|e| format!("Erro ao obter servidores: {:?}", e))?;
        
        let best_result = speedtest::get_best_server_based_on_latency(&server_list.servers)
            .map_err(|_| "Nenhum servidor encontrado para sua região".to_string())?;
        
        let best_server = &best_result.server; 

        w.emit("speed-status", format!("Conectado a: {} ({})", best_server.sponsor, best_server.name)).unwrap();
        w.emit("speed-ping", best_result.latency.as_millis()).unwrap();

        w.emit("speed-status", "Testando Download...").unwrap();
        let download_speed = speedtest::test_download_with_progress_and_config(best_server, || {}, &mut config)
            .map_err(|e| format!("Falha no Download: {:?}", e))?;
        
        let dl_mbps = download_speed.bps_f64() / 1_000_000.0;
        w.emit("speed-download", dl_mbps).unwrap();

        w.emit("speed-status", "Testando Upload...").unwrap();
        let upload_speed = speedtest::test_upload_with_progress_and_config(best_server, || {}, &config)
            .map_err(|e| format!("Falha no Upload: {:?}", e))?;
        
        let ul_mbps = upload_speed.bps_f64() / 1_000_000.0;
        w.emit("speed-upload", ul_mbps).unwrap();

        w.emit("speed-status", "Teste Concluído").unwrap();
        Ok::<(), String>(())
    }).await.map_err(|e| e.to_string())?
}

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
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .setup(|app| {
            use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
            let quit_i = MenuItem::with_id(app, "quit", "Sair do Aegis", true, None::<String>)?;
            let show_i = MenuItem::with_id(app, "show", "Abrir Aegis", true, None::<String>)?;
            let menu = Menu::with_items(app, &[&show_i as &dyn tauri::menu::IsMenuItem<tauri::Wry>, &PredefinedMenuItem::separator(app)? as &dyn tauri::menu::IsMenuItem<tauri::Wry>, &quit_i as &dyn tauri::menu::IsMenuItem<tauri::Wry>])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.maximize();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        button_state: tauri::tray::MouseButtonState::Up,
                        ..
                    } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.maximize();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            let pm = PasswordManager::new(app.handle());
            let pomo = PomodoroManager::new(app.handle());
            let curr = CurrencyManager::new(app.handle());
            let alarm = AlarmManager::new(app.handle());
            let habit = HabitManager::new(app.handle());
            let note = notes::NoteManager::new(app.handle());
            let config = ConfigManager::new(app.handle());
            
            // Window startup logic
            let app_config = config.get_config();
            let args: Vec<String> = std::env::args().collect();
            let is_autostart = args.contains(&"--minimized".to_string());

            if let Some(window) = app.get_webview_window("main") {
                if is_autostart {
                    if !app_config.start_minimized {
                        let _ = window.show();
                        let _ = window.maximize();
                        let _ = window.set_focus();
                    }
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

            let app_handle = app.handle().clone();
            let pm_clone = PasswordManager::new(app.handle());
            let sleep_clone = SleepManager::new(app.handle());
            let notif_clone = NotificationsManager::new(app.handle());
            let pomo_clone = PomodoroManager::new(app.handle());
            let alarm_clone = AlarmManager::new(app.handle());
            let config_clone = ConfigManager::new(app.handle());

            thread::spawn::<_, ()>(move || {
                // Inicializa com o minuto atual do Aegis (respeitando simulação)
                let now_init = config_clone.get_now().with_timezone(&Local);
                let mut last_notified_min = now_init.hour() as i32 * 60 + now_init.minute() as i32;

                loop {
                    thread::sleep(Duration::from_secs(1)); 
                    
                    // Obtém o tempo atual do Aegis (respeitando offset de simulação se houver)
                    let now_aegis = config_clone.get_now().with_timezone(&Local);
                    let now_min = now_aegis.hour() as i32 * 60 + now_aegis.minute() as i32;
                    let now_str = now_aegis.format("%H:%M").to_string();

                    // Só processamos a lógica se houver mudança de minuto
                    if now_min != last_notified_min {
                        // Importante: atualizar IMEDIATAMENTE para evitar re-disparo no próximo tick de 1s
                        last_notified_min = now_min;
                        
                        let alarms = alarm_clone.list_all_enabled_alarms();
                        
                        for a in alarms {
                            let mut trigger = false;
                            
                            if a.alarm_type == "fixed" {
                                // Alerta fixo: EXATAMENTE no minuto configurado
                                if a.time == now_str {
                                    trigger = true;
                                }
                            } else if a.alarm_type == "interval" {
                                // Alerta de intervalo:
                                // 1. No horário de início exato
                                // 2. Se o tempo desde o último disparo >= intervalo
                                if now_str == a.time {
                                    trigger = true;
                                } else if now_str > a.time {
                                    if let Some(iso) = &a.last_triggered {
                                        if let Ok(lt_dt) = DateTime::parse_from_rfc3339(iso) {
                                            let lt = lt_dt.with_timezone(&Local);
                                            let diff_secs = now_aegis.signed_duration_since(lt).num_seconds();
                                            let interval_secs = (a.interval_minutes.unwrap_or(30) * 60) as i64;
                                            
                                            // Usamos margem de 5s para garantir captura mas evitar duplo disparo
                                            if diff_secs >= interval_secs && diff_secs < interval_secs + 59 {
                                                trigger = true;
                                            }
                                        }
                                    } else {
                                        // Se nunca disparou e já passou do horário de início
                                        trigger = true;
                                    }
                                }
                            }

                            if trigger {
                                // Atualiza estado ANTES de notificar para segurança
                                if a.alarm_type == "interval" {
                                    alarm_clone.update_last_triggered(a.id.unwrap(), &now_aegis.to_rfc3339());
                                }

                                let title = format!("Aegis: {}", a.title);
                                let body = if a.alarm_type == "interval" { 
                                    format!("Lembrete periódico: {}", a.title) 
                                } else { 
                                    "Alerta programado disparado!".to_string() 
                                };
                                
                                notify_critical(&app_handle, &title, &body);
                                let _ = app_handle.emit("trigger-alarm", a.clone());
                                let _ = notif_clone.push(&a.user_id, &title, &body, "alarms", None, a.color.as_deref(), Some(&a.icon));
                                let _ = app_handle.emit("new-notification", ());
                            }
                        }
                        
                        // Lógica de Lembretes de Sono (Check por Minuto)
                        if let Ok(users) = pm_clone.list_users() {
                            for user_val in users {
                                if let Some(uid_val) = user_val.get("id") {
                                    if let Some(uid) = uid_val.as_str() {
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

            app.manage(AppState { pm, pomo, curr, alarm, habit, note, config, studies, sleep, calendar, stats, reading, tasks, notif });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            teste_velocidade_aegis, test_notification, open_notification_settings, send_critical_notification, verify_master,
            add_password, update_password, list_passwords, decrypt_entry, import_passwords, export_passwords, delete_password, check_vault, reset_vault,
            get_pomodoro_state, save_pomodoro_state, record_pomodoro_session, get_pomodoro_history, clear_pomodoro_history,
            get_currency_rates, update_currency_rates, list_alarms, add_alarm, delete_alarm, toggle_alarm, update_alarm,
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
            tasks_list, tasks_upsert, tasks_toggle, tasks_delete,
            notif_list, notif_unread_count, notif_mark_read, notif_mark_all_read, notif_delete, notif_clear_read, ensure_discord_invite,
            get_app_version, get_log_path, read_app_logs, capture_screenshot,
            save_avatar, get_avatar, delete_avatar, export_tasks_csv, export_habits_csv, import_tasks_csv, import_habits_csv,
            pre_update_backup, export_user_package, import_user_package, export_full_system_bundle, import_full_system_bundle, check_dnd_status,
            check_github_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}