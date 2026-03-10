use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use chrono::{DateTime, Utc};
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


    fn sync_habit_logic(&self, conn: &Connection, mut habit: Habit) -> Habit {
        let now = Utc::now();
        let mut changed = false;

        // 1. Refill charges
        if habit.charges_amount > 0 && habit.charges_interval_days > 0 {
            let last_refill = DateTime::parse_from_rfc3339(&habit.last_charge_refill)
                .unwrap_or_else(|_| DateTime::parse_from_rfc3339(&habit.created_at).unwrap())
                .with_timezone(&Utc);
            
            let days_passed = (now - last_refill).num_days() as i32;
            if days_passed >= habit.charges_interval_days {
                let times = days_passed / habit.charges_interval_days;
                if habit.accumulates {
                    habit.current_charges += habit.charges_amount * times;
                } else {
                    habit.current_charges = habit.charges_amount;
                }
                let next_refill = last_refill + chrono::Duration::days((times * habit.charges_interval_days) as i64);
                habit.last_charge_refill = next_refill.to_rfc3339();
                changed = true;
            }
        }

        // 2. Auto-consume charges for Positive habits if missed
        if habit.habit_type == "Positive" {
            let cooldown = if habit.cooldown_days > 0 { habit.cooldown_days } else { 1 };
            
            loop {
                let last_done_dt = match &habit.last_done {
                    Some(ld) => DateTime::parse_from_rfc3339(ld).unwrap_or_else(|_| DateTime::parse_from_rfc3339(&habit.last_slip).unwrap()).with_timezone(&Utc),
                    None => DateTime::parse_from_rfc3339(&habit.last_slip).unwrap().with_timezone(&Utc),
                };

                // Se passou do tempo (cooldown + 1 dia de margem)
                if (now - last_done_dt).num_days() as i32 > cooldown {
                    if habit.current_charges > 0 {
                        habit.current_charges -= 1;
                        // Simulamos que foi feito no dia esperado para manter a sequência
                        let next_done = last_done_dt + chrono::Duration::days(cooldown as i64);
                        habit.last_done = Some(next_done.to_rfc3339());
                        changed = true;
                    } else {
                        // Perdeu a sequência
                        habit.last_slip = now.to_rfc3339();
                        habit.last_done = None;
                        changed = true;
                        break;
                    }
                } else {
                    break;
                }
            }
        }

        // 3. Update Max Streak
        let last_slip_dt = DateTime::parse_from_rfc3339(&habit.last_slip).unwrap().with_timezone(&Utc);
        let current_streak = (now - last_slip_dt).num_days() as i32;
        if current_streak > habit.max_streak {
            habit.max_streak = current_streak;
            changed = true;
        }

        if changed {
            conn.execute(
                "UPDATE habits SET last_slip = ?1, last_done = ?2, charges_used = ?3, last_charge_refill = ?4, current_charges = ?5, max_streak = ?6 WHERE id = ?7",
                params![habit.last_slip, habit.last_done, habit.charges_used, habit.last_charge_refill, habit.current_charges, habit.max_streak, habit.id],
            ).ok();
        }

        habit
    }

    pub fn list_habits(&self, user_id: &str) -> Vec<Habit> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare("SELECT id, user_id, name, habit_type, last_slip, created_at, max_streak, cooldown_days, last_done, charges_used, charges_amount, charges_interval_days, accumulates, last_charge_refill, current_charges FROM habits WHERE user_id = ?1").unwrap();
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
            })
        }).unwrap();

        rows.map(|r| {
            let h = r.unwrap();
            self.sync_habit_logic(&conn, h)
        }).collect()
    }

    pub fn add_habit(&self, habit: Habit) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "INSERT INTO habits (user_id, name, habit_type, last_slip, created_at, max_streak, cooldown_days, last_done, charges_used, charges_amount, charges_interval_days, accumulates, last_charge_refill, current_charges) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
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
                habit.charges_interval_days,
                if habit.accumulates { 1 } else { 0 },
                habit.last_charge_refill,
                habit.current_charges
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
                habit.charges_interval_days,
                if habit.accumulates { 1 } else { 0 },
                habit.id
            ],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    fn get_habit_by_id(&self, conn: &Connection, id: i32) -> Result<Habit, String> {
        let mut stmt = conn.prepare("SELECT id, user_id, name, habit_type, last_slip, created_at, max_streak, cooldown_days, last_done, charges_used, charges_amount, charges_interval_days, accumulates, last_charge_refill, current_charges FROM habits WHERE id = ?1").map_err(|e| e.to_string())?;
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
            })
        }).map_err(|e| e.to_string())
    }

    pub fn reset_habit(&self, id: i32, timestamp: &str) -> Result<(), String> {
        let conn = self.get_connection();
        let habit = self.get_habit_by_id(&conn, id)?;
        let synced_habit = self.sync_habit_logic(&conn, habit);

        // Reset sempre quebra a sequência (last_slip = agora)
        conn.execute(
            "UPDATE habits SET last_slip = ?1, last_done = ?2, charges_used = ?3 WHERE id = ?4",
            params![timestamp, None::<String>, synced_habit.charges_used + 1, id],
        ).map_err(|e| e.to_string())?;
        
        Ok(())
    }

    pub fn hard_reset_habit(&self, id: i32, timestamp: &str) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "UPDATE habits SET last_slip = ?1, last_done = NULL, max_streak = 0, charges_used = 0, current_charges = charges_amount, last_charge_refill = ?1 WHERE id = ?2",
            params![timestamp, id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn mark_done(&self, id: i32, timestamp: &str) -> Result<(), String> {
        let conn = self.get_connection();
        let habit = self.get_habit_by_id(&conn, id)?;
        let synced_habit = self.sync_habit_logic(&conn, habit);

        conn.execute(
            "UPDATE habits SET last_done = ?1, charges_used = ?2 WHERE id = ?3",
            params![timestamp, synced_habit.charges_used + 1, id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn use_charge(&self, id: i32) -> Result<(), String> {
        let conn = self.get_connection();
        let habit = self.get_habit_by_id(&conn, id)?;
        let mut habit = self.sync_habit_logic(&conn, habit);

        if habit.current_charges > 0 {
            habit.current_charges -= 1;
            habit.charges_used += 1;
            let now_iso = Utc::now().to_rfc3339();
            
            conn.execute(
                "UPDATE habits SET current_charges = ?1, charges_used = ?2, last_done = ?3 WHERE id = ?4",
                params![habit.current_charges, habit.charges_used, now_iso, id],
            ).map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    pub fn delete_habit(&self, id: i32) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute("DELETE FROM habits WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
        Ok(())
    }
}
