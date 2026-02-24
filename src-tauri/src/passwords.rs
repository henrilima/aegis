use rusqlite::{params, Connection};
use uuid;
use serde::{Deserialize, Serialize};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose, Engine as _};
use chrono::Utc;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use csv::{ReaderBuilder, WriterBuilder};

#[derive(Debug, Serialize, Deserialize)]
pub struct PasswordEntry {
    pub id: Option<i32>,
    pub user_id: String,
    pub name: String,
    pub url: String,
    pub username: String,
    pub password_encrypted: String,
    pub note_encrypted: String,
    pub nonce_password: String,
    pub nonce_note: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DecryptedEntry {
    pub id: i32,
    pub name: String,
    pub url: String,
    pub username: String,
    pub password: String,
    pub note: String,
}

#[derive(Debug, Deserialize)]
struct GoogleCsvEntry {
    name: String,
    url: String,
    username: String,
    password: String,
    note: String,
}

pub struct PasswordManager {
    db_path: PathBuf,
}

impl PasswordManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
        std::fs::create_dir_all(&app_dir).ok();
        let db_path = app_dir.join("passwords.db");
        let conn = Connection::open(&db_path).expect("Failed to open database");
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                master_hash TEXT NOT NULL
            )",
            [],
        ).ok();

        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (username)",
            [],
        ).ok();

        let _ = conn.execute("ALTER TABLE users ADD COLUMN email TEXT DEFAULT 'legacy@aegis.local'", []);

        conn.execute(
            "CREATE TABLE IF NOT EXISTS passwords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                url TEXT,
                username TEXT,
                password_encrypted TEXT NOT NULL,
                note_encrypted TEXT,
                nonce_password TEXT NOT NULL,
                nonce_note TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )",
            [],
        ).ok();

        
        let _ = conn.execute("ALTER TABLE users ADD COLUMN vault_hash TEXT", []);

        Self { db_path }
    }

    fn get_connection(&self) -> Connection {
        Connection::open(&self.db_path).expect("Failed to connect to DB")
    }

    

    pub fn check_user_exists(&self, user_id: &str) -> bool {
        let conn = self.get_connection();
        let count: i64 = conn.query_row(
            "SELECT count(*) FROM users WHERE id = ?1",
            params![user_id],
            |row| row.get(0),
        ).unwrap_or(0);
        count > 0
    }

    pub fn check_availability(&self, username: &str, email: &str) -> Result<(), String> {
        let conn = self.get_connection();
        
        let exists_email: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM users WHERE email = ?1)",
            params![email],
            |row| row.get(0),
        ).unwrap_or(false);

        if exists_email {
            return Err("Este e-mail já está em uso por outra conta local.".to_string());
        }

        let exists_username: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM users WHERE username = ?1)",
            params![username],
            |row| row.get(0),
        ).unwrap_or(false);

        if exists_username {
            return Err("Este nome de usuário já está sendo usado.".to_string());
        }

        Ok(())
    }

    pub fn delete_user(&self, user_id: &str) -> Result<(), String> {
        let conn = self.get_connection();
        let _ = conn.execute("DELETE FROM passwords WHERE user_id = ?1", params![user_id]);
        let _ = conn.execute("DELETE FROM pomodoro_v2 WHERE user_id = ?1", params![user_id]);
        let _ = conn.execute("DELETE FROM pomodoro_history WHERE user_id = ?1", params![user_id]);
        let _ = conn.execute("DELETE FROM habits WHERE user_id = ?1", params![user_id]);
        let _ = conn.execute("DELETE FROM hydration_reminders WHERE user_id = ?1", params![user_id]);
        let _ = conn.execute("DELETE FROM notes WHERE user_id = ?1", params![user_id]);
        let _ = conn.execute("DELETE FROM users WHERE id = ?1", params![user_id]);
        Ok(())
    }

    pub fn register_user(&self, username: &str, email: &str, master_password: &str) -> Result<String, String> {
        let id = uuid::Uuid::new_v4().to_string();
        self.register_user_with_id(&id, username, email, master_password)?;
        Ok(id)
    }

    pub fn register_user_with_id(&self, user_id: &str, username: &str, email: &str, master_password: &str) -> Result<(), String> {
        let conn = self.get_connection();
        
        let exists_email: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM users WHERE email = ?1)",
            params![email],
            |row| row.get(0),
        ).unwrap_or(false);

        if exists_email {
            return Err("Este e-mail já está em uso por outra conta local.".to_string());
        }

        let exists_username: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM users WHERE username = ?1)",
            params![username],
            |row| row.get(0),
        ).unwrap_or(false);

        if exists_username {
            return Err("Este nome de usuário já está sendo usado.".to_string());
        }

        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(master_password.as_bytes(), &salt)
            .map_err(|e| e.to_string())?
            .to_string();

        conn.execute(
            "INSERT INTO users (id, username, email, master_hash) VALUES (?1, ?2, ?3, ?4)",
            params![user_id, username, email, password_hash],
        ).map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn login_user(&self, email: &str, master_password: &str) -> Result<String, String> {
        let conn = self.get_connection();
        let (id, hash): (String, String) = conn.query_row(
            "SELECT id, master_hash FROM users WHERE email = ?1",
            params![email],
            |row| Ok((row.get(0)?, row.get(1)?)),
        ).map_err(|_| "Usuário não encontrado".to_string())?;

        let parsed_hash = PasswordHash::new(&hash).map_err(|e| e.to_string())?;
        Argon2::default()
            .verify_password(master_password.as_bytes(), &parsed_hash)
            .map_err(|_| "Senha incorreta".to_string())?;

        Ok(id)
    }

    pub fn get_user_data(&self, user_id: &str) -> Result<serde_json::Value, String> {
        let conn = self.get_connection();
        let (username, email): (String, String) = conn.query_row(
            "SELECT username, email FROM users WHERE id = ?1",
            params![user_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        ).map_err(|_| "Dados do usuário não encontrados".to_string())?;

        Ok(serde_json::json!({
            "id": user_id,
            "username": username,
            "email": email
        }))
    }

    pub fn list_users(&self) -> Result<Vec<serde_json::Value>, String> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare("SELECT id, username, email FROM users")
            .map_err(|e| e.to_string())?;
        
        let users = stmt.query_map([], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "username": row.get::<_, String>(1)?,
                "email": row.get::<_, String>(2)?
            }))
        }).map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .collect();

        Ok(users)
    }

    pub fn verify_master(&self, user_id: &str, master_password: &str) -> Result<Vec<u8>, String> {
        let conn = self.get_connection();
        let hash: String = conn.query_row(
            "SELECT master_hash FROM users WHERE id = ?1",
            params![user_id],
            |row| row.get(0),
        ).map_err(|_| "Usuário não registrado localmente. Por favor, registre sua conta primeiro.".to_string())?;

        let parsed_hash = PasswordHash::new(&hash).map_err(|e| e.to_string())?;
        Argon2::default()
            .verify_password(master_password.as_bytes(), &parsed_hash)
            .map_err(|_| "Senha mestra incorreta".to_string())?;

        
        let salt = parsed_hash.salt.ok_or("Salt missing")?;
        let mut key = [0u8; 32];
        let argon2 = Argon2::default();
        argon2.hash_password_into(master_password.as_bytes(), salt.as_str().as_bytes(), &mut key)
            .map_err(|e| e.to_string())?;

        Ok(key.to_vec())
    }

    
    
    pub fn verify_vault_password(&self, user_id: &str, vault_pwd: &str) -> Result<Vec<u8>, String> {
        let conn = self.get_connection();
        let (master_hash, vault_hash): (String, Option<String>) = conn.query_row(
            "SELECT master_hash, vault_hash FROM users WHERE id = ?1",
            params![user_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        ).map_err(|_| "Usuário não registrado localmente.".to_string())?;

        
        let hash_to_use = vault_hash.as_deref().unwrap_or(&master_hash);
        let parsed_hash = PasswordHash::new(hash_to_use).map_err(|e| e.to_string())?;
        Argon2::default()
            .verify_password(vault_pwd.as_bytes(), &parsed_hash)
            .map_err(|_| "Senha do cofre incorreta".to_string())?;

        let salt = parsed_hash.salt.ok_or("Salt missing")?;
        let mut key = [0u8; 32];
        Argon2::default()
            .hash_password_into(vault_pwd.as_bytes(), salt.as_str().as_bytes(), &mut key)
            .map_err(|e| e.to_string())?;
        Ok(key.to_vec())
    }

    pub fn has_separate_vault_password(&self, user_id: &str) -> bool {
        let conn = self.get_connection();
        let vault_hash: Option<String> = conn.query_row(
            "SELECT vault_hash FROM users WHERE id = ?1",
            params![user_id],
            |row| row.get(0),
        ).unwrap_or(None);
        vault_hash.is_some()
    }

    pub fn change_account_password(&self, user_id: &str, current_pwd: &str, new_pwd: &str) -> Result<(), String> {
        
        let old_key = self.verify_master(user_id, current_pwd)?;

        
        let conn = self.get_connection();
        let vault_hash: Option<String> = conn.query_row(
            "SELECT vault_hash FROM users WHERE id = ?1",
            params![user_id],
            |row| row.get(0),
        ).unwrap_or(None);

        
        let salt = SaltString::generate(&mut OsRng);
        let new_hash = Argon2::default()
            .hash_password(new_pwd.as_bytes(), &salt)
            .map_err(|e| e.to_string())?
            .to_string();

        
        if vault_hash.is_none() {
            let parsed_new = PasswordHash::new(&new_hash).map_err(|e| e.to_string())?;
            let new_salt = parsed_new.salt.ok_or("Salt missing")?;
            let mut new_key = [0u8; 32];
            Argon2::default()
                .hash_password_into(new_pwd.as_bytes(), new_salt.as_str().as_bytes(), &mut new_key)
                .map_err(|e| e.to_string())?;

            let entries = self.list_passwords(user_id)?;
            for entry in entries {
                let password = self.decrypt(&entry.password_encrypted, &entry.nonce_password, &old_key)?;
                let note = self.decrypt(&entry.note_encrypted, &entry.nonce_note, &old_key)?;
                let (pw_enc, pw_nonce) = self.encrypt(&password, &new_key);
                let (note_enc, note_nonce) = self.encrypt(&note, &new_key);
                conn.execute(
                    "UPDATE passwords SET password_encrypted=?1, note_encrypted=?2, nonce_password=?3, nonce_note=?4 WHERE id=?5",
                    params![pw_enc, note_enc, pw_nonce, note_nonce, entry.id],
                ).map_err(|e| e.to_string())?;
            }
        }

        
        conn.execute(
            "UPDATE users SET master_hash = ?1 WHERE id = ?2",
            params![new_hash, user_id],
        ).map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn change_vault_password(&self, user_id: &str, current_vault_pwd: &str, new_vault_pwd: Option<&str>) -> Result<(), String> {
        
        let old_key = self.verify_vault_password(user_id, current_vault_pwd)?;

        let conn = self.get_connection();

        if let Some(new_pwd) = new_vault_pwd {
            
            let salt = SaltString::generate(&mut OsRng);
            let new_hash = Argon2::default()
                .hash_password(new_pwd.as_bytes(), &salt)
                .map_err(|e| e.to_string())?
                .to_string();

            let parsed_new = PasswordHash::new(&new_hash).map_err(|e| e.to_string())?;
            let new_salt = parsed_new.salt.ok_or("Salt missing")?;
            let mut new_key = [0u8; 32];
            Argon2::default()
                .hash_password_into(new_pwd.as_bytes(), new_salt.as_str().as_bytes(), &mut new_key)
                .map_err(|e| e.to_string())?;

            
            let entries = self.list_passwords(user_id)?;
            for entry in entries {
                let password = self.decrypt(&entry.password_encrypted, &entry.nonce_password, &old_key)?;
                let note = self.decrypt(&entry.note_encrypted, &entry.nonce_note, &old_key)?;
                let (pw_enc, pw_nonce) = self.encrypt(&password, &new_key);
                let (note_enc, note_nonce) = self.encrypt(&note, &new_key);
                conn.execute(
                    "UPDATE passwords SET password_encrypted=?1, note_encrypted=?2, nonce_password=?3, nonce_note=?4 WHERE id=?5",
                    params![pw_enc, note_enc, pw_nonce, note_nonce, entry.id],
                ).map_err(|e| e.to_string())?;
            }

            conn.execute(
                "UPDATE users SET vault_hash = ?1 WHERE id = ?2",
                params![new_hash, user_id],
            ).map_err(|e| e.to_string())?;
        } else {
            
            
            return Err("Para remover a senha isolada do cofre, use o método de reversão dedicado.".to_string());
        }

        Ok(())
    }

    pub fn revert_vault_to_master(&self, user_id: &str, current_vault_pwd: &str, master_pwd: &str) -> Result<(), String> {
        
        let old_key = self.verify_vault_password(user_id, current_vault_pwd)?;

        
        let new_key = self.verify_master(user_id, master_pwd)?;

        let conn = self.get_connection();

        
        let entries = self.list_passwords(user_id)?;
        for entry in entries {
            let password = self.decrypt(&entry.password_encrypted, &entry.nonce_password, &old_key)?;
            let note = self.decrypt(&entry.note_encrypted, &entry.nonce_note, &old_key)?;
            let (pw_enc, pw_nonce) = self.encrypt(&password, &new_key);
            let (note_enc, note_nonce) = self.encrypt(&note, &new_key);
            conn.execute(
                "UPDATE passwords SET password_encrypted=?1, note_encrypted=?2, nonce_password=?3, nonce_note=?4 WHERE id=?5",
                params![pw_enc, note_enc, pw_nonce, note_nonce, entry.id],
            ).map_err(|e| e.to_string())?;
        }

        
        conn.execute(
            "UPDATE users SET vault_hash = NULL WHERE id = ?1",
            params![user_id],
        ).map_err(|e| e.to_string())?;

        Ok(())
    }


    fn encrypt(&self, data: &str, key: &[u8]) -> (String, String) {
        let cipher = Aes256Gcm::new_from_slice(key).unwrap();
        let nonce_bytes = rand::random::<[u8; 12]>();
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        let ciphertext = cipher.encrypt(nonce, data.as_bytes()).expect("Encryption failed");
        
        (
            general_purpose::STANDARD.encode(ciphertext),
            general_purpose::STANDARD.encode(nonce_bytes)
        )
    }

    fn decrypt(&self, encrypted_data: &str, nonce_str: &str, key: &[u8]) -> Result<String, String> {
        let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| e.to_string())?;
        let ciphertext = general_purpose::STANDARD.decode(encrypted_data).map_err(|e| e.to_string())?;
        let nonce_bytes = general_purpose::STANDARD.decode(nonce_str).map_err(|e| e.to_string())?;
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        let plaintext = cipher.decrypt(nonce, ciphertext.as_slice()).map_err(|_| "Falha ao descriptografar".to_string())?;
        
        String::from_utf8(plaintext).map_err(|e| e.to_string())
    }

    

    pub fn add_password(&self, user_id: &str, master_pwd: &str, name: &str, url: &str, username: &str, password_raw: &str, note_raw: &str) -> Result<(), String> {
        let key = self.verify_master(user_id, master_pwd)?;
        let (pw_enc, pw_nonce) = self.encrypt(password_raw, &key);
        let (note_enc, note_nonce) = self.encrypt(note_raw, &key);
        let now = Utc::now().to_rfc3339();

        let conn = self.get_connection();
        conn.execute(
            "INSERT INTO passwords (user_id, name, url, username, password_encrypted, note_encrypted, nonce_password, nonce_note, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![user_id, name, url, username, pw_enc, note_enc, pw_nonce, note_nonce, now, now],
        ).map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn update_password(&self, user_id: &str, master_pwd: &str, entry_id: i32, name: &str, url: &str, username: &str, password_raw: &str, note_raw: &str) -> Result<(), String> {
        let key = self.verify_master(user_id, master_pwd)?;
        let (pw_enc, pw_nonce) = self.encrypt(password_raw, &key);
        let (note_enc, note_nonce) = self.encrypt(note_raw, &key);
        let now = Utc::now().to_rfc3339();

        let conn = self.get_connection();
        conn.execute(
            "UPDATE passwords SET name = ?1, url = ?2, username = ?3, password_encrypted = ?4, note_encrypted = ?5, nonce_password = ?6, nonce_note = ?7, updated_at = ?8 
             WHERE id = ?9 AND user_id = ?10",
            params![name, url, username, pw_enc, note_enc, pw_nonce, note_nonce, now, entry_id, user_id],
        ).map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn delete_password(&self, user_id: &str, entry_id: i32) -> Result<(), String> {
        let conn = self.get_connection();
        conn.execute(
            "DELETE FROM passwords WHERE id = ?1 AND user_id = ?2",
            params![entry_id, user_id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_passwords(&self, user_id: &str) -> Result<Vec<PasswordEntry>, String> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare("SELECT id, user_id, name, url, username, password_encrypted, note_encrypted, nonce_password, nonce_note, created_at, updated_at FROM passwords WHERE user_id = ?1")
            .map_err(|e| e.to_string())?;
        
        let entries = stmt.query_map(params![user_id], |row| {
            Ok(PasswordEntry {
                id: Some(row.get(0)?),
                user_id: row.get(1)?,
                name: row.get(2)?,
                url: row.get(3)?,
                username: row.get(4)?,
                password_encrypted: row.get(5)?,
                note_encrypted: row.get(6)?,
                nonce_password: row.get(7)?,
                nonce_note: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        }).map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .collect();

        Ok(entries)
    }

    pub fn decrypt_entry(&self, user_id: &str, master_pwd: &str, entry_id: i32) -> Result<DecryptedEntry, String> {
        let key = self.verify_master(user_id, master_pwd)?;
        let conn = self.get_connection();
        
        let entry: PasswordEntry = conn.query_row(
            "SELECT id, user_id, name, url, username, password_encrypted, note_encrypted, nonce_password, nonce_note, created_at, updated_at FROM passwords WHERE id = ?1 AND user_id = ?2",
            params![entry_id, user_id],
            |row| Ok(PasswordEntry {
                id: Some(row.get(0)?),
                user_id: row.get(1)?,
                name: row.get(2)?,
                url: row.get(3)?,
                username: row.get(4)?,
                password_encrypted: row.get(5)?,
                note_encrypted: row.get(6)?,
                nonce_password: row.get(7)?,
                nonce_note: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        ).map_err(|_| "Entrada não encontrada".to_string())?;

        let password = self.decrypt(&entry.password_encrypted, &entry.nonce_password, &key)?;
        let note = self.decrypt(&entry.note_encrypted, &entry.nonce_note, &key)?;

        Ok(DecryptedEntry {
            id: entry.id.unwrap(),
            name: entry.name,
            url: entry.url,
            username: entry.username,
            password,
            note,
        })
    }

    pub fn import_google_csv(&self, user_id: &str, master_pwd: &str, file_path: &str) -> Result<usize, String> {
        let key = self.verify_master(user_id, master_pwd)?;
        let mut reader = ReaderBuilder::new()
            .has_headers(true)
            .from_path(file_path)
            .map_err(|e| e.to_string())?;

        let mut count = 0;
        let conn = self.get_connection();
        let now = Utc::now().to_rfc3339();

        for result in reader.deserialize() {
            let record: GoogleCsvEntry = result.map_err(|e| e.to_string())?;
            let (pw_enc, pw_nonce) = self.encrypt(&record.password, &key);
            let (note_enc, note_nonce) = self.encrypt(&record.note, &key);

            conn.execute(
                "INSERT INTO passwords (user_id, name, url, username, password_encrypted, note_encrypted, nonce_password, nonce_note, created_at, updated_at) 
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![user_id, record.name, record.url, record.username, pw_enc, note_enc, pw_nonce, note_nonce, now, now],
            ).map_err(|e| e.to_string())?;
            count += 1;
        }

        Ok(count)
    }

    pub fn export_google_csv(&self, user_id: &str, master_pwd: &str, dest_path: &str) -> Result<(), String> {
        let entries = self.list_passwords(user_id)?;
        let key = self.verify_master(user_id, master_pwd)?;
        
        let mut writer = WriterBuilder::new()
            .has_headers(true)
            .from_path(dest_path)
            .map_err(|e| e.to_string())?;

        writer.write_record(&["name", "url", "username", "password", "note"]).map_err(|e| e.to_string())?;

        for entry in entries {
            let password = self.decrypt(&entry.password_encrypted, &entry.nonce_password, &key)?;
            let note = self.decrypt(&entry.note_encrypted, &entry.nonce_note, &key)?;
            
            writer.write_record(&[
                entry.name,
                entry.url,
                entry.username,
                password,
                note,
            ]).map_err(|e| e.to_string())?;
        }

        writer.flush().map_err(|e| e.to_string())?;
        Ok(())
    }
}
