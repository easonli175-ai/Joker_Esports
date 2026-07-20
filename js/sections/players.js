import { publicApi, sanitizeImageUrl } from "../api.js";
import {
  defaultPlayerOptions,
  escapeHtml,
  optionLabel,
  optionsFromPlayers,
  playerRanks,
  renderState,
  staleNoteHtml,
  visibleSorted
} from "../utils.js";

function filterGroupHtml(title, name, options) {
  return `
    <fieldset class="player-filter-group">
      <legend>${escapeHtml(title)}</legend>
      <div class="player-filter-options">
        ${options.map((option) => `
          <label class="filter-chip">
            <input type="checkbox" name="${escapeHtml(name)}" value="${escapeHtml(option.value)}">
            <span>${escapeHtml(option.label)}</span>
          </label>
        `).join("")}
      </div>
    </fieldset>
  `;
}

function selectedValues(container, name) {
  return [...container.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function platformMatches(playerPlatform, selectedPlatforms) {
  if (!selectedPlatforms.length) return true;
  if (playerPlatform === "dual_platform") {
    return selectedPlatforms.includes("mobile") || selectedPlatforms.includes("pc");
  }
  return selectedPlatforms.includes(playerPlatform);
}

function tagsHtml(ranks, rankOptions, platformLabel) {
  return `
    ${ranks.map((rank) => `<span class="tag tag-rank${rank === "boss_booster" ? " tag-boss" : ""}">${escapeHtml(optionLabel(rankOptions, rank, "陪玩"))}</span>`).join("")}
    ${platformLabel ? `<span class="tag">${escapeHtml(platformLabel)}</span>` : ""}
  `;
}

function previewHtml(player) {
  return `
    <div class="player-avatar">
      <img src="${player.avatar}" width="640" height="640" loading="lazy" alt="${escapeHtml(player.name)} 頭像" data-avatar>
    </div>
    <div class="player-body">
      <h3>${escapeHtml(player.name)}</h3>
      <p>${escapeHtml(player.bio || "")}</p>
      <div class="tag-row">
        ${player.tags}
      </div>
    </div>
  `;
}

export async function renderPlayers() {
  const container = document.querySelector("#players-region");
  try {
    const [{ data, stale }, settingsResult] = await Promise.all([
      publicApi.players(),
      publicApi.settings().catch(() => ({ data: null }))
    ]);
    const players = visibleSorted(data);
    const settings = settingsResult?.data || {};
    const rankOptions = optionsFromPlayers(players, "rank", settings.player_ranks || defaultPlayerOptions.ranks);
    const platformOptions = optionsFromPlayers(players, "platform", settings.player_platforms || defaultPlayerOptions.platforms)
      .filter((option) => option.value !== "dual_platform");
    const allPlatformOptions = optionsFromPlayers(players, "platform", settings.player_platforms || defaultPlayerOptions.platforms);
    const playerModels = players.map((player) => {
      const avatar = sanitizeImageUrl(player.avatar_url);
      const ranks = playerRanks(player);
      const platformLabel = optionLabel(allPlatformOptions, player.platform, "");
      return {
        id: String(player.id),
        name: player.name,
        bio: player.bio || "",
        avatar,
        ranks,
        platform: player.platform,
        isBoss: ranks.includes("boss_booster"),
        tags: tagsHtml(ranks, rankOptions, platformLabel)
      };
    });

    if (!players.length) {
      renderState(container, {
        title: "目前尚無名片",
        message: "陪玩與打手資料上架後會顯示在這裡。"
      });
      return;
    }

    container.innerHTML = `
      ${staleNoteHtml(stale)}
      <div class="player-toolbar" data-player-toolbar>
        <div class="player-filter-panel" aria-label="陪玩篩選">
          ${filterGroupHtml("等級", "rank", rankOptions)}
          ${filterGroupHtml("裝置", "platform", platformOptions)}
        </div>
        <div class="player-filter-summary">
          <span data-player-count>${players.length} 位</span>
          <button class="button button-small" type="button" data-clear-player-filters>清除篩選</button>
        </div>
      </div>
      <div class="player-showcase">
        <div class="player-scroller" tabindex="0" aria-label="陪玩名片，可左右滑動">
          <div class="player-grid" data-player-grid>
            ${playerModels.map((player) => `
              <article class="player-card ${player.isBoss ? "is-boss" : ""}" data-player-id="${escapeHtml(player.id)}" data-ranks="${escapeHtml(player.ranks.join(" "))}" data-platform="${escapeHtml(player.platform)}" tabindex="0" aria-controls="player-preview">
                <div class="player-compact">
                  <div class="player-avatar player-avatar-small">
                    <img src="${player.avatar}" width="640" height="640" loading="lazy" alt="${escapeHtml(player.name)} 頭像" data-avatar>
                  </div>
                  <div class="player-compact-body">
                    <h3>${escapeHtml(player.name)}</h3>
                    <div class="tag-row">
                      ${player.tags}
                    </div>
                  </div>
                </div>
              </article>
            `).join("")}
          </div>
        </div>
        <aside class="player-preview" id="player-preview" data-player-preview aria-live="polite"></aside>
      </div>
      <div class="state-box player-empty-filter" data-player-empty-filter hidden>
        <div>
          <h3>沒有符合條件的名片</h3>
          <p>請調整等級或裝置篩選。</p>
        </div>
      </div>
    `;

    container.querySelectorAll("[data-avatar]").forEach((img) => {
      img.addEventListener("error", () => {
        img.src = "assets/placeholders/avatar.webp";
      }, { once: true });
    });

    const toolbar = container.querySelector("[data-player-toolbar]");
    const cards = [...container.querySelectorAll(".player-card")];
    const count = container.querySelector("[data-player-count]");
    const empty = container.querySelector("[data-player-empty-filter]");
    const clear = container.querySelector("[data-clear-player-filters]");
    const preview = container.querySelector("[data-player-preview]");
    const modelMap = new Map(playerModels.map((player) => [player.id, player]));
    const pointerCanHover = window.matchMedia("(hover: hover) and (pointer: fine)");

    const setPreview = (card) => {
      const player = modelMap.get(card.dataset.playerId);
      if (!player) return;
      preview.innerHTML = previewHtml(player);
      preview.classList.toggle("is-boss", player.isBoss);
      preview.hidden = false;
      cards.forEach((item) => item.classList.toggle("is-active", item === card));
      preview.querySelectorAll("[data-avatar]").forEach((img) => {
        img.addEventListener("error", () => {
          img.src = "assets/placeholders/avatar.webp";
        }, { once: true });
      });
    };

    const clearPreview = () => {
      preview.innerHTML = `
        <div class="player-preview-empty">
          <h3>選擇名片</h3>
          <p>滑過或點選左側小名片查看完整資訊。</p>
        </div>
      `;
      preview.classList.remove("is-boss");
      cards.forEach((item) => item.classList.remove("is-active"));
    };

    const applyFilters = () => {
      const selectedRanks = selectedValues(toolbar, "rank");
      const selectedPlatforms = selectedValues(toolbar, "platform");
      let visibleCount = 0;
      let firstVisibleCard = null;

      cards.forEach((card) => {
        const cardRanks = String(card.dataset.ranks || "").split(/\s+/).filter(Boolean);
        const rankMatch = !selectedRanks.length || selectedRanks.some((rank) => cardRanks.includes(rank));
        const platformMatch = platformMatches(card.dataset.platform, selectedPlatforms);
        const isVisible = rankMatch && platformMatch;
        card.hidden = !isVisible;
        if (isVisible) {
          visibleCount += 1;
          firstVisibleCard ||= card;
        }
      });

      count.textContent = `${visibleCount} 位`;
      empty.hidden = visibleCount !== 0;
      if (firstVisibleCard) {
        setPreview(firstVisibleCard);
      } else {
        clearPreview();
      }
    };

    toolbar.addEventListener("change", applyFilters);
    clear.addEventListener("click", () => {
      toolbar.querySelectorAll("input[type='checkbox']").forEach((input) => {
        input.checked = false;
      });
      applyFilters();
    });

    cards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        if (pointerCanHover.matches) setPreview(card);
      });
      card.addEventListener("focus", () => setPreview(card));
      card.addEventListener("click", () => setPreview(card));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setPreview(card);
        }
        if (event.key === "Escape") {
          clearPreview();
        }
      });
    });

    setPreview(cards.find((card) => !card.hidden) || cards[0]);
  } catch {
    renderState(container, {
      title: "名片載入失敗",
      message: "陪玩與打手 API 目前無法取得，請稍後重試。",
      onRetry: renderPlayers
    });
  }
}
