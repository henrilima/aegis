use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use chrono::{DateTime, Utc, Timelike, NaiveDate};
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Habit {
    pub id: Option<i32>,
    pub user_id: String,
    pub name: String,
    pub habit_type: String, 
    pub last_slip: String,   
    pub created_at: String,
    pub max_streak: i32,
    pub current_streak: i32,
    pub cooldown_days: i32,
    pub last_done: Option<String>,
    pub charges_used: i32,
    pub charges_amount: i32,
    pub charges_interval_days: i32,
    pub accumulates: bool,
    pub last_charge_refill: String,
    pub current_charges: i32,
    pub goal_days: Option<i32>,
    pub frequency: Option<String>,
    pub weekdays: Option<String>,
    pub completed_dates: Option<Vec<String>>,
    pub archived: Option<bool>,
}

pub struct HabitManager {
    db_path: PathBuf,
}

impl HabitManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let db_path = crate::config::get_database_path(app_handle);
        
        let conn = Connection::open(&db_path).expect("Falha ao abrir banco de dados");
        let _ = conn.busy_timeout(std::time::Duration::from_millis(5000));
        conn.execute(
            "CREATE TABLE IF NOT EXISTS habits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                habit_type TEXT NOT NULL,
                last_slip TEXT NOT NULL,
                created_at TEXT NOT NULL,
                max_streak INTEGER NOT NULL DEFAULT 0,
                current_streak INTEGER NOT NULL DEFAULT 0,
                cooldown_days INTEGER NOT NULL DEFAULT 0,
                last_done TEXT,
                charges_used INTEGER NOT NULL DEFAULT 0,
                charges_amount INTEGER NOT NULL DEFAULT 0,
                charges_interval_days INTEGER NOT NULL DEFAULT 0,
                accumulates INTEGER NOT NULL DEFAULT 0,
                last_charge_refill TEXT NOT NULL DEFAULT '',
                current_charges INTEGER NOT NULL DEFAULT 0,
                goal_days INTEGER DEFAULT 0,
                frequency TEXT NOT NULL DEFAULT 'daily',
                weekdays TEXT
            )",
            [],
        ).ok();

        // Cria a tabela de logs para rastreamento de dias individuais concluídos
        conn.execute(
            "CREATE TABLE IF NOT EXISTS habit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                habit_id INTEGER NOT NULL,
                completed_date TEXT NOT NULL,
                FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
            )",
            [],
        ).ok();
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, completed_date)",
            [],
        ).ok();

        // Remove índice único que impedia hábitos com mesmo nome (proteção de duplo-clique deve ser no frontend)
        conn.execute("DROP INDEX IF EXISTS idx_habits_user_name", []).ok();

        
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN max_streak INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN current_streak INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN cooldown_days INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN last_done TEXT", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN charges_used INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN charges_amount INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN charges_interval_days INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN accumulates INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute(r#"ALTER TABLE habits ADD COLUMN last_charge_refill TEXT NOT NULL DEFAULT ''"#, []);
        let _ = conn.execute(r#"ALTER TABLE habits ADD COLUMN current_charges INTEGER NOT NULL DEFAULT 0"#, []);
        let _ = conn.execute(r#"ALTER TABLE habits ADD COLUMN goal_days INTEGER DEFAULT 0"#, []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN frequency TEXT NOT NULL DEFAULT 'daily'", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN weekdays TEXT", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN archived INTEGER DEFAULT 0", []);

        Self { db_path }
    }

    fn get_connection(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Falha ao conectar ao banco de dados");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Falha no timeout");
        conn
    }


    fn is_positive(habit_type: &str) -> bool {
        let t = habit_type.to_lowercase();
        t == "positive" || t == "good"
    }

    fn sync_habit_logic(&self, conn: &Connection, mut habit: Habit, now: DateTime<Utc>) -> Habit {
        let now_local = now.with_timezone(&chrono::Local);
        let now_date = now_local.date_naive();
        let mut changed = false;
        let is_pos = Self::is_positive(&habit.habit_type);

        // Hábitos positivos (Hábitos Diários) não utilizam recarga de cargas automáticas ou tolerâncias de vícios.
        // O progresso deles é calculado dinamicamente de acordo com o histórico de logs.

        // 2. Recarga de cargas (respeitando o horário de 01:00 AM para renovação)
        if habit.charges_amount > 0 && habit.charges_interval_days >= 1 {
            let last_refill = DateTime::parse_from_rfc3339(&habit.last_charge_refill)
                .unwrap_or_else(|_| DateTime::parse_from_rfc3339(&habit.created_at)
                    .unwrap_or_else(|_| now.fixed_offset()))
                .with_timezone(&Utc);
            
            let last_refill_date = last_refill.with_timezone(&chrono::Local).date_naive();
            
            let effective_now_date = if now_local.hour() >= 1 {
                now_date
            } else {
                now_date - chrono::Duration::days(1)
            };

            let days_passed = (effective_now_date - last_refill_date).num_days() as i32;
            let effective_interval = habit.charges_interval_days.max(1);

            if days_passed >= effective_interval {
                let times = days_passed / effective_interval;
                if habit.accumulates {
                    habit.current_charges += habit.charges_amount * times;
                } else {
                    habit.current_charges = habit.charges_amount;
                }
                
                if !habit.accumulates && habit.current_charges > habit.charges_amount {
                    habit.current_charges = habit.charges_amount;
                }

                let next_refill_date = last_refill_date + chrono::Duration::days((times * effective_interval) as i64);
                let next_refill = next_refill_date
                    .and_hms_opt(1, 0, 0)
                    .unwrap_or_else(|| next_refill_date.and_hms_opt(0, 0, 0).unwrap_or_default())
                    .and_utc();
                
                habit.last_charge_refill = next_refill.to_rfc3339();
                changed = true;
            }
        }

        // 3. Atualiza streaks de hábitos negativos (tempo desde o último deslize)
        if !is_pos {
            let last_slip_dt = DateTime::parse_from_rfc3339(&habit.last_slip)
                .unwrap_or_else(|_| now.fixed_offset())
                .with_timezone(&Utc);
            let last_slip_date = last_slip_dt.with_timezone(&chrono::Local).date_naive();
            let new_streak = (now_date - last_slip_date).num_days() as i32;
            if new_streak != habit.current_streak {
                habit.current_streak = new_streak;
                changed = true;
            }
        }

        if habit.current_streak > habit.max_streak {
            habit.max_streak = habit.current_streak;
            changed = true;
        }

        if changed {
            let _ = conn.execute(
                "UPDATE habits SET last_slip = ?1, last_done = ?2, charges_used = ?3, last_charge_refill = ?4, current_charges = ?5, max_streak = ?6, current_streak = ?7, goal_days = ?8 WHERE id = ?9",
                params![habit.last_slip, habit.last_done, habit.charges_used, habit.last_charge_refill, habit.current_charges, habit.max_streak, habit.current_streak, habit.goal_days, habit.id],
            );
        }

        habit
    }

    fn load_completed_dates(&self, conn: &Connection, habit_id: i32, now: DateTime<Utc>) -> Vec<String> {
        let now_local = now.with_timezone(&chrono::Local);
        let start_date = (now_local.date_naive() - chrono::Duration::days(120)).format("%Y-%m-%d").to_string();
        let mut stmt = match conn.prepare("SELECT completed_date FROM habit_logs WHERE habit_id = ?1 AND completed_date >= ?2 ORDER BY completed_date DESC") {
            Ok(s) => s,
            Err(_) => return vec![],
        };
        let rows = match stmt.query_map(params![habit_id, start_date], |row| row.get::<_, String>(0)) {
            Ok(r) => r,
            Err(_) => return vec![],
        };
        rows.filter_map(Result::ok).collect()
    }

    pub fn list_habits(&self, user_id: &str, now: DateTime<Utc>) -> Vec<Habit> {
        let conn = self.get_connection();
        let mut stmt = match conn.prepare("SELECT id, user_id, name, habit_type, last_slip, created_at, max_streak, cooldown_days, last_done, charges_used, charges_amount, charges_interval_days, accumulates, last_charge_refill, current_charges, current_streak, goal_days, frequency, weekdays, archived FROM habits WHERE user_id = ?1") {
            Ok(s) => s,
            Err(e) => {
                eprintln!("list_habits prepare error: {}", e);
                return vec![];
            }
        };
        let rows = match stmt.query_map(params![user_id], |row| {
            Ok(Habit {
                id: Some(row.get(0)?),
                user_id: row.get(1)?,
                name: row.get(2)?,
                habit_type: row.get(3)?,
                last_slip: row.get::<_, Option<String>>(4)?.unwrap_or_default(),
                created_at: row.get::<_, Option<String>>(5)?.unwrap_or_default(),
                max_streak: row.get::<_, Option<i32>>(6)?.unwrap_or(0),
                cooldown_days: row.get::<_, Option<i32>>(7)?.unwrap_or(1),
                last_done: row.get(8)?,
                charges_used: row.get::<_, Option<i32>>(9)?.unwrap_or(0),
                charges_amount: row.get::<_, Option<i32>>(10)?.unwrap_or(0),
                charges_interval_days: row.get::<_, Option<i32>>(11)?.unwrap_or(1),
                accumulates: row.get::<_, Option<i32>>(12)?.unwrap_or(0) != 0,
                last_charge_refill: row.get::<_, Option<String>>(13)?.unwrap_or_default(),
                current_charges: row.get::<_, Option<i32>>(14)?.unwrap_or(0),
                current_streak: row.get::<_, Option<i32>>(15)?.unwrap_or(0),
                goal_days: row.get::<_, Option<i32>>(16)?,
                frequency: row.get::<_, Option<String>>(17).unwrap_or(Some("daily".to_string())),
                weekdays: row.get::<_, Option<String>>(18).unwrap_or(None),
                completed_dates: None,
                archived: Some(row.get::<_, Option<i32>>(19)?.unwrap_or(0) != 0),
            })
        }) {
            Ok(r) => r,
            Err(e) => {
                eprintln!("list_habits query error: {}", e);
                return vec![];
            }
        };

        let habits: Vec<Habit> = rows.filter_map(|r| r.ok()).collect();
        let mut synced_habits = Vec::new();
        for mut h in habits {
            if let Some(id) = h.id {
                let dates = self.load_completed_dates(&conn, id, now);
                h.completed_dates = Some(dates);

                if Self::is_positive(&h.habit_type) {
                    if let Ok((curr, max)) = self.recalculate_streaks_internal(&conn, id, now) {
                        h.current_streak = curr;
                        h.max_streak = max;
                    }
                }
            }
            let synced = self.sync_habit_logic(&conn, h, now);
            synced_habits.push(synced);
        }
        synced_habits
    }

    pub fn add_habit(&self, habit: Habit) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "INSERT INTO habits (user_id, name, habit_type, last_slip, created_at, max_streak, cooldown_days, last_done, charges_used, charges_amount, charges_interval_days, accumulates, last_charge_refill, current_charges, current_streak, goal_days, frequency, weekdays, archived) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)",
            params![
                habit.user_id, 
                habit.name, 
                habit.habit_type, 
                habit.last_slip, 
                habit.created_at, 
                habit.max_streak, 
                habit.cooldown_days, 
                habit.last_done, 
                habit.charges_used,
                habit.charges_amount,
                habit.charges_interval_days.max(1),
                if habit.accumulates { 1 } else { 0 },
                habit.last_charge_refill,
                habit.current_charges,
                habit.current_streak,
                habit.goal_days,
                habit.frequency.unwrap_or_else(|| "daily".to_string()),
                habit.weekdays,
                if habit.archived.unwrap_or(false) { 1 } else { 0 },
            ],
        ).map_err(|e| {
            let err_msg = format!("SQL insert error: {}", e);
            std::fs::write("habit_error.log", &err_msg).ok();
            err_msg
        })?;
        Ok(())
    }

    pub fn update_habit(&self, habit: Habit) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "UPDATE habits SET name = ?1, habit_type = ?2, cooldown_days = ?3, charges_amount = ?4, charges_interval_days = ?5, accumulates = ?6, goal_days = ?7, frequency = ?8, weekdays = ?9, archived = ?10 WHERE id = ?11",
            params![
                habit.name, 
                habit.habit_type, 
                habit.cooldown_days, 
                habit.charges_amount,
                habit.charges_interval_days.max(1),
                if habit.accumulates { 1 } else { 0 },
                habit.goal_days,
                habit.frequency.unwrap_or_else(|| "daily".to_string()),
                habit.weekdays,
                if habit.archived.unwrap_or(false) { 1 } else { 0 },
                habit.id
            ],
        ).map_err(|e| e.to_string())?;

        // Após atualizar frequência/dias da semana, recalcula sequências
        if let Some(id) = habit.id {
            let _ = self.recalculate_streaks_internal(&conn, id, chrono::Utc::now());
        }

        Ok(())
    }

    fn get_habit_by_id(&self, conn: &Connection, id: i32) -> Result<Habit, String> {
        let mut stmt = conn.prepare("SELECT id, user_id, name, habit_type, last_slip, created_at, max_streak, cooldown_days, last_done, charges_used, charges_amount, charges_interval_days, accumulates, last_charge_refill, current_charges, current_streak, goal_days, frequency, weekdays, archived FROM habits WHERE id = ?1").map_err(|e| e.to_string())?;
        stmt.query_row(params![id], |row| {
            Ok(Habit {
                id: Some(row.get(0)?),
                user_id: row.get(1)?,
                name: row.get(2)?,
                habit_type: row.get(3)?,
                last_slip: row.get(4)?,
                created_at: row.get(5)?,
                max_streak: row.get(6)?,
                cooldown_days: row.get(7)?,
                last_done: row.get(8)?,
                charges_used: row.get(9)?,
                charges_amount: row.get(10)?,
                charges_interval_days: row.get(11)?,
                accumulates: row.get::<_, i32>(12)? != 0,
                last_charge_refill: row.get(13)?,
                current_charges: row.get(14)?,
                current_streak: row.get(15)?,
                goal_days: row.get(16)?,
                frequency: row.get::<_, Option<String>>(17).unwrap_or(Some("daily".to_string())),
                weekdays: row.get::<_, Option<String>>(18).unwrap_or(None),
                completed_dates: None,
                archived: Some(row.get::<_, Option<i32>>(19)?.unwrap_or(0) != 0),
            })
        }).map_err(|e| e.to_string())
    }

    pub fn recalculate_streaks_internal(&self, conn: &Connection, habit_id: i32, now: DateTime<Utc>) -> Result<(i32, i32), String> {
        let habit = self.get_habit_by_id(conn, habit_id)?;
        if !Self::is_positive(&habit.habit_type) {
            // Hábitos negativos (vícios) não recalculam por logs (usam o tempo desde o último deslize)
            return Ok((habit.current_streak, habit.max_streak));
        }

        // 1. Carrega todas as datas concluídas em ordem crescente (mais antigas primeiro)
        let mut stmt = conn.prepare("SELECT completed_date FROM habit_logs WHERE habit_id = ?1 ORDER BY completed_date ASC")
            .map_err(|e| e.to_string())?;
        let rows = stmt.query_map(params![habit_id], |row| row.get::<_, String>(0))
            .map_err(|e| e.to_string())?;
        
        let mut completed_dates = std::collections::HashSet::new();
        for r in rows {
            if let Ok(d_str) = r {
                if let Ok(d) = NaiveDate::parse_from_str(&d_str, "%Y-%m-%d") {
                    completed_dates.insert(d);
                }
            }
        }

        let frequency = habit.frequency.unwrap_or_else(|| "daily".to_string());
        let weekdays_str = habit.weekdays.clone().unwrap_or_default();
        let weekdays: Vec<u32> = weekdays_str
            .split(',')
            .filter_map(|s| s.trim().parse::<u32>().ok())
            .collect(); // 0 = Domingo, 1 = Segunda, ...

        // Helper para checar se um dia é agendado
        let is_scheduled = |d: NaiveDate| -> bool {
            if frequency == "daily" {
                true
            } else {
                use chrono::Datelike;
                let w = d.weekday().num_days_from_sunday();
                weekdays.contains(&w)
            }
        };

        // 2. Calcula sequências
        let today = now.with_timezone(&chrono::Local).date_naive();
        
        // Sequência Atual
        let mut current_streak = 0;
        let mut d = today;
        loop {
            if is_scheduled(d) {
                if completed_dates.contains(&d) {
                    current_streak += 1;
                } else {
                    // Se for hoje, o usuário ainda tem tempo para completar, então não quebra a sequência imediatamente
                    if d != today {
                        break;
                    }
                }
            }
            d = d - chrono::Duration::days(1);
            // Parar se retrocedermos muito além da data de criação
            if let Ok(created_dt) = DateTime::parse_from_rfc3339(&habit.created_at) {
                let created_date = created_dt.with_timezone(&chrono::Local).date_naive();
                if d < created_date - chrono::Duration::days(7) {
                    break;
                }
            } else {
                break;
            }
        }

        // Recorde (Max Streak)
        let mut max_streak = 0;
        let mut temp_streak = 0;
        if let Ok(created_dt) = DateTime::parse_from_rfc3339(&habit.created_at) {
            let created_date = created_dt.with_timezone(&chrono::Local).date_naive();
            let mut scan_d = created_date;
            
            // Varre do dia de criação até hoje
            while scan_d <= today {
                if is_scheduled(scan_d) {
                    if completed_dates.contains(&scan_d) {
                        temp_streak += 1;
                        if temp_streak > max_streak {
                            max_streak = temp_streak;
                        }
                    } else {
                        // Se scan_d for hoje e não estiver completo, não quebra a sequência temporária ainda
                        if scan_d != today {
                            temp_streak = 0;
                        }
                    }
                }
                scan_d = scan_d + chrono::Duration::days(1);
            }
        }

        max_streak = max_streak.max(current_streak);

        // Atualiza a tabela
        conn.execute(
            "UPDATE habits SET current_streak = ?1, max_streak = ?2 WHERE id = ?3",
            params![current_streak, max_streak, habit_id],
        ).map_err(|e| e.to_string())?;

        Ok((current_streak, max_streak))
    }

    pub fn toggle_date(&self, id: i32, date: &str, completed: bool, now: DateTime<Utc>) -> Result<(), String> {
        let conn = self.get_connection();
        let _habit = self.get_habit_by_id(&conn, id)?;

        if completed {
            conn.execute(
                "INSERT OR IGNORE INTO habit_logs (habit_id, completed_date) VALUES (?1, ?2)",
                params![id, date],
            ).map_err(|e| e.to_string())?;

            // Atualiza last_done se for a data mais recente
            let today_str = now.with_timezone(&chrono::Local).format("%Y-%m-%d").to_string();
            if date >= today_str.as_str() {
                let _ = conn.execute(
                    "UPDATE habits SET last_done = ?1 WHERE id = ?2",
                    params![now.to_rfc3339(), id],
                );
            }
        } else {
            conn.execute(
                "DELETE FROM habit_logs WHERE habit_id = ?1 AND completed_date = ?2",
                params![id, date],
            ).map_err(|e| e.to_string())?;
        }

        // Recalcula as sequências e atualiza no banco
        let _ = self.recalculate_streaks_internal(&conn, id, now);
        Ok(())
    }

    pub fn reset_habit(&self, id: i32, timestamp: &str, now: DateTime<Utc>) -> Result<(), String> {
        let conn = self.get_connection();
        let habit = self.get_habit_by_id(&conn, id)?;
        let synced_habit = self.sync_habit_logic(&conn, habit, now);

        let effective_now = if !timestamp.is_empty() {
            DateTime::parse_from_rfc3339(timestamp)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or(now)
        } else {
            now
        };

        let is_pos = Self::is_positive(&synced_habit.habit_type);
        let now_iso = effective_now.to_rfc3339();
        let new_charges_used = if is_pos { synced_habit.charges_used } else { synced_habit.charges_used + 1 };

        conn.execute(
            "UPDATE habits SET last_slip = ?1, last_done = ?2, charges_used = ?3, current_streak = 0 WHERE id = ?4",
            params![now_iso, None::<String>, new_charges_used, id],
        ).map_err(|e| e.to_string())?;
        
        Ok(())
    }

    pub fn hard_reset_habit(&self, id: i32, timestamp: &str) -> Result<(), String> {
        let conn = self.get_connection();
        // Deleta os logs de hábitos para reset total
        let _ = conn.execute("DELETE FROM habit_logs WHERE habit_id = ?1", params![id]);
        conn.execute(
            "UPDATE habits SET last_slip = ?1, last_done = NULL, max_streak = 0, current_streak = 0, charges_used = 0, current_charges = charges_amount, last_charge_refill = ?1 WHERE id = ?2",
            params![timestamp, id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    #[allow(dead_code)]
    pub fn mark_done(&self, id: i32, timestamp: &str, now: DateTime<Utc>) -> Result<(), String> {
        let ts = if timestamp.is_empty() {
            now.with_timezone(&chrono::Local).format("%Y-%m-%d").to_string()
        } else if timestamp.contains('T') {
            timestamp.split('T').next().unwrap_or(timestamp).to_string()
        } else {
            timestamp.to_string()
        };
        self.toggle_date(id, &ts, true, now)
    }

    pub fn use_charge(&self, id: i32, now: DateTime<Utc>) -> Result<(), String> {
        let conn = self.get_connection();
        let habit = self.get_habit_by_id(&conn, id)?;
        let mut habit = self.sync_habit_logic(&conn, habit, now);

        if habit.current_charges > 0 {
            habit.current_charges -= 1;
            
            if Self::is_positive(&habit.habit_type) {
                habit.current_streak += 1;
                if habit.current_streak > habit.max_streak {
                    habit.max_streak = habit.current_streak;
                }
                
                let yesterday = now - chrono::Duration::days(1);
                habit.last_done = Some(yesterday.to_rfc3339());
                habit.charges_used += 1;
            } 
            
            conn.execute(
                "UPDATE habits SET current_charges = ?1, charges_used = ?2, last_done = ?3, current_streak = ?4, max_streak = ?5 WHERE id = ?6",
                params![habit.current_charges, habit.charges_used, habit.last_done, habit.current_streak, habit.max_streak, id],
            ).map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    pub fn delete_habit(&self, id: i32) -> Result<(), String> {
        let conn = self.get_connection();
        
        // Verifica se tem logs concluídos
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM habit_logs WHERE habit_id = ?1").map_err(|e| e.to_string())?;
        let has_logs: i32 = stmt.query_row(params![id], |row| row.get(0)).map_err(|e| e.to_string())?;
        
        if has_logs > 0 {
            // Se tiver logs concluídos, apenas arquiva para manter estatísticas e históricos
            conn.execute("UPDATE habits SET archived = 1 WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
        } else {
            // Se não tiver nenhum log concluído, deleta fisicamente
            let _ = conn.execute("DELETE FROM habit_logs WHERE habit_id = ?1", params![id]);
            conn.execute("DELETE FROM habits WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn export_csv(&self, user_id: &str, path: &str, now: DateTime<Utc>) -> Result<(), String> {
        let habits = self.list_habits(user_id, now);
        let mut wtr = csv::Writer::from_path(path).map_err(|e| e.to_string())?;
        wtr.write_record(&["name", "habit_type", "max_streak", "current_streak", "cooldown_days", "current_charges", "charges_amount"]).map_err(|e| e.to_string())?;
        for h in habits {
            wtr.write_record(&[
                h.name,
                h.habit_type,
                h.max_streak.to_string(),
                h.current_streak.to_string(),
                h.cooldown_days.to_string(),
                h.current_charges.to_string(),
                h.charges_amount.to_string(),
            ]).map_err(|e| e.to_string())?;
        }
        wtr.flush().map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn import_csv(&self, user_id: &str, path: &str) -> Result<usize, String> {
        let mut rdr = csv::Reader::from_path(path).map_err(|e| e.to_string())?;
        let mut count = 0;
        let now_iso = Utc::now().to_rfc3339();
        for result in rdr.records() {
            let record = result.map_err(|e| e.to_string())?;
            let habit = Habit {
                id: None,
                user_id: user_id.to_string(),
                name: record.get(0).unwrap_or_default().to_string(),
                habit_type: record.get(1).unwrap_or("positive").to_string(),
                last_slip: now_iso.clone(),
                created_at: now_iso.clone(),
                max_streak: record.get(2).and_then(|s| s.parse().ok()).unwrap_or(0),
                current_streak: record.get(3).and_then(|s| s.parse().ok()).unwrap_or(0),
                cooldown_days: record.get(4).and_then(|s| s.parse().ok()).unwrap_or(1),
                last_done: None,
                charges_used: 0,
                charges_amount: record.get(6).and_then(|s| s.parse().ok()).unwrap_or(0),
                charges_interval_days: 1,
                accumulates: false,
                last_charge_refill: now_iso.clone(),
                current_charges: record.get(5).and_then(|s| s.parse().ok()).unwrap_or(0),
                goal_days: Some(0),
                frequency: Some("daily".to_string()),
                weekdays: None,
                completed_dates: None,
                archived: Some(false),
            };
            let _ = self.add_habit(habit);
            count += 1;
        }
        Ok(count)
    }
}

#[tauri::command]
pub async fn habit_list_habits(state: tauri::State<'_, crate::AppState>, user_id: String) -> Result<Vec<Habit>, String> {
    let now = state.config.get_now();
    Ok(state.habit.list_habits(&user_id, now))
}

#[tauri::command]
pub async fn habit_add_habit(state: tauri::State<'_, crate::AppState>, habit: Habit) -> Result<(), String> {
    state.habit.add_habit(habit)
}

#[tauri::command]
pub async fn habit_update_habit(state: tauri::State<'_, crate::AppState>, habit: Habit) -> Result<(), String> {
    state.habit.update_habit(habit)
}

#[tauri::command]
pub async fn habit_toggle_date(
    state: tauri::State<'_, crate::AppState>, 
    id: i32, 
    date: String, 
    completed: bool
) -> Result<(), String> {
    let now = state.config.get_now();
    state.habit.toggle_date(id, &date, completed, now)
}

#[tauri::command]
pub async fn habit_mark_habit_done(
    state: tauri::State<'_, crate::AppState>, 
    id: i32, 
    _user_id: Option<String>, 
    timestamp: Option<String>
) -> Result<(), String> {
    let now = state.config.get_now();
    let ts = timestamp.unwrap_or_else(|| now.with_timezone(&chrono::Local).format("%Y-%m-%d").to_string());
    let date_only = if ts.contains('T') {
        ts.split('T').next().unwrap_or(&ts).to_string()
    } else {
        ts
    };
    state.habit.toggle_date(id, &date_only, true, now)
}

#[tauri::command]
pub async fn habit_use_habit_charge(
    state: tauri::State<'_, crate::AppState>, 
    id: i32, 
    _user_id: Option<String>
) -> Result<(), String> {
    let now = state.config.get_now();
    state.habit.use_charge(id, now)
}

#[tauri::command]
pub async fn habit_reset_habit(
    state: tauri::State<'_, crate::AppState>, 
    id: i32, 
    _user_id: Option<String>, 
    timestamp: Option<String>
) -> Result<(), String> {
    let now = state.config.get_now();
    let ts = timestamp.unwrap_or_default();
    state.habit.reset_habit(id, &ts, now)
}

#[tauri::command]
pub async fn habit_hard_reset_habit(state: tauri::State<'_, crate::AppState>, id: i32, _user_id: Option<String>, _timestamp: Option<String>) -> Result<(), String> {
    let now = state.config.get_now().to_rfc3339();
    state.habit.hard_reset_habit(id, &now)
}

#[tauri::command]
pub async fn habit_delete_habit(state: tauri::State<'_, crate::AppState>, id: i32, _user_id: Option<String>) -> Result<(), String> {
    state.habit.delete_habit(id)
}

#[tauri::command]
pub async fn habit_export_habits_csv(state: tauri::State<'_, crate::AppState>, user_id: String, dest_path: String) -> Result<(), String> {
    let now = state.config.get_now();
    state.habit.export_csv(&user_id, &dest_path, now)
}

#[tauri::command]
pub async fn habit_import_habits_csv(state: tauri::State<'_, crate::AppState>, user_id: String, file_path: String) -> Result<usize, String> {
    state.habit.import_csv(&user_id, &file_path)
}

