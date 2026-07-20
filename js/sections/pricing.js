import { publicApi } from "../api.js";
import { escapeHtml, renderState, staleNoteHtml, visibleSorted } from "../utils.js";

const CATEGORY_ORDER = ["保底單", "陪玩單", "趣味單", "代肝"];

function uniqueCategories(items) {
  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];
  return categories.sort((a, b) => {
    const orderA = CATEGORY_ORDER.indexOf(a);
    const orderB = CATEGORY_ORDER.indexOf(b);
    if (orderA !== -1 || orderB !== -1) {
      return (orderA === -1 ? Number.MAX_SAFE_INTEGER : orderA) - (orderB === -1 ? Number.MAX_SAFE_INTEGER : orderB);
    }
    return a.localeCompare(b, "zh-Hant");
  });
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
    const activeCategory = categories[0];
    container.innerHTML = `
      ${staleNoteHtml(stale)}
      <div class="pricing-tabs" role="tablist" aria-label="價目分類">
        ${categories.map((category, index) => `
          <button class="pricing-tab ${index === 0 ? "is-active" : ""}" type="button" data-pricing-category="${escapeHtml(category)}" role="tab" aria-selected="${index === 0 ? "true" : "false"}">${escapeHtml(category)}</button>
        `).join("")}
      </div>
      <div class="pricing-grid" data-pricing-grid>
        ${items.map((item) => `
          <article class="pricing-card" data-category="${escapeHtml(item.category || "")}" ${item.category === activeCategory ? "" : "hidden"}>
            <span class="pricing-category">${escapeHtml(item.category || "其他")}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description || "")}</p>
            <strong class="price-text">${escapeHtml(item.price_text || "請洽客服")}</strong>
            ${item.note ? `<span class="pricing-note">${escapeHtml(item.note)}</span>` : ""}
          </article>
        `).join("")}
      </div>
      <div class="state-box pricing-empty-filter" data-pricing-empty-filter hidden>
        <div>
          <h3>這個分類目前沒有項目</h3>
          <p>請切換其他價目分類。</p>
        </div>
      </div>
    `;

    const tabs = [...container.querySelectorAll(".pricing-tab")];
    const cards = [...container.querySelectorAll(".pricing-card")];
    const empty = container.querySelector("[data-pricing-empty-filter]");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const category = tab.dataset.pricingCategory;
        let visibleCount = 0;

        tabs.forEach((item) => {
          const isActive = item === tab;
          item.classList.toggle("is-active", isActive);
          item.setAttribute("aria-selected", String(isActive));
        });

        cards.forEach((card) => {
          const isVisible = card.dataset.category === category;
          card.hidden = !isVisible;
          if (isVisible) visibleCount += 1;
        });

        empty.hidden = visibleCount !== 0;
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
