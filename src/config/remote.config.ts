// Configuração centralizada do Aegis Web System (Painel de Controle)
// Altere aqui a porta ou a chave padrão se desejar

export const REMOTE_CONFIG = {
  // Porta padrão de desenvolvimento (altere aqui para 3000, 3001, etc.)
  port: 3001,
  // Chave de autenticação da API
  apiKey: "96421340",
  // URL de produção na Vercel
  productionUrl: "https://aegiswebpainel.vercel.app",
};

let cachedResolvedUrl: string | null = null;
let lastResolvedTime = 0;

/**
 * Descobre automaticamente o servidor web ativo:
 * 1. Respeita a URL configurada manualmente no localStorage (se houver).
 * 2. Em ambiente local, testa a porta configurada (ex: 3001) e portas alternativas (3000).
 * 3. Se nenhum servidor local estiver rodando, conecta à URL de produção da Vercel.
 */
export async function resolveRemoteApiUrl(): Promise<string> {
  const manual =
    typeof window !== "undefined"
      ? localStorage.getItem("aegis_remote_api_url")
      : null;
  if (manual) return manual;

  const now = Date.now();
  if (cachedResolvedUrl && now - lastResolvedTime < 30000) {
    return cachedResolvedUrl;
  }

  // Lista de URLs candidatas em ordem de prioridade
  const candidateUrls = [
    `http://localhost:${REMOTE_CONFIG.port}`,
    `http://127.0.0.1:${REMOTE_CONFIG.port}`,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    REMOTE_CONFIG.productionUrl,
  ];

  for (const url of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 600);
      const res = await fetch(`${url}/api/notifications`, {
        headers: { "x-api-key": REMOTE_CONFIG.apiKey },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok || res.status === 401 || res.status === 403) {
        cachedResolvedUrl = url;
        lastResolvedTime = now;
        return url;
      }
    } catch {}
  }

  cachedResolvedUrl = REMOTE_CONFIG.productionUrl;
  lastResolvedTime = now;
  return REMOTE_CONFIG.productionUrl;
}
