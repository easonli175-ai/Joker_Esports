export function initRevealAnimations() {
  const items = [...document.querySelectorAll(".reveal")];
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach((item) => item.classList.add("is-visible"));
    document.querySelector(".hero-section")?.classList.add("is-ready");
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { root: null, threshold: 0.18 });

  items.forEach((item) => observer.observe(item));
}

export function initHeroReveal() {
  const hero = document.querySelector(".hero-section");
  if (!hero) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    hero.classList.add("is-ready");
    return;
  }
  requestAnimationFrame(() =>
    requestAnimationFrame(() => hero.classList.add("is-ready"))
  );
}
