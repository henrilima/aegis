// Módulo de Integração com Discord Rich Presence (RPC)
// Gerencia a comunicação IPC com o cliente local do Discord

use std::fs::File;
use std::io::{Read, Write};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{channel, Receiver, Sender};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::State;
use uuid::Uuid;

pub const DISCORD_CLIENT_ID: &str = "933507268165664768";
pub const DEFAULT_LARGE_IMAGE: &str = "aegis_logo";
pub const DEFAULT_LARGE_TEXT: &str = "Aegis";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscordTimestamps {
    pub start: Option<i64>,
    pub end: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscordAssets {
    pub large_image: Option<String>,
    pub large_text: Option<String>,
    pub small_image: Option<String>,
    pub small_text: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscordPresencePayload {
    pub details: Option<String>,
    pub state: Option<String>,
    pub timestamps: Option<DiscordTimestamps>,
    pub assets: Option<DiscordAssets>,
}

#[allow(dead_code)]
enum RpcCommand {
    Update(DiscordPresencePayload),
    Clear,
    SetEnabled(bool),
    Shutdown,
}

enum RpcStream {
    #[cfg(windows)]
    WindowsPipe(File),
    #[cfg(unix)]
    UnixSocket(std::os::unix::net::UnixStream),
}

impl Read for RpcStream {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        match self {
            #[cfg(windows)]
            RpcStream::WindowsPipe(f) => f.read(buf),
            #[cfg(unix)]
            RpcStream::UnixSocket(s) => s.read(buf),
        }
    }
}

impl Write for RpcStream {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        match self {
            #[cfg(windows)]
            RpcStream::WindowsPipe(f) => f.write(buf),
            #[cfg(unix)]
            RpcStream::UnixSocket(s) => s.write(buf),
        }
    }

    fn flush(&mut self) -> std::io::Result<()> {
        match self {
            #[cfg(windows)]
            RpcStream::WindowsPipe(f) => f.flush(),
            #[cfg(unix)]
            RpcStream::UnixSocket(s) => s.flush(),
        }
    }
}

pub struct DiscordRpcManager {
    sender: Sender<RpcCommand>,
    is_enabled: Arc<AtomicBool>,
    is_connected: Arc<AtomicBool>,
}

impl DiscordRpcManager {
    pub fn new() -> Self {
        let (sender, receiver) = channel::<RpcCommand>();
        let is_enabled = Arc::new(AtomicBool::new(true));
        let is_connected = Arc::new(AtomicBool::new(false));

        let enabled_clone = Arc::clone(&is_enabled);
        let connected_clone = Arc::clone(&is_connected);

        thread::spawn(move || {
            Self::worker_loop(receiver, enabled_clone, connected_clone);
        });

        Self {
            sender,
            is_enabled,
            is_connected,
        }
    }

    pub fn set_enabled(&self, enabled: bool) {
        self.is_enabled.store(enabled, Ordering::SeqCst);
        let _ = self.sender.send(RpcCommand::SetEnabled(enabled));
    }

    pub fn is_enabled(&self) -> bool {
        self.is_enabled.load(Ordering::SeqCst)
    }

    pub fn is_connected(&self) -> bool {
        self.is_connected.load(Ordering::SeqCst)
    }

    pub fn update_presence(&self, payload: DiscordPresencePayload) {
        if self.is_enabled.load(Ordering::SeqCst) {
            let _ = self.sender.send(RpcCommand::Update(payload));
        }
    }

    pub fn clear_presence(&self) {
        let _ = self.sender.send(RpcCommand::Clear);
    }

    fn connect_socket() -> Option<RpcStream> {
        #[cfg(windows)]
        {
            for i in 0..10 {
                let pipe_path = format!(r"\\.\pipe\discord-ipc-{}", i);
                if let Ok(file) = std::fs::OpenOptions::new()
                    .read(true)
                    .write(true)
                    .open(&pipe_path)
                {
                    return Some(RpcStream::WindowsPipe(file));
                }
            }
        }

        #[cfg(unix)]
        {
            let prefixes = [
                std::env::var("XDG_RUNTIME_DIR").ok(),
                std::env::var("TMPDIR").ok(),
                std::env::var("TMP").ok(),
                std::env::var("TEMP").ok(),
                Some("/tmp".to_string()),
            ];

            for prefix in prefixes.into_iter().flatten() {
                for i in 0..10 {
                    let socket_path = format!("{}/discord-ipc-{}", prefix, i);
                    if let Ok(stream) = std::os::unix::net::UnixStream::connect(&socket_path) {
                        return Some(RpcStream::UnixSocket(stream));
                    }
                }
            }
        }

        None
    }

