import { createField, draw, settle } from './moss-field.js';
import { icons } from './icons.js';

const screen = document.querySelector('.screen');
const title = document.getElementById('name');
const iconField = document.querySelector('.icon-field');
const icon = document.querySelector('.icon');
const selectedIcon = icons.find(item => item.id === new URLSearchParams(location.search).get('icon')) || icons[0];
icon.src = selectedIcon.src;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
await icon.decode();
await document.fonts.ready;
const phone = createField(iconField, 144, 177, ink => ink.drawImage(icon, 30, 24, 84, 84));
let titleMoss;
function createTitle() {
  const style = getComputedStyle(title);
  const width = Math.ceil((title.offsetWidth + 48) / 1.5);
  const height = Math.ceil((title.offsetHeight + 48) / 1.5);
  if (titleMoss && titleMoss.growth.width === width && titleMoss.growth.height === height) return;
  for (const canvas of title.querySelectorAll('canvas')) {
    canvas.style.width = `${width * 1.5}px`;
    canvas.style.height = `${height * 1.5}px`;
  }
  titleMoss = createField(title, width, height, ink => {
    ink.scale(1 / 1.5, 1 / 1.5);
    ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ink.letterSpacing = style.letterSpacing;
    const metrics = ink.measureText('Moss');
    const baseline = (parseFloat(style.lineHeight) - metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2 + metrics.fontBoundingBoxAscent;
    ink.fillText('Moss', 24, 24 + baseline);
  });
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
