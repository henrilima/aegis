use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::AppHandle;


// Estruturas de Dados

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CrossMetric {
    pub date: String,
    pub sleep_hours: f64,
    pub study_hours: f64,
    pub study_hit_rate: f64,   // Taxa de acerto global (%)
    pub questions_total: i32,
    pub focus_score: Option<f64>,
    pub reading_pages: i32,
    pub reading_minutes: i32,
    pub reading_ppm: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SubjectStats {
    pub name: String,
    pub hours: f64,
    pub hit_rate: f64,
    pub percent_total: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
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
    pub reading_streak_days: i32,
    pub peak_study_subject: Option<String>,
    pub avg_reading_pages: f64,
    pub avg_reading_minutes: f64,
    pub avg_ppm: f64,
    // Métricas calculadas
    pub consistency_score: f64,     // % de dias com atividade
    pub study_efficiency: f64,      // Questões resolvidas por hora
    pub rested_hit_rate: f64,       // Taxa de acerto com > 7.5h de sono
    pub tired_hit_rate: f64,        // Taxa de acerto com < 6h de sono
    pub avg_focus_score: f64,
    pub focus_hit_rate_high: f64,   // Taxa de acerto com foco >= 4
    pub focus_hit_rate_low: f64,    // Taxa de acerto com foco <= 2
    pub subject_distribution: Vec<SubjectStats>,
}


// Gerenciador de Estatísticas

pub struct StatisticsManager {
    db_path: PathBuf,
}

impl StatisticsManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let db_path = crate::config::get_database_path(app_handle);
        Self { db_path }
    }

    fn conn(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Falha ao abrir banco");
        conn.busy_timeout(std::time::Duration::from_millis(5000))
            .expect("failed to set busy timeout");
        conn
    }

    /// Retorna métricas cruzadas (sono + estudo) para os últimos N dias
    #[allow(clippy::cast_precision_loss)]
    pub fn get_cross_metrics(&self, user_id: &str, days: i32, now: DateTime<Utc>) -> Vec<CrossMetric> {
        let conn = self.conn();
        let mut metrics = Vec::new();

        let now_local = now.with_timezone(&chrono::Local);
        // Gera lista de datas para o período
        for i in (0..days).rev() {
            let date = (now_local - chrono::Duration::days(i as i64)).format("%Y-%m-%d").to_string();
            
            // Busca dados de estudo para este dia
            let study_data: (f64, i32, i32, Option<f64>) = conn.query_row(
                "SELECT SUM(hours), SUM(questions_new + questions_review), SUM(correct_new + correct_review), AVG(focus_score)
                 FROM study_sessions WHERE user_id=?1 AND date=?2",
                params![user_id, date],
                |row| {
                    Ok((
                        row.get::<_, Option<f64>>(0)?.unwrap_or(0.0),
                        row.get::<_, Option<i32>>(1)?.unwrap_or(0),
                        row.get::<_, Option<i32>>(2)?.unwrap_or(0),
                        row.get::<_, Option<f64>>(3)?,
                    ))
                }
            ).unwrap_or((0.0, 0, 0, None));

            // Busca dados de sono
            let sleep_hours: f64 = conn.query_row(
                "SELECT duration_minutes FROM sleep_entries WHERE user_id=?1 AND date=?2",
                params![user_id, date],
                |row| Ok(row.get::<_, i32>(0)? as f64 / 60.0)
            ).unwrap_or(0.0);

            // Busca dados de leitura
            let reading_data: (i32, i32) = conn.query_row(
                "SELECT SUM(pages_read), SUM(duration_minutes) FROM reading_sessions WHERE user_id=?1 AND date=?2",
                params![user_id, date],
                |row| {
                    Ok((
                        row.get::<_, Option<i32>>(0)?.unwrap_or(0),
                        row.get::<_, Option<i32>>(1)?.unwrap_or(0),
                    ))
                }
            ).unwrap_or((0, 0));

            let hit_rate = if study_data.1 > 0 { (study_data.2 as f64 / study_data.1 as f64) * 100.0 } else { 0.0 };
            let ppm = if reading_data.1 > 0 { reading_data.0 as f64 / reading_data.1 as f64 } else { 0.0 };

            metrics.push(CrossMetric {
                date,
                sleep_hours,
                study_hours: study_data.0,
                study_hit_rate: (hit_rate * 10.0).round() / 10.0,
                questions_total: study_data.1,
                focus_score: study_data.3,
                reading_pages: reading_data.0,
                reading_minutes: reading_data.1,
                reading_ppm: (ppm * 10.0).round() / 10.0,
            });
        }

        metrics
    }

    /// Gera resumo geral de desempenho
    #[allow(clippy::cast_precision_loss)]
    pub fn get_performance_summary(&self, user_id: &str, days: i32, now: DateTime<Utc>) -> PerformanceSummary {
        let metrics = self.get_cross_metrics(user_id, days, now);
        let conn = self.conn();
        let now_local = now.with_timezone(&chrono::Local);
        let cutoff_date = (now_local - chrono::Duration::days(days as i64)).format("%Y-%m-%d").to_string();

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
                reading_streak_days: 0,
                peak_study_subject: None,
                avg_reading_pages: 0.0,
                avg_reading_minutes: 0.0,
                avg_ppm: 0.0,
                consistency_score: 0.0,
                study_efficiency: 0.0,
                rested_hit_rate: 0.0,
                tired_hit_rate: 0.0,
                avg_focus_score: 0.0,
                focus_hit_rate_high: 0.0,
                focus_hit_rate_low: 0.0,
                subject_distribution: vec![],
            };
        }

        let n = metrics.len() as f64;
        let total_sleep: f64 = metrics.iter().map(|m| m.sleep_hours).sum();
        let total_study: f64 = metrics.iter().map(|m| m.study_hours).sum();
        let total_reading_pages: i32 = metrics.iter().map(|m| m.reading_pages).sum();
        let total_reading_minutes: i32 = metrics.iter().map(|m| m.reading_minutes).sum();
        let total_questions: i32 = metrics.iter().map(|m| m.questions_total).sum();
        
        let avg_sleep = total_sleep / n;
        let avg_study = total_study / n;
        let avg_reading_p = total_reading_pages as f64 / n;
        let avg_reading_m = total_reading_minutes as f64 / n;
        let avg_hit = metrics.iter().filter(|m| m.questions_total > 0).map(|m| m.study_hit_rate).sum::<f64>()
            / metrics.iter().filter(|m| m.questions_total > 0).count().max(1) as f64;

        let best_sleep = metrics.iter().max_by(|a, b| a.sleep_hours.partial_cmp(&b.sleep_hours).unwrap_or(std::cmp::Ordering::Equal))
            .map(|m| m.date.clone());
        let best_study = metrics.iter().max_by(|a, b| a.study_hours.partial_cmp(&b.study_hours).unwrap_or(std::cmp::Ordering::Equal))
            .map(|m| m.date.clone());

        // Novas métricas
        let active_days = metrics.iter().filter(|m| {
            m.sleep_hours > 0.0 || m.study_hours > 0.0 || m.reading_pages > 0
        }).count();
        let consistency_score = (active_days as f64 / days as f64) * 100.0;
        let study_efficiency = if total_study > 0.0 { total_questions as f64 / total_study } else { 0.0 };

        let (rested_sum, rested_count) = metrics.iter()
            .filter(|m| m.sleep_hours >= 7.5 && m.questions_total > 0)
            .fold((0.0, 0), |(s, c), m| (s + m.study_hit_rate, c + 1));
        let rested_hr = if rested_count > 0 { rested_sum / rested_count as f64 } else { 0.0 };

        let (tired_sum, tired_count) = metrics.iter()
            .filter(|m| m.sleep_hours > 0.0 && m.sleep_hours <= 6.0 && m.questions_total > 0)
            .fold((0.0, 0), |(s, c), m| (s + m.study_hit_rate, c + 1));
        let tired_hr = if tired_count > 0 { tired_sum / tired_count as f64 } else { 0.0 };

        // Métricas de Foco
        let focus_metrics: Vec<&CrossMetric> = metrics.iter().filter(|m| m.focus_score.is_some()).collect();
        let avg_focus = if focus_metrics.is_empty() { 0.0 } else {
            focus_metrics.iter().filter_map(|m| m.focus_score).sum::<f64>() / focus_metrics.len() as f64
        };

        let (fh_sum, fh_count) = metrics.iter()
            .filter(|m| m.focus_score.unwrap_or(0.0) >= 4.0 && m.questions_total > 0)
            .fold((0.0, 0), |(s, c), m| (s + m.study_hit_rate, c + 1));
        let focus_hr_high = if fh_count > 0 { fh_sum / fh_count as f64 } else { 0.0 };

        let (fl_sum, fl_count) = metrics.iter()
            .filter(|m| m.focus_score.is_some() && m.focus_score.unwrap_or(10.0) <= 2.0 && m.questions_total > 0)
            .fold((0.0, 0), |(s, c), m| (s + m.study_hit_rate, c + 1));
        let focus_hr_low = if fl_count > 0 { fl_sum / fl_count as f64 } else { 0.0 };

        // Distribuição por matéria
        let mut subject_distribution = vec![];
        {
            let mut stmt = conn.prepare(
                "SELECT subject, SUM(hours) as sh, 
                        SUM(questions_new + questions_review) as tq,
                        SUM(correct_new + correct_review) as tc
                 FROM study_sessions
                 WHERE user_id=?1 AND date >= ?2
                 GROUP BY subject ORDER BY sh DESC LIMIT 10"
            ).unwrap();
            
            let rows = stmt.query_map(params![user_id, cutoff_date], |row| {
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
        let study_streak = self.calculate_streak(user_id, "study_sessions", &cutoff_date, now);
        let sleep_streak = self.calculate_streak(user_id, "sleep_entries", &cutoff_date, now);
        let reading_streak = self.calculate_streak(user_id, "reading_sessions", &cutoff_date, now);

        let active_reading_days = metrics.iter().filter(|m| m.reading_minutes > 0).count();
        let avg_ppm = if active_reading_days > 0 {
            metrics.iter().map(|m| m.reading_ppm).sum::<f64>() / active_reading_days as f64
        } else {
            0.0
        };

        PerformanceSummary {
            avg_sleep_hours: (avg_sleep * 100.0).round() / 100.0,
            avg_study_hours: (avg_study * 100.0).round() / 100.0,
            avg_reading_pages: (avg_reading_p * 10.0).round() / 10.0,
            avg_reading_minutes: (avg_reading_m * 10.0).round() / 10.0,
            avg_ppm: (avg_ppm * 10.0).round() / 10.0,
            avg_hit_rate: (avg_hit * 10.0).round() / 10.0,
            best_sleep_day: best_sleep,
            best_study_day: best_study,
            correlation_label,
            total_days_analyzed: metrics.len() as i32,
            study_streak_days: study_streak,
            sleep_streak_days: sleep_streak,
            reading_streak_days: reading_streak,
            peak_study_subject: peak_subject,
            consistency_score: (consistency_score * 10.0).round() / 10.0,
            study_efficiency: (study_efficiency * 10.0).round() / 10.0,
            rested_hit_rate: (rested_hr * 10.0).round() / 10.0,
            tired_hit_rate: (tired_hr * 10.0).round() / 10.0,
            avg_focus_score: (avg_focus * 10.0).round() / 10.0,
            focus_hit_rate_high: (focus_hr_high * 10.0).round() / 10.0,
            focus_hit_rate_low: (focus_hr_low * 10.0).round() / 10.0,
            subject_distribution,
        }
    }

    fn calculate_streak(&self, user_id: &str, table: &str, cutoff_date: &str, now: DateTime<Utc>) -> i32 {
        let conn = self.conn();
        let sql = format!(
            "SELECT date FROM {} WHERE user_id=?1 AND date >= ?2
             GROUP BY date ORDER BY date DESC",
            table
        );
        let mut stmt = match conn.prepare(&sql) {
            Ok(s) => s,
            Err(_) => return 0,
        };
        let dates: Vec<String> = match stmt.query_map(params![user_id, cutoff_date], |row| row.get(0)) {
            Ok(rows) => rows.filter_map(|r| r.ok()).collect(),
            Err(_) => vec![],
        };
        
        if dates.is_empty() { return 0; }
        
        let now_local = now.with_timezone(&chrono::Local);
        let today = now_local.format("%Y-%m-%d").to_string();
        let yesterday = (now_local - chrono::Duration::days(1)).format("%Y-%m-%d").to_string();
        
        // Se não estudou nem hoje nem ontem, streak é 0
        if dates[0] != today && dates[0] != yesterday { return 0; }
        
        let mut streak = 0;
        let mut expected = dates[0].clone();
        for date in dates {
            if date == expected {
                streak += 1;
                if let Ok(d) = chrono::NaiveDate::parse_from_str(&expected, "%Y-%m-%d") {
                    expected = (d - chrono::Duration::days(1)).format("%Y-%m-%d").to_string();
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        streak
    }
}

#[tauri::command]
pub async fn stats_get_cross_metrics(state: tauri::State<'_, crate::AppState>, user_id: String, days: i32) -> Result<Vec<CrossMetric>, String> {
    let now = state.config.get_now();
    Ok(state.stats.get_cross_metrics(&user_id, days, now))
}

#[tauri::command]
pub async fn stats_get_performance_summary(state: tauri::State<'_, crate::AppState>, user_id: String, days: i32) -> Result<PerformanceSummary, String> {
    let now = state.config.get_now();
    Ok(state.stats.get_performance_summary(&user_id, days, now))
}

