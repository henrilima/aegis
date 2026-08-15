use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::AppHandle;

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
    #[serde(default)]
    pub topic: Option<String>,
    #[serde(default)]
    pub tags: Option<String>,
    #[serde(default)]
    pub is_pomodoro: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StudyGoal {
    pub id: Option<i64>,
    pub user_id: String,
    pub goal_type: String,
    pub target_value: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StudyGrade {
    pub id: Option<i64>,
    pub user_id: String,
    pub subject: String,
    pub grade_type: String,
    pub title: Option<String>,
    pub grade: f64,
    pub max_grade: f64,
    pub weight: f64,
    pub questions_total: i32,
    pub questions_correct: i32,
    pub date: String,
    pub note: Option<String>,
    pub created_at: Option<String>,
    #[serde(default)]
    pub half_grade: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SubjectMeta {
    pub id: Option<i64>,
    pub user_id: String,
    pub name: String,
    pub color: String,
    #[serde(default)]
    pub weekly_target_hours: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SubjectGroup {
    pub id: Option<i64>,
    pub user_id: String,
    pub name: String,
    pub subjects: Vec<String>,
    #[serde(default)]
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SubjectFormula {
    pub id: Option<i64>,
    pub user_id: String,
    pub subject: String,
    pub formula_type: String,
    pub passing_grade: f64,
    pub custom_formula: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StudySchedule {
    pub id: Option<i64>,
    pub user_id: String,
    pub subject: String,
    pub day_of_week: i32,
    pub start_time: String,
    pub end_time: String,
    pub break_start_time: Option<String>,
    pub break_end_time: Option<String>,
    pub location: Option<String>,
    pub teacher: Option<String>,
    pub created_at: Option<String>,
}

pub struct StudiesManager {
    db_path: PathBuf,
}

impl StudiesManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let db_path = crate::config::get_database_path(app_handle);

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
                focus_score       INTEGER,
                topic             TEXT,
                tags              TEXT,
                is_pomodoro       INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS study_goals (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id      TEXT NOT NULL,
                goal_type    TEXT NOT NULL,
                target_value REAL NOT NULL DEFAULT 0,
                UNIQUE(user_id, goal_type)
            );
            CREATE TABLE IF NOT EXISTS study_grades (
                id                INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id           TEXT NOT NULL,
                subject           TEXT NOT NULL,
                grade_type        TEXT NOT NULL DEFAULT 'prova',
                title             TEXT,
                grade             REAL NOT NULL,
                max_grade         REAL NOT NULL DEFAULT 10,
                weight            REAL NOT NULL DEFAULT 1,
                questions_total   INTEGER DEFAULT 0,
                questions_correct INTEGER DEFAULT 0,
                date              TEXT NOT NULL,
                note              TEXT,
                created_at        TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS study_subjects (
                id                INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id           TEXT NOT NULL,
                name              TEXT NOT NULL,
                color             TEXT NOT NULL DEFAULT 'blue',
                weekly_target_hours REAL,
                UNIQUE(user_id, name)
            );
            CREATE TABLE IF NOT EXISTS study_subject_groups (
                id                INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id           TEXT NOT NULL,
                name              TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS study_subject_group_members (
                group_id          INTEGER NOT NULL,
                user_id           TEXT NOT NULL,
                subject           TEXT NOT NULL,
                UNIQUE(group_id, subject)
            );
            CREATE TABLE IF NOT EXISTS study_subject_formulas (
                id                INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id           TEXT NOT NULL,
                subject           TEXT NOT NULL,
                formula_type      TEXT NOT NULL,
                passing_grade     REAL NOT NULL DEFAULT 7.0,
                custom_formula    TEXT,
                UNIQUE(user_id, subject)
            );
            CREATE TABLE IF NOT EXISTS study_schedules (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id      TEXT NOT NULL,
                subject      TEXT NOT NULL,
                day_of_week  INTEGER NOT NULL,
                start_time   TEXT NOT NULL,
                end_time     TEXT NOT NULL,
                break_start_time TEXT,
                break_end_time   TEXT,
                location     TEXT,
                teacher      TEXT,
                created_at   TEXT NOT NULL DEFAULT (datetime('now'))
            );",
        );

        let _ = conn.execute(
            "ALTER TABLE study_sessions ADD COLUMN pages_read INTEGER",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE study_sessions ADD COLUMN custom_metric_label TEXT",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE study_sessions ADD COLUMN custom_metric_value REAL",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE study_sessions ADD COLUMN focus_score INTEGER",
            [],
        );
        let _ = conn.execute("ALTER TABLE study_sessions ADD COLUMN topic TEXT", []);
        let _ = conn.execute("ALTER TABLE study_sessions ADD COLUMN tags TEXT", []);
        let _ = conn.execute(
            "ALTER TABLE study_sessions ADD COLUMN is_pomodoro INTEGER DEFAULT 0",
            [],
        );

        // Migração manual: renomeia tipo de fórmula 'custom' para 'personalizada'
        let _ = conn.execute("UPDATE study_subject_formulas SET formula_type = 'personalizada' WHERE formula_type = 'custom'", []);

        let _ = conn.execute("ALTER TABLE study_subject_groups ADD COLUMN color TEXT", []);
        let _ = conn.execute(
            "ALTER TABLE study_grades ADD COLUMN half_grade INTEGER DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE study_subjects ADD COLUMN weekly_target_hours REAL",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE study_schedules ADD COLUMN break_start_time TEXT",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE study_schedules ADD COLUMN break_end_time TEXT",
            [],
        );

        Self { db_path }
    }

    fn conn(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Falha ao conectar");
        conn.busy_timeout(std::time::Duration::from_millis(5000))
            .expect("Falha ao definir timeout de espera");
        conn
    }

    pub fn add_session(&self, s: StudySession) -> Result<i64, String> {
        let conn = self.conn();
        let is_pomo = s.is_pomodoro.unwrap_or(false) as i32;
        conn.execute(
            "INSERT INTO study_sessions
             (user_id, date, subject, hours, questions_new, questions_review, correct_new, correct_review, note, pages_read, custom_metric_label, custom_metric_value, focus_score, topic, tags, is_pomodoro)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16)",
            params![s.user_id, s.date, s.subject, s.hours,
                    s.questions_new, s.questions_review,
                    s.correct_new, s.correct_review, s.note,
                    s.pages_read, s.custom_metric_label, s.custom_metric_value, s.focus_score, s.topic, s.tags, is_pomo],
        ).map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    pub fn update_session(&self, s: StudySession) -> Result<(), String> {
        let conn = self.conn();
        let id = s.id.ok_or("id ausente")?;
        let is_pomo = s.is_pomodoro.unwrap_or(false) as i32;
        conn.execute(
            "UPDATE study_sessions SET date=?2, subject=?3, hours=?4,
             questions_new=?5, questions_review=?6, correct_new=?7, correct_review=?8, note=?9,
             pages_read=?10, custom_metric_label=?11, custom_metric_value=?12, focus_score=?14, topic=?15, tags=?16, is_pomodoro=?17
             WHERE id=?1 AND user_id=?13",
            params![
                id,
                s.date,
                s.subject,
                s.hours,
                s.questions_new,
                s.questions_review,
                s.correct_new,
                s.correct_review,
                s.note,
                s.pages_read,
                s.custom_metric_label,
                s.custom_metric_value,
                s.user_id,
                s.focus_score,
                s.topic,
                s.tags,
                is_pomo
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_session(&self, id: i64, user_id: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "DELETE FROM study_sessions WHERE id=?1 AND user_id=?2",
            params![id, user_id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_sessions(
        &self,
        user_id: &str,
        months_back: i32,
        now: DateTime<Utc>,
    ) -> Vec<StudySession> {
        let conn = self.conn();
        let now_local = now.with_timezone(&chrono::Local);
        let cutoff_date = (now_local - chrono::Duration::days((months_back * 30) as i64))
            .format("%Y-%m-%d")
            .to_string();
        let mut stmt = conn.prepare(
            "SELECT id, date, subject, hours, questions_new, questions_review, correct_new, correct_review, note, created_at, pages_read, custom_metric_label, custom_metric_value, focus_score, topic, tags, is_pomodoro
             FROM study_sessions
             WHERE user_id=?1 AND date >= ?2
             ORDER BY date DESC, id DESC"
        ).unwrap();

        stmt.query_map(params![user_id, cutoff_date], |row| {
            let is_pomo_num: Option<i32> = row.get(16)?;
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
                topic: row.get(14)?,
                tags: row.get(15)?,
                is_pomodoro: is_pomo_num.map(|v| v != 0),
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect()
    }

    pub fn upsert_goal(&self, g: StudyGoal) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO study_goals (user_id, goal_type, target_value)
             VALUES (?1, ?2, ?3)
             ON CONFLICT(user_id, goal_type) DO UPDATE SET target_value = excluded.target_value",
            params![g.user_id, g.goal_type, g.target_value],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_goals(&self, user_id: &str) -> Vec<StudyGoal> {
        let conn = self.conn();
        let mut stmt = conn
            .prepare("SELECT id, goal_type, target_value FROM study_goals WHERE user_id=?1")
            .unwrap();
        stmt.query_map(params![user_id], |row| {
            Ok(StudyGoal {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                goal_type: row.get(1)?,
                target_value: row.get(2)?,
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect()
    }

    pub fn export_csv(
        &self,
        user_id: &str,
        dest_path: &str,
        now: DateTime<Utc>,
    ) -> Result<(), String> {
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
                s.note
                    .unwrap_or_default()
                    .replace(',', ";")
                    .replace('\n', " "),
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
            if i == 0 {
                continue;
            }
            let cols: Vec<&str> = line.split(',').collect();
            if cols.len() < 7 {
                continue;
            }

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
            let c_value: f64 = cols
                .get(11)
                .and_then(|s| s.trim().parse().ok())
                .unwrap_or(0.0);

            // Verifica duplicatas INCLUINDO focus_score, pages_read e métricas customizadas
            let exists: bool = conn.query_row(
                "SELECT EXISTS(SELECT 1 FROM study_sessions WHERE user_id=?1 AND date=?2 AND subject=?3 AND abs(hours - ?4) < 0.001 AND questions_new=?5 AND questions_review=?6 AND correct_new=?7 AND correct_review=?8 AND (note=?9 OR (note IS NULL AND ?9 IS NULL)) AND (focus_score=?10 OR (focus_score IS NULL AND ?10=0)) AND (pages_read=?11 OR (pages_read IS NULL AND ?11=0)) AND (custom_metric_label=?12 OR (custom_metric_label IS NULL AND ?12 IS NULL)) AND (abs(custom_metric_value - ?13) < 0.001 OR (custom_metric_value IS NULL AND ?13=0.0)))",
                params![user_id, date, subject, hours, q_new, q_rev, c_new, c_rev, note, focus, pages, c_label, c_value],
                |row| row.get(0)
            ).unwrap_or(false);

            if exists {
                continue;
            }

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
                topic: None,
                tags: None,
                is_pomodoro: None,
            };
            self.add_session(s).ok();
            count += 1;
        }
        Ok(count)
    }

    // --- MÉTODOS DE SIMULADOS & NOTAS ---

    // Adiciona uma nova nota/simulado
    pub fn add_grade(&self, g: StudyGrade) -> Result<i64, String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO study_grades
             (user_id, subject, grade_type, title, grade, max_grade, weight, questions_total, questions_correct, date, note, half_grade)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                g.user_id,
                g.subject,
                g.grade_type,
                g.title,
                g.grade,
                g.max_grade,
                g.weight,
                g.questions_total,
                g.questions_correct,
                g.date,
                g.note,
                g.half_grade.unwrap_or(false)
            ],
        ).map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    // Atualiza uma nota/simulado existente
    pub fn update_grade(&self, g: StudyGrade) -> Result<(), String> {
        let conn = self.conn();
        let id = g.id.ok_or("id ausente")?;
        conn.execute(
            "UPDATE study_grades SET
             subject=?2, grade_type=?3, title=?4, grade=?5, max_grade=?6, weight=?7,
             questions_total=?8, questions_correct=?9, date=?10, note=?11, half_grade=?13
             WHERE id=?1 AND user_id=?12",
            params![
                id,
                g.subject,
                g.grade_type,
                g.title,
                g.grade,
                g.max_grade,
                g.weight,
                g.questions_total,
                g.questions_correct,
                g.date,
                g.note,
                g.user_id,
                g.half_grade.unwrap_or(false)
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    // Deleta uma nota/simulado
    pub fn delete_grade(&self, id: i64, user_id: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "DELETE FROM study_grades WHERE id=?1 AND user_id=?2",
            params![id, user_id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    // Lista todas as notas/simulados de um usuário
    pub fn list_grades(&self, user_id: &str) -> Vec<StudyGrade> {
        let conn = self.conn();
        let mut stmt = conn.prepare(
            "SELECT id, subject, grade_type, title, grade, max_grade, weight, questions_total, questions_correct, date, note, created_at, half_grade
             FROM study_grades
             WHERE user_id=?1
             ORDER BY date DESC, id DESC"
        ).unwrap();

        stmt.query_map(params![user_id], |row| {
            Ok(StudyGrade {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                subject: row.get(1)?,
                grade_type: row.get(2)?,
                title: row.get(3)?,
                grade: row.get(4)?,
                max_grade: row.get(5)?,
                weight: row.get(6)?,
                questions_total: row.get(7)?,
                questions_correct: row.get(8)?,
                date: row.get(9)?,
                note: row.get(10)?,
                created_at: Some(row.get(11)?),
                half_grade: row.get(12)?,
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect()
    }

    // Cria ou atualiza as configurações visuais da matéria (como a cor)
    pub fn upsert_subject(&self, s: SubjectMeta) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO study_subjects (user_id, name, color, weekly_target_hours)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(user_id, name) DO UPDATE SET color = excluded.color, weekly_target_hours = excluded.weekly_target_hours",
            params![s.user_id, s.name, s.color, s.weekly_target_hours],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    // Deleta uma matéria do cadastro de cores e de grupos
    pub fn delete_subject(&self, user_id: &str, name: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "DELETE FROM study_subjects WHERE user_id=?1 AND name=?2",
            params![user_id, name],
        )
        .map_err(|e| e.to_string())?;
        conn.execute(
            "DELETE FROM study_subject_group_members WHERE user_id=?1 AND subject=?2",
            params![user_id, name],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    // Renomeia uma matéria em todas as tabelas correspondentes atomicamente
    pub fn rename_subject(
        &self,
        user_id: &str,
        old_name: &str,
        new_name: &str,
    ) -> Result<(), String> {
        let mut conn = self.conn();
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        let exists: bool = tx
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM study_subjects WHERE user_id=?1 AND name=?2)",
                params![user_id, new_name],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if exists {
            tx.execute(
                "DELETE FROM study_subjects WHERE user_id=?1 AND name=?2",
                params![user_id, old_name],
            )
            .map_err(|e| e.to_string())?;
        } else {
            tx.execute(
                "UPDATE study_subjects SET name=?1 WHERE user_id=?2 AND name=?3",
                params![new_name, user_id, old_name],
            )
            .map_err(|e| e.to_string())?;
        }

        tx.execute(
            "UPDATE study_sessions SET subject=?1 WHERE user_id=?2 AND subject=?3",
            params![new_name, user_id, old_name],
        )
        .map_err(|e| e.to_string())?;

        tx.execute(
            "UPDATE study_grades SET subject=?1 WHERE user_id=?2 AND subject=?3",
            params![new_name, user_id, old_name],
        )
        .map_err(|e| e.to_string())?;

        tx.execute(
            "UPDATE study_subject_formulas SET subject=?1 WHERE user_id=?2 AND subject=?3",
            params![new_name, user_id, old_name],
        )
        .map_err(|e| e.to_string())?;

        tx.execute(
            "UPDATE study_subject_group_members SET subject=?1 WHERE user_id=?2 AND subject=?3",
            params![new_name, user_id, old_name],
        )
        .map_err(|e| e.to_string())?;

        tx.commit().map_err(|e| e.to_string())?;
        Ok(())
    }

    // Lista metadados de matérias de um usuário
    pub fn list_subjects(&self, user_id: &str) -> Vec<SubjectMeta> {
        let conn = self.conn();
        let mut stmt = conn
            .prepare("SELECT id, name, color, weekly_target_hours FROM study_subjects WHERE user_id=?1")
            .unwrap();

        stmt.query_map(params![user_id], |row| {
            Ok(SubjectMeta {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                name: row.get(1)?,
                color: row.get(2)?,
                weekly_target_hours: row.get(3)?,
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect()
    }

    // Cria ou atualiza um grupo de matérias, além de associar as matérias informadas
    pub fn upsert_subject_group(&self, g: SubjectGroup) -> Result<(), String> {
        let mut conn = self.conn();
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        let group_id = if let Some(id) = g.id {
            tx.execute(
                "UPDATE study_subject_groups SET name=?1, color=?2 WHERE id=?3 AND user_id=?4",
                params![g.name, g.color, id, g.user_id],
            )
            .map_err(|e| e.to_string())?;
            id
        } else {
            tx.execute(
                "INSERT INTO study_subject_groups (user_id, name, color) VALUES (?1, ?2, ?3)",
                params![g.user_id, g.name, g.color],
            )
            .map_err(|e| e.to_string())?;
            tx.last_insert_rowid()
        };

        tx.execute(
            "DELETE FROM study_subject_group_members WHERE group_id=?1 AND user_id=?2",
            params![group_id, g.user_id],
        )
        .map_err(|e| e.to_string())?;

        for subject in g.subjects {
            tx.execute(
                "INSERT INTO study_subject_group_members (group_id, user_id, subject)
                 VALUES (?1, ?2, ?3)
                 ON CONFLICT(group_id, subject) DO NOTHING",
                params![group_id, g.user_id, subject],
            )
            .map_err(|e| e.to_string())?;
        }

        tx.commit().map_err(|e| e.to_string())?;
        Ok(())
    }

    // Remove um grupo de matérias e suas associações
    pub fn delete_subject_group(&self, id: i64, user_id: &str) -> Result<(), String> {
        let mut conn = self.conn();
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        tx.execute(
            "DELETE FROM study_subject_groups WHERE id=?1 AND user_id=?2",
            params![id, user_id],
        )
        .map_err(|e| e.to_string())?;

        tx.execute(
            "DELETE FROM study_subject_group_members WHERE group_id=?1 AND user_id=?2",
            params![id, user_id],
        )
        .map_err(|e| e.to_string())?;

        tx.commit().map_err(|e| e.to_string())?;
        Ok(())
    }

    // Lista os grupos de matérias e seus respectivos membros
    pub fn list_subject_groups(&self, user_id: &str) -> Vec<SubjectGroup> {
        let conn = self.conn();
        let mut stmt_groups = conn
            .prepare("SELECT id, name, color FROM study_subject_groups WHERE user_id=?1")
            .unwrap();

        let groups_basic: Vec<(i64, String, Option<String>)> = stmt_groups
            .query_map(params![user_id], |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?))
            })
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();

        let mut groups = Vec::new();
        for (id, name, color) in groups_basic {
            let mut stmt_members = conn.prepare(
                "SELECT subject FROM study_subject_group_members WHERE group_id=?1 AND user_id=?2"
            ).unwrap();
            let subjects: Vec<String> = stmt_members
                .query_map(params![id, user_id], |row| row.get(0))
                .unwrap()
                .filter_map(|r| r.ok())
                .collect();

            groups.push(SubjectGroup {
                id: Some(id),
                user_id: user_id.to_string(),
                name,
                subjects,
                color,
            });
        }
        groups
    }

    // Cria ou atualiza as configurações de cálculo de nota (fórmula) por matéria
    pub fn upsert_subject_formula(&self, f: SubjectFormula) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO study_subject_formulas (user_id, subject, formula_type, passing_grade, custom_formula)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(user_id, subject) DO UPDATE SET
                formula_type = excluded.formula_type,
                passing_grade = excluded.passing_grade,
                custom_formula = excluded.custom_formula",
            params![
                f.user_id,
                f.subject,
                f.formula_type,
                f.passing_grade,
                f.custom_formula
            ],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    // Lista todas as fórmulas de cálculo cadastradas
    pub fn list_subject_formulas(&self, user_id: &str) -> Vec<SubjectFormula> {
        let conn = self.conn();
        let mut stmt = conn.prepare(
            "SELECT id, subject, formula_type, passing_grade, custom_formula FROM study_subject_formulas WHERE user_id=?1"
        ).unwrap();

        stmt.query_map(params![user_id], |row| {
            Ok(SubjectFormula {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                subject: row.get(1)?,
                formula_type: row.get(2)?,
                passing_grade: row.get(3)?,
                custom_formula: row.get(4)?,
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect()
    }

    // Adiciona ou edita um horário de aula
    pub fn add_schedule(&self, s: StudySchedule) -> Result<i64, String> {
        let conn = self.conn();
        if let Some(id) = s.id {
            conn.execute(
                "UPDATE study_schedules
                 SET subject=?1, day_of_week=?2, start_time=?3, end_time=?4, break_start_time=?5, break_end_time=?6, location=?7, teacher=?8
                 WHERE id=?9 AND user_id=?10",
                params![
                    s.subject,
                    s.day_of_week,
                    s.start_time,
                    s.end_time,
                    s.break_start_time,
                    s.break_end_time,
                    s.location,
                    s.teacher,
                    id,
                    s.user_id
                ],
            )
            .map_err(|e| e.to_string())?;
            Ok(id)
        } else {
            conn.execute(
                "INSERT INTO study_schedules (user_id, subject, day_of_week, start_time, end_time, break_start_time, break_end_time, location, teacher)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![
                    s.user_id,
                    s.subject,
                    s.day_of_week,
                    s.start_time,
                    s.end_time,
                    s.break_start_time,
                    s.break_end_time,
                    s.location,
                    s.teacher
                ],
            )
            .map_err(|e| e.to_string())?;
            Ok(conn.last_insert_rowid())
        }
    }

    // Deleta um horário de aula
    pub fn delete_schedule(&self, id: i64, user_id: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "DELETE FROM study_schedules WHERE id=?1 AND user_id=?2",
            params![id, user_id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    // Lista todas as aulas semanais cadastradas
    pub fn list_schedules(&self, user_id: &str) -> Vec<StudySchedule> {
        let conn = self.conn();
        let mut stmt = conn
            .prepare(
                "SELECT id, subject, day_of_week, start_time, end_time, break_start_time, break_end_time, location, teacher, created_at 
                 FROM study_schedules WHERE user_id=?1 ORDER BY day_of_week, start_time",
            )
            .unwrap();
        stmt.query_map(params![user_id], |row| {
            Ok(StudySchedule {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                subject: row.get(1)?,
                day_of_week: row.get(2)?,
                start_time: row.get(3)?,
                end_time: row.get(4)?,
                break_start_time: row.get(5)?,
                break_end_time: row.get(6)?,
                location: row.get(7)?,
                teacher: row.get(8)?,
                created_at: Some(row.get(9)?),
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect()
    }
}

#[tauri::command]
pub async fn studies_add_session(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, crate::AppState>,
    session: StudySession,
) -> Result<i64, String> {
    let res = state.studies.add_session(session.clone());
    if let Ok(inserted_id) = res {
        let xp_to_add = 10 + (session.hours * 15.0) as i32;
        state.stats.add_xp_with_source_and_ref(
            &session.user_id,
            xp_to_add,
            "Sessão de Estudos",
            Some("study_sessions"),
            Some(&inserted_id.to_string()),
        );
        let _ = crate::automation::evaluate_rules(&state, &app_handle, &session.user_id);
    }
    res
}

#[tauri::command]
pub async fn estudos_add_session(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, crate::AppState>,
    session: StudySession,
) -> Result<i64, String> {
    studies_add_session(app_handle, state, session).await
}

#[tauri::command]
pub async fn studies_update_session(
    state: tauri::State<'_, crate::AppState>,
    session: StudySession,
) -> Result<(), String> {
    state.studies.update_session(session)
}

#[tauri::command]
pub async fn estudos_update_session(
    state: tauri::State<'_, crate::AppState>,
    session: StudySession,
) -> Result<(), String> {
    studies_update_session(state, session).await
}

#[tauri::command]
pub async fn studies_delete_session(
    state: tauri::State<'_, crate::AppState>,
    id: i64,
    user_id: String,
) -> Result<(), String> {
    let result = state.studies.delete_session(id, &user_id);
    if result.is_ok() {
        let _ = state
            .stats
            .delete_xp_for_ref(&user_id, "study_sessions", &id.to_string());
    }
    result
}

#[tauri::command]
pub async fn estudos_delete_session(
    state: tauri::State<'_, crate::AppState>,
    id: i64,
    user_id: String,
) -> Result<(), String> {
    studies_delete_session(state, id, user_id).await
}

#[tauri::command]
pub async fn studies_list_sessions(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    months_back: i32,
) -> Result<Vec<StudySession>, String> {
    let now = state.config.get_now();
    Ok(state.studies.list_sessions(&user_id, months_back, now))
}

#[tauri::command]
pub async fn estudos_list_sessions(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    months_back: i32,
) -> Result<Vec<StudySession>, String> {
    studies_list_sessions(state, user_id, months_back).await
}

#[tauri::command]
pub async fn studies_upsert_goal(
    state: tauri::State<'_, crate::AppState>,
    goal: StudyGoal,
) -> Result<(), String> {
    state.studies.upsert_goal(goal)
}

#[tauri::command]
pub async fn estudos_upsert_goal(
    state: tauri::State<'_, crate::AppState>,
    goal: StudyGoal,
) -> Result<(), String> {
    studies_upsert_goal(state, goal).await
}

#[tauri::command]
pub async fn studies_list_goals(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
) -> Result<Vec<StudyGoal>, String> {
    Ok(state.studies.list_goals(&user_id))
}

#[tauri::command]
pub async fn estudos_list_goals(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
) -> Result<Vec<StudyGoal>, String> {
    studies_list_goals(state, user_id).await
}

#[tauri::command]
pub async fn studies_export_csv(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    dest_path: String,
) -> Result<(), String> {
    let now = state.config.get_now();
    state.studies.export_csv(&user_id, &dest_path, now)
}

#[tauri::command]
pub async fn estudos_export_csv(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    dest_path: String,
) -> Result<(), String> {
    studies_export_csv(state, user_id, dest_path).await
}

#[tauri::command]
pub async fn studies_import_csv(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    file_path: String,
) -> Result<usize, String> {
    state.studies.import_csv(&user_id, &file_path)
}

#[tauri::command]
pub async fn estudos_import_csv(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    file_path: String,
) -> Result<usize, String> {
    studies_import_csv(state, user_id, file_path).await
}

#[tauri::command]
pub async fn studies_add_schedule(
    state: tauri::State<'_, crate::AppState>,
    schedule: StudySchedule,
) -> Result<i64, String> {
    state.studies.add_schedule(schedule)
}

#[tauri::command]
pub async fn estudos_add_schedule(
    state: tauri::State<'_, crate::AppState>,
    schedule: StudySchedule,
) -> Result<i64, String> {
    studies_add_schedule(state, schedule).await
}

#[tauri::command]
pub async fn studies_delete_schedule(
    state: tauri::State<'_, crate::AppState>,
    id: i64,
    user_id: String,
) -> Result<(), String> {
    state.studies.delete_schedule(id, &user_id)
}

#[tauri::command]
pub async fn estudos_delete_schedule(
    state: tauri::State<'_, crate::AppState>,
    id: i64,
    user_id: String,
) -> Result<(), String> {
    studies_delete_schedule(state, id, user_id).await
}

#[tauri::command]
pub async fn studies_list_schedules(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
) -> Result<Vec<StudySchedule>, String> {
    Ok(state.studies.list_schedules(&user_id))
}

#[tauri::command]
pub async fn estudos_list_schedules(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
) -> Result<Vec<StudySchedule>, String> {
    studies_list_schedules(state, user_id).await
}

// --- COMANDOS TAURI PARA SIMULADOS & NOTAS ---

#[tauri::command]
pub async fn grades_add(
    state: tauri::State<'_, crate::AppState>,
    grade: StudyGrade,
) -> Result<i64, String> {
    state.studies.add_grade(grade)
}

#[tauri::command]
pub async fn grades_update(
    state: tauri::State<'_, crate::AppState>,
    grade: StudyGrade,
) -> Result<(), String> {
    state.studies.update_grade(grade)
}

#[tauri::command]
pub async fn grades_delete(
    state: tauri::State<'_, crate::AppState>,
    id: i64,
    user_id: String,
) -> Result<(), String> {
    state.studies.delete_grade(id, &user_id)
}

#[tauri::command]
pub async fn grades_list(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
) -> Result<Vec<StudyGrade>, String> {
    Ok(state.studies.list_grades(&user_id))
}

#[tauri::command]
pub async fn subjects_upsert(
    state: tauri::State<'_, crate::AppState>,
    subject: SubjectMeta,
) -> Result<(), String> {
    state.studies.upsert_subject(subject)
}

#[tauri::command]
pub async fn subjects_delete(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    name: String,
) -> Result<(), String> {
    state.studies.delete_subject(&user_id, &name)
}

#[tauri::command]
pub async fn subjects_list(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
) -> Result<Vec<SubjectMeta>, String> {
    Ok(state.studies.list_subjects(&user_id))
}

#[tauri::command]
pub async fn subjects_rename(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    old_name: String,
    new_name: String,
) -> Result<(), String> {
    state.studies.rename_subject(&user_id, &old_name, &new_name)
}

#[tauri::command]
pub async fn subject_groups_upsert(
    state: tauri::State<'_, crate::AppState>,
    group: SubjectGroup,
) -> Result<(), String> {
    state.studies.upsert_subject_group(group)
}

#[tauri::command]
pub async fn subject_groups_delete(
    state: tauri::State<'_, crate::AppState>,
    id: i64,
    user_id: String,
) -> Result<(), String> {
    state.studies.delete_subject_group(id, &user_id)
}

#[tauri::command]
pub async fn subject_groups_list(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
) -> Result<Vec<SubjectGroup>, String> {
    Ok(state.studies.list_subject_groups(&user_id))
}

#[tauri::command]
pub async fn subject_formulas_upsert(
    state: tauri::State<'_, crate::AppState>,
    formula: SubjectFormula,
) -> Result<(), String> {
    state.studies.upsert_subject_formula(formula)
}

#[tauri::command]
pub async fn subject_formulas_list(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
) -> Result<Vec<SubjectFormula>, String> {
    Ok(state.studies.list_subject_formulas(&user_id))
}
