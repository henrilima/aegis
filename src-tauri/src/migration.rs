use serde::{Deserialize, Serialize};
use tauri::{State, Manager, AppHandle};
use crate::AppState;
use chrono::Local;
use std::collections::HashMap;
use aes_gcm::AeadCore;

#[derive(Debug, Serialize, Deserialize)]
pub struct UserFullBackup {
    pub version: String,
    pub user_id: String,
    pub export_date: String,
    
    pub passwords: Vec<crate::passwords::PasswordEntry>,
    pub habits: Vec<crate::habits::Habit>,
    pub tasks: Vec<crate::tasks::Task>,
    pub notes: Vec<crate::notes::Note>,
    pub pomodoro_history: Vec<crate::pomodoro::PomodoroHistory>,
    pub alarms: Vec<crate::alarms::AppAlarm>,
    pub sleep_entries: Vec<crate::sleep::SleepEntry>,
    pub sleep_goals: Vec<crate::sleep::SleepGoal>,
    pub study_sessions: Vec<crate::studies::StudySession>,
    pub study_goals: Vec<crate::studies::StudyGoal>,
    pub reading_books: Vec<crate::reading::ReadingBook>,
    pub reading_sessions: Vec<crate::reading::ReadingSession>,
    pub reading_goals: Vec<crate::reading::ReadingGoal>,
    pub calendar_events: Vec<crate::calendar::CalendarEvent>,
    pub notifications: Vec<crate::notifications::AppNotification>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemFullBundle {
    pub version: String,
    pub export_date: String,
    pub passwords_db: Vec<u8>,
    pub config_db: Vec<u8>,
    pub notes_files: HashMap<String, String>, // path -> content
    pub dashboard_config: Option<String>,
}

#[tauri::command]
pub async fn export_user_package(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    user_id: String,
    path: String,
    key_bytes: Vec<u8>
) -> Result<(), String> {
    let backup = UserFullBackup {
        version: "1.0.0".to_string(),
        user_id: user_id.clone(),
        export_date: Local::now().to_rfc3339(),
        
        passwords: state.pm.list_passwords(&user_id)?,
        habits: state.habit.list_habits(&user_id, chrono::Utc::now()),
        tasks: state.tasks.list_tasks(&user_id),
        notes: state.note.list_notes(&user_id),
        pomodoro_history: state.pomo.get_history(&user_id),
        alarms: state.alarm.list_alarms(&user_id),
        sleep_entries: state.sleep.list_entries(&user_id, 120, chrono::Utc::now()),
        sleep_goals: vec![state.sleep.get_goal(&user_id, &app_handle)],
        study_sessions: state.studies.list_sessions(&user_id, 120, chrono::Utc::now()),
        study_goals: state.studies.list_goals(&user_id),
        reading_books: state.reading.list_books(&user_id),
        reading_sessions: state.reading.list_sessions(&user_id, 120, chrono::Utc::now()),
        reading_goals: state.reading.list_goals(&user_id),
        calendar_events: state
            .calendar
            .list_events(&user_id)
            .into_iter()
            .filter(|e| !e.is_holiday.unwrap_or(false))
            .collect(),
        notifications: state.notif.list(&user_id),
    };

    let json = serde_json::to_vec(&backup).map_err(|e| e.to_string())?;
    encrypt_and_save(json, path, key_bytes).await
}

#[tauri::command]
pub async fn import_user_package(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    target_user_id: String,
    path: String,
    key_bytes: Vec<u8>
) -> Result<(), String> {
    let decrypted = decrypt_file(path, key_bytes).await?;
    let backup: UserFullBackup = serde_json::from_slice(&decrypted).map_err(|e| format!("Erro ao processar dados: {}", e))?;

    // Merging...
    for mut p in backup.passwords {
        p.user_id = target_user_id.clone();
        p.id = None;
        let _ = state.pm.add_password_entry(p);
    }
    for mut h in backup.habits {
        h.user_id = target_user_id.clone();
        h.id = None;
        let _ = state.habit.add_habit(h);
    }
    for mut t in backup.tasks {
        t.user_id = target_user_id.clone();
        t.id = None;
        let _ = state.tasks.upsert_task(t);
    }
    for mut n in backup.notes {
        n.user_id = target_user_id.clone();
        n.id = None;
        let _ = state.note.add_note(n);
    }
    for mut ph in backup.pomodoro_history {
        ph.user_id = target_user_id.clone();
        ph.id = None;
        let _ = state.pomo.record_session(ph);
    }
    for mut alarm in backup.alarms {
        alarm.user_id = target_user_id.clone();
        alarm.id = None;
        // Se for intervalo e estiver sendo importado, limpamos o last_triggered para recomeçar
        if alarm.alarm_type == "interval" {
            alarm.last_triggered = None;
        }
        let _ = state.alarm.add_alarm(alarm);
    }
    for mut se in backup.sleep_entries {
        se.user_id = target_user_id.clone();
        se.id = None;
        let _ = state.sleep.upsert_entry(se);
    }
    for mut sg in backup.sleep_goals {
        sg.user_id = target_user_id.clone();
        let _ = state.sleep.upsert_goal(sg, &app_handle);
    }
    for mut ss in backup.study_sessions {
        ss.user_id = target_user_id.clone();
        ss.id = None;
        let _ = state.studies.add_session(ss);
    }
    for mut sgoal in backup.study_goals {
        sgoal.user_id = target_user_id.clone();
        sgoal.id = None;
        let _ = state.studies.upsert_goal(sgoal);
    }
    
    let mut book_id_map = HashMap::new();
    for mut rb in backup.reading_books {
        let old_id = rb.id;
        rb.user_id = target_user_id.clone();
        rb.id = None;
        if let Ok(new_id) = state.reading.upsert_book(rb) {
            if let Some(oid) = old_id {
                book_id_map.insert(oid, new_id);
            }
        }
    }
    for mut rs in backup.reading_sessions {
        rs.user_id = target_user_id.clone();
        rs.id = None;
        if let Some(old_book_id) = rs.book_id {
            rs.book_id = book_id_map.get(&old_book_id).copied();
        }
        let _ = state.reading.add_session_direct(rs);
    }
    for mut rg in backup.reading_goals {
        rg.user_id = target_user_id.clone();
        rg.id = None;
        let _ = state.reading.upsert_goal(rg);
    }
    for mut ce in backup.calendar_events {
        ce.user_id = target_user_id.clone();
        ce.id = None;
        let _ = state.calendar.add_event(ce);
    }
    for mut notif in backup.notifications {
        notif.user_id = target_user_id.clone();
        notif.id = None;
        let _ = state.notif.add_notification_direct(notif);
    }

    Ok(())
}

#[tauri::command]
pub async fn export_full_system_bundle(
    app_handle: AppHandle,
    path: String,
    key_bytes: Vec<u8>
) -> Result<(), String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    
    // 1. Bancos de dados
    let passwords_db = std::fs::read(app_dir.join("passwords.db")).unwrap_or_default();
    let config_db = std::fs::read(app_dir.join("config.db")).unwrap_or_default();
    
