use crate::config::ConfigManager;
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SleepEntry {
    pub id: Option<i64>,
    pub user_id: String,
    pub date: String,
    pub bedtime: String,
    pub wake_time: String,
    pub duration_minutes: i32,
    pub quality: i32,
    pub note: Option<String>,
    pub created_at: Option<String>,
    pub caffeine: Option<bool>,
    pub screens: Option<bool>,
    pub alcohol: Option<bool>,
    pub exercise: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SleepDream {
    pub id: Option<i32>,
    pub user_id: String,
    pub date: String,
    pub title: Option<String>,
    pub content: String,
    pub dream_type: String, // "lúcido" | "comum" | "pesadelo"
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SleepGoal {
    pub user_id: String,
    pub target_hours: f64,
    pub target_bedtime: String,
    pub reminder_enabled: bool,
}

pub struct SleepManager {
    db_path: PathBuf,
}

impl SleepManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let db_path = crate::config::get_database_path(app_handle);

        let conn = Connection::open(&db_path).expect("Falha ao abrir banco");

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS sleep_entries (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id          TEXT NOT NULL,
                date             TEXT NOT NULL,
                bedtime          TEXT NOT NULL,
                wake_time        TEXT NOT NULL,
                duration_minutes INTEGER NOT NULL DEFAULT 0,
                quality          INTEGER NOT NULL DEFAULT 3,
                note             TEXT,
                created_at       TEXT NOT NULL DEFAULT (datetime('now')),
                UNIQUE(user_id, date)
            );
            CREATE TABLE IF NOT EXISTS sleep_goals (
                user_id         TEXT PRIMARY KEY,
                target_hours    REAL NOT NULL DEFAULT 8.0,
                target_bedtime  TEXT NOT NULL DEFAULT '23:00'
            );",
        )
        .ok();

        conn.execute(
            "ALTER TABLE sleep_goals ADD COLUMN reminder_enabled INTEGER NOT NULL DEFAULT 0",
            [],
        )
        .ok();

        let _ = conn.execute(
            "ALTER TABLE sleep_entries ADD COLUMN caffeine INTEGER NOT NULL DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE sleep_entries ADD COLUMN screens INTEGER NOT NULL DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE sleep_entries ADD COLUMN alcohol INTEGER NOT NULL DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE sleep_entries ADD COLUMN exercise INTEGER NOT NULL DEFAULT 0",
            [],
        );

        let _ = conn.execute(
            "CREATE TABLE IF NOT EXISTS sleep_dreams (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id      TEXT NOT NULL,
                date         TEXT NOT NULL,
                title        TEXT,
                content      TEXT NOT NULL,
                dream_type   TEXT NOT NULL DEFAULT 'comum',
                created_at   TEXT NOT NULL DEFAULT (datetime('now')),
                UNIQUE(user_id, date)
            )",
            [],
        );

        let _ = conn.execute(
            "ALTER TABLE sleep_dreams ADD COLUMN title TEXT",
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

    pub fn upsert_entry(&self, e: SleepEntry) -> Result<i64, String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO sleep_entries (user_id, date, bedtime, wake_time, duration_minutes, quality, note, caffeine, screens, alcohol, exercise)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)
             ON CONFLICT(user_id, date) DO UPDATE SET
                bedtime          = excluded.bedtime,
                wake_time        = excluded.wake_time,
                duration_minutes = excluded.duration_minutes,
                quality          = excluded.quality,
                note             = excluded.note,
                caffeine         = excluded.caffeine,
                screens          = excluded.screens,
                alcohol          = excluded.alcohol,
                exercise         = excluded.exercise",
            params![
                e.user_id,
                e.date,
                e.bedtime,
                e.wake_time,
                e.duration_minutes,
                e.quality,
                e.note,
                e.caffeine.unwrap_or(false) as i32,
                e.screens.unwrap_or(false) as i32,
                e.alcohol.unwrap_or(false) as i32,
                e.exercise.unwrap_or(false) as i32
            ],
        ).map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    pub fn exists(&self, user_id: &str, date: &str) -> bool {
        let conn = self.conn();
        let count: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM sleep_entries WHERE user_id=?1 AND date=?2",
                params![user_id, date],
                |r| r.get(0),
            )
            .unwrap_or(0);
        count > 0
    }

    pub fn delete_entry(&self, id: i64, user_id: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "DELETE FROM sleep_entries WHERE id=?1 AND user_id=?2",
            params![id, user_id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_entries(
        &self,
        user_id: &str,
        months_back: i32,
        now: DateTime<Utc>,
    ) -> Vec<SleepEntry> {
        let conn = self.conn();
        let now_local = now.with_timezone(&chrono::Local);
        let cutoff_date = (now_local - chrono::Duration::days((months_back * 30) as i64))
            .format("%Y-%m-%d")
            .to_string();
        let mut stmt = conn
            .prepare(
                "SELECT id, date, bedtime, wake_time, duration_minutes, quality, note, created_at, caffeine, screens, alcohol, exercise
             FROM sleep_entries
             WHERE user_id=?1 AND date >= ?2
             ORDER BY date DESC",
            )
            .unwrap();

        stmt.query_map(params![user_id, cutoff_date], |row| {
            Ok(SleepEntry {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                date: row.get(1)?,
                bedtime: row.get(2)?,
                wake_time: row.get(3)?,
                duration_minutes: row.get(4)?,
                quality: row.get(5)?,
                note: row.get(6)?,
                created_at: row.get(7)?,
                caffeine: Some(row.get::<_, i32>(8)? != 0),
                screens: Some(row.get::<_, i32>(9)? != 0),
                alcohol: Some(row.get::<_, i32>(10)? != 0),
                exercise: Some(row.get::<_, i32>(11)? != 0),
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect()
    }

    pub fn upsert_goal(&self, g: SleepGoal, app_handle: &AppHandle) -> Result<(), String> {
        let config_manager = ConfigManager::new(app_handle);

        // Sincroniza com a config global
        let _ = config_manager.update_config(
            "notif_sleep_bedtime",
            serde_json::Value::Bool(g.reminder_enabled),
        );
        let _ = config_manager.update_config(
            "notif_sleep_bedtime_time",
            serde_json::Value::String(g.target_bedtime.clone()),
        );
        let _ = config_manager.update_config(
            "notif_sleep_target_hours",
            serde_json::Value::Number(serde_json::Number::from_f64(g.target_hours).unwrap()),
        );

        let conn = self.conn();
        conn.execute(
            "INSERT INTO sleep_goals (user_id, target_hours, target_bedtime, reminder_enabled)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(user_id) DO UPDATE SET
                target_hours     = excluded.target_hours,
                target_bedtime   = excluded.target_bedtime,
                reminder_enabled = excluded.reminder_enabled",
            params![
                g.user_id,
                g.target_hours,
                g.target_bedtime,
                if g.reminder_enabled { 1 } else { 0 }
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_goal(&self, user_id: &str, app_handle: &AppHandle) -> SleepGoal {
        let config_manager = ConfigManager::new(app_handle);
        let config = config_manager.get_config();

        let conn = self.conn();
        let db_goal: Option<(f64, String, bool)> = conn.query_row(
            "SELECT target_hours, target_bedtime, reminder_enabled FROM sleep_goals WHERE user_id=?1",
            params![user_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get::<_, i32>(2)? != 0)),
        ).ok();

        match db_goal {
            Some((_hours, _bedtime, _reminder)) => {
                // Retorna mix entre banco local e config global (preferência global)
                SleepGoal {
                    user_id: user_id.to_string(),
                    target_hours: config.notif_sleep_target_hours, // Usa a global
                    target_bedtime: config.notif_sleep_bedtime_time,
                    reminder_enabled: config.notif_sleep_bedtime,
                }
            }
            None => SleepGoal {
                user_id: user_id.to_string(),
                target_hours: config.notif_sleep_target_hours,
                target_bedtime: config.notif_sleep_bedtime_time,
                reminder_enabled: config.notif_sleep_bedtime,
            },
        }
    }

    pub fn get_dream(&self, user_id: &str, date: &str) -> Result<Option<SleepDream>, String> {
        let conn = self.conn();
        let dream: Option<SleepDream> = conn.query_row(
            "SELECT id, user_id, date, title, content, dream_type, created_at FROM sleep_dreams WHERE user_id=?1 AND date=?2",
            params![user_id, date],
            |row| Ok(SleepDream {
                id: Some(row.get(0)?),
                user_id: row.get(1)?,
                date: row.get(2)?,
                title: row.get(3)?,
                content: row.get(4)?,
                dream_type: row.get(5)?,
                created_at: Some(row.get(6)?),
            })
        ).ok();
        Ok(dream)
    }

    pub fn upsert_dream(&self, d: SleepDream) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO sleep_dreams (user_id, date, title, content, dream_type)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(user_id, date) DO UPDATE SET
                title      = excluded.title,
                content    = excluded.content,
                dream_type = excluded.dream_type",
            params![d.user_id, d.date, d.title, d.content, d.dream_type],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_dreams(&self, user_id: &str) -> Result<Vec<SleepDream>, String> {
        let conn = self.conn();
        let mut stmt = conn
            .prepare(
                "
            SELECT id, user_id, date, title, content, dream_type, created_at
            FROM sleep_dreams
            WHERE user_id = ?1
            ORDER BY date DESC
        ",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![user_id], |row| {
                Ok(SleepDream {
                    id: Some(row.get(0)?),
                    user_id: row.get(1)?,
                    date: row.get(2)?,
                    title: row.get(3)?,
                    content: row.get(4)?,
                    dream_type: row.get(5)?,
                    created_at: Some(row.get(6)?),
                })
            })
            .map_err(|e| e.to_string())?;

        let mut dreams = Vec::new();
        for r in rows {
            if let Ok(d) = r {
                dreams.push(d);
            }
        }
        Ok(dreams)
    }

    pub fn export_csv(
        &self,
        user_id: &str,
        dest_path: &str,
        now: DateTime<Utc>,
    ) -> Result<(), String> {
        let entries = self.list_entries(user_id, 120, now);
        let mut out =
            String::from("data,hora_dormir,hora_acordar,duracao_minutos,qualidade,nota\n");
        for e in entries {
            out.push_str(&format!(
                "{},{},{},{},{},{}\n",
                e.date,
                e.bedtime,
                e.wake_time,
                e.duration_minutes,
                e.quality,
                e.note
                    .unwrap_or_default()
                    .replace(',', ";")
                    .replace('\n', " ")
            ));
        }
        std::fs::write(dest_path, out).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn import_csv(&self, user_id: &str, file_path: &str) -> Result<usize, String> {
        let csv = std::fs::read_to_string(file_path).map_err(|e| e.to_string())?;
        let mut count = 0usize;
        for (i, line) in csv.lines().enumerate() {
            if i == 0 {
                continue;
            }
            let cols: Vec<&str> = line.splitn(6, ',').collect();
            if cols.len() < 5 {
                continue;
            }
            let e = SleepEntry {
                id: None,
                user_id: user_id.to_string(),
                date: cols[0].trim().to_string(),
                bedtime: cols[1].trim().to_string(),
                wake_time: cols[2].trim().to_string(),
                duration_minutes: cols[3].trim().parse().unwrap_or(0),
                quality: cols[4].trim().parse().unwrap_or(3),
                note: cols.get(5).map(|s| s.trim().to_string()),
                created_at: None,
                caffeine: Some(false),
                screens: Some(false),
                alcohol: Some(false),
                exercise: Some(false),
            };
            self.upsert_entry(e).ok();
            count += 1;
        }
        Ok(count)
    }

    pub fn delete_dream(&self, user_id: &str, date: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "DELETE FROM sleep_dreams WHERE user_id = ?1 AND date = ?2",
            params![user_id, date],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }
}

#[tauri::command]
pub async fn sono_upsert_entry(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, crate::AppState>,
    entry: SleepEntry,
) -> Result<i64, String> {
    let is_new = !state.sleep.exists(&entry.user_id, &entry.date);
    let res = state.sleep.upsert_entry(entry.clone());
    if let Ok(inserted_id) = res {
        if is_new {
            let hours = entry.duration_minutes as f64 / 60.0;
            let xp_to_add = 30 + (hours * 5.0) as i32;
            state.stats.add_xp_with_source_and_ref(
                &entry.user_id,
                xp_to_add,
                "Registro de Sono",
                Some("sleep_entries"),
                Some(&inserted_id.to_string()),
            );
        }
        let _ = crate::automation::evaluate_rules(&state, &app_handle, &entry.user_id);
    }
    res
}

#[tauri::command]
pub async fn sono_delete_entry(
    state: tauri::State<'_, crate::AppState>,
    id: i64,
    user_id: String,
) -> Result<(), String> {
    let result = state.sleep.delete_entry(id, &user_id);
    if result.is_ok() {
        let _ = state
            .stats
            .delete_xp_for_ref(&user_id, "sleep_entries", &id.to_string());
    }
    result
}

#[tauri::command]
pub async fn sono_list_entries(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    months_back: i32,
) -> Result<Vec<SleepEntry>, String> {
    let now = state.config.get_now();
    Ok(state.sleep.list_entries(&user_id, months_back, now))
}

#[tauri::command]
pub async fn sono_upsert_goal(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, crate::AppState>,
    goal: SleepGoal,
) -> Result<(), String> {
    state.sleep.upsert_goal(goal, &app_handle)
}

#[tauri::command]
pub async fn sono_get_goal(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
) -> Result<SleepGoal, String> {
    Ok(state.sleep.get_goal(&user_id, &app_handle))
}

#[tauri::command]
pub async fn sono_export_csv(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    dest_path: String,
) -> Result<(), String> {
    let now = state.config.get_now();
    state.sleep.export_csv(&user_id, &dest_path, now)
}

#[tauri::command]
pub async fn sono_import_csv(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    file_path: String,
) -> Result<usize, String> {
    state.sleep.import_csv(&user_id, &file_path)
}

#[tauri::command]
pub async fn sono_get_dream(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    date: String,
) -> Result<Option<SleepDream>, String> {
    state.sleep.get_dream(&user_id, &date)
}

#[tauri::command]
pub async fn sono_upsert_dream(
    state: tauri::State<'_, crate::AppState>,
    dream: SleepDream,
) -> Result<(), String> {
    state.sleep.upsert_dream(dream)
}

#[tauri::command]
pub async fn sono_delete_dream(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    date: String,
) -> Result<(), String> {
    state.sleep.delete_dream(&user_id, &date)
}

#[tauri::command]
pub async fn sono_list_dreams(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
) -> Result<Vec<SleepDream>, String> {
    state.sleep.list_dreams(&user_id)
}