    fn send_packet(stream: &mut RpcStream, opcode: u32, payload: &str) -> std::io::Result<()> {
        let length = payload.len() as u32;
        stream.write_all(&opcode.to_le_bytes())?;
        stream.write_all(&length.to_le_bytes())?;
        stream.write_all(payload.as_bytes())?;
        stream.flush()?;
        Ok(())
    }

    fn read_packet(stream: &mut RpcStream) -> std::io::Result<(u32, String)> {
        let mut header = [0u8; 8];
        stream.read_exact(&mut header)?;

        let opcode = u32::from_le_bytes([header[0], header[1], header[2], header[3]]);
        let length = u32::from_le_bytes([header[4], header[5], header[6], header[7]]) as usize;

        let mut buf = vec![0u8; length];
        stream.read_exact(&mut buf)?;

        let payload = String::from_utf8_lossy(&buf).to_string();
        Ok((opcode, payload))
    }

    fn handshake(stream: &mut RpcStream) -> bool {
        let payload = json!({
            "v": 1,
            "client_id": DISCORD_CLIENT_ID
        })
        .to_string();

        if Self::send_packet(stream, 0, &payload).is_err() {
            return false;
        }

        if let Ok((opcode, _)) = Self::read_packet(stream) {
            return opcode == 1; // Resposta de Frame DISPATCH
        }

        false
    }

    fn build_activity_payload(payload: &DiscordPresencePayload) -> String {
        let pid = std::process::id();
        let nonce = Uuid::new_v4().to_string();

        let mut activity_json = serde_json::Map::new();

        if let Some(details) = &payload.details {
            if !details.is_empty() {
                activity_json.insert("details".to_string(), json!(details));
            }
        }

        if let Some(state) = &payload.state {
            if !state.is_empty() {
                activity_json.insert("state".to_string(), json!(state));
            }
        }

        if let Some(ts) = &payload.timestamps {
            let mut ts_json = serde_json::Map::new();
            if let Some(start) = ts.start {
                ts_json.insert("start".to_string(), json!(start));
            }
            if let Some(end) = ts.end {
                ts_json.insert("end".to_string(), json!(end));
            }
            if !ts_json.is_empty() {
                activity_json.insert("timestamps".to_string(), json!(ts_json));
            }
        }

        let mut assets_json = serde_json::Map::new();
        let large_img = payload
            .assets
            .as_ref()
            .and_then(|a| a.large_image.clone())
            .unwrap_or_else(|| DEFAULT_LARGE_IMAGE.to_string());
        let large_txt = payload
            .assets
            .as_ref()
            .and_then(|a| a.large_text.clone())
            .unwrap_or_else(|| DEFAULT_LARGE_TEXT.to_string());

        assets_json.insert("large_image".to_string(), json!(large_img));
        assets_json.insert("large_text".to_string(), json!(large_txt));

        if let Some(assets) = &payload.assets {
            if let Some(small_img) = &assets.small_image {
                if !small_img.is_empty() {
                    assets_json.insert("small_image".to_string(), json!(small_img));
                }
            }
            if let Some(small_txt) = &assets.small_text {
                if !small_txt.is_empty() {
                    assets_json.insert("small_text".to_string(), json!(small_txt));
                }
            }
        }

        activity_json.insert("assets".to_string(), json!(assets_json));

        json!({
            "cmd": "SET_ACTIVITY",
            "args": {
                "pid": pid,
                "activity": activity_json
            },
            "nonce": nonce
        })
        .to_string()
    }

