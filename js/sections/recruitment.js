import { publicApi } from "../api.js";
import { DISCORD_INVITE_URL } from "../config.js";
import { escapeHtml, renderState, staleNoteHtml, toLines } from "../utils.js";

function listHtml(title, items) {
  const lines = toLines(items);
  if (!lines.length) return "";
  return `
    <div>
      <h3>${escapeHtml(title)}</h3>
      <ul>${lines.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
  `;
}

function tagsHtml(data) {
  const statusLabel = data.status_label || (data.is_open ? "開放招募" : "暫停招募");
  const tags = toLines(data.tags);
  return `
    <div class="status-row" aria-label="招募狀態與標籤">
      <span class="status-pill">${escapeHtml(statusLabel)}</span>
      ${tags.map((tag) => `<span class="status-pill status-pill-secondary">${escapeHtml(tag)}</span>`).join("")}
    </div>
  `;
}

export async function renderRecruitment() {
  const container = document.querySelector("#recruitment-region");
  try {
    const { data, stale } = await publicApi.recruitment();
    if (!data) {
      renderState(container, {
        title: "招募資訊尚未提供",
        message: "正式招募文案上架後會顯示在這裡。"
      });
      return;
    }

    const ctaUrl = data.cta_url || DISCORD_INVITE_URL;
    container.innerHTML = `
      ${staleNoteHtml(stale)}
      <article class="recruitment-card">
        <p class="eyebrow">Recruitment</p>
        ${tagsHtml(data)}
        <h2 id="recruitment-title">${escapeHtml(data.title || "招募資訊")}</h2>
        <p>${escapeHtml(data.summary || "")}</p>
        <div class="recruitment-lists">
          ${listHtml("招募職位", data.roles)}
          ${listHtml("基本條件", data.requirements)}
          ${listHtml("福利", data.benefits)}
          ${listHtml("合作方式", data.work_style)}
        </div>
        ${data.application ? `<p>${escapeHtml(data.application)}</p>` : ""}
        <a class="button button-primary" href="${escapeHtml(ctaUrl)}" target="_blank" rel="noopener">${escapeHtml(data.cta_label || "加入 Discord")}</a>
      </article>
    `;
  } catch {
    renderState(container, {
      title: "招募資訊載入失敗",
      message: "招募 API 目前無法取得，請稍後重試。",
      onRetry: renderRecruitment
    });
  }
}
