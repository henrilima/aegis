use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

// ─── Estruturas ─────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CrossMetric {
    pub date: String,
    pub sleep_hours: f64,
    pub study_hours: f64,
    pub study_hit_rate: f64,   // % acerto geral
    pub questions_total: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SubjectStats {
    pub name: String,
    pub hours: f64,
    pub hit_rate: f64,
    pub percent_total: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PerformanceSummary {
    pub avg_sleep_hours: f64,
    pub avg_study_hours: f64,
    pub avg_hit_rate: f64,
    pub best_sleep_day: Option<String>,
    pub best_study_day: Option<String>,
    pub correlation_label: String,
    pub total_days_analyzed: i32,
    pub study_streak_days: i32,
    pub sleep_streak_days: i32,
    pub peak_study_subject: Option<String>,
    // Novas métricas
    pub consistency_score: f64,     // % de dias com alguma atividade
    pub study_efficiency: f64,      // questões por hora
    pub rested_hit_rate: f64,       // acerto quando dorme > 7.5h
    pub tired_hit_rate: f64,        // acerto quando dorme < 6h
    pub subject_distribution: Vec<SubjectStats>,
}

// ─── Manager ────────────────────────────────────────────────────────────────

pub struct StatisticsManager {
    db_path: PathBuf,
}

impl StatisticsManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("app data dir");
        let db_path = app_dir.join("passwords.db");
        Self { db_path }
    }

    fn conn(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("open db");
        conn.busy_timeout(std::time::Duration::from_millis(5000))
            .expect("failed to set busy timeout");
        conn
    }

    /// Retorna métricas cruzadas (sono + estudo) para os últimos N dias
    #[allow(clippy::cast_precision_loss)]
    pub fn get_cross_metrics(&self, user_id: &str, days: i32) -> Vec<CrossMetric> {
        let conn = self.conn();
        let cutoff = format!("-{} days", days);

        // Busca sessões de estudo agrupadas por data
        let mut study_stmt = conn.prepare(
            "SELECT date,
                    SUM(hours) as total_hours,
                    SUM(questions_new + questions_review) as total_q,
                    SUM(correct_new + correct_review) as total_c
             FROM study_sessions
             WHERE user_id=?1 AND date >= date('now', ?2)
             GROUP BY date
             ORDER BY date ASC"
        ).unwrap();

        let study_rows: Vec<(String, f64, i32, i32)> = study_stmt
            .query_map(params![user_id, cutoff], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, f64>(1)?,
                    row.get::<_, i32>(2)?,
                    row.get::<_, i32>(3)?,
                ))
            }).unwrap()
            .filter_map(|r| r.ok())
            .collect();

        // Busca entradas de sono
        let mut sleep_stmt = conn.prepare(
            "SELECT date, duration_minutes FROM sleep_entries
             WHERE user_id=?1 AND date >= date('now', ?2)
             ORDER BY date ASC"
        ).unwrap();

        let sleep_map: std::collections::HashMap<String, f64> = sleep_stmt
            .query_map(params![user_id, cutoff], |row| {
                let date: String = row.get(0)?;
                let mins: i32 = row.get(1)?;
                Ok((date, mins as f64 / 60.0))
            }).unwrap()
            .filter_map(|r| r.ok())
            .collect();

        study_rows.into_iter().map(|(date, sh, tq, tc)| {
            let sleep_hours = sleep_map.get(&date).copied().unwrap_or(0.0);
            let hit_rate = if tq > 0 { (tc as f64 / tq as f64) * 100.0 } else { 0.0 };
            CrossMetric {
                date,
                sleep_hours,
                study_hours: sh,
                study_hit_rate: (hit_rate * 10.0).round() / 10.0,
                questions_total: tq,
            }
        }).collect()
    }

    /// Gera resumo geral de desempenho
    #[allow(clippy::cast_precision_loss)]
    pub fn get_performance_summary(&self, user_id: &str, days: i32) -> PerformanceSummary {
        let metrics = self.get_cross_metrics(user_id, days);
        let conn = self.conn();
        let cutoff = format!("-{} days", days);

        if metrics.is_empty() {
            return PerformanceSummary {
                avg_sleep_hours: 0.0,
                avg_study_hours: 0.0,
                avg_hit_rate: 0.0,
                best_sleep_day: None,
                best_study_day: None,
                correlation_label: "Neutra".to_string(),
                total_days_analyzed: 0,
                study_streak_days: 0,
                sleep_streak_days: 0,
                peak_study_subject: None,
                consistency_score: 0.0,
                study_efficiency: 0.0,
                rested_hit_rate: 0.0,
                tired_hit_rate: 0.0,
                subject_distribution: vec![],
            };
        }

        let n = metrics.len() as f64;
        let total_sleep: f64 = metrics.iter().map(|m| m.sleep_hours).sum();
        let total_study: f64 = metrics.iter().map(|m| m.study_hours).sum();
        let total_questions: i32 = metrics.iter().map(|m| m.questions_total).sum();
        
        let avg_sleep = total_sleep / n;
        let avg_study = total_study / n;
        let avg_hit = metrics.iter().filter(|m| m.questions_total > 0).map(|m| m.study_hit_rate).sum::<f64>()
            / metrics.iter().filter(|m| m.questions_total > 0).count().max(1) as f64;

        let best_sleep = metrics.iter().max_by(|a, b| a.sleep_hours.partial_cmp(&b.sleep_hours).unwrap())
            .map(|m| m.date.clone());
        let best_study = metrics.iter().max_by(|a, b| a.study_hours.partial_cmp(&b.study_hours).unwrap())
            .map(|m| m.date.clone());

        // Novas métricas
        let consistency_score = (metrics.len() as f64 / days as f64) * 100.0;
        let study_efficiency = if total_study > 0.0 { total_questions as f64 / total_study } else { 0.0 };

        let (rested_sum, rested_count) = metrics.iter()
            .filter(|m| m.sleep_hours >= 7.5 && m.questions_total > 0)
            .fold((0.0, 0), |(s, c), m| (s + m.study_hit_rate, c + 1));
        let rested_hr = if rested_count > 0 { rested_sum / rested_count as f64 } else { 0.0 };

        let (tired_sum, tired_count) = metrics.iter()
            .filter(|m| m.sleep_hours > 0.0 && m.sleep_hours <= 6.0 && m.questions_total > 0)
            .fold((0.0, 0), |(s, c), m| (s + m.study_hit_rate, c + 1));
        let tired_hr = if tired_count > 0 { tired_sum / tired_count as f64 } else { 0.0 };

        // Distribuição por matéria
        let mut subject_distribution = vec![];
        {
            let mut stmt = conn.prepare(
                "SELECT subject, SUM(hours) as sh, 
                        SUM(questions_new + questions_review) as tq,
                        SUM(correct_new + correct_review) as tc
                 FROM study_sessions
                 WHERE user_id=?1 AND date >= date('now', ?2)
                 GROUP BY subject ORDER BY sh DESC LIMIT 10"
            ).unwrap();
            
            let rows = stmt.query_map(params![user_id, cutoff], |row| {
                let name: String = row.get(0)?;
                let hours: f64 = row.get(1)?;
                let tq: i32 = row.get(2)?;
                let tc: i32 = row.get(3)?;
                let hr = if tq > 0 { (tc as f64 / tq as f64) * 100.0 } else { 0.0 };
                Ok(SubjectStats {
                    name,
                    hours,
                    hit_rate: (hr * 10.0).round() / 10.0,
                    percent_total: if total_study > 0.0 { (hours / total_study) * 100.0 } else { 0.0 },
                })
            }).unwrap().filter_map(|r| r.ok());
            
            subject_distribution = rows.collect();
        }

        let peak_subject = subject_distribution.first().map(|s| s.name.clone());

        let pairs_with_sleep: Vec<(f64, f64)> = metrics.iter()
            .filter(|m| m.sleep_hours > 0.0 && m.questions_total > 0)
            .map(|m| (m.sleep_hours, m.study_hit_rate))
            .collect();

        let correlation_label = if pairs_with_sleep.len() >= 3 {
            let mean_x = pairs_with_sleep.iter().map(|(x, _)| x).sum::<f64>() / pairs_with_sleep.len() as f64;
            let mean_y = pairs_with_sleep.iter().map(|(_, y)| y).sum::<f64>() / pairs_with_sleep.len() as f64;
            let cov = pairs_with_sleep.iter().map(|(x, y)| (x - mean_x) * (y - mean_y)).sum::<f64>();
            if cov > 1.0 { "Positiva".to_string() }
            else if cov < -1.0 { "Negativa".to_string() }
            else { "Neutra".to_string() }
        } else { "Neutra".to_string() };

        // Streaks
        let study_streak = self.calculate_streak(user_id, "study_sessions", &cutoff);
        let sleep_streak = self.calculate_streak(user_id, "sleep_entries", &cutoff);

        PerformanceSummary {
            avg_sleep_hours: (avg_sleep * 100.0).round() / 100.0,
            avg_study_hours: (avg_study * 100.0).round() / 100.0,
            avg_hit_rate: (avg_hit * 10.0).round() / 10.0,
            best_sleep_day: best_sleep,
            best_study_day: best_study,
            correlation_label,
            total_days_analyzed: metrics.len() as i32,
            study_streak_days: study_streak,
            sleep_streak_days: sleep_streak,
            peak_study_subject: peak_subject,
            consistency_score: (consistency_score * 10.0).round() / 10.0,
            study_efficiency: (study_efficiency * 10.0).round() / 10.0,
            rested_hit_rate: (rested_hr * 10.0).round() / 10.0,
            tired_hit_rate: (tired_hr * 10.0).round() / 10.0,
            subject_distribution,
        }
    }

    fn calculate_streak(&self, user_id: &str, table: &str, cutoff: &str) -> i32 {
        let conn = self.conn();
        let sql = format!(
            "SELECT date FROM {} WHERE user_id=?1 AND date >= date('now', ?2)
             GROUP BY date ORDER BY date DESC",
            table
        );
        let mut stmt = conn.prepare(&sql).unwrap();
        let dates: Vec<String> = stmt.query_map(params![user_id, cutoff], |row| row.get(0))
            .unwrap().filter_map(|r| r.ok()).collect();
        
        if dates.is_empty() { return 0; }
        
        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        let yesterday = (chrono::Local::now() - chrono::Duration::days(1)).format("%Y-%m-%d").to_string();
        
        // Se não estudou nem hoje nem ontem, streak é 0
        if dates[0] != today && dates[0] != yesterday { return 0; }
        
        let mut streak = 0;
        let mut expected = dates[0].clone();
        for date in dates {
            if date == expected {
                streak += 1;
                let d = chrono::NaiveDate::parse_from_str(&expected, "%Y-%m-%d").unwrap();
                expected = (d - chrono::Duration::days(1)).format("%Y-%m-%d").to_string();
            } else {
                break;
            }
        }
        streak
    }
}