    fn worker_loop(
        receiver: Receiver<RpcCommand>,
        is_enabled: Arc<AtomicBool>,
        is_connected: Arc<AtomicBool>,
    ) {
        let mut stream: Option<RpcStream> = None;
        let mut last_presence: Option<DiscordPresencePayload> = None;
        // Contador para tentativas de reconexão periódica (a cada ~10s = 20 ticks de 500ms)
        let mut reconnect_ticks: u32 = 0;

        loop {
            // Aguarda comandos com timeout de verificação
            match receiver.recv_timeout(Duration::from_millis(500)) {
                Ok(RpcCommand::Shutdown) => {
                    if let Some(mut s) = stream.take() {
                        let _ = Self::send_packet(&mut s, 2, "{}");
                    }
                    is_connected.store(false, Ordering::SeqCst);
                    break;
                }
                Ok(RpcCommand::SetEnabled(enabled)) => {
                    if !enabled {
                        if let Some(mut s) = stream.take() {
                            let pid = std::process::id();
                            let nonce = Uuid::new_v4().to_string();
                            let clear_payload = json!({
                                "cmd": "SET_ACTIVITY",
                                "args": {
                                    "pid": pid,
                                    "activity": null
                                },
                                "nonce": nonce
                            })
                            .to_string();
                            let _ = Self::send_packet(&mut s, 1, &clear_payload);
                        }
                        is_connected.store(false, Ordering::SeqCst);
                    } else if let Some(presence) = &last_presence {
                        // Reenvia última presença ao reativar
                        let payload_str = Self::build_activity_payload(presence);
                        Self::ensure_connected_and_send(
                            &mut stream,
                            &is_connected,
                            &payload_str,
                        );
                    }
                }
                Ok(RpcCommand::Clear) => {
                    last_presence = None;
                    if is_enabled.load(Ordering::SeqCst) && stream.is_some() {
                        let pid = std::process::id();
                        let nonce = Uuid::new_v4().to_string();
                        let clear_payload = json!({
                            "cmd": "SET_ACTIVITY",
                            "args": {
                                "pid": pid,
                                "activity": null
                            },
                            "nonce": nonce
                        })
                        .to_string();
                        if let Some(s) = stream.as_mut() {
                            if Self::send_packet(s, 1, &clear_payload).is_err() {
                                stream = None;
                                is_connected.store(false, Ordering::SeqCst);
                            }
                        }
                    }
                }
                Ok(RpcCommand::Update(presence)) => {
                    last_presence = Some(presence.clone());
                    if is_enabled.load(Ordering::SeqCst) {
                        let payload_str = Self::build_activity_payload(&presence);
                        Self::ensure_connected_and_send(
                            &mut stream,
                            &is_connected,
                            &payload_str,
                        );
                    }
                }
                Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {
                    // Reconexão automática: quando habilitado mas desconectado,
                    // tenta reconectar a cada ~10 segundos (20 ticks de 500ms)
                    reconnect_ticks += 1;
                    if reconnect_ticks >= 20 {
                        reconnect_ticks = 0;
                        if is_enabled.load(Ordering::SeqCst) && stream.is_none() {
                            if let Some(ref presence) = last_presence {
                                let payload_str = Self::build_activity_payload(presence);
                                Self::ensure_connected_and_send(
                                    &mut stream,
                                    &is_connected,
                                    &payload_str,
                                );
                            } else {
                                // Tenta conectar mesmo sem presença pendente
                                if let Some(mut new_stream) = Self::connect_socket() {
                                    if Self::handshake(&mut new_stream) {
                                        stream = Some(new_stream);
                                        is_connected.store(true, Ordering::SeqCst);
                                    }
                                }
                            }
                        }
                    }
                }
                Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => {
                    break;
                }
            }
        }
    }

    fn ensure_connected_and_send(
        stream: &mut Option<RpcStream>,
        is_connected: &Arc<AtomicBool>,
        payload_str: &str,
    ) {
        if stream.is_none() {
            if let Some(mut new_stream) = Self::connect_socket() {
                if Self::handshake(&mut new_stream) {
                    *stream = Some(new_stream);
                    is_connected.store(true, Ordering::SeqCst);
                }
            }
        }

        if let Some(s) = stream.as_mut() {
            if Self::send_packet(s, 1, payload_str).is_err() {
                *stream = None;
                is_connected.store(false, Ordering::SeqCst);
            }
        }
    }
}

// Comandos Tauri expostos para o Frontend

#[tauri::command]
pub fn discord_rpc_set_enabled(
    state: State<'_, crate::AppState>,
    enabled: bool,
) -> Result<bool, String> {
    state.discord.set_enabled(enabled);
    Ok(enabled)
}

#[tauri::command]
pub fn discord_rpc_is_enabled(state: State<'_, crate::AppState>) -> Result<bool, String> {
    Ok(state.discord.is_enabled())
}

#[tauri::command]
pub fn discord_rpc_is_connected(state: State<'_, crate::AppState>) -> Result<bool, String> {
    Ok(state.discord.is_connected())
}

#[tauri::command]
pub fn discord_rpc_update_presence(
    state: State<'_, crate::AppState>,
    payload: DiscordPresencePayload,
) -> Result<(), String> {
    state.discord.update_presence(payload);
    Ok(())
}

#[tauri::command]
pub fn discord_rpc_clear_presence(state: State<'_, crate::AppState>) -> Result<(), String> {
    state.discord.clear_presence();
    Ok(())
}
