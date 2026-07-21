import { initRevealAnimations } from "./animations.js";
import { initNavigation } from "./navigation.js";
import { initTheme } from "./theme.js";
import { renderPlayers } from "./sections/players.js";
import { renderPricing } from "./sections/pricing.js";
import { renderRecruitment } from "./sections/recruitment.js";
import { renderFaq } from "./sections/faq.js";

function initDynamicSections() {
  const tasks = [
    { selector: "#players", render: renderPlayers },
    { selector: "#pricing", render: renderPricing },
    { selector: "#recruitment", render: renderRecruitment },
    { selector: "#faq", render: renderFaq }
  ];
  const loaded = new Set();

  const runTask = (task) => {
    if (!task || loaded.has(task.selector)) return;
    loaded.add(task.selector);
    Promise.resolve(task.render()).finally(() => {
      document.querySelector(task.selector)?.querySelectorAll(".reveal").forEach((item) => {
        item.classList.add("is-visible");
      });
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const task = tasks.find((item) => item.selector === `#${entry.target.id}`);
        runTask(task);
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: "220px 0px",
    threshold: 0.02
  });

  tasks.forEach((task) => {
    const section = document.querySelector(task.selector);
    if (section) observer.observe(section);
  });

  if (window.location.hash) {
    runTask(tasks.find((task) => task.selector === window.location.hash));
  }

  const scheduleIdle = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 1200));
  scheduleIdle(() => {
    tasks.forEach((task, index) => {
      window.setTimeout(() => runTask(task), index * 120);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("[data-year]").textContent = new Date().getFullYear();
  initTheme();
  initNavigation();
  initRevealAnimations();
  initDynamicSections();
});
