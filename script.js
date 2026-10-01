import { createIconField, createWordmarkField, draw, settle } from './moss-field.js';
import { icons } from './icons.js';

const screen = document.querySelector('.screen');
const title = document.getElementById('name');
const icon = document.querySelector('.icon');
const selectedIcon = icons.find(item => item.id === new URLSearchParams(location.search).get('icon')) || icons[0];
icon.src = selectedIcon.src;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
await icon.decode();
await document.fonts.ready;
const phone = createIconField(screen, icon, selectedIcon.fullHeight);
let titleMoss;
function createTitle() {
  const next = createWordmarkField(title, titleMoss);
  if (next === titleMoss) return;
  titleMoss = next;
  titleMoss.growth.setBlocked(true);
  // Begin with a little growth before the phone receives any interaction.
  settle(titleMoss, 65);
  draw(titleMoss);
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
});
reducedMotion.addEventListener('change', () => {
  settlePhoneForReducedMotion();
  draw(phone);
});
setInterval(() => {
  if (document.hidden || reducedMotion.matches) return;
  titleMoss.growth.step();
  draw(titleMoss);
  // Avoid simulation and painting once the unblocked phone has cleared.
  if (phone.growth.blocked || phone.growth.cells.some(age => age > 0)) {
    phone.growth.step();
    draw(phone);
  }
}, 100);
draw(phone);
