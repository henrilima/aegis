use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};



#[derive(Debug, Serialize, Deserialize, Clone)]
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
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StudyGoal {
    pub id: Option<i64>,
    pub user_id: String,
    pub goal_type: String,        
    pub target_value: f64,
}



pub struct EstudosManager {
    db_path: PathBuf,
}

impl EstudosManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("app data dir");
        let db_path = app_dir.join("passwords.db");

        let conn = Connection::open(&db_path).expect("open db");

        conn.execute_batch(
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
                created_at   TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS study_goals (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id      TEXT NOT NULL,
                goal_type    TEXT NOT NULL,
                target_value REAL NOT NULL DEFAULT 0,
                UNIQUE(user_id, goal_type)
            );",
        ).ok();

        Self { db_path }
    }

    fn conn(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("open db");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Failed to set busy timeout");
        conn
    }

    

    pub fn add_session(&self, s: StudySession) -> Result<i64, String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO study_sessions
             (user_id, date, subject, hours, questions_new, questions_review, correct_new, correct_review, note)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
            params![s.user_id, s.date, s.subject, s.hours,
                    s.questions_new, s.questions_review,
                    s.correct_new, s.correct_review, s.note],
        ).map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    pub fn update_session(&self, s: StudySession) -> Result<(), String> {
        let conn = self.conn();
        let id = s.id.ok_or("missing id")?;
        conn.execute(
            "UPDATE study_sessions SET date=?2, subject=?3, hours=?4,
             questions_new=?5, questions_review=?6, correct_new=?7, correct_review=?8, note=?9
             WHERE id=?1 AND user_id=?10",
            params![id, s.date, s.subject, s.hours,
                    s.questions_new, s.questions_review,
                    s.correct_new, s.correct_review, s.note, s.user_id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_session(&self, id: i64, user_id: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute("DELETE FROM study_sessions WHERE id=?1 AND user_id=?2", params![id, user_id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_sessions(&self, user_id: &str, months_back: i32) -> Vec<StudySession> {
        let conn = self.conn();
        let cutoff = format!("-{} months", months_back);
        let mut stmt = conn.prepare(
            "SELECT id, date, subject, hours, questions_new, questions_review, correct_new, correct_review, note, created_at
             FROM study_sessions
             WHERE user_id=?1 AND date >= date('now', ?2)
             ORDER BY date DESC, id DESC"
        ).unwrap();

        stmt.query_map(params![user_id, cutoff], |row| {
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

    

    pub fn export_csv(&self, user_id: &str, dest_path: &str) -> Result<(), String> {
        let sessions = self.list_sessions(user_id, 3);
        let mut out = String::from(
            "data,materia,horas,questoes_ineditas,questoes_refeitas,acertos_ineditas,acertos_refeitas,nota\n"
        );
        for s in sessions {
            out.push_str(&format!(
                "{},{},{:.2},{},{},{},{},{}\n",
                s.date,
                s.subject.replace(',', ";"),
                s.hours,
                s.questions_new,
                s.questions_review,
                s.correct_new,
                s.correct_review,
                s.note.unwrap_or_default().replace(',', ";").replace('\n', " ")
            ));
        }
        std::fs::write(dest_path, out).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn import_csv(&self, user_id: &str, file_path: &str) -> Result<usize, String> {
        let csv = std::fs::read_to_string(file_path).map_err(|e| e.to_string())?;
        let mut count = 0usize;
        for (i, line) in csv.lines().enumerate() {
            if i == 0 { continue; } 
            let cols: Vec<&str> = line.splitn(8, ',').collect();
            if cols.len() < 7 { continue; }
            let s = StudySession {
                id: None,
                user_id: user_id.to_string(),
                date: cols[0].trim().to_string(),
                subject: cols[1].trim().to_string(),
                hours: cols[2].trim().parse().unwrap_or(0.0),
                questions_new: cols[3].trim().parse().unwrap_or(0),
                questions_review: cols[4].trim().parse().unwrap_or(0),
                correct_new: cols[5].trim().parse().unwrap_or(0),
                correct_review: cols[6].trim().parse().unwrap_or(0),
                note: cols.get(7).map(|s| s.trim().to_string()),
                created_at: None,
            };
            self.add_session(s).ok();
            count += 1;
        }
        Ok(count)
    }
}
