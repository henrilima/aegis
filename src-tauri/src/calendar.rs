use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};


// Estruturas de Dados

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CalendarEvent {
    pub id: Option<i64>,
    pub user_id: String,
    pub title: String,
    pub description: Option<String>,
    pub date: String,            // YYYY-MM-DD
    pub time: Option<String>,    // HH:MM opcional
    pub event_type: String,      // "event" | "deadline" | "holiday"
    pub deadline_category: Option<String>, // "prova" | "trabalho" | "simulado"
    pub color: Option<String>,
    pub is_holiday: Option<bool>,
    pub created_at: Option<String>,
}


#[derive(Debug, Deserialize)]
struct BrasilApiHoliday {
    date: String,
    name: String,
}

// Gerenciador de Calendário

pub struct CalendarManager {
    db_path: PathBuf,
}

impl CalendarManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Falha ao obter diretório de dados");
        let db_path = app_dir.join("passwords.db");

        let conn = Connection::open(&db_path).expect("Falha ao abrir banco");

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS calendar_events (
                id                 INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id            TEXT NOT NULL,
                title              TEXT NOT NULL,
                description        TEXT,
                date               TEXT NOT NULL,
                time               TEXT,
                event_type         TEXT NOT NULL DEFAULT 'event',
                deadline_category  TEXT,
                color              TEXT,
                is_holiday         BOOLEAN DEFAULT 0,
                created_at         TEXT NOT NULL DEFAULT (datetime('now'))
            );",
        ).ok();

        // Migração: Garante que is_holiday existe para DBs antigos
        let _ = conn.execute("ALTER TABLE calendar_events ADD COLUMN is_holiday BOOLEAN DEFAULT 0", []);

        // Migração: Atualiza cor dos feriados antigos de rosa para verde
        let _ = conn.execute("UPDATE calendar_events SET color='#22c55e' WHERE is_holiday=1 AND color='#ec4899'", []);

        Self { db_path }
    }

    fn conn(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Falha ao conectar");
        conn.busy_timeout(std::time::Duration::from_millis(5000))
            .expect("falha ao definir timeout de espera");
        conn
    }

    pub fn add_event(&self, ev: CalendarEvent) -> Result<i64, String> {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO calendar_events
             (user_id, title, description, date, time, event_type, deadline_category, color, is_holiday)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
            params![
                ev.user_id, ev.title, ev.description, ev.date, ev.time,
                ev.event_type, ev.deadline_category, ev.color, ev.is_holiday.unwrap_or(false)
            ],
        ).map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    pub fn update_event(&self, ev: CalendarEvent) -> Result<(), String> {
        let id = ev.id.ok_or("id ausente")?;
        let conn = self.conn();
        conn.execute(
            "UPDATE calendar_events SET
             title=?2, description=?3, date=?4, time=?5,
             event_type=?6, deadline_category=?7, color=?8, is_holiday=?9
             WHERE id=?1 AND user_id=?10",
            params![
                id,
                ev.title,
                ev.description,
                ev.date,
                ev.time,
                ev.event_type,
                ev.deadline_category,
                ev.color,
                ev.is_holiday.unwrap_or(false),
                ev.user_id
            ],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_event(&self, id: i64, user_id: &str) -> Result<(), String> {
        let conn = self.conn();
        conn.execute(
            "DELETE FROM calendar_events WHERE id=?1 AND user_id=?2",
            params![id, user_id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_events(&self, user_id: &str) -> Vec<CalendarEvent> {
        let conn = self.conn();
        let mut stmt = conn.prepare(
            "SELECT id, title, description, date, time, event_type, deadline_category, color, is_holiday, created_at
             FROM calendar_events WHERE user_id=?1
             ORDER BY date ASC, time ASC"
        ).unwrap();

        stmt.query_map(params![user_id], |row| {
            Ok(CalendarEvent {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                title: row.get(1)?,
                description: row.get(2)?,
                date: row.get(3)?,
                time: row.get(4)?,
                event_type: row.get(5)?,
                deadline_category: row.get(6)?,
                color: row.get(7)?,
                is_holiday: Some(row.get::<_, i32>(8)? != 0),
                created_at: row.get(9)?,
            })
        }).unwrap().filter_map(|r| r.ok()).collect()
    }

    pub fn list_upcoming_deadlines(&self, user_id: &str, now: DateTime<Utc>) -> Vec<CalendarEvent> {
        let conn = self.conn();
        let today_simple = now.format("%Y-%m-%d").to_string();
        let mut stmt = conn.prepare(
            "SELECT id, title, description, date, time, event_type, deadline_category, color, is_holiday, created_at
             FROM calendar_events
             WHERE user_id=?1 AND event_type='deadline' AND date >= ?2
             ORDER BY date ASC"
        ).unwrap();

        stmt.query_map(params![user_id, today_simple], |row| {
            Ok(CalendarEvent {
                id: Some(row.get(0)?),
                user_id: user_id.to_string(),
                title: row.get(1)?,
                description: row.get(2)?,
                date: row.get(3)?,
                time: row.get(4)?,
                event_type: row.get(5)?,
                deadline_category: row.get(6)?,
                color: row.get(7)?,
                is_holiday: Some(row.get::<_, i32>(8)? != 0),
                created_at: row.get(9)?,
            })
        }).unwrap().filter_map(|r| r.ok()).collect()
    }

    pub async fn sync_holidays(&self, user_id: &str, year: i32) -> Result<i32, String> {
        // Tenta buscar pela API primeiro
        let api_holidays = self.fetch_holidays_from_api(year).await;
        
        let holidays_to_sync = match api_holidays {
            Ok(list) => {
                list.into_iter().map(|h| (h.date, h.name)).collect::<Vec<_>>()
            },
            Err(e) => {
                log::warn!("Falha ao buscar feriados da API ({}). Usando cálculo local.", e);
                self.generate_local_holidays(year)
            }
        };

        let conn = self.conn();
        let mut count = 0;

        for (date, title) in holidays_to_sync {
            let exists: i32 = conn.query_row(
                "SELECT COUNT(*) FROM calendar_events WHERE user_id=?1 AND date=?2 AND is_holiday=1",
                params![user_id, date],
                |row| row.get(0),
            ).unwrap_or(0);

            if exists == 0 {
                conn.execute(
                    "INSERT INTO calendar_events (user_id, title, date, event_type, color, is_holiday)
                     VALUES (?1, ?2, ?3, 'holiday', '#22c55e', 1)",
                    params![user_id, title, date],
                ).map_err(|e| e.to_string())?;
                count += 1;
            }
        }

        Ok(count)
    }

    async fn fetch_holidays_from_api(&self, year: i32) -> Result<Vec<BrasilApiHoliday>, String> {
        let url = format!("https://brasilapi.com.br/api/feriados/v1/{}", year);
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(5))
            .build()
            .map_err(|e| e.to_string())?;

        let res = client.get(url).send().await.map_err(|e| e.to_string())?;
        if !res.status().is_success() {
            return Err(format!("API retornou erro status {}", res.status()));
        }

        let holidays: Vec<BrasilApiHoliday> = res.json().await.map_err(|e| e.to_string())?;
        Ok(holidays)
    }

    fn generate_local_holidays(&self, year: i32) -> Vec<(String, String)> {
        let mut h = Vec::new();
        // Feriados Fixos
        h.push((format!("{}-01-01", year), "Confraternização Universal".to_string()));
        h.push((format!("{}-04-21", year), "Tiradentes".to_string()));
        h.push((format!("{}-05-01", year), "Dia do Trabalho".to_string()));
        h.push((format!("{}-09-07", year), "Independência do Brasil".to_string()));
        h.push((format!("{}-10-12", year), "Nossa Senhora Aparecida".to_string()));
        h.push((format!("{}-11-02", year), "Finados".to_string()));
        h.push((format!("{}-11-15", year), "Proclamação da República".to_string()));
        h.push((format!("{}-11-20", year), "Dia da Consciência Negra".to_string()));
        h.push((format!("{}-12-25", year), "Natal".to_string()));

        // Feriados Móveis (Baseados na Páscoa) - Algoritmo de Butcher-Meeus
        let a = year % 19;
        let b = year / 100;
        let c = year % 100;
        let d = b / 4;
        let e = b % 4;
        let f = (b + 8) / 25;
        let g = (b - f + 1) / 3;
        let h_val = (19 * a + b - d - g + 15) % 30;
        let i = c / 4;
        let k = c % 4;
        let l = (32 + 2 * e + 2 * i - h_val - k) % 7;
        let m = (a + 11 * h_val + 22 * l) / 451;
        let month = (h_val + l - 7 * m + 114) / 31;
        let day = ((h_val + l - 7 * m + 114) % 31) + 1;

        let pascoa = chrono::NaiveDate::from_ymd_opt(year, month as u32, day as u32).unwrap();
        
        // Carnaval (47 dias antes)
        let carnaval = pascoa - chrono::Duration::days(47);
        h.push((carnaval.format("%Y-%m-%d").to_string(), "Carnaval".to_string()));
        
        // Sexta-feira Santa (2 dias antes)
        let sexta_santa = pascoa - chrono::Duration::days(2);
        h.push((sexta_santa.format("%Y-%m-%d").to_string(), "Sexta-feira Santa".to_string()));
        
        // Corpus Christi (60 dias depois)
        let corpus_christi = pascoa + chrono::Duration::days(60);
        h.push((corpus_christi.format("%Y-%m-%d").to_string(), "Corpus Christi".to_string()));

        h
    }
}
