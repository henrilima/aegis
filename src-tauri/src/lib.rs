mod passwords;
mod pomodoro;
mod currencies;
mod hydration;
mod habits;
mod notes;
mod config;
mod estudos;
mod sono;
mod calendar;
mod statistics;

use passwords::{PasswordEntry, DecryptedEntry, PasswordManager};
use pomodoro::{PomodoroState, PomodoroManager, PomodoroHistory};
use currencies::{CurrencyRate, CurrencyManager};
use hydration::{HydrationReminder, HydrationManager};
use habits::{Habit, HabitManager};
use config::{AppConfig, ConfigManager};
use estudos::{EstudosManager, StudySession, StudyGoal};
use sono::{SonoManager, SleepEntry, SleepGoal};
use calendar::{CalendarManager, CalendarEvent};
use statistics::{StatisticsManager, CrossMetric, PerformanceSummary};
use speedtest_rs::speedtest;
use tauri::{Emitter, Manager, Window, State, tray::TrayIconBuilder};
use std::thread;
use std::time::Duration;
use chrono::{Local, Timelike, Utc};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_autostart::ManagerExt as AutoStartManagerExt;



struct AppState {
    pm: PasswordManager,
    pomo: PomodoroManager,
    curr: CurrencyManager,
    hydra: HydrationManager,
    habit: HabitManager,
    note: notes::NoteManager,
    config: ConfigManager,
    estudos: EstudosManager,
    sono: SonoManager,
    calendar: CalendarManager,
    stats: StatisticsManager,
}

#[tauri::command]
async fn verify_master(state: State<'_, AppState>, user_id: String, master_password: String) -> Result<bool, String> {
    state.pm.verify_master(&user_id, &master_password).map(|_| true)
}

#[tauri::command]
async fn send_critical_notification(app_handle: tauri::AppHandle, title: String, body: String) -> Result<(), String> {
    notify_critical(&app_handle, &title, &body);
    Ok(())
}

fn notify_critical(app: &tauri::AppHandle, title: &str, body: &str) {
    let _ = app.notification().builder()
        .title(title)
        .body(body)
        .show();
}

#[tauri::command]
fn check_dnd_status() -> bool {
    false
}

#[tauri::command]
async fn open_notification_settings(app_handle: tauri::AppHandle) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use tauri_plugin_shell::ShellExt;
        let _ = app_handle.shell().command("explorer").args(["ms-settings:notifications"]).spawn();
    }
    Ok(())
}

#[tauri::command]
async fn test_notification(app_handle: tauri::AppHandle) -> Result<(), String> {
    notify_critical(&app_handle, "Aegis Teste", "Se você vê isso, as notificações críticas estão funcionando!");
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
async fn list_hydration_reminders(state: State<'_, AppState>, user_id: String) -> Result<Vec<HydrationReminder>, String> {
    Ok(state.hydra.list_reminders(&user_id))
}

#[tauri::command]
async fn add_hydration_reminder(state: State<'_, AppState>, reminder: HydrationReminder) -> Result<(), String> {
    state.hydra.add_reminder(reminder)
}

#[tauri::command]
async fn delete_hydration_reminder(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    state.hydra.delete_reminder(id)
}


#[tauri::command]
async fn list_habits(state: State<'_, AppState>, user_id: String) -> Result<Vec<Habit>, String> {
    Ok(state.habit.list_habits(&user_id))
}

#[tauri::command]
async fn add_habit(state: State<'_, AppState>, habit: Habit) -> Result<(), String> {
    state.habit.add_habit(habit)
}

#[tauri::command]
async fn reset_habit(state: State<'_, AppState>, id: i32, timestamp: String) -> Result<(), String> {
    state.habit.reset_habit(id, &timestamp)
}

#[tauri::command]
async fn hard_reset_habit(state: State<'_, AppState>, id: i32, timestamp: String) -> Result<(), String> {
    state.habit.hard_reset_habit(id, &timestamp)
}

#[tauri::command]
async fn delete_habit(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    state.habit.delete_habit(id)
}

#[tauri::command]
async fn update_habit(state: State<'_, AppState>, habit: Habit) -> Result<(), String> {
    state.habit.update_habit(habit)
}

#[tauri::command]
async fn mark_habit_done(state: State<'_, AppState>, id: i32, timestamp: String) -> Result<(), String> {
    state.habit.mark_done(id, &timestamp)
}

#[tauri::command]
async fn use_habit_charge(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    state.habit.use_charge(id)
}

#[tauri::command]
async fn quit_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}

