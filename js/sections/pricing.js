import { publicApi } from "../api.js";
import { escapeHtml, renderState, sanitizeHexColor, staleNoteHtml, visibleSorted } from "../utils.js";

const CATEGORY_ORDER = ["保底單", "陪玩單", "趣味單", "代肝"];
const PLATFORM_OPTIONS = [
  { value: "mobile", label: "手遊" },
  { value: "pc", label: "端遊" }
];

function uniqueCategories(items) {
  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];
  const categorySet = new Set([...CATEGORY_ORDER, ...categories]);
  return [...categorySet].sort((a, b) => {
    const orderA = CATEGORY_ORDER.indexOf(a);
    const orderB = CATEGORY_ORDER.indexOf(b);
    if (orderA !== -1 || orderB !== -1) {
      return (orderA === -1 ? Number.MAX_SAFE_INTEGER : orderA) - (orderB === -1 ? Number.MAX_SAFE_INTEGER : orderB);
    }
    return a.localeCompare(b, "zh-Hant");
  });
}

function pricingPlatform(item) {
  return item.platform === "pc" ? "pc" : "mobile";
}

function positionPlatformArrow(shell, activeButton) {
  const frame = shell.querySelector(".pricing-control-frame");
  if (!frame || !activeButton) return;
  const shellRect = shell.getBoundingClientRect();
  const buttonRect = activeButton.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  const buttonCenter = buttonRect.left + buttonRect.width / 2 - shellRect.left;
  const min = frameRect.left - shellRect.left + 14;
  const max = frameRect.right - shellRect.left - 14;
  const arrowX = Math.min(max, Math.max(min, buttonCenter));
  shell.style.setProperty("--pricing-arrow-x", `${arrowX}px`);
}

function positionCategoryIndicator(shell, activeButton) {
  const frame = shell.querySelector(".pricing-control-frame");
  if (!frame || !activeButton) return;
  const frameRect = frame.getBoundingClientRect();
  const buttonRect = activeButton.getBoundingClientRect();
  frame.style.setProperty("--pricing-category-x", `${buttonRect.left - frameRect.left}px`);
  frame.style.setProperty("--pricing-category-width", `${buttonRect.width}px`);
}

