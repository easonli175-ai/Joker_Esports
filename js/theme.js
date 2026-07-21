const STORAGE_KEY = "joker-theme";
const DARK_THEME_COLOR = "#090909";
const LIGHT_THEME_COLOR = "#f7f4fb";

const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");

function savedTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "";
  } catch {
    return "";
  }
}

function effectiveTheme() {
  return savedTheme() || (mediaQuery.matches ? "light" : "dark");
}

function setMetaThemeColor(theme) {
  const meta = document.querySelector("meta[name='theme-color']");
  if (meta) meta.setAttribute("content", theme === "light" ? LIGHT_THEME_COLOR : DARK_THEME_COLOR);
}

function applyTheme(theme, persist = false) {
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* Storage may be unavailable in private browsing. */
    }
    document.documentElement.dataset.theme = theme;
  } else {
    const stored = savedTheme();
    if (stored) {
      document.documentElement.dataset.theme = stored;
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  const current = effectiveTheme();
  setMetaThemeColor(current);
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.dataset.activeTheme = current;
    button.setAttribute("aria-pressed", String(current === "light"));
    button.setAttribute("aria-label", current === "light" ? "切換為深色模式" : "切換為淺色模式");
  });
  document.querySelectorAll("[data-theme-label]").forEach((label) => {
    label.textContent = current === "light" ? "切換為深色模式" : "切換為淺色模式";
  });
}

export function initTheme() {
  applyTheme(savedTheme(), false);

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = effectiveTheme() === "light" ? "dark" : "light";
      applyTheme(nextTheme, true);
    });
  });

  mediaQuery.addEventListener("change", () => {
    if (!savedTheme()) applyTheme("", false);
  });
}
