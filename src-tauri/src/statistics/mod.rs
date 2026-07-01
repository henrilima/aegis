use chrono::{DateTime, Utc};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

// Estruturas de Dados

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CrossMetric {
    pub date: String,
    pub sleep_hours: f64,
    pub study_hours: f64,
    pub study_hit_rate: f64, // Taxa de acerto global (%)
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
    pub consistency_score: f64, // % de dias com atividade
    pub study_efficiency: f64,  // Questões resolvidas por hora
    pub rested_hit_rate: f64,   // Taxa de acerto com > 7.5h de sono
    pub tired_hit_rate: f64,    // Taxa de acerto com < 6h de sono
    pub avg_focus_score: f64,
    pub focus_hit_rate_high: f64, // Taxa de acerto com foco >= 4
    pub focus_hit_rate_low: f64,  // Taxa de acerto com foco <= 2
    pub subject_distribution: Vec<SubjectStats>,
}

// Gerenciador de Estatísticas

pub struct StatisticsManager {
    db_path: PathBuf,
    config_db_path: PathBuf,
}

impl StatisticsManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let db_path = crate::config::get_database_path(app_handle);
        let config_db_path = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data dir")
            .join("config.db");

        let conn = Connection::open(&db_path).expect("Falha ao abrir banco");
        conn.busy_timeout(std::time::Duration::from_millis(5000))
            .expect("failed to set busy timeout");

        conn.execute(
            "CREATE TABLE IF NOT EXISTS achievements_unlocked (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                achievement_id TEXT NOT NULL,
                unlocked_at TEXT NOT NULL,
                UNIQUE(user_id, achievement_id)
            )",
            [],
        )
        .ok();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS user_xp (
                user_id TEXT PRIMARY KEY,
                xp INTEGER NOT NULL DEFAULT 0,
                level INTEGER NOT NULL DEFAULT 1,
                tree_xp INTEGER NOT NULL DEFAULT 0,
                tree_level INTEGER NOT NULL DEFAULT 1
            )",
            [],
        )
        .ok();

        let _ = conn.execute(
            "ALTER TABLE user_xp ADD COLUMN tree_xp INTEGER NOT NULL DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE user_xp ADD COLUMN tree_level INTEGER NOT NULL DEFAULT 1",
            [],
        );

        conn.execute(
            "CREATE TABLE IF NOT EXISTS daily_challenges_completed (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                challenge_id TEXT NOT NULL,
                completed_date TEXT NOT NULL,
                xp_awarded INTEGER NOT NULL,
                UNIQUE(user_id, challenge_id, completed_date)
            )",
            [],
        )
        .ok();

        // Limpa duplicatas antes de aplicar o índice único
        let _ = conn.execute(
            "DELETE FROM daily_challenges_completed 
             WHERE id NOT IN (
                 SELECT MIN(id) 
                 FROM daily_challenges_completed 
                 GROUP BY user_id, challenge_id, completed_date
             )",
            [],
        );

        let _ = conn.execute(
            "DELETE FROM xp_ledger 
             WHERE xp_type = 'Pet' AND source LIKE 'Desafio Diário:%' AND id NOT IN (
                 SELECT MIN(id) 
                 FROM xp_ledger 
                 WHERE xp_type = 'Pet' AND source LIKE 'Desafio Diário:%'
                 GROUP BY user_id, source, SUBSTR(timestamp, 1, 10)
             )",
            [],
        );

        let _ = conn.execute(
            "DELETE FROM xp_history 
             WHERE xp_type = 'Pet' AND source LIKE 'Desafio Diário:%' AND id NOT IN (
                 SELECT MIN(id) 
                 FROM xp_history 
                 WHERE xp_type = 'Pet' AND source LIKE 'Desafio Diário:%'
                 GROUP BY user_id, source, SUBSTR(timestamp, 1, 10)
             )",
            [],
        );

        let _ = conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_user_challenge_date ON daily_challenges_completed (user_id, challenge_id, completed_date)",
            [],
        );

        conn.execute(
            "CREATE TABLE IF NOT EXISTS xp_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                amount INTEGER NOT NULL,
                source TEXT NOT NULL,
                xp_type TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                reference_table TEXT,
                reference_id TEXT
            )",
            [],
        )
        .ok();

        let _ = conn.execute("ALTER TABLE xp_history ADD COLUMN reference_table TEXT", []);
        let _ = conn.execute("ALTER TABLE xp_history ADD COLUMN reference_id TEXT", []);

        // Tabela permanente e ilimitada — fonte da verdade do XP
        conn.execute(
            "CREATE TABLE IF NOT EXISTS xp_ledger (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                amount INTEGER NOT NULL,
                source TEXT NOT NULL,
                xp_type TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                reference_table TEXT,
                reference_id TEXT,
                obsolete INTEGER NOT NULL DEFAULT 0
            )",
            [],
        )
        .ok();
        let _ = conn.execute("ALTER TABLE xp_ledger ADD COLUMN obsolete INTEGER NOT NULL DEFAULT 0", []);

        conn.execute(
            "CREATE TABLE IF NOT EXISTS note_activity (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                note_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )",
            [],
        )
        .ok();

        // Migração: popula o ledger a partir do xp_history existente (best-effort)
        // Apenas se o ledger estiver vazio, evitando duplicar registros ao reiniciar.
        let ledger_count: i32 = conn
            .query_row("SELECT COUNT(*) FROM xp_ledger", [], |r| r.get(0))
            .unwrap_or(0);
        if ledger_count == 0 {
            conn.execute(
                "INSERT OR IGNORE INTO xp_ledger (user_id, amount, source, xp_type, timestamp, reference_table, reference_id)
                 SELECT user_id, amount, source, xp_type, timestamp, reference_table, reference_id FROM xp_history",
                [],
            )
            .ok();
        }

        // Correção de gap: para cada usuário, se a soma do ledger for menor que o XP
        // real em user_xp, adiciona uma entrada de compensação para não perder progresso.
        // Isso cobre tanto o caso de ledger vazio quanto o caso de xp_history incompleto.
        {
            let rows: Vec<(String, i32, i32)> = {
                let mut stmt = conn
                    .prepare("SELECT user_id, xp, level FROM user_xp WHERE xp > 0 OR level > 1")
                    .unwrap();
                stmt.query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))
                    .unwrap()
                    .filter_map(|r| r.ok())
                    .collect()
            };
            for (uid, xp, level) in rows {
                // XP total real acumulado pelo usuário
                let mut real_total = xp;
                for l in 1..level {
                    real_total += if l <= 5 { 200 } else if l <= 10 { 400 } else if l <= 15 { 800 }
                        else if l <= 20 { 1500 } else if l <= 25 { 2500 } else if l <= 30 { 4000 }
                        else if l <= 35 { 6000 } else if l <= 40 { 9000 } else { 12000 };
                }
                // Soma atual do ledger para este usuário (apenas do tipo Global e não obsoleto)
                let ledger_sum: i32 = conn
                    .query_row(
                        "SELECT COALESCE(SUM(amount), 0) FROM xp_ledger WHERE user_id = ?1 AND obsolete = 0 AND xp_type = 'Global'",
                        params![uid],
                        |r| r.get(0),
                    )
                    .unwrap_or(0);
                let gap = real_total - ledger_sum;
                if gap > 0 {
                    let _ = conn.execute(
                        "INSERT INTO xp_ledger (user_id, amount, source, xp_type, timestamp) VALUES (?1, ?2, 'Progresso anterior (migração)', 'Global', '2000-01-01 00:00:00')",
                        params![uid, gap],
                    );
                }
            }
        }

        // Recalcula o tree_xp e tree_level para todos os usuários com base no ledger de Pet sem duplicados
        if let Ok(mut stmt) = conn.prepare("SELECT user_id, SUM(amount) FROM xp_ledger WHERE xp_type = 'Pet' AND obsolete = 0 GROUP BY user_id") {
            let user_pms: Vec<(String, i32)> = stmt.query_map([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, i32>(1)?))
            })
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();

            for (uid, total_pet_xp) in user_pms {
                let mut current_tree_xp = total_pet_xp;
                let mut current_tree_level = 1;
                loop {
                    let needed = if current_tree_level <= 5 { 200 } else if current_tree_level <= 10 { 400 }
                        else if current_tree_level <= 15 { 800 } else if current_tree_level <= 20 { 1500 }
                        else if current_tree_level <= 25 { 2500 } else if current_tree_level <= 30 { 4000 }
                        else if current_tree_level <= 35 { 6000 } else if current_tree_level <= 40 { 9000 }
                        else { 12000 };
                    if current_tree_xp >= needed {
                        current_tree_xp -= needed;
                        current_tree_level += 1;
                    } else {
                        break;
                    }
                }
                let _ = conn.execute(
                    "UPDATE user_xp SET tree_xp = ?1, tree_level = ?2 WHERE user_id = ?3",
                    params![current_tree_xp, current_tree_level, &uid],
                );
            }
        }

        Self { db_path, config_db_path }
    }

    pub fn achievements_enabled(&self) -> bool {
        if let Ok(conn) = Connection::open(&self.config_db_path) {
            let enabled: Option<String> = conn
                .query_row(
                    "SELECT value FROM settings WHERE key = 'achievements_enabled'",
                    [],
                    |row| row.get(0),
                )
                .ok();
            if let Some(val) = enabled {
                return val == "true";
            }
        }
        true
    }

    fn conn(&self) -> Connection {
        let conn = Connection::open(&self.db_path).expect("Falha ao abrir banco");
        conn.busy_timeout(std::time::Duration::from_millis(5000))
            .expect("failed to set busy timeout");
        conn
    }

    /// Retorna métricas cruzadas (sono + estudo) para os últimos N dias
    #[allow(clippy::cast_precision_loss)]
    pub fn get_cross_metrics(
        &self,
        user_id: &str,
        days: i32,
        now: DateTime<Utc>,
    ) -> Vec<CrossMetric> {
        let conn = self.conn();
        let mut metrics = Vec::new();

        let now_local = now.with_timezone(&chrono::Local);
        // Gera lista de datas para o período
        for i in (0..days).rev() {
            let date = (now_local - chrono::Duration::days(i as i64))
                .format("%Y-%m-%d")
                .to_string();

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
            let sleep_hours: f64 = conn
                .query_row(
                    "SELECT duration_minutes FROM sleep_entries WHERE user_id=?1 AND date=?2",
                    params![user_id, date],
                    |row| Ok(row.get::<_, i32>(0)? as f64 / 60.0),
                )
                .unwrap_or(0.0);

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

            let hit_rate = if study_data.1 > 0 {
                (study_data.2 as f64 / study_data.1 as f64) * 100.0
            } else {
                0.0
            };
            let ppm = if reading_data.1 > 0 {
                reading_data.0 as f64 / reading_data.1 as f64
            } else {
                0.0
            };

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
    pub fn get_performance_summary(
        &self,
        user_id: &str,
        days: i32,
        now: DateTime<Utc>,
    ) -> PerformanceSummary {
        let metrics = self.get_cross_metrics(user_id, days, now);
        let conn = self.conn();
        let now_local = now.with_timezone(&chrono::Local);
        let cutoff_date = (now_local - chrono::Duration::days(days as i64))
            .format("%Y-%m-%d")
            .to_string();

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
        let avg_hit = metrics
            .iter()
            .filter(|m| m.questions_total > 0)
            .map(|m| m.study_hit_rate)
            .sum::<f64>()
            / metrics
                .iter()
                .filter(|m| m.questions_total > 0)
                .count()
                .max(1) as f64;

        let best_sleep = metrics
            .iter()
            .max_by(|a, b| {
                a.sleep_hours
                    .partial_cmp(&b.sleep_hours)
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
            .map(|m| m.date.clone());
        let best_study = metrics
            .iter()
            .max_by(|a, b| {
                a.study_hours
                    .partial_cmp(&b.study_hours)
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
            .map(|m| m.date.clone());

        // Novas métricas
        let active_days = metrics
            .iter()
            .filter(|m| m.sleep_hours > 0.0 || m.study_hours > 0.0 || m.reading_pages > 0)
            .count();
        let consistency_score = (active_days as f64 / days as f64) * 100.0;
        let study_efficiency = if total_study > 0.0 {
            total_questions as f64 / total_study
        } else {
            0.0
        };

        let (rested_sum, rested_count) = metrics
            .iter()
            .filter(|m| m.sleep_hours >= 7.5 && m.questions_total > 0)
            .fold((0.0, 0), |(s, c), m| (s + m.study_hit_rate, c + 1));
        let rested_hr = if rested_count > 0 {
            rested_sum / rested_count as f64
        } else {
            0.0
        };

        let (tired_sum, tired_count) = metrics
            .iter()
            .filter(|m| m.sleep_hours > 0.0 && m.sleep_hours <= 6.0 && m.questions_total > 0)
            .fold((0.0, 0), |(s, c), m| (s + m.study_hit_rate, c + 1));
        let tired_hr = if tired_count > 0 {
            tired_sum / tired_count as f64
        } else {
            0.0
        };

        // Métricas de Foco
        let focus_metrics: Vec<&CrossMetric> =
            metrics.iter().filter(|m| m.focus_score.is_some()).collect();
        let avg_focus = if focus_metrics.is_empty() {
            0.0
        } else {
            focus_metrics
                .iter()
                .filter_map(|m| m.focus_score)
                .sum::<f64>()
                / focus_metrics.len() as f64
        };

        let (fh_sum, fh_count) = metrics
            .iter()
            .filter(|m| m.focus_score.unwrap_or(0.0) >= 4.0 && m.questions_total > 0)
            .fold((0.0, 0), |(s, c), m| (s + m.study_hit_rate, c + 1));
        let focus_hr_high = if fh_count > 0 {
            fh_sum / fh_count as f64
        } else {
            0.0
        };

        let (fl_sum, fl_count) = metrics
            .iter()
            .filter(|m| {
                m.focus_score.is_some()
                    && m.focus_score.unwrap_or(10.0) <= 2.0
                    && m.questions_total > 0
            })
            .fold((0.0, 0), |(s, c), m| (s + m.study_hit_rate, c + 1));
        let focus_hr_low = if fl_count > 0 {
            fl_sum / fl_count as f64
        } else {
            0.0
        };

        // Distribuição por matéria
        let mut subject_distribution = vec![];
        {
            let mut stmt = conn
                .prepare(
                    "SELECT subject, SUM(hours) as sh, 
                        SUM(questions_new + questions_review) as tq,
                        SUM(correct_new + correct_review) as tc
                 FROM study_sessions
                 WHERE user_id=?1 AND date >= ?2
                 GROUP BY subject ORDER BY sh DESC LIMIT 10",
                )
                .unwrap();

            let rows = stmt
                .query_map(params![user_id, cutoff_date], |row| {
                    let name: String = row.get(0)?;
                    let hours: f64 = row.get(1)?;
                    let tq: i32 = row.get(2)?;
                    let tc: i32 = row.get(3)?;
                    let hr = if tq > 0 {
                        (tc as f64 / tq as f64) * 100.0
                    } else {
                        0.0
                    };
                    Ok(SubjectStats {
                        name,
                        hours,
                        hit_rate: (hr * 10.0).round() / 10.0,
                        percent_total: if total_study > 0.0 {
                            (hours / total_study) * 100.0
                        } else {
                            0.0
                        },
                    })
                })
                .unwrap()
                .filter_map(|r| r.ok());

            subject_distribution = rows.collect();
        }

        let peak_subject = subject_distribution.first().map(|s| s.name.clone());

        let pairs_with_sleep: Vec<(f64, f64)> = metrics
            .iter()
            .filter(|m| m.sleep_hours > 0.0 && m.questions_total > 0)
            .map(|m| (m.sleep_hours, m.study_hit_rate))
            .collect();

        let correlation_label = if pairs_with_sleep.len() >= 3 {
            let mean_x = pairs_with_sleep.iter().map(|(x, _)| x).sum::<f64>()
                / pairs_with_sleep.len() as f64;
            let mean_y = pairs_with_sleep.iter().map(|(_, y)| y).sum::<f64>()
                / pairs_with_sleep.len() as f64;
            let cov = pairs_with_sleep
                .iter()
                .map(|(x, y)| (x - mean_x) * (y - mean_y))
                .sum::<f64>();
            if cov > 1.0 {
                "Positiva".to_string()
            } else if cov < -1.0 {
                "Negativa".to_string()
            } else {
                "Neutra".to_string()
            }
        } else {
            "Neutra".to_string()
        };

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

    fn calculate_streak(
        &self,
        user_id: &str,
        table: &str,
        cutoff_date: &str,
        now: DateTime<Utc>,
    ) -> i32 {
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
        let dates: Vec<String> =
            match stmt.query_map(params![user_id, cutoff_date], |row| row.get(0)) {
                Ok(rows) => rows.filter_map(|r| r.ok()).collect(),
                Err(_) => vec![],
            };

        if dates.is_empty() {
            return 0;
        }

        let now_local = now.with_timezone(&chrono::Local);
        let today = now_local.format("%Y-%m-%d").to_string();
        let yesterday = (now_local - chrono::Duration::days(1))
            .format("%Y-%m-%d")
            .to_string();

        // Se não estudou nem hoje nem ontem, streak é 0
        if dates[0] != today && dates[0] != yesterday {
            return 0;
        }

        let mut streak = 0;
        let mut expected = dates[0].clone();
        for date in dates {
            if date == expected {
                streak += 1;
                if let Ok(d) = chrono::NaiveDate::parse_from_str(&expected, "%Y-%m-%d") {
                    expected = (d - chrono::Duration::days(1))
                        .format("%Y-%m-%d")
                        .to_string();
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        streak
    }

    pub fn get_global_realtime_metrics(&self, user_id: &str, today: &str) -> RealtimeGlobalStats {
        let conn = self.conn();

        let total_passwords: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM passwords WHERE user_id = ?1",
                params![user_id],
                |r| r.get(0),
            )
            .unwrap_or(0);
        let total_tasks: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM tasks WHERE user_id = ?1",
                params![user_id],
                |r| r.get(0),
            )
            .unwrap_or(0);
        let completed_tasks_total: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM tasks WHERE user_id = ?1 AND completed = 1",
                params![user_id],
                |r| r.get(0),
            )
            .unwrap_or(0);
        let completed_tasks_today: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM tasks WHERE user_id = ?1 AND completed = 1 AND completed_at = ?2",
                params![user_id, today],
                |r| r.get(0),
            )
            .unwrap_or(0);
        let total_notes: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM notes WHERE user_id = ?1",
                params![user_id],
                |r| r.get(0),
            )
            .unwrap_or(0);

        let mut total_pomodoros_today = 0;
        if let Ok(mut pomo_stmt) = conn.prepare("SELECT cycles_done, end_time FROM pomodoro_history WHERE user_id = ?1") {
            if let Ok(pomo_rows) = pomo_stmt.query_map(params![user_id], |r| {
                Ok((r.get::<_, i32>(0)?, r.get::<_, String>(1)?))
            }) {
                for row in pomo_rows {
                    if let Ok((cycles, end_time_str)) = row {
                        if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(&end_time_str) {
                            let local_date_str = dt.with_timezone(&chrono::Local).format("%Y-%m-%d").to_string();
                            if local_date_str == today {
                                total_pomodoros_today += cycles;
                            }
                        }
                    }
                }
            }
        }

        let total_pomodoros: i32 = conn
            .query_row(
                "SELECT SUM(cycles_done) FROM pomodoro_history WHERE user_id = ?1",
                params![user_id],
                |r| Ok(r.get::<_, Option<i32>>(0)?.unwrap_or(0)),
            )
            .unwrap_or(0);

        let total_habits: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM habits WHERE user_id = ?1",
                params![user_id],
                |r| r.get(0),
            )
            .unwrap_or(0);

        let mut habits_completed_today = 0;
        if let Ok(mut habit_stmt) = conn.prepare("SELECT last_done FROM habits WHERE user_id = ?1") {
            if let Ok(habit_rows) = habit_stmt.query_map(params![user_id], |r| {
                r.get::<_, Option<String>>(0)
            }) {
                for row in habit_rows {
                    if let Ok(Some(last_done_str)) = row {
                        if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(&last_done_str) {
                            let local_date_str = dt.with_timezone(&chrono::Local).format("%Y-%m-%d").to_string();
                            if local_date_str == today {
                                habits_completed_today += 1;
                            }
                        }
                    }
                }
            }
        }

        let sleep_logged_today_hours: f64 = conn
            .query_row(
                "SELECT SUM(duration_minutes) FROM sleep_entries WHERE user_id = ?1 AND date = ?2",
                params![user_id, today],
                |r| Ok(r.get::<_, Option<i32>>(0)?.unwrap_or(0) as f64 / 60.0),
            )
            .unwrap_or(0.0);

        let study_hours_today: f64 = conn
            .query_row(
                "SELECT SUM(hours) FROM study_sessions WHERE user_id = ?1 AND date = ?2",
                params![user_id, today],
                |r| Ok(r.get::<_, Option<f64>>(0)?.unwrap_or(0.0)),
            )
            .unwrap_or(0.0);

        let reading_pages_today: i32 = conn
            .query_row(
                "SELECT SUM(pages_read) FROM reading_sessions WHERE user_id = ?1 AND date = ?2",
                params![user_id, today],
                |r| Ok(r.get::<_, Option<i32>>(0)?.unwrap_or(0)),
            )
            .unwrap_or(0);

        let reading_books_total: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM reading_books WHERE user_id = ?1",
                params![user_id],
                |r| r.get(0),
            )
            .unwrap_or(0);

        let active_days_total: i32 = conn
            .query_row(
                "SELECT COUNT(distinct date_str) FROM (
                SELECT date as date_str FROM study_sessions WHERE user_id = ?1
                UNION
                SELECT date as date_str FROM sleep_entries WHERE user_id = ?1
                UNION
                SELECT date as date_str FROM reading_sessions WHERE user_id = ?1
                UNION
                SELECT substr(end_time, 1, 10) as date_str FROM pomodoro_history WHERE user_id = ?1
            )",
                params![user_id],
                |r| r.get(0),
            )
            .unwrap_or(0);

        let (current_xp, level, tree_xp, tree_level): (i32, i32, i32, i32) = conn
            .query_row(
                "SELECT xp, level, tree_xp, tree_level FROM user_xp WHERE user_id = ?1",
                params![user_id],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
            )
            .unwrap_or((0, 1, 0, 1));

        let xp_today: i32 = conn.query_row(
            "SELECT SUM(xp_awarded) FROM daily_challenges_completed WHERE user_id = ?1 AND completed_date = ?2",
            params![user_id, today],
            |r| Ok(r.get::<_, Option<i32>>(0)?.unwrap_or(0))
        ).unwrap_or(0);

        let total_glossary_words: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM glossary WHERE user_id = ?1",
                params![user_id],
                |r| r.get(0),
            )
            .unwrap_or(0);
        let total_flashcard_decks: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM flashcard_decks WHERE user_id = ?1",
                params![user_id],
                |r| r.get(0),
            )
            .unwrap_or(0);
        let total_movies: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM movies WHERE user_id = ?1",
                params![user_id],
                |r| r.get(0),
            )
            .unwrap_or(0);

        let max_habit_streak: i32 = conn
            .query_row(
                "SELECT COALESCE(MAX(max_streak), 0) FROM habits WHERE user_id = ?1",
                params![user_id],
                |r| r.get(0),
            )
            .unwrap_or(0);

        let has_night_pomodoro: bool = conn
            .query_row(
                "SELECT EXISTS(
                SELECT 1 FROM pomodoro_history
                WHERE user_id = ?1
                  AND (
                    CAST(strftime('%H', datetime(end_time, 'localtime')) AS INTEGER) BETWEEN 3 AND 4
                  )
            )",
                params![user_id],
                |r| r.get(0),
            )
            .unwrap_or(false);

        RealtimeGlobalStats {
            total_passwords,
            total_tasks,
            completed_tasks_total,
            completed_tasks_today,
            total_notes,
            notes_created_today: 0,
            total_pomodoros_today,
            total_pomodoros,
            total_habits,
            habits_completed_today,
            sleep_logged_today_hours,
            study_hours_today,
            reading_pages_today,
            reading_books_total,
            active_days_total,
            current_xp,
            level,
            tree_xp,
            tree_level,
            xp_today,
            total_glossary_words,
            total_flashcard_decks,
            total_movies,
            max_habit_streak,
            has_night_pomodoro,
        }
    }

    pub fn get_user_progress_state(
        &self,
        user_id: &str,
        today: &str,
        three_days_ago: &str,
    ) -> UserProgressState {
        let conn = self.conn();

        let (xp, level, tree_xp, tree_level): (i32, i32, i32, i32) = conn.query_row(
            "SELECT xp, level, tree_xp, tree_level FROM user_xp WHERE user_id = ?1",
            params![user_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?))
        ).unwrap_or_else(|_| {
            let _ = conn.execute(
                "INSERT INTO user_xp (user_id, xp, level, tree_xp, tree_level) VALUES (?1, 0, 1, 0, 1) ON CONFLICT(user_id) DO NOTHING",
                params![user_id],
            );
            (0, 1, 0, 1)
        });

        let mut stmt = conn
            .prepare(
                "SELECT achievement_id, unlocked_at FROM achievements_unlocked WHERE user_id = ?1",
            )
            .unwrap();
        let unlocked_achievements = stmt
            .query_map(params![user_id], |r| {
                Ok(UnlockedAchievement {
                    achievement_id: r.get(0)?,
                    unlocked_at: r.get(1)?,
                })
            })
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();

        let mut stmt_chal = conn.prepare("SELECT challenge_id FROM daily_challenges_completed WHERE user_id = ?1 AND completed_date = ?2").unwrap();
        let completed_challenges_today = stmt_chal
            .query_map(params![user_id, today], |r| r.get(0))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();

        let last_3_days_completed_count: i32 = conn.query_row(
            "SELECT COUNT(distinct completed_date) FROM daily_challenges_completed WHERE user_id = ?1 AND completed_date >= ?2 AND completed_date <= ?3",
            params![user_id, three_days_ago, today],
            |r| r.get(0)
        ).unwrap_or(0);

        let last_completed_date: Option<String> = conn.query_row(
            "SELECT MAX(completed_date) FROM daily_challenges_completed WHERE user_id = ?1",
            params![user_id],
            |r| r.get(0)
        ).unwrap_or(None);

        UserProgressState {
            xp,
            level,
            tree_xp,
            tree_level,
            unlocked_achievements,
            completed_challenges_today,
            last_3_days_completed_count,
            last_completed_date,
        }
    }

    fn award_xp_internal(&self, conn: &Connection, user_id: &str, xp_award: i32) -> (i32, i32) {
        let (mut current_xp, mut current_level): (i32, i32) = conn
            .query_row(
                "SELECT xp, level FROM user_xp WHERE user_id = ?1",
                params![user_id],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap_or((0, 1));

        current_xp += xp_award;

        loop {
            let needed = get_xp_for_level(current_level);
            if current_xp >= needed {
                current_xp -= needed;
                current_level += 1;
            } else {
                break;
            }
        }

        let _ = conn.execute(
            "INSERT INTO user_xp (user_id, xp, level, tree_xp, tree_level) VALUES (?1, ?2, ?3, 0, 1)
             ON CONFLICT(user_id) DO UPDATE SET xp = excluded.xp, level = excluded.level",
            params![user_id, current_xp, current_level],
        );

        (current_xp, current_level)
    }



    fn award_tree_xp_internal(
        &self,
        conn: &Connection,
        user_id: &str,
        xp_award: i32,
    ) -> (i32, i32) {
        let (mut current_tree_xp, mut current_tree_level): (i32, i32) = conn
            .query_row(
                "SELECT tree_xp, tree_level FROM user_xp WHERE user_id = ?1",
                params![user_id],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap_or((0, 1));

        current_tree_xp += xp_award;

        loop {
            let needed = get_xp_for_level(current_tree_level);
            if current_tree_xp >= needed {
                current_tree_xp -= needed;
                current_tree_level += 1;
            } else {
                break;
            }
        }

        let _ = conn.execute(
            "INSERT INTO user_xp (user_id, xp, level, tree_xp, tree_level) VALUES (?1, 0, 1, ?2, ?3)
             ON CONFLICT(user_id) DO UPDATE SET tree_xp = excluded.tree_xp, tree_level = excluded.tree_level",
            params![user_id, current_tree_xp, current_tree_level],
        );

        (current_tree_xp, current_tree_level)
    }

    fn deduct_tree_xp_internal(
        &self,
        conn: &Connection,
        user_id: &str,
        xp_deduction: i32,
    ) -> (i32, i32) {
        let (mut current_tree_xp, mut current_tree_level): (i32, i32) = conn
            .query_row(
                "SELECT tree_xp, tree_level FROM user_xp WHERE user_id = ?1",
                params![user_id],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap_or((0, 1));

        let mut xp_to_deduct = xp_deduction;
        while xp_to_deduct > 0 {
            if current_tree_xp >= xp_to_deduct {
                current_tree_xp -= xp_to_deduct;
                xp_to_deduct = 0;
            } else {
                xp_to_deduct -= current_tree_xp;
                if current_tree_level > 1 {
                    current_tree_level -= 1;
                    current_tree_xp = get_xp_for_level(current_tree_level);
                } else {
                    current_tree_xp = 0;
                    xp_to_deduct = 0;
                }
            }
        }

        let _ = conn.execute(
            "INSERT INTO user_xp (user_id, xp, level, tree_xp, tree_level) VALUES (?1, 0, 1, ?2, ?3)
             ON CONFLICT(user_id) DO UPDATE SET tree_xp = excluded.tree_xp, tree_level = excluded.tree_level",
            params![user_id, current_tree_xp, current_tree_level],
        );

        (current_tree_xp, current_tree_level)
    }

    pub fn log_xp_gain(
        &self,
        conn: &Connection,
        user_id: &str,
        amount: i32,
        source: &str,
        xp_type: &str,
        ref_table: Option<&str>,
        ref_id: Option<&str>,
    ) {
        let now = chrono::Utc::now()
            .with_timezone(&chrono::Local)
            .format("%Y-%m-%d %H:%M:%S")
            .to_string();

        // Ledger permanente (sem limite) — fonte da verdade do XP
        let _ = conn.execute(
            "INSERT INTO xp_ledger (user_id, amount, source, xp_type, timestamp, reference_table, reference_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![user_id, amount, source, xp_type, now, ref_table, ref_id],
        );

        // Histórico de exibição (buffer circular, máx 50)
        let _ = conn.execute(
            "INSERT INTO xp_history (user_id, amount, source, xp_type, timestamp, reference_table, reference_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![user_id, amount, source, xp_type, now, ref_table, ref_id],
        );
        let _ = conn.execute(
            "DELETE FROM xp_history WHERE user_id = ?1 AND id NOT IN (
                SELECT id FROM xp_history WHERE user_id = ?1 ORDER BY timestamp DESC, id DESC LIMIT 50
            )",
            params![user_id],
        );
    }

    /// Recalcula o XP e nível do usuário somando entradas não-obsoletas e do tipo Global do ledger.
    pub fn recalculate_xp_from_ledger(&self, user_id: &str) {
        let conn = self.conn();
        let total_xp: i32 = conn
            .query_row(
                "SELECT COALESCE(SUM(amount), 0) FROM xp_ledger WHERE user_id = ?1 AND obsolete = 0 AND xp_type = 'Global'",
                params![user_id],
                |r| r.get(0),
            )
            .unwrap_or(0);
        let (new_xp, new_level) = get_level_from_total_xp(total_xp.max(0));
        let _ = conn.execute(
            "INSERT INTO user_xp (user_id, xp, level, tree_xp, tree_level) VALUES (?1, ?2, ?3, 0, 1)
             ON CONFLICT(user_id) DO UPDATE SET xp = excluded.xp, level = excluded.level",
            params![user_id, new_xp, new_level],
        );
    }

    /// Marca como obsoletas as entradas de XP do ledger vinculadas a um registro deletado
    /// e recalcula o XP total (entradas obsoletas são ignoradas no cálculo).
    pub fn delete_xp_for_ref(&self, user_id: &str, ref_table: &str, ref_id: &str) -> Result<(), String> {
        let conn = self.conn();

        // Marca como obsoleto no ledger (não deleta — mantém rastro)
        let _ = conn.execute(
            "UPDATE xp_ledger SET obsolete = 1 WHERE user_id = ?1 AND reference_table = ?2 AND reference_id = ?3",
            params![user_id, ref_table, ref_id],
        );

        // Remove do histórico de exibição para não mostrar registros órfãos/deletados
        let _ = conn.execute(
            "DELETE FROM xp_history WHERE user_id = ?1 AND reference_table = ?2 AND reference_id = ?3",
            params![user_id, ref_table, ref_id],
        );

        // Recalcula XP ignorando entradas obsoletas
        self.recalculate_xp_from_ledger(user_id);

        Ok(())
    }

    /// Sincroniza conquistas no ledger: insere entradas para conquistas que ainda não têm
    /// registro no ledger (ex: desbloqueadas antes da implementação do ledger).
    pub fn sync_achievement_ledger(
        &self,
        user_id: &str,
        achievements: &[(String, i32)], // (achievement_id, xp_award)
    ) {
        let conn = self.conn();
        for (achievement_id, xp_award) in achievements {
            // Busca a data em que foi desbloqueada (comum para ledger e history se necessário)
            let mut unlocked_at_opt: Option<String> = None;

            // Verifica se já existe entrada no ledger para esta conquista
            let exists: i32 = conn
                .query_row(
                    "SELECT COUNT(*) FROM xp_ledger WHERE user_id = ?1 AND reference_table = 'achievements_unlocked' AND reference_id = ?2 AND obsolete = 0",
                    params![user_id, achievement_id],
                    |r| r.get(0),
                )
                .unwrap_or(0);
            if exists == 0 {
                let unlocked_at = conn
                    .query_row(
                        "SELECT unlocked_at FROM achievements_unlocked WHERE user_id = ?1 AND achievement_id = ?2",
                        params![user_id, achievement_id],
                        |r| r.get(0),
                    )
                    .unwrap_or_else(|_| "2000-01-01 00:00:00".to_string());
                unlocked_at_opt = Some(unlocked_at.clone());
                let _ = conn.execute(
                    "INSERT INTO xp_ledger (user_id, amount, source, xp_type, timestamp, reference_table, reference_id, obsolete) VALUES (?1, ?2, ?3, 'Global', ?4, 'achievements_unlocked', ?5, 0)",
                    params![user_id, xp_award, format!("Conquista: {}", achievement_id), unlocked_at, achievement_id],
                );
            }

            // Verifica se já existe entrada no histórico de exibição para esta conquista
            let exists_hist: i32 = conn
                .query_row(
                    "SELECT COUNT(*) FROM xp_history WHERE user_id = ?1 AND reference_table = 'achievements_unlocked' AND reference_id = ?2",
                    params![user_id, achievement_id],
                    |r| r.get(0),
                )
                .unwrap_or(0);
            if exists_hist == 0 {
                let unlocked_at = match unlocked_at_opt {
                    Some(val) => val,
                    None => conn
                        .query_row(
                            "SELECT unlocked_at FROM achievements_unlocked WHERE user_id = ?1 AND achievement_id = ?2",
                            params![user_id, achievement_id],
                            |r| r.get(0),
                        )
                        .unwrap_or_else(|_| "2000-01-01 00:00:00".to_string()),
                };
                let _ = conn.execute(
                    "INSERT INTO xp_history (user_id, amount, source, xp_type, timestamp, reference_table, reference_id) VALUES (?1, ?2, ?3, 'Global', ?4, 'achievements_unlocked', ?5)",
                    params![user_id, xp_award, format!("Conquista: {}", achievement_id), unlocked_at, achievement_id],
                );
            }
        }
        // Após sync, refaz gap correction e recalcula
        self.fix_ledger_gap(user_id, &conn);
        self.recalculate_xp_from_ledger(user_id);
    }

    /// Corrige o gap entre XP real (user_xp) e soma do ledger, ajustando a entrada de migração.
    fn fix_ledger_gap(&self, user_id: &str, conn: &Connection) {
        let (xp, level): (i32, i32) = conn
            .query_row(
                "SELECT xp, level FROM user_xp WHERE user_id = ?1",
                params![user_id],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap_or((0, 1));
        let mut real_total = xp;
        for l in 1..level {
            real_total += get_xp_for_level(l);
        }
        let ledger_sum: i32 = conn
            .query_row(
                "SELECT COALESCE(SUM(amount), 0) FROM xp_ledger WHERE user_id = ?1 AND obsolete = 0 AND xp_type = 'Global'",
                params![user_id],
                |r| r.get(0),
            )
            .unwrap_or(0);
        // Atualiza (ou remove) a entrada de migração existente
        let _ = conn.execute(
            "DELETE FROM xp_ledger WHERE user_id = ?1 AND source = 'Progresso anterior (migração)'",
            params![user_id],
        );
        let gap = real_total - ledger_sum;
        if gap > 0 {
            let _ = conn.execute(
                "INSERT INTO xp_ledger (user_id, amount, source, xp_type, timestamp, obsolete) VALUES (?1, ?2, 'Progresso anterior (migração)', 'Global', '2000-01-01 00:00:00', 0)",
                params![user_id, gap],
            );
        }
    }

    /// Reseta todo o XP de conquistas/global do usuário e recalcula apenas com base nas conquistas fornecidas.
    pub fn reset_xp_and_resync(
        &self,
        user_id: &str,
        achievements: &[(String, i32)],
    ) {
        let conn = self.conn();

        // Apaga apenas o ledger global/conquistas do usuário, preservando o progresso do Pet
        let _ = conn.execute(
            "DELETE FROM xp_ledger WHERE user_id = ?1 AND xp_type = 'Global'",
            params![user_id],
        );

        // Apaga apenas o histórico global/conquistas de exibição do usuário
        let _ = conn.execute(
            "DELETE FROM xp_history WHERE user_id = ?1 AND xp_type = 'Global'",
            params![user_id],
        );

        // Re-insere conquistas desbloqueadas no ledger e no histórico
        for (achievement_id, xp_award) in achievements {
            let unlocked_at: String = conn
                .query_row(
                    "SELECT unlocked_at FROM achievements_unlocked WHERE user_id = ?1 AND achievement_id = ?2",
                    params![user_id, achievement_id],
                    |r| r.get(0),
                )
                .unwrap_or_else(|_| "2000-01-01 00:00:00".to_string());

            // Ledger permanente
            let _ = conn.execute(
                "INSERT INTO xp_ledger (user_id, amount, source, xp_type, timestamp, reference_table, reference_id, obsolete) VALUES (?1, ?2, ?3, 'Global', ?4, 'achievements_unlocked', ?5, 0)",
                params![user_id, xp_award, format!("Conquista: {}", achievement_id), unlocked_at, achievement_id],
            );

            // Histórico de exibição
            let _ = conn.execute(
                "INSERT INTO xp_history (user_id, amount, source, xp_type, timestamp, reference_table, reference_id) VALUES (?1, ?2, ?3, 'Global', ?4, 'achievements_unlocked', ?5)",
                params![user_id, xp_award, format!("Conquista: {}", achievement_id), unlocked_at, achievement_id],
            );
        }

        // Recalcula XP a partir do ledger
        self.recalculate_xp_from_ledger(user_id);
    }

    pub fn export_xp_history_csv(&self, user_id: &str, path: &str) -> Result<(), String> {
        let conn = self.conn();
        let mut stmt = conn.prepare(
            "SELECT timestamp, amount, xp_type, source, reference_table, reference_id FROM xp_history WHERE user_id = ?1 ORDER BY timestamp DESC, id DESC"
        ).map_err(|e| e.to_string())?;

        let mut wtr = csv::Writer::from_path(path).map_err(|e| e.to_string())?;
        wtr.write_record(&["timestamp", "amount", "xp_type", "source", "reference_table", "reference_id"]).map_err(|e| e.to_string())?;

        let rows = stmt.query_map(params![user_id], |row| {
            let timestamp: String = row.get(0)?;
            let amount: i32 = row.get(1)?;
            let xp_type: String = row.get(2)?;
            let source: String = row.get(3)?;
            let reference_table: Option<String> = row.get(4)?;
            let reference_id: Option<String> = row.get(5)?;
            Ok((timestamp, amount, xp_type, source, reference_table, reference_id))
        }).map_err(|e| e.to_string())?;

        for r in rows {
            if let Ok((timestamp, amount, xp_type, source, ref_table, ref_id)) = r {
                wtr.write_record(&[
                    timestamp,
                    amount.to_string(),
                    xp_type,
                    source,
                    ref_table.unwrap_or_default(),
                    ref_id.unwrap_or_default(),
                ]).map_err(|e| e.to_string())?;
            }
        }

        wtr.flush().map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_xp_history(
        &self,
        user_id: &str,
        note_manager: &crate::notes::NoteManager,
    ) -> Vec<XPHistoryEntry> {
        let conn = self.conn();
        let mut stmt = conn.prepare(
            "SELECT id, user_id, amount, source, xp_type, timestamp, reference_table, reference_id FROM xp_history WHERE user_id = ?1 ORDER BY timestamp DESC, id DESC"
        ).unwrap();
        let rows = stmt
            .query_map(params![user_id], |row| {
                let id: i64 = row.get(0)?;
                let user_id: String = row.get(1)?;
                let amount: i32 = row.get(2)?;
                let source: String = row.get(3)?;
                let xp_type: String = row.get(4)?;
                let timestamp: String = row.get(5)?;
                let reference_table: Option<String> = row.get(6).ok();
                let reference_id: Option<String> = row.get(7).ok();

                Ok((
                    id,
                    user_id,
                    amount,
                    source,
                    xp_type,
                    timestamp,
                    reference_table,
                    reference_id,
                ))
            })
            .unwrap();

        rows.filter_map(|r| r.ok())
            .map(
                |(
                    id,
                    user_id,
                    amount,
                    source,
                    xp_type,
                    timestamp,
                    reference_table,
                    reference_id,
                )| {
                    let is_lost = if let (Some(ref_table), Some(ref_id)) =
                        (&reference_table, &reference_id)
                    {
                        match ref_table.as_str() {
                            "notes" => {
                                if let Ok(note_id) = ref_id.parse::<i32>() {
                                    note_manager.find_note_file(note_id).is_none()
                                } else {
                                    false
                                }
                            }
                            "sleep_entries" | "study_sessions" | "reading_books"
                            | "reading_sessions" | "movies" | "flashcard_decks" | "glossary" => {
                                let count: i32 = conn
                                    .query_row(
                                        &format!(
                                            "SELECT COUNT(*) FROM {} WHERE id = ?1",
                                            ref_table
                                        ),
                                        params![ref_id],
                                        |r| r.get(0),
                                    )
                                    .unwrap_or(0);
                                count == 0
                            }
                            _ => false,
                        }
                    } else {
                        false
                    };

                    XPHistoryEntry {
                        id,
                        user_id,
                        amount,
                        source,
                        xp_type,
                        timestamp,
                        reference_table,
                        reference_id,
                        is_lost,
                    }
                },
            )
            .collect()
    }

    pub fn unlock_achievement(
        &self,
        user_id: &str,
        achievement_id: &str,
        xp_award: i32,
        unlocked_at: &str,
    ) -> (bool, i32, i32, i32) {
        let conn = self.conn();

        let res = conn.execute(
            "INSERT INTO achievements_unlocked (user_id, achievement_id, unlocked_at) VALUES (?1, ?2, ?3)",
            params![user_id, achievement_id, unlocked_at],
        );

        match res {
            Ok(_) => {
                let (new_xp, new_level) = self.award_xp_internal(&conn, user_id, xp_award);
                self.log_xp_gain(
                    &conn,
                    user_id,
                    xp_award,
                    &format!("Conquista: {}", achievement_id),
                    "Global",
                    Some("achievements_unlocked"),
                    Some(achievement_id),
                );
                (true, xp_award, new_xp, new_level)
            }
            Err(_) => {
                let (xp, level): (i32, i32) = conn
                    .query_row(
                        "SELECT xp, level FROM user_xp WHERE user_id = ?1",
                        params![user_id],
                        |r| Ok((r.get(0)?, r.get(1)?)),
                    )
                    .unwrap_or((0, 1));
                (false, 0, xp, level)
            }
        }
    }

    pub fn complete_challenge(
        &self,
        user_id: &str,
        challenge_id: &str,
        xp_award: i32,
        date: &str,
    ) -> (i32, i32) {
        let conn = self.conn();

        if !self.achievements_enabled() {
            let (tree_xp, tree_level): (i32, i32) = conn
                .query_row(
                    "SELECT tree_xp, tree_level FROM user_xp WHERE user_id = ?1",
                    params![user_id],
                    |r| Ok((r.get(0)?, r.get(1)?)),
                )
                .unwrap_or((0, 1));
            return (tree_xp, tree_level);
        }

        let rows_affected = conn.execute(
            "INSERT OR IGNORE INTO daily_challenges_completed (user_id, challenge_id, completed_date, xp_awarded) VALUES (?1, ?2, ?3, ?4)",
            params![user_id, challenge_id, date, xp_award],
        ).unwrap_or(0);

        if rows_affected == 0 {
            let (tree_xp, tree_level): (i32, i32) = conn
                .query_row(
                    "SELECT tree_xp, tree_level FROM user_xp WHERE user_id = ?1",
                    params![user_id],
                    |r| Ok((r.get(0)?, r.get(1)?)),
                )
                .unwrap_or((0, 1));
            return (tree_xp, tree_level);
        }

        let res = self.award_tree_xp_internal(&conn, user_id, xp_award);
        self.log_xp_gain(
            &conn,
            user_id,
            xp_award,
            &format!("Desafio Diário: {}", challenge_id),
            "Pet",
            None,
            None,
        );
        res
    }

    pub fn undo_challenge(
        &self,
        user_id: &str,
        challenge_id: &str,
        date: &str,
    ) -> (i32, i32) {
        let conn = self.conn();
        
        let xp_awarded: i32 = conn.query_row(
            "SELECT xp_awarded FROM daily_challenges_completed WHERE user_id = ?1 AND challenge_id = ?2 AND completed_date = ?3",
            params![user_id, challenge_id, date],
            |r| r.get(0)
        ).unwrap_or(0);

        if xp_awarded > 0 {
            conn.execute(
                "DELETE FROM daily_challenges_completed WHERE user_id = ?1 AND challenge_id = ?2 AND completed_date = ?3",
                params![user_id, challenge_id, date],
            ).ok();

            let res = self.deduct_tree_xp_internal(&conn, user_id, xp_awarded);

            let source_text = format!("Desafio Diário: {}", challenge_id);
            conn.execute(
                "DELETE FROM xp_history WHERE user_id = ?1 AND source = ?2 AND xp_type = 'Pet'",
                params![user_id, source_text],
            ).ok();
            conn.execute(
                "DELETE FROM xp_ledger WHERE user_id = ?1 AND source = ?2 AND xp_type = 'Pet'",
                params![user_id, source_text],
            ).ok();

            res
        } else {
            let (tree_xp, tree_level): (i32, i32) = conn
                .query_row(
                    "SELECT tree_xp, tree_level FROM user_xp WHERE user_id = ?1",
                    params![user_id],
                    |r| Ok((r.get(0)?, r.get(1)?)),
                )
                .unwrap_or((0, 1));
            (tree_xp, tree_level)
        }
    }

    pub fn add_xp_with_source_and_ref(
        &self,
        user_id: &str,
        amount: i32,
        source: &str,
        ref_table: Option<&str>,
        ref_id: Option<&str>,
    ) -> (i32, i32) {
        let conn = self.conn();
        if !self.achievements_enabled() {
            let (current_xp, current_level): (i32, i32) = conn
                .query_row(
                    "SELECT xp, level FROM user_xp WHERE user_id = ?1",
                    params![user_id],
                    |r| Ok((r.get(0)?, r.get(1)?)),
                )
                .unwrap_or((0, 1));
            return (current_xp, current_level);
        }
        let res = self.award_xp_internal(&conn, user_id, amount);
        self.log_xp_gain(&conn, user_id, amount, source, "Global", ref_table, ref_id);
        res
    }

    pub fn add_xp_with_source(&self, user_id: &str, amount: i32, source: &str) -> (i32, i32) {
        self.add_xp_with_source_and_ref(user_id, amount, source, None, None)
    }

    pub fn add_xp(&self, user_id: &str, amount: i32) -> (i32, i32) {
        self.add_xp_with_source(user_id, amount, "Geral")
    }

    pub fn log_note_activity(&self, user_id: &str, note_id: i32, action: &str, timestamp: &str) {
        let conn = self.conn();
        conn.execute(
            "INSERT INTO note_activity (user_id, note_id, action, timestamp) VALUES (?1, ?2, ?3, ?4)",
            params![user_id, note_id, action, timestamp],
        ).ok();
    }

    pub fn get_notes_activity_today(&self, user_id: &str, today: &str) -> i32 {
        let conn = self.conn();
        let mut count = 0;
        if let Ok(mut stmt) = conn.prepare("SELECT timestamp FROM note_activity WHERE user_id = ?1") {
            if let Ok(rows) = stmt.query_map(params![user_id], |r| r.get::<_, String>(0)) {
                for row in rows {
                    if let Ok(ts_str) = row {
                        if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(&ts_str) {
                            let local_date_str = dt.with_timezone(&chrono::Local).format("%Y-%m-%d").to_string();
                            if local_date_str == today {
                                count += 1;
                            }
                        }
                    }
                }
            }
        }
        count
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RealtimeGlobalStats {
    pub total_passwords: i32,
    pub total_tasks: i32,
    pub completed_tasks_total: i32,
    pub completed_tasks_today: i32,
    pub total_notes: i32,
    pub notes_created_today: i32,
    pub total_pomodoros_today: i32,
    pub total_pomodoros: i32,
    pub total_habits: i32,
    pub habits_completed_today: i32,
    pub sleep_logged_today_hours: f64,
    pub study_hours_today: f64,
    pub reading_pages_today: i32,
    pub reading_books_total: i32,
    pub active_days_total: i32,
    pub current_xp: i32,
    pub level: i32,
    pub tree_xp: i32,
    pub tree_level: i32,
    pub xp_today: i32,
    pub total_glossary_words: i32,
    pub total_flashcard_decks: i32,
    pub total_movies: i32,
    pub max_habit_streak: i32,
    pub has_night_pomodoro: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct XPHistoryEntry {
    pub id: i64,
    pub user_id: String,
    pub amount: i32,
    pub source: String,
    pub xp_type: String,
    pub timestamp: String,
    pub reference_table: Option<String>,
    pub reference_id: Option<String>,
    pub is_lost: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UnlockedAchievement {
    pub achievement_id: String,
    pub unlocked_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UserProgressState {
    pub xp: i32,
    pub level: i32,
    pub tree_xp: i32,
    pub tree_level: i32,
    pub unlocked_achievements: Vec<UnlockedAchievement>,
    pub completed_challenges_today: Vec<String>,
    pub last_3_days_completed_count: i32,
    pub last_completed_date: Option<String>,
}

#[tauri::command]
pub async fn stats_get_cross_metrics(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    days: i32,
) -> Result<Vec<CrossMetric>, String> {
    let now = state.config.get_now();
    Ok(state.stats.get_cross_metrics(&user_id, days, now))
}

#[tauri::command]
pub async fn stats_get_performance_summary(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    days: i32,
) -> Result<PerformanceSummary, String> {
    let now = state.config.get_now();
    Ok(state.stats.get_performance_summary(&user_id, days, now))
}

#[tauri::command]
pub async fn stats_get_global_realtime_metrics(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    today: String,
) -> Result<RealtimeGlobalStats, String> {
    let mut stats = state.stats.get_global_realtime_metrics(&user_id, &today);
    let notes = state.note.list_notes(&user_id);
    stats.total_notes = notes.len() as i32;
    stats.notes_created_today = state.stats.get_notes_activity_today(&user_id, &today);
    Ok(stats)
}

#[tauri::command]
pub async fn stats_get_xp_history(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
) -> Result<Vec<XPHistoryEntry>, String> {
    Ok(state.stats.get_xp_history(&user_id, &state.note))
}

#[tauri::command]
pub async fn achievements_get_user_state(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    today: String,
    three_days_ago: String,
) -> Result<UserProgressState, String> {
    Ok(state
        .stats
        .get_user_progress_state(&user_id, &today, &three_days_ago))
}

#[tauri::command]
pub async fn achievements_unlock(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    achievement_id: String,
    xp_award: i32,
    unlocked_at: String,
) -> Result<(bool, i32, i32, i32), String> {
    Ok(state
        .stats
        .unlock_achievement(&user_id, &achievement_id, xp_award, &unlocked_at))
}

#[tauri::command]
pub async fn achievements_complete_challenge(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    challenge_id: String,
    xp_award: i32,
    date: String,
) -> Result<(i32, i32), String> {
    Ok(state
        .stats
        .complete_challenge(&user_id, &challenge_id, xp_award, &date))
}

#[tauri::command]
pub async fn achievements_undo_challenge(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    challenge_id: String,
    date: String,
) -> Result<(i32, i32), String> {
    Ok(state
        .stats
        .undo_challenge(&user_id, &challenge_id, &date))
}

#[tauri::command]
pub async fn achievements_add_xp(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    amount: i32,
) -> Result<(i32, i32), String> {
    Ok(state.stats.add_xp(&user_id, amount))
}

/// Sincroniza o ledger de XP com as conquistas desbloqueadas.
/// Recebe a lista de conquistas já desbloqueadas com seus valores de XP do frontend.
#[tauri::command]
pub async fn achievements_sync_ledger(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    achievements: Vec<(String, i32)>,
) -> Result<(), String> {
    state.stats.sync_achievement_ledger(&user_id, &achievements);
    Ok(())
}

/// Reseta o XP do usuário e recalcula com base apenas nas conquistas fornecidas.
#[tauri::command]
pub async fn achievements_reset_xp_and_resync(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    achievements: Vec<(String, i32)>,
) -> Result<(), String> {
    state.stats.reset_xp_and_resync(&user_id, &achievements);
    Ok(())
}

#[tauri::command]
pub async fn stats_export_xp_history_csv(
    state: tauri::State<'_, crate::AppState>,
    user_id: String,
    path: String,
) -> Result<(), String> {
    state.stats.export_xp_history_csv(&user_id, &path)
}

fn get_xp_for_level(level: i32) -> i32 {
    if level <= 5 {
        200
    } else if level <= 10 {
        400
    } else if level <= 15 {
        800
    } else if level <= 20 {
        1500
    } else if level <= 25 {
        2500
    } else if level <= 30 {
        4000
    } else if level <= 35 {
        6000
    } else if level <= 40 {
        9000
    } else {
        12000
    }
}


fn get_level_from_total_xp(total_xp: i32) -> (i32, i32) {
    let mut xp = total_xp;
    let mut level = 1;
    loop {
        let needed = get_xp_for_level(level);
        if xp >= needed {
            xp -= needed;
            level += 1;
        } else {
            break;
        }
    }
    (xp, level)
}
