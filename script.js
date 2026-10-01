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
  clearInterval(timer);
  timer = undefined;
  if (document.hidden || reducedMotion.matches || (!titleMoss.growth.needsUpdate() && !phone.growth.needsUpdate())) return;
  timer = setInterval(() => {
    let updating = false;
    for (const field of [titleMoss, phone]) {
      if (!field.growth.needsUpdate()) continue;
      field.growth.step();
      draw(field);
      updating = true;
    }
    if (!updating) syncAnimation();
  }, 100);
}
document.addEventListener('visibilitychange', syncAnimation);
draw(phone);
