export const labels = {
  rank: {
    companion: "陪玩",
    regular_booster: "普通打手",
    boss_booster: "魔王打手"
  },
  platform: {
    mobile: "手遊",
    pc: "端遊",
    dual_platform: "雙端"
  }
};

export const defaultPlayerOptions = {
  ranks: [
    { value: "companion", label: "陪玩", sort_order: 1, is_visible: true },
    { value: "regular_booster", label: "普通打手", sort_order: 2, is_visible: true },
    { value: "boss_booster", label: "魔王打手", sort_order: 3, is_visible: true }
  ],
  platforms: [
    { value: "mobile", label: "手遊", sort_order: 1, is_visible: true },
    { value: "pc", label: "端遊", sort_order: 2, is_visible: true },
    { value: "dual_platform", label: "雙端", sort_order: 3, is_visible: true }
  ]
};

function normalizeOption(option, index) {
  if (!option) return null;
  if (typeof option === "string") {
    return { value: option, label: option, sort_order: index + 1, is_visible: true };
  }
  if (!option.value) return null;
  return {
    value: String(option.value),
    label: String(option.label || option.value),
    sort_order: Number(option.sort_order || index + 1),
    is_visible: option.is_visible !== false
  };
}

export function normalizeOptions(options = []) {
  return options
    .map(normalizeOption)
    .filter(Boolean)
    .filter((option) => option.is_visible !== false)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
}

export function optionLabel(options, value, fallback = "") {
  return normalizeOptions(options).find((option) => option.value === value)?.label || fallback || value || "";
}

export function playerRanks(player = {}) {
  const ranks = Array.isArray(player.ranks) ? player.ranks : [player.rank];
  return [...new Set(ranks.map((rank) => String(rank || "").trim()).filter(Boolean))];
}

export function optionsFromPlayers(players = [], key, configuredOptions = []) {
  const optionMap = new Map(normalizeOptions(configuredOptions).map((option) => [option.value, option]));
  players.forEach((player) => {
    const rawValue = key === "rank" ? playerRanks(player) : player?.[key];
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    values.forEach((value) => {
      if (!value || optionMap.has(value)) return;
      const fallback = key === "rank" ? labels.rank[value] : labels.platform[value];
      optionMap.set(value, {
        value,
        label: fallback || value,
        sort_order: optionMap.size + 1,
        is_visible: true
      });
    });
  });
  return [...optionMap.values()].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
}

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

export function sanitizeHexColor(value = "") {
  const color = String(value || "").trim();
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color) ? color : "";
}

export function visibleSorted(items = []) {
  return [...items]
    .filter((item) => item.is_visible !== false)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
}

export function toLines(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function renderState(container, { title, message, onRetry }) {
  container.innerHTML = `
    <div class="state-box" role="status">
      <div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
        ${onRetry ? '<button class="button" type="button" data-retry>重新載入</button>' : ""}
      </div>
    </div>
  `;
  if (onRetry) {
    container.querySelector("[data-retry]").addEventListener("click", onRetry);
  }
}

export function staleNoteHtml(isStale) {
  return isStale ? '<p class="stale-note">目前顯示最近一次成功載入的資料。</p>' : "";
}