#[tauri::command]
async fn check_user_availability(state: State<'_, AppState>, username: String, email: String) -> Result<(), String> {
    state.pm.check_availability(&username, &email)
}

#[tauri::command]
async fn local_register(state: State<'_, AppState>, username: String, email: String, password: String) -> Result<String, String> {
    state.pm.register_user(&username, &email, &password)
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
    
    state.pm.verify_master(&user_id, &password)?;
    state.pm.delete_user(&user_id)
}

#[tauri::command]
async fn change_account_password(state: State<'_, AppState>, user_id: String, current_password: String, new_password: String) -> Result<(), String> {
    state.pm.change_account_password(&user_id, &current_password, &new_password)
}

#[tauri::command]
async fn change_vault_password(state: State<'_, AppState>, user_id: String, current_vault_pwd: String, new_vault_pwd: String) -> Result<(), String> {
    state.pm.change_vault_password(&user_id, &current_vault_pwd, Some(&new_vault_pwd))
}

#[tauri::command]
async fn revert_vault_to_master(state: State<'_, AppState>, user_id: String, current_vault_pwd: String, master_pwd: String) -> Result<(), String> {
    state.pm.revert_vault_to_master(&user_id, &current_vault_pwd, &master_pwd)
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
async fn add_note(state: State<'_, AppState>, note: notes::Note) -> Result<(), String> {
    state.note.add_note(note)
}

#[tauri::command]
async fn update_note(state: State<'_, AppState>, note: notes::Note) -> Result<(), String> {
    state.note.update_note(note)
}

#[tauri::command]
async fn setup_local_vault(state: State<'_, AppState>, user_id: String, username: String, master_password: String) -> Result<(), String> {
    
    let local_email = format!("{}@aegis.local", username.to_lowercase());
    state.pm.register_user_with_id(&user_id, &username, &local_email, &master_password)
}

#[tauri::command]
async fn delete_note(state: State<'_, AppState>, id: i32) -> Result<(), String> {
    state.note.delete_note(id)
}

#[tauri::command]
async fn update_note_status(state: State<'_, AppState>, id: i32, status: String) -> Result<(), String> {
    state.note.update_note_status(id, &status)
}

#[tauri::command]
async fn update_note_pinned(state: State<'_, AppState>, id: i32, pinned: bool) -> Result<(), String> {
    state.note.update_note_pinned(id, pinned)
}

#[tauri::command]
async fn get_app_config(state: State<'_, AppState>) -> Result<AppConfig, String> {
    Ok(state.config.get_config())
}

#[tauri::command]
async fn set_app_config(state: State<'_, AppState>, app_handle: tauri::AppHandle, config: AppConfig) -> Result<(), String> {
    state.config.set_config(config.clone())?;

    if config.start_at_login {
        app_handle
            .autolaunch()
            .enable()
            .map_err(|e| format!("Falha ao ativar inicialização automática: {e}"))?;
    } else {
        app_handle
            .autolaunch()
            .disable()
            .map_err(|e| format!("Falha ao desativar inicialização automática: {e}"))?;
    }

    Ok(())
}



#[tauri::command]
async fn estudos_add_session(state: State<'_, AppState>, session: StudySession) -> Result<i64, String> {
    state.estudos.add_session(session)
}

#[tauri::command]
async fn estudos_update_session(state: State<'_, AppState>, session: StudySession) -> Result<(), String> {
    state.estudos.update_session(session)
}

#[tauri::command]
async fn estudos_delete_session(state: State<'_, AppState>, id: i64, user_id: String) -> Result<(), String> {
    state.estudos.delete_session(id, &user_id)
}

#[tauri::command]
async fn estudos_list_sessions(state: State<'_, AppState>, user_id: String, months_back: i32) -> Result<Vec<StudySession>, String> {
    Ok(state.estudos.list_sessions(&user_id, months_back))
}

#[tauri::command]
async fn estudos_upsert_goal(state: State<'_, AppState>, goal: StudyGoal) -> Result<(), String> {
    state.estudos.upsert_goal(goal)
}

#[tauri::command]
async fn estudos_list_goals(state: State<'_, AppState>, user_id: String) -> Result<Vec<StudyGoal>, String> {
    Ok(state.estudos.list_goals(&user_id))
}

#[tauri::command]
async fn estudos_export_csv(state: State<'_, AppState>, user_id: String, dest_path: String) -> Result<(), String> {
    state.estudos.export_csv(&user_id, &dest_path)
}

#[tauri::command]
async fn estudos_import_csv(state: State<'_, AppState>, user_id: String, file_path: String) -> Result<usize, String> {
    state.estudos.import_csv(&user_id, &file_path)
}



#[tauri::command]
async fn sono_upsert_entry(state: State<'_, AppState>, entry: SleepEntry) -> Result<i64, String> {
    state.sono.upsert_entry(entry)
}

#[tauri::command]
async fn sono_delete_entry(state: State<'_, AppState>, id: i64, user_id: String) -> Result<(), String> {
    state.sono.delete_entry(id, &user_id)
}

#[tauri::command]
async fn sono_list_entries(state: State<'_, AppState>, user_id: String, months_back: i32) -> Result<Vec<SleepEntry>, String> {
    Ok(state.sono.list_entries(&user_id, months_back))
}

#[tauri::command]
async fn sono_upsert_goal(state: State<'_, AppState>, goal: SleepGoal) -> Result<(), String> {
    state.sono.upsert_goal(goal)
}

#[tauri::command]
async fn sono_get_goal(state: State<'_, AppState>, user_id: String) -> Result<SleepGoal, String> {
    Ok(state.sono.get_goal(&user_id))
}



#[tauri::command]
async fn open_notes_folder(state: State<'_, AppState>) -> Result<(), String> {
    state.note.open_folder()
}

// ── Calendar commands ──────────────────────────────────────────────────────

#[tauri::command]
async fn calendar_add_event(state: State<'_, AppState>, event: CalendarEvent) -> Result<i64, String> {
    state.calendar.add_event(event)
}

#[tauri::command]
async fn calendar_update_event(state: State<'_, AppState>, event: CalendarEvent) -> Result<(), String> {
    state.calendar.update_event(event)
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
    Ok(state.calendar.list_upcoming_deadlines(&user_id))
}

// ── Statistics commands ────────────────────────────────────────────────────

#[tauri::command]
async fn stats_get_cross_metrics(state: State<'_, AppState>, user_id: String, days: i32) -> Result<Vec<CrossMetric>, String> {
    Ok(state.stats.get_cross_metrics(&user_id, days))
}

#[tauri::command]
async fn stats_get_performance_summary(state: State<'_, AppState>, user_id: String, days: i32) -> Result<PerformanceSummary, String> {
    Ok(state.stats.get_performance_summary(&user_id, days))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .plugin(tauri_plugin_store::Builder::new().build())
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
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            let pm = PasswordManager::new(app.handle());
            let pomo = PomodoroManager::new(app.handle());
            let curr = CurrencyManager::new(app.handle());
            let hydra = HydrationManager::new(app.handle());
            let habit = HabitManager::new(app.handle());
            let note = notes::NoteManager::new(app.handle());
            let config = ConfigManager::new(app.handle());
            let estudos = EstudosManager::new(app.handle());
            let sono = SonoManager::new(app.handle());
            let calendar = CalendarManager::new(app.handle());
            let stats = StatisticsManager::new(app.handle());

            let initial_config = config.get_config();
            if initial_config.start_at_login {
                let _ = app.autolaunch().enable();
            } else {
                let _ = app.autolaunch().disable();
            }
            

            
            
            let app_handle = app.handle().clone();
            let hydra_clone = HydrationManager::new(app.handle());
            let pomo_clone = PomodoroManager::new(app.handle());
            
            thread::spawn(move || {
                let mut last_notified_min = -1;

                loop {
                    thread::sleep(Duration::from_secs(1)); 
                    
                    let now = Local::now();
                    let now_min = now.hour() as i32 * 60 + now.minute() as i32;
                    let now_str = now.format("%H:%M").to_string();

                    
                    if now_min != last_notified_min {
                        let reminders = hydra_clone.list_all_enabled_reminders();
                        let mut notified_this_round = false;
                        for r in reminders {
                            let mut should_notify = false;
                            if r.reminder_type == "Fixed" && r.value == now_str {
                                should_notify = true;
                            } else if r.reminder_type == "Interval" {
                                if let Some(start_str) = r.start_time {
                                    let start_parts: Vec<&str> = start_str.split(':').collect();
                                    if start_parts.len() == 2 {
                                        let s_h = start_parts[0].parse::<i32>().unwrap_or(0);
                                        let s_m = start_parts[1].parse::<i32>().unwrap_or(0);
                                        let s_min = s_h * 60 + s_m;
                                        let interval = r.value.parse::<i32>().unwrap_or(60);
                                        if now_min >= s_min && (now_min - s_min) % interval == 0 {
                                            should_notify = true;
                                        }
                                    }
                                }
                            }
                            if should_notify {
                                notify_critical(&app_handle, "Aegis: Hidratação", "Hora de beber água!");
                                notified_this_round = true;
                            }
                        }
                        if notified_this_round { last_notified_min = now_min; }
                    }

                    
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
                                    let next_type = if state.cycle_type == "Work" { "ShortBreak" } else { "Work" };
                                    state.cycles_completed += if state.cycle_type == "Work" { 1 } else { 0 };
                                    state.cycle_type = next_type.to_string();
                                    state.start_time = Some(Utc::now());
                                    state.accumulated_seconds = 0;
                                    
                                    let _ = pomo_clone.save_state(&user_id, &state);
                                    
                                    let body = if next_type == "Work" { "Descanso concluído! De volta ao foco." } else { "Foco concluído! Hora de um descanso." };
                                    notify_critical(&app_handle, "Aegis Pomodoro", body);
                                }
                            }
                        }
                    }
                    
                    let _ = app_handle.emit("pomo-tick", ());
                }
            });

            app.manage(AppState { pm, pomo, curr, hydra, habit, note, config, estudos, sono, calendar, stats });
            
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let args: Vec<String> = std::env::args().collect();
            let arg_minimized = args.contains(&"--minimized".to_string());
            let config_minimized = initial_config.start_minimized;

            if let Some(window) = app.get_webview_window("main") {
                if arg_minimized || config_minimized {
                    let _ = window.hide();
                } else {
                    let _ = window.maximize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let state = window.state::<AppState>();
                let config = state.config.get_config();
                
                if config.minimize_on_close {
                    api.prevent_close();
                    let _ = window.hide();
                }
                
            }
        })
        .invoke_handler(tauri::generate_handler![
            teste_velocidade_aegis,
            test_notification,
            check_dnd_status,
            open_notification_settings,
            send_critical_notification,
            verify_master,
            add_password,
            update_password,
            list_passwords,
            decrypt_entry,
            import_passwords,
            export_passwords,
            delete_password,
            check_vault,
            reset_vault,
            
            get_pomodoro_state,
            save_pomodoro_state,
            record_pomodoro_session,
            get_pomodoro_history,
            clear_pomodoro_history,
            
            get_currency_rates,
            update_currency_rates,
            
            list_hydration_reminders,
            add_hydration_reminder,
            delete_hydration_reminder,
            
            list_habits,
            add_habit,
            update_habit,
            mark_habit_done,
            use_habit_charge,
            reset_habit,
            hard_reset_habit,
            delete_habit,
            
            local_register,
            check_user_availability,
            local_login,
            get_local_user,
            list_local_users,
            delete_account,
            change_account_password,
            change_vault_password,
            revert_vault_to_master,
            has_separate_vault_password,
            setup_local_vault,
            list_notes,
            add_note,
            update_note,
            delete_note,
            update_note_status,
            update_note_pinned,
            open_notes_folder,
            get_app_config,
            set_app_config,
            quit_app,
            
            estudos_add_session,
            estudos_update_session,
            estudos_delete_session,
            estudos_list_sessions,
            estudos_upsert_goal,
            estudos_list_goals,
            estudos_export_csv,
            estudos_import_csv,
            
            sono_upsert_entry,
            sono_delete_entry,
            sono_list_entries,
            sono_upsert_goal,
            sono_get_goal,

            calendar_add_event,
            calendar_update_event,
            calendar_delete_event,
            calendar_list_events,
            calendar_list_upcoming_deadlines,

            stats_get_cross_metrics,
            stats_get_performance_summary
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
