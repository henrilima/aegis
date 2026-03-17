use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use chrono::{DateTime, Utc, Timelike};
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
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
}

pub struct HabitManager {
    db_path: PathBuf,
}

impl HabitManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
        let db_path = app_dir.join("passwords.db");
        
        let conn = Connection::open(&db_path).expect("Failed to open database");
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
                current_charges INTEGER NOT NULL DEFAULT 0
            )",
            [],
        ).ok();

        
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN max_streak INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN current_streak INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN cooldown_days INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN last_done TEXT", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN charges_used INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN charges_amount INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN charges_interval_days INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN accumulates INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN last_charge_refill TEXT NOT NULL DEFAULT ''", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN current_charges INTEGER NOT NULL DEFAULT 0", []);

        Self { db_path }
    }

    fn get_connection(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Failed to connect to habit DB");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Failed to set busy timeout");
        conn
    }


    fn sync_habit_logic(&self, conn: &Connection, mut habit: Habit, now: DateTime<Utc>) -> Habit {
        let now_date = now.date_naive();
        let mut changed = false;
        let l_type = habit.habit_type.to_lowercase();

        // 1. Consumo automático de cargas para hábitos positivos (antes da recarga)
        if l_type == "positive" {
            let cooldown = if habit.cooldown_days > 0 { habit.cooldown_days } else { 1 };
            
            loop {
                let last_done_dt = match &habit.last_done {
                    Some(ld) => DateTime::parse_from_rfc3339(ld).unwrap_or_else(|_| DateTime::parse_from_rfc3339(&habit.last_slip).unwrap()).with_timezone(&Utc),
                    None => DateTime::parse_from_rfc3339(&habit.created_at).unwrap_or_else(|_| DateTime::parse_from_rfc3339(&habit.last_slip).unwrap()).with_timezone(&Utc),
                };

                let last_done_date = last_done_dt.date_naive();
                let days_diff = (now_date - last_done_date).num_days() as i32;

                if days_diff > cooldown {
                    if habit.current_charges > 0 {
                        habit.current_charges -= 1;
                        habit.charges_used += 1; // Incrementa uso de carga
                        // Nota: streak atual não aumenta, apenas congela a sequência
                        
                        let next_done = last_done_date + chrono::Duration::days(cooldown as i64);
                        habit.last_done = Some(next_done.and_hms_opt(12, 0, 0).unwrap().and_local_timezone(Utc).unwrap().to_rfc3339());
                        changed = true;
                    } else {
                        // Quebra de sequência
                        habit.last_slip = now.to_rfc3339();
                        habit.last_done = None;
                        habit.current_streak = 0;
                        changed = true;
                        break;
                    }
                } else {
                    break;
                }
            }
        }

        // 2. Recarga de cargas (após verificação, respeitando 01:00 AM)
        if habit.charges_amount > 0 && habit.charges_interval_days >= 2 {
            let last_refill = DateTime::parse_from_rfc3339(&habit.last_charge_refill)
                .unwrap_or_else(|_| DateTime::parse_from_rfc3339(&habit.created_at).unwrap())
                .with_timezone(&Utc);
            
            let last_refill_date = last_refill.date_naive();
            
            // Ajuste para renovar apenas após as 01:00
            let effective_now_date = if now.hour() >= 1 {
                now_date
            } else {
                now_date - chrono::Duration::days(1)
            };

            let days_passed = (effective_now_date - last_refill_date).num_days() as i32;
            let effective_interval = habit.charges_interval_days.max(2);

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
                // Define o tempo de recarga para as 01:00 do dia em questão
                let next_refill = next_refill_date.and_hms_opt(1, 0, 0).unwrap().and_local_timezone(Utc).unwrap();
                
                habit.last_charge_refill = next_refill.to_rfc3339();
                changed = true;
            }
        }

        // 3. Atualiza streaks de hábitos negativos
        if l_type != "positive" {
            let last_slip_dt = DateTime::parse_from_rfc3339(&habit.last_slip).unwrap().with_timezone(&Utc);
            let last_slip_date = last_slip_dt.date_naive();
            habit.current_streak = (now_date - last_slip_date).num_days() as i32;
        }

        if habit.current_streak > habit.max_streak {
            habit.max_streak = habit.current_streak;
            changed = true;
        }

        if changed {
            conn.execute(
                "UPDATE habits SET last_slip = ?1, last_done = ?2, charges_used = ?3, last_charge_refill = ?4, current_charges = ?5, max_streak = ?6, current_streak = ?7 WHERE id = ?8",
                params![habit.last_slip, habit.last_done, habit.charges_used, habit.last_charge_refill, habit.current_charges, habit.max_streak, habit.current_streak, habit.id],
            ).ok();
        }

        habit
    }

    pub fn list_habits(&self, user_id: &str, now: DateTime<Utc>) -> Vec<Habit> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare("SELECT id, user_id, name, habit_type, last_slip, created_at, max_streak, cooldown_days, last_done, charges_used, charges_amount, charges_interval_days, accumulates, last_charge_refill, current_charges, current_streak FROM habits WHERE user_id = ?1").unwrap();
        let rows = stmt.query_map(params![user_id], |row| {
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
            })
        }).unwrap();

        rows.map(|r| {
            let h = r.unwrap();
            self.sync_habit_logic(&conn, h, now)
        }).collect()
    }

    pub fn add_habit(&self, habit: Habit) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "INSERT INTO habits (user_id, name, habit_type, last_slip, created_at, max_streak, cooldown_days, last_done, charges_used, charges_amount, charges_interval_days, accumulates, last_charge_refill, current_charges, current_streak) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
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
                habit.charges_interval_days.max(2),
                if habit.accumulates { 1 } else { 0 },
                habit.last_charge_refill,
                habit.current_charges,
                habit.current_streak
            ],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn update_habit(&self, habit: Habit) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "UPDATE habits SET name = ?1, habit_type = ?2, cooldown_days = ?3, charges_amount = ?4, charges_interval_days = ?5, accumulates = ?6 WHERE id = ?7",
            params![
                habit.name, 
                habit.habit_type, 
                habit.cooldown_days, 
                habit.charges_amount,
                habit.charges_interval_days.max(2),
                if habit.accumulates { 1 } else { 0 },
                habit.id
            ],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    fn get_habit_by_id(&self, conn: &Connection, id: i32) -> Result<Habit, String> {
        let mut stmt = conn.prepare("SELECT id, user_id, name, habit_type, last_slip, created_at, max_streak, cooldown_days, last_done, charges_used, charges_amount, charges_interval_days, accumulates, last_charge_refill, current_charges, current_streak FROM habits WHERE id = ?1").map_err(|e| e.to_string())?;
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
            })
        }).map_err(|e| e.to_string())
    }

    pub fn reset_habit(&self, id: i32, _timestamp: &str, now: DateTime<Utc>) -> Result<(), String> {
        let conn = self.get_connection();
        let habit = self.get_habit_by_id(&conn, id)?;
        let synced_habit = self.sync_habit_logic(&conn, habit, now);

        // Reset sempre quebra a sequência
        let now_iso = now.to_rfc3339();
        conn.execute(
            "UPDATE habits SET last_slip = ?1, last_done = ?2, charges_used = ?3, current_streak = 0 WHERE id = ?4",
            params![now_iso, None::<String>, synced_habit.charges_used + 1, id],
        ).map_err(|e| e.to_string())?;
        
        Ok(())
    }

    pub fn hard_reset_habit(&self, id: i32, timestamp: &str) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "UPDATE habits SET last_slip = ?1, last_done = NULL, max_streak = 0, current_streak = 0, charges_used = 0, current_charges = charges_amount, last_charge_refill = ?1 WHERE id = ?2",
            params![timestamp, id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn mark_done(&self, id: i32, _timestamp: &str, now: DateTime<Utc>) -> Result<(), String> {
        let conn = self.get_connection();
        let habit = self.get_habit_by_id(&conn, id)?;
        let mut synced_habit = self.sync_habit_logic(&conn, habit, now);

        if synced_habit.habit_type.to_lowercase() == "positive" {
            synced_habit.current_streak += 1;
            if synced_habit.current_streak > synced_habit.max_streak {
                synced_habit.max_streak = synced_habit.current_streak;
            }
        }

        let now_iso = now.to_rfc3339();
        conn.execute(
            "UPDATE habits SET last_done = ?1, charges_used = ?2, current_streak = ?3, max_streak = ?4 WHERE id = ?5",
            params![now_iso, synced_habit.charges_used + 1, synced_habit.current_streak, synced_habit.max_streak, id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }


    pub fn use_charge(&self, id: i32, now: DateTime<Utc>) -> Result<(), String> {
        let conn = self.get_connection();
        let habit = self.get_habit_by_id(&conn, id)?;
        let mut habit = self.sync_habit_logic(&conn, habit, now);

        if habit.current_charges > 0 {
            habit.current_charges -= 1;
            habit.charges_used += 1; 
            
            if habit.habit_type.to_lowercase() == "positive" {
                habit.current_streak += 1;
                if habit.current_streak > habit.max_streak {
                    habit.max_streak = habit.current_streak;
                }
                
                let yesterday = now - chrono::Duration::days(1);
                habit.last_done = Some(yesterday.to_rfc3339());
            } 
            
            conn.execute(
                "UPDATE habits SET current_charges = ?1, charges_used = ?2, last_done = ?3, current_streak = ?4, max_streak = ?5 WHERE id = ?6",
                params![habit.current_charges, habit.charges_used, habit.last_done, habit.current_streak, habit.max_streak, id],
            ).map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    pub fn refill_all_charges(&self, now: DateTime<Utc>) -> Result<(), String> {
        let conn = self.get_connection();
        let now_iso = now.to_rfc3339();
        conn.execute(
            "UPDATE habits SET current_charges = charges_amount, last_charge_refill = ?1",
            params![now_iso],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_habit(&self, id: i32) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute("DELETE FROM habits WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
        Ok(())
    }
}
