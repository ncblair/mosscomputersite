import { createIconField, createWordmarkField, draw, settle } from './moss-field.js';

const screen = document.querySelector('.screen');
const title = document.getElementById('name');
const icon = document.querySelector('.icon');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
await icon.decode();
await document.fonts.ready;
const phone = createIconField(screen, icon, { growInterior: true });
let titleMoss;
let timer;
const lastUpdates = new WeakMap();
function createTitle() {
  const next = createWordmarkField(title, titleMoss);
  if (next === titleMoss) return;
  titleMoss = next;
  titleMoss.growth.setBlocked(true);
  // Begin with a little growth before the phone receives any interaction.
  settle(titleMoss, 65);
  draw(titleMoss);
  syncAnimation();
}
createTitle();
new ResizeObserver(createTitle).observe(title);

function settlePhoneForReducedMotion() {
  if (!reducedMotion.matches) return;
  if (phone.growth.blocked) settle(phone, 100);
  else {
    phone.growth.cells.fill(0);
  }
}

screen.addEventListener('click', () => {
  phone.growth.setBlocked(!phone.growth.blocked);
  const blocked = phone.growth.blocked;
  screen.setAttribute('aria-pressed', String(blocked));
  screen.setAttribute('aria-label', blocked ? 'Unblock apps in the preview' : 'Block apps in the preview and grow moss');
  document.getElementById('state').textContent = blocked ? 'Apps blocked' : 'Apps available';
  document.getElementById('preview-note').textContent = blocked ? 'Tap to unblock' : 'Tap to block';
  settlePhoneForReducedMotion();
  draw(phone);
  syncAnimation();
});
reducedMotion.addEventListener('change', () => {
  settlePhoneForReducedMotion();
  draw(phone);
  syncAnimation();
});
function syncAnimation() {
  clearTimeout(timer);
  timer = undefined;
  if (document.hidden || reducedMotion.matches) return;
  const now = performance.now();
  let wait = Infinity;
  for (const field of [titleMoss, phone]) {
    const delay = field.growth.updateDelay();
    if (!delay) continue;
    if (!lastUpdates.has(field)) lastUpdates.set(field, now);
    wait = Math.min(wait, Math.max(0, lastUpdates.get(field) + delay - now));
  }
  if (wait === Infinity) return;
  timer = setTimeout(() => {
    const now = performance.now();
    for (const field of [titleMoss, phone]) {
      const delay = field.growth.updateDelay();
      if (!delay || now - lastUpdates.get(field) < delay) continue;
      field.growth.step();
      draw(field);
      lastUpdates.set(field, now);
    }
    syncAnimation();
  }, Math.ceil(wait));
}
document.addEventListener('visibilitychange', syncAnimation);
draw(phone);
