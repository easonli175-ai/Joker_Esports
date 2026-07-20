const API_PORT = "18080";
const PUBLIC_API_BASE_URL = `http://eason.giize.com:${API_PORT}`;

function isLocalHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(hostname)
  );
}

function resolveApiBaseUrl() {
  if (typeof window === "undefined") return PUBLIC_API_BASE_URL;

  const { hostname, protocol } = window.location;
  if (protocol === "http:" && isLocalHost(hostname)) {
    return `http://${hostname}:${API_PORT}`;
  }

  return PUBLIC_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const DISCORD_INVITE_URL = "https://discord.gg/R8E86xPpes";

export const REQUEST_TIMEOUT_MS = 7000;
export const REQUEST_RETRIES = 1;
export const CACHE_TTL_MS = 1000 * 60 * 20;

export const IS_MOCK_API_BASE = API_BASE_URL.includes("api.example.com") || API_BASE_URL.trim() === "";
