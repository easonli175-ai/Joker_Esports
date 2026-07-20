export function initNavigation() {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-menu]");
  const navLinks = [...document.querySelectorAll(".nav-menu a[href^='#']")];
  const sections = [...document.querySelectorAll("[data-section]")];
  const dots = document.querySelector("[data-section-dots]");

  const dotLinks = sections.map((section) => {
    const link = document.createElement("a");
    link.href = `#${section.id}`;
    link.setAttribute("aria-label", section.dataset.section);
    dots.append(link);
    return link;
  });

  const closeMenu = () => {
    menu.classList.remove("is-open");
    header.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    header.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  const setActive = (id) => {
    navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`));
    dotLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`));
  };

  const jumpToHash = (hash, behavior = "smooth") => {
    const target = document.querySelector(hash);
    if (!target) return;
    const top = Math.max(0, target.offsetTop);
    document.documentElement.classList.add("is-jumping");
    target.scrollIntoView({ behavior, block: "start" });
    window.scrollTo({ top, behavior });
    document.documentElement.scrollTop = top;
    document.body.scrollTop = top;
    window.setTimeout(() => document.documentElement.classList.remove("is-jumping"), 1400);
    target.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
    setActive(target.id);
    history.replaceState(null, "", hash);
  };

  [...navLinks, ...dotLinks].forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      if (hash?.startsWith("#")) {
        event.preventDefault();
        jumpToHash(hash);
      }
      closeMenu();
    });
  });

  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActive(visible.target.id);
  }, {
    root: null,
    threshold: [0.35, 0.6]
  });

  sections.forEach((section) => observer.observe(section));
  setActive("home");

  if (window.location.hash) {
    window.setTimeout(() => jumpToHash(window.location.hash, "auto"), 0);
    window.setTimeout(() => jumpToHash(window.location.hash, "auto"), 350);
    window.setTimeout(() => jumpToHash(window.location.hash, "auto"), 900);
    window.setTimeout(() => jumpToHash(window.location.hash, "auto"), 1400);
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
}