    // 2. Config do dashboard
    let dash_config = std::fs::read_to_string(app_dir.join("aegis-dashboard.json")).ok();
    
    // 3. Notas (arquivos md)
    // Precisamos encontrar onde as notas estão. Como o NoteManager é inicializado no lib.rs,
    // ele usa o diretório do executável/notes.
    // Vamos tentar localizar.
    let mut notes_files = HashMap::new();
    let current_exe = std::env::current_exe().unwrap_or_default();
    let base_dir = current_exe.parent().unwrap_or(&app_dir).to_path_buf();
    let notes_dir = base_dir.join("notes");
    
    if notes_dir.exists() {
        collect_notes_recursive(&notes_dir, &notes_dir, &mut notes_files);
    }

    let bundle = SystemFullBundle {
        version: "1.0.0".to_string(),
        export_date: Local::now().to_rfc3339(),
        passwords_db,
        config_db,
        notes_files,
        dashboard_config: dash_config,
    };

    let json = serde_json::to_vec(&bundle).map_err(|e| e.to_string())?;
    encrypt_and_save(json, path, key_bytes).await
}

#[tauri::command]
pub async fn import_full_system_bundle(
    app_handle: AppHandle,
    path: String,
    key_bytes: Vec<u8>
) -> Result<(), String> {
    let decrypted = decrypt_file(path, key_bytes).await?;
    let bundle: SystemFullBundle = serde_json::from_slice(&decrypted).map_err(|e| format!("Erro ao processar bundle: {}", e))?;

    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    
    // Backup preventivo
    let _ = std::fs::copy(app_dir.join("passwords.db"), app_dir.join("passwords_backup_pre_bundle.db"));
    
    // 1. Restaurar bancos
    if !bundle.passwords_db.is_empty() {
        std::fs::write(app_dir.join("passwords.db"), &bundle.passwords_db).map_err(|e| e.to_string())?;
    }
    if !bundle.config_db.is_empty() {
        std::fs::write(app_dir.join("config.db"), &bundle.config_db).map_err(|e| e.to_string())?;
    }
    
    // 2. Dashboard config
    if let Some(dash) = bundle.dashboard_config {
        std::fs::write(app_dir.join("aegis-dashboard.json"), dash).map_err(|e| e.to_string())?;
    }
    
    // 3. Notas
    let current_exe = std::env::current_exe().unwrap_or_default();
    let base_dir = current_exe.parent().unwrap_or(&app_dir).to_path_buf();
    let notes_dir = base_dir.join("notes");
    
    for (rel_path, content) in bundle.notes_files {
        let full_path = notes_dir.join(rel_path);
        if let Some(parent) = full_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let _ = std::fs::write(full_path, content);
    }

    Ok(())
}

