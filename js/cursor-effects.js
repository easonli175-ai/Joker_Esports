const TRAIL_LIMIT = 42;
const TRAIL_INTERVAL_MS = 26;
const CROSSHAIR_DURATION_MS = 520;

let lastTrailAt = 0;
let trailCount = 0;

function canUseCursorEffects() {
  return (
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function createTrailSquare(root, x, y) {
  const square = document.createElement("span");
  const size = 6 + Math.round(Math.random() * 8);
  const offsetX = Math.round((Math.random() - 0.5) * 14);
  const offsetY = Math.round((Math.random() - 0.5) * 14);

  square.className = "cursor-pixel";
  square.style.width = `${size}px`;
  square.style.height = `${size}px`;
  square.style.left = `${x + offsetX}px`;
  square.style.top = `${y + offsetY}px`;
  square.style.setProperty("--pixel-rotate", `${Math.round(Math.random() * 12 - 6)}deg`);

  root.append(square);
  trailCount += 1;

  if (trailCount > TRAIL_LIMIT) {
    root.querySelector(".cursor-pixel")?.remove();
    trailCount -= 1;
  }

  square.addEventListener("animationend", () => {
    square.remove();
    trailCount = Math.max(0, trailCount - 1);
  }, { once: true });
}

function createCrosshair(root, x, y) {
  const crosshair = document.createElement("span");
  crosshair.className = "cursor-crosshair";
  crosshair.style.left = `${x}px`;
  crosshair.style.top = `${y}px`;
  crosshair.innerHTML = "<i></i><i></i><i></i><i></i>";
  root.append(crosshair);

  window.setTimeout(() => crosshair.remove(), CROSSHAIR_DURATION_MS);
}

export function initCursorEffects() {
  if (!canUseCursorEffects()) return;

  const root = document.createElement("div");
  root.className = "cursor-effects";
  root.setAttribute("aria-hidden", "true");
  document.body.append(root);

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    const now = performance.now();
    if (now - lastTrailAt < TRAIL_INTERVAL_MS) return;
    lastTrailAt = now;
    createTrailSquare(root, event.clientX, event.clientY);
  }, { passive: true });

  window.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse") return;
    createCrosshair(root, event.clientX, event.clientY);
  }, { passive: true });
}
