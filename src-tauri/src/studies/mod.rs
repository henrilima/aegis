use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StudySession {
    pub id: Option<i64>,
    pub user_id: String,
    pub date: String,             
    pub subject: String,
    pub hours: f64,
    pub questions_new: i32,
    pub questions_review: i32,
    pub correct_new: i32,
    pub correct_review: i32,
    pub note: Option<String>,
    pub created_at: Option<String>,
    // Métricas extras opcionais
    pub pages_read: Option<i32>,
    pub custom_metric_label: Option<String>,
    pub custom_metric_value: Option<f64>,
    pub focus_score: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StudyGoal {
    pub id: Option<i64>,
    pub user_id: String,
    pub goal_type: String,        
    pub target_value: f64,
}

pub struct StudiesManager {
    db_path: PathBuf,
}

impl StudiesManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Falha ao obter diretório de dados");
        let db_path = app_dir.join("passwords.db");

        let conn = Connection::open(&db_path).expect("Falha ao abrir banco");

        let _ = conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS study_sessions (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id      TEXT NOT NULL,
                date         TEXT NOT NULL,
                subject      TEXT NOT NULL,
                hours        REAL NOT NULL DEFAULT 0,
                questions_new     INTEGER NOT NULL DEFAULT 0,
                questions_review  INTEGER NOT NULL DEFAULT 0,
                correct_new       INTEGER NOT NULL DEFAULT 0,
                correct_review    INTEGER NOT NULL DEFAULT 0,
                note         TEXT,
                created_at   TEXT NOT NULL DEFAULT (datetime('now')),
                pages_read        INTEGER,
                custom_metric_label TEXT,
                custom_metric_value REAL,
                focus_score       INTEGER
            );
            CREATE TABLE IF NOT EXISTS study_goals (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id      TEXT NOT NULL,
                goal_type    TEXT NOT NULL,
                target_value REAL NOT NULL DEFAULT 0,
                UNIQUE(user_id, goal_type)
            );"
        );

        // Migração manual de colunas (SQLite não suporta IF NOT EXISTS no ALTER TABLE)
        let _ = conn.execute("ALTER TABLE study_sessions ADD COLUMN pages_read INTEGER", []);
        let _ = conn.execute("ALTER TABLE study_sessions ADD COLUMN custom_metric_label TEXT", []);
        let _ = conn.execute("ALTER TABLE study_sessions ADD COLUMN custom_metric_value REAL", []);
        let _ = conn.execute("ALTER TABLE study_sessions ADD COLUMN focus_score INTEGER", []);

        Self { db_path }
    }

    fn conn(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Falha ao conectar");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Falha ao definir timeout de espera");
        conn
    }

    pub fn add_session(&self, s: StudySession) -> Result<i64, String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO study_sessions
             (user_id, date, subject, hours, questions_new, questions_review, correct_new, correct_review, note, pages_read, custom_metric_label, custom_metric_value, focus_score)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)",
            params![s.user_id, s.date, s.subject, s.hours,
                    s.questions_new, s.questions_review,
                    s.correct_new, s.correct_review, s.note,
                    s.pages_read, s.custom_metric_label, s.custom_metric_value, s.focus_score],
        ).map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    pub fn update_session(&self, s: StudySession) -> Result<(), String> {
        let conn = self.conn();
        let id = s.id.ok_or("id ausente")?;
        conn.execute(
            "UPDATE study_sessions SET date=?2, subject=?3, hours=?4,
             questions_new=?5, questions_review=?6, correct_new=?7, correct_review=?8, note=?9,
             pages_read=?10, custom_metric_label=?11, custom_metric_value=?12, focus_score=?14
             WHERE id=?1 AND user_id=?13",
            params![id, s.date, s.subject, s.hours,
                    s.questions_new, s.questions_review,
                    s.correct_new, s.correct_review, s.note,
                    s.pages_read, s.custom_metric_label, s.custom_metric_value,
                    s.user_id, s.focus_score],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_session(&self, id: i64, user_id: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute("DELETE FROM study_sessions WHERE id=?1 AND user_id=?2", params![id, user_id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_sessions(&self, user_id: &str, months_back: i32, now: DateTime<Utc>) -> Vec<StudySession> {
        let conn = self.conn();
        let now_local = now.with_timezone(&chrono::Local);
        let cutoff_date = (now_local - chrono::Duration::days((months_back * 30) as i64)).format("%Y-%m-%d").to_string();
        let mut stmt = conn.prepare(
            "SELECT id, date, subject, hours, questions_new, questions_review, correct_new, correct_review, note, created_at, pages_read, custom_metric_label, custom_metric_value, focus_score
             FROM study_sessions
             WHERE user_id=?1 AND date >= ?2
             ORDER BY date DESC, id DESC"
        ).unwrap();

        stmt.query_map(params![user_id, cutoff_date], |row| {
            Ok(StudySession {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                date: row.get(1)?,
                subject: row.get(2)?,
                hours: row.get(3)?,
                questions_new: row.get(4)?,
                questions_review: row.get(5)?,
                correct_new: row.get(6)?,
                correct_review: row.get(7)?,
                note: row.get(8)?,
                created_at: row.get(9)?,
                pages_read: row.get(10)?,
                custom_metric_label: row.get(11)?,
                custom_metric_value: row.get(12)?,
                focus_score: row.get(13)?,
            })
        }).unwrap().filter_map(|r| r.ok()).collect()
    }

    pub fn upsert_goal(&self, g: StudyGoal) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO study_goals (user_id, goal_type, target_value)
             VALUES (?1, ?2, ?3)
             ON CONFLICT(user_id, goal_type) DO UPDATE SET target_value = excluded.target_value",
            params![g.user_id, g.goal_type, g.target_value],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_goals(&self, user_id: &str) -> Vec<StudyGoal> {
        let conn = self.conn();
        let mut stmt = conn.prepare(
            "SELECT id, goal_type, target_value FROM study_goals WHERE user_id=?1"
        ).unwrap();
        stmt.query_map(params![user_id], |row| {
            Ok(StudyGoal {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                goal_type: row.get(1)?,
                target_value: row.get(2)?,
            })
        }).unwrap().filter_map(|r| r.ok()).collect()
    }

    pub fn export_csv(&self, user_id: &str, dest_path: &str, now: DateTime<Utc>) -> Result<(), String> {
        let sessions = self.list_sessions(user_id, 120, now); // Exporta um intervalo maior
        let mut out = String::from(
            "data,materia,horas,questoes_ineditas,questoes_refeitas,acertos_ineditas,acertos_refeitas,nota,paginas_lidas,foco,custom_label,custom_value\n"
        );
        for s in sessions {
            out.push_str(&format!(
                "{},{},{:.2},{},{},{},{},{},{},{},{},{}\n",
                s.date,
                s.subject.replace(',', ";"),
                s.hours,
                s.questions_new,
                s.questions_review,
                s.correct_new,
                s.correct_review,
                s.note.unwrap_or_default().replace(',', ";").replace('\n', " "),
                s.pages_read.unwrap_or(0),
                s.focus_score.unwrap_or(0),
                s.custom_metric_label.unwrap_or_default().replace(',', ";"),
                s.custom_metric_value.unwrap_or(0.0)
            ));
        }
        std::fs::write(dest_path, out).map_err(|e| e.to_string())?;
        Ok(())
    }

    #[allow(clippy::cast_precision_loss)]
    pub fn import_csv(&self, user_id: &str, file_path: &str) -> Result<usize, String> {
        let csv = std::fs::read_to_string(file_path).map_err(|e| e.to_string())?;
        let conn = self.conn();
        let mut count = 0usize;
        for (i, line) in csv.lines().enumerate() {
            if i == 0 { continue; } 
            let cols: Vec<&str> = line.split(',').collect();
            if cols.len() < 7 { continue; }
            
            let date = cols[0].trim();
            let subject = cols[1].trim();
            let hours: f64 = cols[2].trim().parse().unwrap_or(0.0);
            let q_new: i32 = cols[3].trim().parse().unwrap_or(0);
            let q_rev: i32 = cols[4].trim().parse().unwrap_or(0);
            let c_new: i32 = cols[5].trim().parse().unwrap_or(0);
            let c_rev: i32 = cols[6].trim().parse().unwrap_or(0);
            let note = cols.get(7).map(|s| s.trim().to_string());
            let pages: i32 = cols.get(8).and_then(|s| s.trim().parse().ok()).unwrap_or(0);
            let focus: i32 = cols.get(9).and_then(|s| s.trim().parse().ok()).unwrap_or(0);
            let c_label = cols.get(10).map(|s| s.trim().to_string());
            let c_value: f64 = cols.get(11).and_then(|s| s.trim().parse().ok()).unwrap_or(0.0);

            // Verifica duplicatas INCLUINDO focus_score, pages_read e métricas customizadas
            let exists: bool = conn.query_row(
                "SELECT EXISTS(SELECT 1 FROM study_sessions WHERE user_id=?1 AND date=?2 AND subject=?3 AND abs(hours - ?4) < 0.001 AND questions_new=?5 AND questions_review=?6 AND correct_new=?7 AND correct_review=?8 AND (note=?9 OR (note IS NULL AND ?9 IS NULL)) AND (focus_score=?10 OR (focus_score IS NULL AND ?10=0)) AND (pages_read=?11 OR (pages_read IS NULL AND ?11=0)) AND (custom_metric_label=?12 OR (custom_metric_label IS NULL AND ?12 IS NULL)) AND (abs(custom_metric_value - ?13) < 0.001 OR (custom_metric_value IS NULL AND ?13=0.0)))",
                params![user_id, date, subject, hours, q_new, q_rev, c_new, c_rev, note, focus, pages, c_label, c_value],
                |row| row.get(0)
            ).unwrap_or(false);

            if exists { continue; }

            let s = StudySession {
                id: None,
                user_id: user_id.to_string(),
                date: date.to_string(),
                subject: subject.to_string(),
                hours,
                questions_new: q_new,
                questions_review: q_rev,
                correct_new: c_new,
                correct_review: c_rev,
                note,
                created_at: None,
                pages_read: Some(pages),
                custom_metric_label: c_label,
                custom_metric_value: Some(c_value),
                focus_score: Some(focus),
            };
            self.add_session(s).ok();
            count += 1;
        }
        Ok(count)
    }
}

#[tauri::command]
pub async fn estudos_add_session(state: tauri::State<'_, crate::AppState>, session: StudySession) -> Result<i64, String> {
    state.studies.add_session(session)
}

#[tauri::command]
pub async fn estudos_update_session(state: tauri::State<'_, crate::AppState>, session: StudySession) -> Result<(), String> {
    state.studies.update_session(session)
}

#[tauri::command]
pub async fn estudos_delete_session(state: tauri::State<'_, crate::AppState>, id: i64, user_id: String) -> Result<(), String> {
    state.studies.delete_session(id, &user_id)
}

#[tauri::command]
pub async fn estudos_list_sessions(state: tauri::State<'_, crate::AppState>, user_id: String, months_back: i32) -> Result<Vec<StudySession>, String> {
    let now = state.config.get_now();
    Ok(state.studies.list_sessions(&user_id, months_back, now))
}

#[tauri::command]
pub async fn estudos_upsert_goal(state: tauri::State<'_, crate::AppState>, goal: StudyGoal) -> Result<(), String> {
    state.studies.upsert_goal(goal)
}

#[tauri::command]
pub async fn estudos_list_goals(state: tauri::State<'_, crate::AppState>, user_id: String) -> Result<Vec<StudyGoal>, String> {
    Ok(state.studies.list_goals(&user_id))
}

#[tauri::command]
pub async fn estudos_export_csv(state: tauri::State<'_, crate::AppState>, user_id: String, dest_path: String) -> Result<(), String> {
    let now = state.config.get_now();
    state.studies.export_csv(&user_id, &dest_path, now)
}

#[tauri::command]
pub async fn estudos_import_csv(state: tauri::State<'_, crate::AppState>, user_id: String, file_path: String) -> Result<usize, String> {
    state.studies.import_csv(&user_id, &file_path)
}
