import {
  API_BASE_URL,
  CACHE_TTL_MS,
  IS_MOCK_API_BASE,
  REQUEST_RETRIES,
  REQUEST_TIMEOUT_MS
} from "./config.js";
import { mockPlayers } from "./mock/players.js";
import { mockPricing } from "./mock/pricing.js";
import { mockRecruitment } from "./mock/recruitment.js";
import { mockFaq } from "./mock/faq.js";
import { mockSettings } from "./mock/settings.js";

const mockByKey = {
  players: mockPlayers,
  pricing: mockPricing,
  recruitment: mockRecruitment,
  faq: mockFaq,
  settings: mockSettings
};

function cacheKey(path) {
  return `joker-cache:${path}`;
}

function readCache(path) {
  try {
    const raw = localStorage.getItem(cacheKey(path));
    if (!raw) return null;
    const cached = JSON.parse(raw);
    return cached?.data ? cached : null;
  } catch {
    return null;
  }
}

function writeCache(path, data) {
  try {
    localStorage.setItem(cacheKey(path), JSON.stringify({ data, saved_at: Date.now() }));
  } catch {
    /* localStorage may be unavailable in private browsing. */
  }
}

function resolveUrl(path) {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

function mockResponse(key) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve({ data: structuredClone(mockByKey[key]), source: "mock", stale: false }), 180);
  });
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

async function requestJson(path, options = {}) {
  let lastError;
  for (let attempt = 0; attempt <= REQUEST_RETRIES; attempt += 1) {
    try {
      return await fetchWithTimeout(resolveUrl(path), options);
    } catch (error) {
      lastError = error;
      if (attempt < REQUEST_RETRIES) {
        await new Promise((resolve) => window.setTimeout(resolve, 350 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export async function getPublicResource(path, mockKey) {
  if (IS_MOCK_API_BASE) {
    return mockResponse(mockKey);
  }

  try {
    const data = await requestJson(path);
    writeCache(path, data);
    return { data, source: "api", stale: false };
  } catch (error) {
    const cached = readCache(path);
    if (cached?.data && Date.now() - Number(cached.saved_at || 0) <= CACHE_TTL_MS * 6) {
      return { data: cached.data, source: "cache", stale: true, error };
    }
    throw error;
  }
}

export const publicApi = {
  players: () => getPublicResource("/api/players", "players"),
  pricing: () => getPublicResource("/api/pricing", "pricing"),
  recruitment: () => getPublicResource("/api/recruitment", "recruitment"),
  faq: () => getPublicResource("/api/faq", "faq"),
  settings: () => getPublicResource("/api/settings", "settings")
};

export async function adminRequest(path, { method = "GET", body } = {}) {
  const headers = {};
  let payload = body;

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (IS_MOCK_API_BASE && method !== "GET") {
    await new Promise((resolve) => window.setTimeout(resolve, 220));
    return { ok: true, mock: true };
  }

  return requestJson(path, {
    method,
    headers,
    body: payload
  });
}

export function sanitizeImageUrl(url, fallback = "assets/placeholders/avatar.webp") {
  if (!url || typeof url !== "string") return fallback;
  try {
    const parsed = new URL(url, window.location.origin);
    if (!["http:", "https:"].includes(parsed.protocol)) return fallback;
    return parsed.href;
  } catch {
    return fallback;
  }
}