function updatePricingView({ platform, category, tabs, platformTabs, cards, empty, grid, shell }) {
  let visibleCount = 0;
  let activePlatformButton = null;
  let activeCategoryButton = null;

  shell.dataset.activePlatform = platform;

  platformTabs.forEach((item) => {
    const isActive = item.dataset.pricingPlatform === platform;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", String(isActive));
    if (isActive) activePlatformButton = item;
  });
  positionPlatformArrow(shell, activePlatformButton);

  tabs.forEach((item) => {
    const isActive = item.dataset.pricingCategory === category;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", String(isActive));
    if (isActive) activeCategoryButton = item;
  });
  positionCategoryIndicator(shell, activeCategoryButton);

  grid.classList.remove("is-switching");
  void grid.offsetWidth;
  grid.classList.add("is-switching");

  cards.forEach((card) => {
    const isVisible = card.dataset.platform === platform && card.dataset.category === category;
    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  empty.hidden = visibleCount !== 0;
  window.setTimeout(() => grid.classList.remove("is-switching"), 240);
}

export async function renderPricing() {
  const container = document.querySelector("#pricing-region");
  try {
    const { data, stale } = await publicApi.pricing();
    const items = visibleSorted(data);
    if (!items.length) {
      renderState(container, {
        title: "目前尚無價目",
        message: "服務價目上架後會顯示在這裡。"
      });
      return;
    }

    const categories = uniqueCategories(items);
    const activePlatform = PLATFORM_OPTIONS[0].value;
    const activeCategory = categories[0];
    container.innerHTML = `
      ${staleNoteHtml(stale)}
      <div class="pricing-filter-shell" data-pricing-filter-shell data-active-platform="${escapeHtml(activePlatform)}" aria-label="價目篩選">
        <div class="pricing-platform-tabs" role="tablist" aria-label="遊戲平台">
          ${PLATFORM_OPTIONS.map((platform, index) => `
            <button class="pricing-platform-tab ${index === 0 ? "is-active" : ""}" type="button" data-pricing-platform="${escapeHtml(platform.value)}" role="tab" aria-selected="${index === 0 ? "true" : "false"}">${escapeHtml(platform.label)}</button>
          `).join("")}
        </div>
        <div class="pricing-control-frame" aria-hidden="false">
          <span class="pricing-platform-arrow" aria-hidden="true"></span>
          <span class="pricing-category-indicator" aria-hidden="true"></span>
          <div class="pricing-tabs" role="tablist" aria-label="價目分類">
            ${categories.map((category, index) => `
              <button class="pricing-tab ${index === 0 ? "is-active" : ""}" type="button" data-pricing-category="${escapeHtml(category)}" role="tab" aria-selected="${index === 0 ? "true" : "false"}">${escapeHtml(category)}</button>
            `).join("")}
          </div>
        </div>
      </div>
      <div class="pricing-grid" data-pricing-grid>
        ${items.map((item) => {
          const titleColor = sanitizeHexColor(item.title_color);
          const priceColor = sanitizeHexColor(item.price_color);
          const platform = pricingPlatform(item);
          const styleVars = [
            titleColor ? `--pricing-title-color: ${titleColor};` : "",
            priceColor ? `--pricing-price-color: ${priceColor};` : ""
          ].filter(Boolean).join(" ");
          return `
          <article class="pricing-card" data-platform="${escapeHtml(platform)}" data-category="${escapeHtml(item.category || "")}" ${styleVars ? `style="${styleVars}"` : ""} ${platform === activePlatform && item.category === activeCategory ? "" : "hidden"}>
            <div class="pricing-card-head">
              <span class="pricing-category">${escapeHtml(item.category || "其他")}</span>
              <h3>${escapeHtml(item.title)}</h3>
            </div>
            <p>${escapeHtml(item.description || "")}</p>
            <strong class="price-text">${escapeHtml(item.price_text || "請洽客服")}</strong>
            ${item.note ? `<span class="pricing-note">${escapeHtml(item.note)}</span>` : ""}
          </article>
        `;
        }).join("")}
      </div>
      <div class="state-box pricing-empty-filter" data-pricing-empty-filter hidden>
        <div>
          <h3>這個價目目前沒有項目</h3>
          <p>請切換平台或價目分類。</p>
        </div>
      </div>
    `;

    let selectedPlatform = activePlatform;
    let selectedCategory = activeCategory;
    const platformTabs = [...container.querySelectorAll(".pricing-platform-tab")];
    const tabs = [...container.querySelectorAll(".pricing-tab")];
    const cards = [...container.querySelectorAll(".pricing-card")];
    const empty = container.querySelector("[data-pricing-empty-filter]");
    const grid = container.querySelector("[data-pricing-grid]");
    const shell = container.querySelector("[data-pricing-filter-shell]");
    positionPlatformArrow(shell, platformTabs[0]);
    positionCategoryIndicator(shell, tabs[0]);
    window.addEventListener("resize", () => {
      const activeButton = platformTabs.find((tab) => tab.classList.contains("is-active"));
      const activeCategoryButton = tabs.find((tab) => tab.classList.contains("is-active"));
      positionPlatformArrow(shell, activeButton);
      positionCategoryIndicator(shell, activeCategoryButton);
    }, { passive: true });

    platformTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        selectedPlatform = tab.dataset.pricingPlatform;
        updatePricingView({ platform: selectedPlatform, category: selectedCategory, tabs, platformTabs, cards, empty, grid, shell });
      });
    });

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        selectedCategory = tab.dataset.pricingCategory;
        updatePricingView({ platform: selectedPlatform, category: selectedCategory, tabs, platformTabs, cards, empty, grid, shell });
      });
    });
  } catch {
    renderState(container, {
      title: "價目載入失敗",
      message: "價目表 API 目前無法取得，請稍後重試。",
      onRetry: renderPricing
    });
  }
}
