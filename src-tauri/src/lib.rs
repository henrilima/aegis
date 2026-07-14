//  Macros de Log Semântico 

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
mod flashcards;

use passwords::PasswordManager;
use pomodoro::PomodoroManager;

use alarms::AlarmManager;
use habits::HabitManager;
use config::{AppConfig, ConfigManager};
use studies::StudiesManager;
use sleep::SleepManager;
use calendar::CalendarManager;
use statistics::StatisticsManager;
use reading::ReadingManager;
use tasks::TaskManager;
use notifications::NotificationsManager;

use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_notification::NotificationExt;
use chrono::{Utc, Timelike, Local, DateTime};
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
    flashcards: flashcards::FlashcardManager,
}

#[tauri::command]
async fn global_verify_master(
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
async fn global_send_critical_notification(app_handle: tauri::AppHandle, title: String, body: String) -> Result<(), String> {
    notify_critical(&app_handle, &title, &body);
    Ok(())
}
#[tauri::command]
async fn global_test_notification(app_handle: tauri::AppHandle) -> Result<(), String> {
    notify_critical(&app_handle, "Aegis Teste", "Se você vê isso, as notificações críticas estão funcionando!");
    Ok(())
}
#[tauri::command]
fn global_get_app_version(app_handle: tauri::AppHandle) -> String {
    app_handle.package_info().version.to_string()
}

#[tauri::command]
async fn global_read_changelog(app_handle: tauri::AppHandle) -> Result<String, String> {
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
async fn global_get_log_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    app_handle.path().app_log_dir()
        .map(|p| p.join("Aegis.log").to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn global_read_app_logs(app_handle: tauri::AppHandle) -> Result<String, String> {
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
async fn global_capture_screenshot() -> Result<Vec<u8>, String> {
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
fn global_check_dnd_status() -> bool {
    false
}

#[tauri::command]
async fn global_open_notification_settings() -> Result<(), String> {
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
async fn global_list_notification_sounds(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let mut sounds = Vec::new();
    
    // Tenta localizar via diretório de recursos (produção)
    let mut found_dir = None;

    // Em desenvolvimento (debug), prioriza o diretório real de sounds do projeto na raiz
    #[cfg(debug_assertions)]
    {
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
async fn global_local_register(state: State<'_, AppState>, username: String, email: String, password: String, password_hint: String) -> Result<String, String> {
    state.pm.register_user(&username, &email, &password, &password_hint)
}

#[tauri::command]
async fn global_check_user_availability(state: State<'_, AppState>, username: String, email: String) -> Result<(), String> {
    state.pm.check_availability(&username, &email)
}

#[tauri::command]
async fn global_local_login(state: State<'_, AppState>, email: String, password: String) -> Result<String, String> {
    state.pm.login_user(&email, &password)
}

#[tauri::command]
async fn global_get_local_user(state: State<'_, AppState>, user_id: String) -> Result<serde_json::Value, String> {
    state.pm.get_user_data(&user_id)
}

#[tauri::command]
async fn global_list_local_users(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    state.pm.list_users()
}

#[tauri::command]
async fn global_delete_account(state: State<'_, AppState>, user_id: String, password: String) -> Result<(), String> {
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
async fn global_change_account_password(state: State<'_, AppState>, user_id: String, current_password: String, new_password: String) -> Result<(), String> {
    state.pm.change_account_password(&user_id, &current_password, &new_password)
}

#[tauri::command]
async fn global_change_username(state: State<'_, AppState>, user_id: String, new_username: String) -> Result<(), String> {
    state.pm.change_username(&user_id, &new_username)
}

#[tauri::command]
async fn global_change_vault_password(state: State<'_, AppState>, user_id: String, current_vault_password: String, new_vault_password: String) -> Result<(), String> {
    state.pm.change_vault_password(&user_id, &current_vault_password, Some(&new_vault_password))
}

#[tauri::command]
async fn global_revert_vault_to_master(state: State<'_, AppState>, user_id: String, current_vault_password: String, master_password: String) -> Result<(), String> {
    state.pm.revert_vault_to_master(&user_id, &current_vault_password, &master_password)
}

#[tauri::command]
async fn global_has_separate_vault_password(state: State<'_, AppState>, user_id: String) -> Result<bool, String> {
    Ok(state.pm.has_separate_vault_password(&user_id))
}



#[tauri::command]
async fn global_open_app_data_folder(app: AppHandle) -> Result<(), String> {
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
async fn global_get_app_config(state: State<'_, AppState>) -> Result<AppConfig, String> {
    Ok(state.config.get_config())
}

#[tauri::command]
async fn global_set_app_config(state: State<'_, AppState>, config: AppConfig) -> Result<(), String> {
    state.config.set_config(config)
}

#[tauri::command]
async fn global_apply_internal_command(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    command: String,
    user_id: Option<String>,
) -> Result<String, String> {
    state.config.apply_debug_command(&app_handle, user_id, &command)
}

#[tauri::command]
async fn global_get_simulation_status(state: State<'_, AppState>) -> Result<SimulationStatus, String> {
    let offset = state.config.get_time_offset();
    Ok(SimulationStatus {
        is_active: offset != 0,
        simulated_time: state.config.get_now().to_rfc3339(),
        offset_seconds: offset,
    })
}


#[tauri::command]
async fn global_quit_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}

fn copy_dir_all(src: impl AsRef<std::path::Path>, dst: impl AsRef<std::path::Path>) -> std::io::Result<()> {
    std::fs::create_dir_all(&dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(entry.path(), dst.as_ref().join(entry.file_name()))?;
        } else {
            std::fs::copy(entry.path(), dst.as_ref().join(entry.file_name()))?;
        }
    }
    Ok(())
}

#[tauri::command]
async fn global_set_custom_data_dir(app_handle: tauri::AppHandle, new_path: Option<String>) -> Result<(), String> {
    
    let current_db_path = crate::config::get_database_path(&app_handle);
    let current_notes_dir = crate::config::get_notes_path(&app_handle);
    
    let default_app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    
    let target_dir = match &new_path {
        Some(path_str) => {
            let path_str = path_str.trim();
            if path_str.is_empty() {
                default_app_dir.clone()
            } else {
                std::path::PathBuf::from(path_str)
            }
        }
        None => default_app_dir.clone(),
    };
    
    if target_dir != default_app_dir {
        std::fs::create_dir_all(&target_dir).map_err(|e| format!("Falha ao criar diretório: {}", e))?;
    }
    
    let target_db_path = target_dir.join("profile.db");
    let target_notes_dir = target_dir.join("notes");
    
    // Copy profile.db if it exists in current path and doesn't exist in target
    if current_db_path.exists() && !target_db_path.exists() {
        std::fs::copy(&current_db_path, &target_db_path)
            .map_err(|e| format!("Falha ao copiar banco de dados: {}", e))?;
    }
    
    // Check if target notes directory is empty
    let is_target_notes_empty = if target_notes_dir.exists() {
        if let Ok(mut entries) = std::fs::read_dir(&target_notes_dir) {
            entries.next().is_none()
        } else {
            true
        }
    } else {
        true
    };

    // Copy notes if they exist in current path and target is empty or missing
    if current_notes_dir.exists() && is_target_notes_empty {
        std::fs::create_dir_all(&target_notes_dir).map_err(|e| e.to_string())?;
        copy_dir_all(&current_notes_dir, &target_notes_dir)
            .map_err(|e| format!("Falha ao copiar notas: {}", e))?;
    }
    
    // Save to local configuration db
    let config_manager = crate::config::ConfigManager::new(&app_handle);
    let path_val = match &new_path {
        Some(p) => p.trim().to_string(),
        None => "".to_string(),
    };
    config_manager.update_config("custom_data_dir", serde_json::json!(path_val))?;
    
    // Relaunch app
    app_handle.restart()
}

#[tauri::command]
async fn global_set_custom_icon(app_handle: tauri::AppHandle, source_path: Option<String>) -> Result<(), String> {
    // Obter o diretório de dados do aplicativo
    let app_data_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    
    // Garantir que o diretório exista
    std::fs::create_dir_all(&app_data_dir).map_err(|e| format!("Falha ao criar diretório: {}", e))?;
    
    let custom_icon_path = app_data_dir.join("custom_icon.png");
    let custom_ico_path = app_data_dir.join("custom_icon.ico");
    
    match source_path {
        Some(path_str) => {
            let src = std::path::Path::new(&path_str);
            if !src.exists() {
                return Err("O arquivo de origem selecionado não existe.".to_string());
            }
            
            // Abrir e decodificar a imagem de origem (pode ser PNG, JPEG, JPG, etc.)
            let img = image::open(src).map_err(|e| format!("Falha ao abrir imagem de origem: {}", e))?;
            
            // Salvar a imagem decodificada como PNG no caminho custom_icon_path
            img.save_with_format(&custom_icon_path, image::ImageFormat::Png)
                .map_err(|e| format!("Falha ao salvar imagem do ícone como PNG: {}", e))?;
            
            // Converter para ICO multi-resolução (16, 32, 48, 256px) — necessário para
            // o Windows exibir o ícone corretamente na área de trabalho e barra de tarefas.
            let mut icon_dir = ico::IconDir::new(ico::ResourceType::Icon);
            for &size in &[16u32, 32, 48, 256] {
                let resized = img.resize_exact(size, size, image::imageops::FilterType::Lanczos3);
                let rgba = resized.into_rgba8();
                let (w, h) = rgba.dimensions();
                let icon_img = ico::IconImage::from_rgba_data(w, h, rgba.into_raw());
                if let Ok(entry) = ico::IconDirEntry::encode(&icon_img) {
                    icon_dir.add_entry(entry);
                }
            }
            if let Ok(mut ico_file) = std::fs::File::create(&custom_ico_path) {
                let _ = icon_dir.write(&mut ico_file);
            }
            
            // Carregar e aplicar o ícone na janela em tempo real
            let icon = tauri::image::Image::from_path(&custom_icon_path)
                .map_err(|e| format!("Falha ao ler o ícone PNG: {}", e))?;
            
            if let Some(window) = app_handle.get_webview_window("main") {
                window.set_icon(icon).map_err(|e| format!("Falha ao definir ícone da janela: {}", e))?;
            }
        }
        None => {
            // Remover os arquivos do ícone personalizado para restaurar o padrão
            if custom_icon_path.exists() {
                std::fs::remove_file(&custom_icon_path).map_err(|e| format!("Falha ao remover ícone PNG personalizado: {}", e))?;
            }
            if custom_ico_path.exists() {
                std::fs::remove_file(&custom_ico_path).map_err(|e| format!("Falha ao remover ícone ICO personalizado: {}", e))?;
            }
            
            // Restaurar o ícone original do app na janela
            if let Some(default_icon) = app_handle.default_window_icon() {
                if let Some(window) = app_handle.get_webview_window("main") {
                    window.set_icon(default_icon.clone()).map_err(|e| format!("Falha ao restaurar ícone original: {}", e))?;
                }
            }
        }
    }
    
    Ok(())
}

#[tauri::command]
fn global_has_custom_icon(app_handle: tauri::AppHandle) -> bool {
    // Verificar se o arquivo do ícone personalizado existe na pasta do app
    if let Ok(app_data_dir) = app_handle.path().app_data_dir() {
        app_data_dir.join("custom_icon.png").exists()
    } else {
        false
    }
}

#[tauri::command]
fn global_get_custom_icon_path(app_handle: tauri::AppHandle) -> Option<String> {
    if let Ok(app_data_dir) = app_handle.path().app_data_dir() {
        let path = app_data_dir.join("custom_icon.png");
        if path.exists() {
            return Some(path.to_string_lossy().to_string());
        }
    }
    None
}

fn update_shortcut_icon_helper(app_handle: &tauri::AppHandle) -> Result<(), String> {
    // Atualiza o ícone dos atalhos da Área de Trabalho e Menu Iniciar após reinicialização
    // Só funciona no Windows — usa PowerShell com COM WScript.Shell
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        
        let app_data_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
        let custom_ico_path = app_data_dir.join("custom_icon.ico");
        
        // Determinar o caminho do executável atual
        let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
        let exe_str = exe_path.to_string_lossy();
        
        // Determinar a origem do ícone: personalizado ou padrão (dentro do exe)
        let icon_location = if custom_ico_path.exists() {
            format!("{},0", custom_ico_path.to_string_lossy())
        } else {
            // Restaurar para o ícone embutido no executável (índice 0)
            format!("{},0", exe_str)
        };
        
        // Script PowerShell robusto: GetFolderPath resolve o Desktop corretamente mesmo no OneDrive
        // -ilike para comparação case-insensitive (Aegis.exe vs aegis.exe)
        let script = format!(
            "$sh = New-Object -ComObject WScript.Shell; \
             $paths = @( \
                 [System.Environment]::GetFolderPath('Desktop'), \
                 [System.Environment]::GetFolderPath('CommonDesktopDirectory'), \
                 [System.Environment]::GetFolderPath('Programs'), \
                 [System.Environment]::GetFolderPath('CommonPrograms'), \
                 \"$env:APPDATA\\Microsoft\\Internet Explorer\\Quick Launch\\User Pinned\\TaskBar\" \
             ); \
             foreach ($dir in $paths) {{ \
                 if (Test-Path $dir) {{ \
                     Get-ChildItem -Path $dir -Filter '*.lnk' -Recurse -ErrorAction SilentlyContinue | \
                     ForEach-Object {{ \
                         try {{ \
                             $s = $sh.CreateShortcut($_.FullName); \
                             if ($s.TargetPath -ilike '*aegis*' -or $_.Name -ilike '*aegis*') {{ \
                                 $s.IconLocation = '{icon}'; \
                                 $s.Save() \
                             }} \
                         }} catch {{}} \
                     }} \
                 }} \
             }}; \
             $code = '[System.Runtime.InteropServices.DllImport(\"shell32.dll\")] public static extern void SHChangeNotify(int wEventId, int uFlags, System.IntPtr dwItem1, System.IntPtr dwItem2);'; \
             $type = Add-Type -MemberDefinition $code -Name \"Shell32\" -Namespace \"Win32\" -PassThru -ErrorAction SilentlyContinue; \
             if ($type) {{ $type::SHChangeNotify(0x08000000, 0, [System.IntPtr]::Zero, [System.IntPtr]::Zero) }}",
            icon = icon_location.replace("'", "''")
        );
        
        std::process::Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", &script])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .spawn()
            .map_err(|e| format!("Falha ao executar PowerShell para atualizar atalho: {}", e))?;
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        let _ = app_handle;
    }
    
    Ok(())
}

#[tauri::command]
async fn global_update_shortcut_icon(app_handle: tauri::AppHandle) -> Result<(), String> {
    update_shortcut_icon_helper(&app_handle)
}

#[tauri::command]
async fn global_check_github_update() -> Result<serde_json::Value, String> {
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
async fn global_notif_list(state: State<'_, AppState>, user_id: String) -> Result<Vec<notifications::AppNotification>, String> {
    Ok(state.notif.list(&user_id))
}

#[tauri::command]
async fn global_notif_push(app_handle: tauri::AppHandle, state: State<'_, AppState>, n: notifications::AppNotification) -> Result<(), String> {
    state.notif.add_notification_direct(n)?;
    let _ = app_handle.emit("new-notification", serde_json::json!({ "skipSound": false }));
    Ok(())
}

#[tauri::command]
async fn global_notif_unread_count(state: State<'_, AppState>, user_id: String) -> Result<i64, String> {
    Ok(state.notif.unread_count(&user_id))
}

#[tauri::command]
async fn global_notif_mark_read(app_handle: tauri::AppHandle, state: State<'_, AppState>, id: i64, user_id: String) -> Result<(), String> {
    state.notif.mark_read(id, &user_id)?;
    let _ = app_handle.emit("new-notification", serde_json::json!({ "skipSound": true }));
    Ok(())
}

#[tauri::command]
async fn global_notif_mark_unread(app_handle: tauri::AppHandle, state: State<'_, AppState>, id: i64, user_id: String) -> Result<(), String> {
    state.notif.mark_unread(id, &user_id)?;
    let _ = app_handle.emit("new-notification", serde_json::json!({ "skipSound": true }));
    Ok(())
}

#[tauri::command]
async fn global_notif_delete_by_tag(app_handle: tauri::AppHandle, state: State<'_, AppState>, tag: String, user_id: String) -> Result<(), String> {
    state.notif.delete_by_tag(&tag, &user_id)?;
    let _ = app_handle.emit("new-notification", serde_json::json!({ "skipSound": true }));
    Ok(())
}

#[tauri::command]
async fn global_notif_mark_all_read(app_handle: tauri::AppHandle, state: State<'_, AppState>, user_id: String) -> Result<(), String> {
    state.notif.mark_all_read(&user_id)?;
    let _ = app_handle.emit("new-notification", serde_json::json!({ "skipSound": true }));
    Ok(())
}

#[tauri::command]
async fn global_notif_delete(app_handle: tauri::AppHandle, state: State<'_, AppState>, id: i64, user_id: String) -> Result<Option<String>, String> {
    let tag = state.notif.delete(id, &user_id)?;
    let _ = app_handle.emit("new-notification", serde_json::json!({ "skipSound": true }));
    Ok(tag)
}

#[tauri::command]
async fn global_notif_clear_read(app_handle: tauri::AppHandle, state: State<'_, AppState>, user_id: String) -> Result<Vec<String>, String> {
    let tags = state.notif.clear_read(&user_id)?;
    let _ = app_handle.emit("new-notification", serde_json::json!({ "skipSound": true }));
    Ok(tags)
}

#[tauri::command]
async fn global_ensure_discord_invite(app_handle: tauri::AppHandle, state: State<'_, AppState>, user_id: String) -> Result<(), String> {
    if state.notif.check_and_push_discord_invitation(&user_id)? {
        notify_critical(&app_handle, "Comunidade", "Junte-se ao nosso Discord!");
    }
    Ok(())
}

#[tauri::command]
async fn global_save_avatar(state: State<'_, AppState>, user_id: String, base64_data: String) -> Result<(), String> {
    state.pm.save_avatar(&user_id, &base64_data)
}

#[tauri::command]
async fn global_get_avatar(state: State<'_, AppState>, user_id: String) -> Result<Option<String>, String> {
    Ok(state.pm.get_avatar(&user_id))
}

#[tauri::command]
async fn global_delete_avatar(state: State<'_, AppState>, user_id: String) -> Result<(), String> {
    state.pm.delete_avatar(&user_id)
}







#[tauri::command]
async fn global_pre_update_backup(app_handle: tauri::AppHandle) -> Result<(), String> {
    let data_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let backup_dir = data_dir.join("backups");
    if !backup_dir.exists() { std::fs::create_dir(&backup_dir).map_err(|e| e.to_string())?; }
    let now = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let db_path = crate::config::get_database_path(&app_handle);
    std::fs::copy(db_path, backup_dir.join(format!("backup_{}.db", now))).map_err(|e| e.to_string())?;
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
                    let _ = window.hide();
                    api.prevent_close();
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
                // Carrega o ícone personalizado se existir no startup
                let app_data_dir = app.path().app_data_dir().unwrap_or_default();
                let custom_icon_path = app_data_dir.join("custom_icon.png");
                if custom_icon_path.exists() {
                    if let Ok(icon) = tauri::image::Image::from_path(&custom_icon_path) {
                        let _ = window.set_icon(icon);
                    }
                }

                // Atualizar o ícone do atalho no startup (especialmente após reiniciar o app)
                let _ = update_shortcut_icon_helper(app.handle());

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
            let flashcards = flashcards::FlashcardManager::new(app.handle());

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

            app.manage(AppState { pm, pomo, alarm, habit, note, config, studies, sleep, calendar, stats, reading, tasks, notif, dictionary, movies, flashcards });

            //  Startup Data Summary 
            {
                use std::panic::{catch_unwind, AssertUnwindSafe};

                fn safe_startup_count<F>(label: &str, f: F) -> usize
                where
                    F: FnOnce() -> usize,
                {
                    match catch_unwind(AssertUnwindSafe(f)) {
                        Ok(count) => count,
                        Err(_) => {
                            crate::log_warn!(
                                "Resumo de startup ignorou '{}' porque a leitura falhou; o app continuará abrindo.",
                                label
                            );
                            0
                        }
                    }
                }

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

                let db_path = crate::config::get_database_path(app.handle());
                let notes_path = crate::config::get_notes_path(app.handle());
                crate::log_status!("Aegis iniciado — Resumo de Dados");
                crate::log_status!("  [Debug] Banco de dados: {:?}", db_path);
                crate::log_status!("  [Debug] Notas: {:?}", notes_path);

                if let Ok(users) = pm_report.list_users() {
                    crate::log_status!("Usuários registrados: {}", users.len());
                    for user_val in &users {
                        let uid = user_val.get("id").and_then(|v| v.as_str()).unwrap_or("?");
                        let name = user_val.get("username").and_then(|v| v.as_str()).unwrap_or("?");

                        let pw_count = safe_startup_count("senhas", || {
                            pm_report.list_passwords(uid).map(|v| v.len()).unwrap_or(0)
                        });
                        let note_count = safe_startup_count("notas", || note_report.list_notes(uid).len());
                        let habit_count = safe_startup_count("hábitos", || habit_report.list_habits(uid, now_report).len());
                        let task_count = safe_startup_count("tarefas", || task_report.list_tasks(uid).len());
                        let book_count = safe_startup_count("leitura", || reading_report.list_books(uid).len());
                        let sleep_count = safe_startup_count("sono", || sleep_report.list_entries(uid, 1, now_report).len());
                        let event_count = safe_startup_count("agenda", || calendar_report.list_events(uid).len());
                        let alarm_count = safe_startup_count("alertas", || alarm_report.list_alarms(uid).len());
                        let study_count = safe_startup_count("estudos", || studies_report.list_sessions(uid, 12, now_report).len());
                        let dict_count = safe_startup_count("dicionário", || dict_report.list_words(uid).len());
                        let movies_count = safe_startup_count("filmes/séries", || movies_report.list_movies(uid).len());

                        crate::log_status!("  ┌ Usuário: {} ({})", name, uid);
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
                        crate::log_status!("  └ Eventos (agenda): {}", event_count);
                    }
                } else {
                    crate::log_warn!("Não foi possível listar usuários no startup.");
                }
            }
            // 

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Infra/Globais
            global_test_notification, global_open_notification_settings, global_send_critical_notification, global_verify_master,
            global_local_register, global_check_user_availability, global_local_login, global_get_local_user, global_list_local_users, 
            global_delete_account, global_change_account_password, global_change_username, global_change_vault_password, 
            global_revert_vault_to_master, global_has_separate_vault_password,
            global_get_app_config, global_set_app_config, global_apply_internal_command, global_get_simulation_status, global_quit_app, global_set_custom_data_dir,
            global_set_custom_icon, global_has_custom_icon, global_get_custom_icon_path, global_update_shortcut_icon,
            global_get_app_version, global_read_changelog, global_get_log_path, global_read_app_logs, global_capture_screenshot,
            global_save_avatar, global_get_avatar, global_delete_avatar, global_check_dnd_status, global_check_github_update, 
            global_open_app_data_folder, global_pre_update_backup, 
            global_export_user_package, global_import_user_package, global_export_full_system_bundle, global_import_full_system_bundle,
            global_export_raw_user_json, global_import_raw_user_json,
            global_list_notification_sounds,
            global_notif_push, global_notif_list, global_notif_unread_count, global_notif_mark_read, global_notif_mark_unread, global_notif_mark_all_read, global_notif_delete, global_notif_delete_by_tag, global_notif_clear_read, global_ensure_discord_invite,

            // Passwords
            passwords::password_add_password, passwords::password_list_passwords, passwords::password_decrypt_entry, 
            passwords::password_import_passwords, passwords::password_export_passwords, passwords::password_delete_password, 
            passwords::password_update_password, passwords::password_check_vault, passwords::password_reset_vault, 
            passwords::password_setup_local_vault,

            // Pomodoro
            pomodoro::pomodoro_get_pomodoro_state, pomodoro::pomodoro_save_pomodoro_state, 
            pomodoro::pomodoro_record_pomodoro_session, pomodoro::pomodoro_get_pomodoro_history, 
            pomodoro::pomodoro_clear_pomodoro_history, pomodoro::pomodoro_open_widget,

            // Alarms
            alarms::alarm_list_alarms, alarms::alarm_add_alarm, alarms::alarm_update_alarm, 
            alarms::alarm_delete_alarm, alarms::alarm_toggle_alarm,

            // Habits
            habits::habit_list_habits, habits::habit_add_habit, habits::habit_update_habit, 
            habits::habit_toggle_date,
            habits::habit_mark_habit_done, habits::habit_use_habit_charge, habits::habit_reset_habit, 
            habits::habit_hard_reset_habit, habits::habit_delete_habit, habits::habit_export_habits_csv, 
            habits::habit_import_habits_csv,

            // Notes
            notes::note_list_notes, notes::note_list_note_items, notes::note_add_note, 
            notes::note_update_note, notes::note_create_note_folder, notes::note_delete_note_folder, 
            notes::note_move_note_item, notes::note_delete_note, notes::note_update_note_pinned, 
            notes::note_update_note_color, notes::note_update_folder_color, notes::note_open_notes_folder,

            // Studies
            studies::estudos_add_session, studies::estudos_update_session, studies::estudos_delete_session, 
            studies::estudos_list_sessions, studies::estudos_upsert_goal, studies::estudos_list_goals, 
            studies::estudos_export_csv, studies::estudos_import_csv,

            // Simulados & Notas
            studies::grades_add, studies::grades_update, studies::grades_delete, studies::grades_list,
            studies::subjects_upsert, studies::subjects_delete, studies::subjects_list, studies::subjects_rename,
            studies::subject_groups_upsert, studies::subject_groups_delete, studies::subject_groups_list,
            studies::subject_formulas_upsert, studies::subject_formulas_list,

            // Sleep
            sleep::sono_upsert_entry, sleep::sono_delete_entry, sleep::sono_list_entries, 
            sleep::sono_upsert_goal, sleep::sono_get_goal, sleep::sono_export_csv, sleep::sono_import_csv,

            // Calendar
            calendar::calendar_add_event, calendar::calendar_update_event, calendar::sync_br_holidays, 
            calendar::calendar_delete_event, calendar::calendar_list_events, calendar::calendar_list_upcoming_deadlines,

            // Statistics
            statistics::stats_get_cross_metrics, statistics::stats_get_performance_summary,
            statistics::stats_get_global_realtime_metrics,
            statistics::achievements_get_user_state,
            statistics::achievements_unlock,
            statistics::achievements_complete_challenge,
            statistics::achievements_undo_challenge,
            statistics::achievements_add_xp,
            statistics::achievements_sync_ledger,
            statistics::achievements_reset_xp_and_resync,
            statistics::stats_get_xp_history,
            statistics::stats_export_xp_history_csv,

            // Reading
            reading::reading_list_books, reading::reading_upsert_book, reading::reading_delete_book, 
            reading::reading_upsert_session, reading::reading_list_sessions, reading::reading_delete_session, 
            reading::reading_upsert_goal, reading::reading_list_goals, reading::reading_export_json, 
            reading::reading_import_json, reading::reading_search_books, reading::reading_toggle_favorite,

            // Dictionary
            dictionary::dictionary_search, dictionary::dictionary_list, dictionary::dictionary_add, 
            dictionary::dictionary_delete, dictionary::dictionary_toggle_favorite, dictionary::dictionary_suggestions,
            dictionary::dictionary_export_csv, dictionary::dictionary_import_csv,

            // Movies
            movies::movies_search, movies::movies_list, movies::movies_upsert, movies::movies_delete, 
            movies::movies_toggle_favorite, movies::get_tmdb_api_key, movies::set_tmdb_api_key,
            movies::movies_export_json, movies::movies_import_json,

            // Tasks
            tasks::tasks_list, tasks::tasks_upsert, tasks::tasks_toggle, tasks::tasks_delete, 
            tasks::export_tasks_csv, tasks::import_tasks_csv,

            // Flashcards
            flashcards::flashcards_list_decks, flashcards::flashcards_add_deck, flashcards::flashcards_update_deck, 
            flashcards::flashcards_delete_deck, flashcards::flashcards_list_cards, flashcards::flashcards_add_card, 
            flashcards::flashcards_update_card, flashcards::flashcards_delete_card, flashcards::flashcards_record_review, 
            flashcards::flashcards_export_json, flashcards::flashcards_import_json
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
