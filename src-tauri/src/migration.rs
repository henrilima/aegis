use crate::AppState;
use aes_gcm::AeadCore;
use chrono::Local;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortablePassword {
    pub name: String,
    pub url: String,
    pub username: String,
    pub password_raw: String,
    pub note_raw: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserFullBackup {
    pub version: String,
    pub user_id: String,
    pub export_date: String,

    pub passwords: Vec<PortablePassword>,
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

    #[serde(default)]
    pub movies: Vec<crate::movies::Movie>,
    #[serde(default)]
    pub dictionary_words: Vec<crate::dictionary::GlossaryWord>,
    #[serde(default)]
    pub flashcard_decks: Vec<crate::flashcards::FlashcardDeck>,
    #[serde(default)]
    pub flashcards: Vec<crate::flashcards::Flashcard>,
    #[serde(default)]
    pub study_grades: Vec<crate::studies::StudyGrade>,
    #[serde(default)]
    pub study_subjects: Vec<crate::studies::SubjectMeta>,
    #[serde(default)]
    pub study_subject_groups: Vec<crate::studies::SubjectGroup>,
    #[serde(default)]
    pub study_subject_formulas: Vec<crate::studies::SubjectFormula>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemFullBundle {
    pub version: String,
    pub export_date: String,
    pub passwords_db: Vec<u8>,
    pub config_db: Vec<u8>,
    pub notes_files: HashMap<String, String>, // path -> content
    pub dashboard_config: Option<String>,
}

#[tauri::command]
pub async fn global_export_user_package(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    user_id: String,
    master_pwd: String,
    path: String,
    key_bytes: Vec<u8>,
) -> Result<(), String> {
    let raw_passwords = state.pm.list_passwords(&user_id)?;
    let mut portable_passwords = Vec::new();

    for p in raw_passwords {
        let decrypted =
            state
                .pm
                .decrypt_entry(user_id.as_str(), master_pwd.as_str(), p.id.unwrap_or(0))?;
        portable_passwords.push(PortablePassword {
            name: decrypted.name,
            url: decrypted.url,
            username: decrypted.username,
            password_raw: decrypted.password,
            note_raw: decrypted.note,
            created_at: p.created_at,
            updated_at: p.updated_at,
        });
    }

    let backup = UserFullBackup {
        version: "2.1.0".to_string(), // Bumped version for full coverage (movies, dictionary, flashcards)
        user_id: user_id.clone(),
        export_date: Local::now().to_rfc3339(),

        passwords: portable_passwords,
        habits: state.habit.list_habits(&user_id, chrono::Utc::now()),
        tasks: state.tasks.list_tasks(&user_id),
        notes: state.note.list_notes(&user_id),
        pomodoro_history: state.pomo.get_history(&user_id),
        alarms: state.alarm.list_alarms(&user_id),
        sleep_entries: state.sleep.list_entries(&user_id, 120, chrono::Utc::now()),
        sleep_goals: vec![state.sleep.get_goal(&user_id, &app_handle)],
        study_sessions: state
            .studies
            .list_sessions(&user_id, 120, chrono::Utc::now()),
        study_goals: state.studies.list_goals(&user_id),
        reading_books: state.reading.list_books(&user_id),
        reading_sessions: state
            .reading
            .list_sessions(&user_id, 120, chrono::Utc::now()),
        reading_goals: state.reading.list_goals(&user_id),
        calendar_events: state
            .calendar
            .list_events(&user_id)
            .into_iter()
            .filter(|e| !e.is_holiday.unwrap_or(false))
            .collect(),
        notifications: state.notif.list(&user_id),
        movies: state.movies.list_movies(&user_id),
        dictionary_words: state.dictionary.list_words(&user_id),
        flashcard_decks: state.flashcards.list_decks(&user_id),
        flashcards: {
            let mut cards = Vec::new();
            let decks = state.flashcards.list_decks(&user_id);
            for d in decks {
                if let Some(deck_id) = d.id {
                    let deck_cards = state.flashcards.list_cards(deck_id);
                    cards.extend(deck_cards);
                }
            }
            cards
        },
        study_grades: state.studies.list_grades(&user_id),
        study_subjects: state.studies.list_subjects(&user_id),
        study_subject_groups: state.studies.list_subject_groups(&user_id),
        study_subject_formulas: state.studies.list_subject_formulas(&user_id),
    };

    let json = serde_json::to_vec(&backup).map_err(|e| e.to_string())?;
    encrypt_and_save(json, path.clone(), key_bytes).await?;

    // Adiciona uma notificação in-app sobre a conclusão do backup
    let filename = std::path::Path::new(&path)
        .file_name()
        .and_then(|f| f.to_str())
        .unwrap_or("backup.aegisuser")
        .to_string();
    let body_msg = format!(
        "Seu pacote criptografado do perfil foi exportado com sucesso em: {}",
        filename
    );
    let _ = state.notif.push(
        &user_id,
        "Pacote de Perfil Exportado",
        &body_msg,
        "system",
        None,
        Some("blue"),
        Some("Shield"),
    );
    let _ = app_handle.emit("new-notification", ());
    Ok(())
}

/// Cria um backup JSON formatado de todos os dados do usuário, omitindo a lista
/// de senhas decodificadas para garantir a máxima privacidade e segurança do cofre.
#[tauri::command]
pub async fn global_export_raw_user_json(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    user_id: String,
    path: String,
) -> Result<(), String> {
    // Monta o objeto completo de backup omitindo as senhas descriptografadas por segurança
    let backup = UserFullBackup {
        version: "2.1.0-raw".to_string(),
        user_id: user_id.clone(),
        export_date: Local::now().to_rfc3339(),

        passwords: Vec::new(), // Senhas decifradas são estritamente omitidas no backup automático raw
        habits: state.habit.list_habits(&user_id, chrono::Utc::now()),
        tasks: state.tasks.list_tasks(&user_id),
        notes: state.note.list_notes(&user_id),
        pomodoro_history: state.pomo.get_history(&user_id),
        alarms: state.alarm.list_alarms(&user_id),
        sleep_entries: state.sleep.list_entries(&user_id, 120, chrono::Utc::now()),
        sleep_goals: vec![state.sleep.get_goal(&user_id, &app_handle)],
        study_sessions: state
            .studies
            .list_sessions(&user_id, 120, chrono::Utc::now()),
        study_goals: state.studies.list_goals(&user_id),
        reading_books: state.reading.list_books(&user_id),
        reading_sessions: state
            .reading
            .list_sessions(&user_id, 120, chrono::Utc::now()),
        reading_goals: state.reading.list_goals(&user_id),
        calendar_events: state
            .calendar
            .list_events(&user_id)
            .into_iter()
            .filter(|e| !e.is_holiday.unwrap_or(false))
            .collect(),
        notifications: state.notif.list(&user_id),
        movies: state.movies.list_movies(&user_id),
        dictionary_words: state.dictionary.list_words(&user_id),
        flashcard_decks: state.flashcards.list_decks(&user_id),
        flashcards: {
            let mut cards = Vec::new();
            let decks = state.flashcards.list_decks(&user_id);
            for d in decks {
                if let Some(deck_id) = d.id {
                    let deck_cards = state.flashcards.list_cards(deck_id);
                    cards.extend(deck_cards);
                }
            }
            cards
        },
        study_grades: state.studies.list_grades(&user_id),
        study_subjects: state.studies.list_subjects(&user_id),
        study_subject_groups: state.studies.list_subject_groups(&user_id),
        study_subject_formulas: state.studies.list_subject_formulas(&user_id),
    };

    // Serializa e gera o JSON formatado e legível
    let json_string = serde_json::to_string_pretty(&backup)
        .map_err(|e| format!("Falha ao gerar o JSON do backup: {}", e))?;

    // Grava de forma segura no caminho do sistema de arquivos solicitado pelo usuário
    std::fs::write(&path, json_string)
        .map_err(|e| format!("Falha ao salvar o arquivo físico de backup: {}", e))?;

    // Rotação de backups automáticos: mantém apenas as 2 cópias mais recentes do usuário
    if let Some(filename) = std::path::Path::new(&path).file_name().and_then(|n| n.to_str()) {
        if filename.starts_with("aegis_auto_backup_") && filename.len() > 16 {
            if let Some(parent) = std::path::Path::new(&path).parent() {
                let prefix = &filename[..filename.len() - 15];
                rotate_auto_backups(parent, prefix, 2);
            }
        }
    }

    // Adiciona uma notificação in-app sobre a conclusão do backup
    let filename = std::path::Path::new(&path)
        .file_name()
        .and_then(|f| f.to_str())
        .unwrap_or("backup.json")
        .to_string();
    let body_msg = format!(
        "Seu backup de progresso do perfil foi salvo com sucesso em: {}",
        filename
    );
    let _ = state.notif.push(
        &user_id,
        "Backup do Perfil Concluído",
        &body_msg,
        "system",
        None,
        Some("green"),
        Some("Database"),
    );
    let _ = app_handle.emit("new-notification", ());

    Ok(())
}

/// Restaura os dados de perfil (hábitos, tarefas, notas, etc.) a partir de um backup
/// raw JSON (backup automático). Não importa senhas, pois o arquivo JSON bruto
/// não contém senhas por motivos de segurança e privacidade.
#[tauri::command]
pub async fn global_import_raw_user_json(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    target_user_id: String,
    path: String,
) -> Result<(), String> {
    let content = std::fs::read_to_string(path)
        .map_err(|e| format!("Falha ao ler o arquivo de backup: {}", e))?;
    let backup: UserFullBackup = serde_json::from_str(&content)
        .map_err(|e| format!("Formato de backup inválido ou corrompido: {}", e))?;

    // Carrega hábitos existentes para desduplicação
    let existing_habits = state.habit.list_habits(&target_user_id, chrono::Utc::now());

    // Mesclando os dados no perfil atual do usuário
    for mut h in backup.habits {
        h.user_id = target_user_id.clone();
        h.id = None;
        let exists = existing_habits
            .iter()
            .any(|eh| eh.name.to_lowercase() == h.name.to_lowercase());
        if !exists {
            let _ = state.habit.add_habit(h);
        }
    }
    for mut t in backup.tasks {
        t.user_id = target_user_id.clone();
        t.id = None;
        let _ = state.tasks.upsert_task(t);
    }

    // Carrega notas existentes para desduplicação
    let existing_notes = state.note.list_notes(&target_user_id);

    for mut n in backup.notes {
        n.user_id = target_user_id.clone();
        n.id = None;
        let exists = existing_notes.iter().any(|en| {
            en.title.to_lowercase() == n.title.to_lowercase()
                && en.content.trim() == n.content.trim()
        });
        if !exists {
            let _ = state.note.add_note(n);
        }
    }
    for mut ph in backup.pomodoro_history {
        ph.user_id = target_user_id.clone();
        ph.id = None;
        let _ = state.pomo.record_session(ph);
    }
    for mut alarm in backup.alarms {
        alarm.user_id = target_user_id.clone();
        alarm.id = None;
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

    for mut m in backup.movies {
        m.id = None;
        m.user_id = target_user_id.clone();
        let _ = state.movies.upsert_movie(m);
    }

    for mut w in backup.dictionary_words {
        w.id = None;
        w.user_id = target_user_id.clone();
        let _ = state.dictionary.add_word(w);
    }

    // Carrega decks existentes para desduplicação
    let existing_decks = state.flashcards.list_decks(&target_user_id);

    let mut deck_id_map = HashMap::new();
    for mut deck in backup.flashcard_decks {
        let old_id = deck.id;
        deck.user_id = target_user_id.clone();
        deck.id = None;

        let existing_deck = existing_decks
            .iter()
            .find(|ed| ed.name.to_lowercase() == deck.name.to_lowercase());
        if let Some(ed) = existing_deck {
            if let Some(oid) = old_id {
                if let Some(ed_id) = ed.id {
                    deck_id_map.insert(oid, ed_id);
                }
            }
        } else {
            if let Ok(new_id) = state.flashcards.add_deck(deck) {
                if let Some(oid) = old_id {
                    deck_id_map.insert(oid, new_id);
                }
            }
        }
    }

    for mut card in backup.flashcards {
        let old_deck_id = card.deck_id;
        card.id = None;
        if let Some(new_deck_id) = deck_id_map.get(&old_deck_id) {
            card.deck_id = *new_deck_id;
            let _ = state.flashcards.add_card(card);
        }
    }

    for mut grade in backup.study_grades {
        grade.user_id = target_user_id.clone();
        grade.id = None;
        let _ = state.studies.add_grade(grade);
    }
    for mut subj in backup.study_subjects {
        subj.user_id = target_user_id.clone();
        subj.id = None;
        let _ = state.studies.upsert_subject(subj);
    }
    for mut group in backup.study_subject_groups {
        group.user_id = target_user_id.clone();
        group.id = None;
        let _ = state.studies.upsert_subject_group(group);
    }
    for mut formula in backup.study_subject_formulas {
        formula.user_id = target_user_id.clone();
        formula.id = None;
        let _ = state.studies.upsert_subject_formula(formula);
    }

    Ok(())
}

#[tauri::command]
pub async fn global_import_user_package(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    target_user_id: String,
    master_pwd: String,
    path: String,
    key_bytes: Vec<u8>,
) -> Result<(), String> {
    let decrypted = decrypt_file(path, key_bytes).await?;
    let backup: UserFullBackup = serde_json::from_slice(&decrypted)
        .map_err(|e| format!("Erro ao processar dados: {}", e))?;

    // Desduplicação de Passwords
    let mut existing_decrypted = Vec::new();
    if let Ok(raw_list) = state.pm.list_passwords(&target_user_id) {
        for p in raw_list {
            if let Ok(dec) = state
                .pm
                .decrypt_entry(&target_user_id, &master_pwd, p.id.unwrap_or(0))
            {
                existing_decrypted.push(dec);
            }
        }
    }

    // Merging passwords...
    for p in backup.passwords {
        let exists = existing_decrypted.iter().any(|ep| {
            ep.name.to_lowercase() == p.name.to_lowercase()
                && ep.username.to_lowercase() == p.username.to_lowercase()
                && ep.url.to_lowercase() == p.url.to_lowercase()
        });
        if !exists {
            let _ = state.pm.add_password(
                &target_user_id,
                &master_pwd,
                &p.name,
                &p.url,
                &p.username,
                &p.password_raw,
                &p.note_raw,
            );
        }
    }

    // Carrega hábitos existentes para desduplicação
    let existing_habits = state.habit.list_habits(&target_user_id, chrono::Utc::now());

    for mut h in backup.habits {
        h.user_id = target_user_id.clone();
        h.id = None;
        let exists = existing_habits
            .iter()
            .any(|eh| eh.name.to_lowercase() == h.name.to_lowercase());
        if !exists {
            let _ = state.habit.add_habit(h);
        }
    }
    for mut t in backup.tasks {
        t.user_id = target_user_id.clone();
        t.id = None;
        let _ = state.tasks.upsert_task(t);
    }

    // Carrega notas existentes para desduplicação
    let existing_notes = state.note.list_notes(&target_user_id);

    for mut n in backup.notes {
        n.user_id = target_user_id.clone();
        n.id = None;
        let exists = existing_notes.iter().any(|en| {
            en.title.to_lowercase() == n.title.to_lowercase()
                && en.content.trim() == n.content.trim()
        });
        if !exists {
            let _ = state.note.add_note(n);
        }
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

    for mut m in backup.movies {
        m.id = None;
        m.user_id = target_user_id.clone();
        let _ = state.movies.upsert_movie(m);
    }

    for mut w in backup.dictionary_words {
        w.id = None;
        w.user_id = target_user_id.clone();
        let _ = state.dictionary.add_word(w);
    }

    // Carrega decks existentes para desduplicação
    let existing_decks = state.flashcards.list_decks(&target_user_id);

    let mut deck_id_map = HashMap::new();
    for mut deck in backup.flashcard_decks {
        let old_id = deck.id;
        deck.user_id = target_user_id.clone();
        deck.id = None;

        let existing_deck = existing_decks
            .iter()
            .find(|ed| ed.name.to_lowercase() == deck.name.to_lowercase());
        if let Some(ed) = existing_deck {
            if let Some(oid) = old_id {
                if let Some(ed_id) = ed.id {
                    deck_id_map.insert(oid, ed_id);
                }
            }
        } else {
            if let Ok(new_id) = state.flashcards.add_deck(deck) {
                if let Some(oid) = old_id {
                    deck_id_map.insert(oid, new_id);
                }
            }
        }
    }

    for mut card in backup.flashcards {
        let old_deck_id = card.deck_id;
        card.id = None;
        if let Some(new_deck_id) = deck_id_map.get(&old_deck_id) {
            card.deck_id = *new_deck_id;
            let _ = state.flashcards.add_card(card);
        }
    }

    for mut grade in backup.study_grades {
        grade.user_id = target_user_id.clone();
        grade.id = None;
        let _ = state.studies.add_grade(grade);
    }
    for mut subj in backup.study_subjects {
        subj.user_id = target_user_id.clone();
        subj.id = None;
        let _ = state.studies.upsert_subject(subj);
    }
    for mut group in backup.study_subject_groups {
        group.user_id = target_user_id.clone();
        group.id = None;
        let _ = state.studies.upsert_subject_group(group);
    }
    for mut formula in backup.study_subject_formulas {
        formula.user_id = target_user_id.clone();
        formula.id = None;
        let _ = state.studies.upsert_subject_formula(formula);
    }

    Ok(())
}

#[tauri::command]
pub async fn global_export_full_system_bundle(
    app_handle: AppHandle,
    path: String,
    key_bytes: Vec<u8>,
) -> Result<(), String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    // 1. Bancos de dados
    let passwords_db = std::fs::read(crate::config::get_database_path(&app_handle)).unwrap_or_default();
    let config_db = std::fs::read(app_dir.join("config.db")).unwrap_or_default();

    // 2. Config do dashboard
    let dash_config = std::fs::read_to_string(app_dir.join("aegis-dashboard.json")).ok();

    // 3. Notas (arquivos md)
    // Precisamos encontrar onde as notas estão. Como o NoteManager é inicializado no lib.rs,
    // ele usa o diretório do executável/notes.
    // Vamos tentar localizar.
    let mut notes_files = HashMap::new();
    let notes_dir = crate::config::get_notes_path(&app_handle);

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
pub async fn global_import_full_system_bundle(
    app_handle: AppHandle,
    path: String,
    key_bytes: Vec<u8>,
) -> Result<(), String> {
    let decrypted = decrypt_file(path, key_bytes).await?;
    let bundle: SystemFullBundle = serde_json::from_slice(&decrypted)
        .map_err(|e| format!("Erro ao processar bundle: {}", e))?;

    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    // Backup preventivo
    let db_path = crate::config::get_database_path(&app_handle);
    let _ = std::fs::copy(
        &db_path,
        db_path.with_file_name("profile_backup_pre_bundle.db"),
    );

    // 1. Restaurar bancos
    if !bundle.passwords_db.is_empty() {
        std::fs::write(&db_path, &bundle.passwords_db)
            .map_err(|e| e.to_string())?;
    }
    if !bundle.config_db.is_empty() {
        std::fs::write(app_dir.join("config.db"), &bundle.config_db).map_err(|e| e.to_string())?;
    }

    // 2. Dashboard config
    if let Some(dash) = bundle.dashboard_config {
        std::fs::write(app_dir.join("aegis-dashboard.json"), dash).map_err(|e| e.to_string())?;
    }

    // 3. Notas
    let notes_dir = crate::config::get_notes_path(&app_handle);

    for (rel_path, content) in bundle.notes_files {
        let normalized_path = rel_path.replace('\\', "/");
        let full_path = notes_dir.join(normalized_path);
        if let Some(parent) = full_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let _ = std::fs::write(full_path, content);
    }

    Ok(())
}

// Helpers
async fn encrypt_and_save(data: Vec<u8>, path: String, key_bytes: Vec<u8>) -> Result<(), String> {
    use aes_gcm::{
        aead::{Aead, KeyInit, OsRng},
        Aes256Gcm, Key,
    };
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

    let encrypted = cipher
        .encrypt(&nonce, data.as_ref())
        .map_err(|_| "Falha na criptografia".to_string())?;

    let mut final_data = nonce.to_vec();
    final_data.extend_from_slice(&encrypted);

    std::fs::write(path, final_data).map_err(|e| e.to_string())?;
    Ok(())
}

async fn decrypt_file(path: String, key_bytes: Vec<u8>) -> Result<Vec<u8>, String> {
    let data = std::fs::read(path).map_err(|e| e.to_string())?;
    if data.len() < 12 {
        return Err("Arquivo de backup inválido".to_string());
    }

    let (nonce_bytes, encrypted) = data.split_at(12);

    use aes_gcm::{
        aead::{Aead, KeyInit},
        Aes256Gcm, Key, Nonce,
    };
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce_bytes);

    cipher
        .decrypt(nonce, encrypted)
        .map_err(|_| "Senha incorreta ou arquivo corrompido".to_string())
}

fn collect_notes_recursive(
    base_dir: &std::path::Path,
    current_dir: &std::path::Path,
    files: &mut HashMap<String, String>,
) {
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

fn rotate_auto_backups(dir: &std::path::Path, prefix: &str, limit: usize) {
    if let Ok(entries) = std::fs::read_dir(dir) {
        let mut backup_files = Vec::new();
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
                    if filename.starts_with(prefix) && filename.ends_with(".json") {
                        backup_files.push(path);
                    }
                }
            }
        }

        // Ordenação alfabética natural (uma vez que os nomes contêm data YYYY-MM-DD no final,
        // a ordenação alfabética colocará os arquivos mais antigos primeiro).
        backup_files.sort();

        if backup_files.len() > limit {
            let to_remove = backup_files.len() - limit;
            for file_path in backup_files.iter().take(to_remove) {
                let _ = std::fs::remove_file(file_path);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_rotate_auto_backups() {
        let temp_dir = std::env::temp_dir().join("aegis_test_backup_rotation");
        let _ = fs::create_dir_all(&temp_dir);

        // Limpa arquivos anteriores se existirem
        if let Ok(entries) = fs::read_dir(&temp_dir) {
            for entry in entries.flatten() {
                let _ = fs::remove_file(entry.path());
            }
        }

        // Criar arquivos de backup simulados (do mais antigo para o mais novo)
        let files = vec![
            "aegis_auto_backup_user1_2026-06-10.json",
            "aegis_auto_backup_user1_2026-06-11.json",
            "aegis_auto_backup_user1_2026-06-12.json",
            "aegis_auto_backup_user1_2026-06-13.json",
            // Um arquivo de outro usuário que não deve ser apagado
            "aegis_auto_backup_user2_2026-06-10.json",
            // Um arquivo que não é backup automático e não deve ser apagado
            "aegis_manual_backup_user1_2026-06-10.json",
        ];

        for filename in &files {
            let file_path = temp_dir.join(filename);
            let _ = fs::write(&file_path, "{}");
        }

        // Executar a rotação mantendo o limite de 2 para o user1
        rotate_auto_backups(&temp_dir, "aegis_auto_backup_user1_", 2);

        // Verificar quais arquivos sobraram na pasta
        let mut remaining = Vec::new();
        if let Ok(entries) = fs::read_dir(&temp_dir) {
            for entry in entries.flatten() {
                if let Some(name) = entry.file_name().to_str() {
                    remaining.push(name.to_string());
                }
            }
        }
        remaining.sort();

        // Esperamos que restem apenas os dois mais recentes do user1: 2026-06-12.json e 2026-06-13.json
        // e os outros arquivos intactos (do user2 e o manual)
        assert!(remaining.contains(&"aegis_auto_backup_user1_2026-06-12.json".to_string()));
        assert!(remaining.contains(&"aegis_auto_backup_user1_2026-06-13.json".to_string()));
        assert!(remaining.contains(&"aegis_auto_backup_user2_2026-06-10.json".to_string()));
        assert!(remaining.contains(&"aegis_manual_backup_user1_2026-06-10.json".to_string()));

        // Os antigos do user1 devem ter sido apagados
        assert!(!remaining.contains(&"aegis_auto_backup_user1_2026-06-10.json".to_string()));
        assert!(!remaining.contains(&"aegis_auto_backup_user1_2026-06-11.json".to_string()));

        // Limpa a pasta temporária
        let _ = fs::remove_dir_all(&temp_dir);
    }
}


