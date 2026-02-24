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
                charges_used INTEGER NOT NULL DEFAULT 0
            )",
            [],
        ).ok();

        
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN max_streak INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN cooldown_days INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN last_done TEXT", []);
        let _ = conn.execute("ALTER TABLE habits ADD COLUMN charges_used INTEGER NOT NULL DEFAULT 0", []);

        Self { db_path }
    }

    fn get_connection(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Failed to connect to habit DB");
        conn.busy_timeout(std::time::Duration::from_millis(5000)).expect("Failed to set busy timeout");
        conn
    }

    pub fn list_habits(&self, user_id: &str) -> Vec<Habit> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare("SELECT id, user_id, name, habit_type, last_slip, created_at, max_streak, cooldown_days, last_done, charges_used FROM habits WHERE user_id = ?1").unwrap();
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
            })
        }).unwrap();

        rows.map(|r| r.unwrap()).collect()
    }

    pub fn add_habit(&self, habit: Habit) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "INSERT INTO habits (user_id, name, habit_type, last_slip, created_at, max_streak, cooldown_days, last_done, charges_used) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![habit.user_id, habit.name, habit.habit_type, habit.last_slip, habit.created_at, habit.max_streak, habit.cooldown_days, habit.last_done, habit.charges_used],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn update_habit(&self, habit: Habit) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "UPDATE habits SET name = ?1, habit_type = ?2, cooldown_days = ?3 WHERE id = ?4",
            params![habit.name, habit.habit_type, habit.cooldown_days, habit.id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn reset_habit(&self, id: i32, timestamp: &str) -> Result<(), String> {
        let conn = self.get_connection();
        
        let mut stmt = conn.prepare("SELECT id, user_id, name, habit_type, last_slip, created_at, max_streak, cooldown_days, last_done, charges_used FROM habits WHERE id = ?1").map_err(|e| e.to_string())?;
        let habit: Habit = stmt.query_row(params![id], |row| {
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
            })
        }).map_err(|e| e.to_string())?;

        let last_slip = DateTime::parse_from_rfc3339(&habit.last_slip).map_err(|e| e.to_string())?.with_timezone(&Utc);
        let now = Utc::now();
        let current_streak = (now - last_slip).num_days() as i32;
        let new_max = if current_streak > habit.max_streak { current_streak } else { habit.max_streak };

        if habit.habit_type == "Positive" {
            
            conn.execute(
                "UPDATE habits SET last_slip = ?1, last_done = NULL, max_streak = ?2, charges_used = 0 WHERE id = ?3",
                params![timestamp, new_max, id],
            ).map_err(|e| e.to_string())?;
        } else {
            
            conn.execute(
                "UPDATE habits SET last_slip = ?1, last_done = ?1, max_streak = ?2, charges_used = ?3 WHERE id = ?4",
                params![timestamp, new_max, habit.charges_used + 1, id],
            ).map_err(|e| e.to_string())?;
        }
        
        Ok(())
    }

    pub fn hard_reset_habit(&self, id: i32, timestamp: &str) -> Result<(), String> {
        let conn = self.get_connection();
        
        conn.execute(
            "UPDATE habits SET last_slip = ?1, last_done = NULL, max_streak = 0, charges_used = 0 WHERE id = ?2",
            params![timestamp, id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn mark_done(&self, id: i32, timestamp: &str) -> Result<(), String> {
        let conn = self.get_connection();
        let now = Utc::now();
        
        let mut stmt = conn.prepare("SELECT id, user_id, name, habit_type, last_slip, created_at, max_streak, cooldown_days, last_done, charges_used FROM habits WHERE id = ?1").map_err(|e| e.to_string())?;
        let habit: Habit = stmt.query_row(params![id], |row| {
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
            })
        }).map_err(|e| e.to_string())?;

        let mut current_charges = habit.charges_used;

        
        if habit.habit_type == "Positive" {
            if let Some(ld_str) = habit.last_done {
                let ld = DateTime::parse_from_rfc3339(&ld_str).map_err(|e| e.to_string())?.with_timezone(&Utc);
                let diff_days = (now - ld).num_days() as i32;
                if diff_days > (habit.cooldown_days + 1) {
                    current_charges = 0;
                    conn.execute("UPDATE habits SET last_slip = ?1 WHERE id = ?2", params![timestamp, id]).ok();
                }
            }
        }

        let new_charges = current_charges + 1;
        let mut final_max = habit.max_streak;
        if habit.habit_type == "Positive" {
             if new_charges > habit.max_streak { final_max = new_charges; }
        } else {
            let ls = DateTime::parse_from_rfc3339(&habit.last_slip).map_err(|e| e.to_string())?.with_timezone(&Utc);
            let current_days = (now - ls).num_days() as i32;
            if current_days > habit.max_streak { final_max = current_days; }
        }

        conn.execute(
            "UPDATE habits SET last_done = ?1, charges_used = ?2, max_streak = ?3 WHERE id = ?4",
            params![timestamp, new_charges, final_max, id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn use_charge(&self, id: i32) -> Result<(), String> {
        let conn = self.get_connection();
        let now = Utc::now();
        let now_iso = now.to_rfc3339();

        let mut stmt = conn.prepare("SELECT id, user_id, name, habit_type, last_slip, created_at, max_streak, cooldown_days, last_done, charges_used FROM habits WHERE id = ?1").map_err(|e| e.to_string())?;
        let habit: Habit = stmt.query_row(params![id], |row| {
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
            })
        }).map_err(|e| e.to_string())?;

        let last_slip = DateTime::parse_from_rfc3339(&habit.last_slip).map_err(|e| e.to_string())?.with_timezone(&Utc);
        let current_streak = (now - last_slip).num_days() as i32;
        let new_max = if current_streak > habit.max_streak { current_streak } else { habit.max_streak };

        conn.execute(
            "UPDATE habits SET charges_used = ?1, last_done = ?2, max_streak = ?3 WHERE id = ?4",
            params![habit.charges_used + 1, now_iso, new_max, id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_habit(&self, id: i32) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute("DELETE FROM habits WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
        Ok(())
    }
}
