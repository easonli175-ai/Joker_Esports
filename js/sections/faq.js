import { publicApi } from "../api.js";
import { escapeHtml, renderState, staleNoteHtml, visibleSorted } from "../utils.js";

export async function renderFaq() {
  const container = document.querySelector("#faq-region");
  try {
    const { data, stale } = await publicApi.faq();
    const items = visibleSorted(data);
    if (!items.length) {
      renderState(container, {
        title: "目前尚無 FAQ",
        message: "常見問題上架後會顯示在這裡。"
      });
      return;
    }

    container.innerHTML = `
      ${staleNoteHtml(stale)}
      <div class="faq-card">
        <div class="section-heading faq-heading">
          <p class="eyebrow">FAQ</p>
          <h2 id="faq-title">常見問題</h2>
        </div>
        <div class="faq-list">
          ${items.map((item, index) => {
            const panelId = `faq-panel-${item.id}`;
            return `
              <article class="faq-item">
                <button class="faq-trigger" type="button" aria-expanded="${index === 0 ? "true" : "false"}" aria-controls="${panelId}">
                  <span>${escapeHtml(item.question)}</span>
                </button>
                <div class="faq-panel" id="${panelId}">
                  <div class="faq-panel-content">
                    <p>${escapeHtml(item.answer)}</p>
                  </div>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </div>
    `;

    const triggers = [...container.querySelectorAll(".faq-trigger")];
    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        triggers.forEach((item) => item.setAttribute("aria-expanded", String(item === trigger && item.getAttribute("aria-expanded") !== "true")));
      });
    });
  } catch {
    renderState(container, {
      title: "FAQ 載入失敗",
      message: "FAQ API 目前無法取得，請稍後重試。",
      onRetry: renderFaq
    });
  }
}