// Helpers
async fn encrypt_and_save(data: Vec<u8>, path: String, key_bytes: Vec<u8>) -> Result<(), String> {
    use aes_gcm::{aead::{Aead, KeyInit, OsRng}, Aes256Gcm, Key};
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    
    let encrypted = cipher.encrypt(&nonce, data.as_ref()).map_err(|_| "Falha na criptografia".to_string())?;
    
    let mut final_data = nonce.to_vec();
    final_data.extend_from_slice(&encrypted);
    
    std::fs::write(path, final_data).map_err(|e| e.to_string())?;
    Ok(())
}

async fn decrypt_file(path: String, key_bytes: Vec<u8>) -> Result<Vec<u8>, String> {
    let data = std::fs::read(path).map_err(|e| e.to_string())?;
    if data.len() < 12 { return Err("Arquivo de backup inválido".to_string()); }
    
    let (nonce_bytes, encrypted) = data.split_at(12);
    
    use aes_gcm::{aead::{Aead, KeyInit}, Aes256Gcm, Nonce, Key};
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce_bytes);
    
    cipher.decrypt(nonce, encrypted).map_err(|_| "Senha incorreta ou arquivo corrompido".to_string())
}

fn collect_notes_recursive(base_dir: &std::path::Path, current_dir: &std::path::Path, files: &mut HashMap<String, String>) {
    if let Ok(entries) = std::fs::read_dir(current_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                collect_notes_recursive(base_dir, &path, files);
            } else if path.extension().and_then(|s| s.to_str()) == Some("md") {
                if let Ok(content) = std::fs::read_to_string(&path) {
                    if let Ok(rel_path) = path.strip_prefix(base_dir) {
                        files.insert(rel_path.to_string_lossy().to_string(), content);
                    }
                }
            }
        }
    }
}
