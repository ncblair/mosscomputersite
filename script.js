import { MossGrowth } from './moss.js';

const screen = document.querySelector('.screen');
const title = document.getElementById('name');
const starField = document.querySelector('.star-field');
const star = document.querySelector('.star');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const greens = [0xb5c879, 0x8faa55, 0x668c3c, 0x497032, 0x35562b];
const dry = [0xa89b66, 0x83764e, 0x625d43];

function createField(element, width, height, paintShape) {
  const back = element.querySelector('.back');
  const front = element.querySelector('.front');
  back.width = front.width = width;
  back.height = front.height = height;
  const mask = document.createElement('canvas');
  mask.width = width;
  mask.height = height;
  const ink = mask.getContext('2d', { willReadFrequently: true });
  paintShape(ink);
  const pixels = ink.getImageData(0, 0, width, height).data;
  const habitat = new Uint8Array(width * height);
  for (let i = 0; i < habitat.length; i++) if (pixels[i * 4 + 3] > 90) habitat[i] = 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (habitat[y * width + x] !== 2) continue;
      const columnNoise = ((x * 1103515245 + 12345) >>> 8) % 100 / 100;
      for (let dy = -1; dy <= 40; dy++) {
        if (dy > 4 && (columnNoise < .58 || dy > 16 + columnNoise * 24)) continue;
        const reach = dy < 4 ? 2 : 0;
        for (let dx = -reach; dx <= reach; dx++) {
          if (x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
          const i = (y + dy) * width + x + dx;
          if (!habitat[i]) habitat[i] = 1;
        }
      }
    }
  }
  const backContext = back.getContext('2d');
  const frontContext = front.getContext('2d');
  // Drawing buffers depend only on this field's fixed dimensions.
  return {
    growth: new MossGrowth(width, height, habitat),
    back: backContext, front: frontContext,
    backPixels: backContext.createImageData(width, height),
    frontPixels: frontContext.createImageData(width, height),
  };
}

function drawLayer(field, z) {
  const { growth } = field;
  const pixels = (z === 0 ? field.backPixels : field.frontPixels).data;
  const colors = growth.blocked ? greens : dry;
  for (let i = 0; i < growth.area; i++) {
    const age = growth.cells[z * growth.area + i];
    if (!age) continue;
    let hash = Math.imul(i + z * growth.area + 1, 0x45d9f3b);
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
    const variation = ((hash ^ (hash >>> 16)) >>> 0) % 3;
    const tone = Math.min(colors.length - 1, Math.floor(age / 80) + variation + (z === 0 ? 1 : 0));
    const offset = i * 4;
    const color = colors[tone];
    const alpha = growth.blocked ? 1 : Math.min(1, age / 65);
    const behind = pixels[offset + 3] / 255 * (1 - alpha);
    const combined = alpha + behind;
    pixels[offset] = ((color >> 16) * alpha + pixels[offset] * behind) / combined;
    pixels[offset + 1] = (((color >> 8) & 255) * alpha + pixels[offset + 1] * behind) / combined;
    pixels[offset + 2] = ((color & 255) * alpha + pixels[offset + 2] * behind) / combined;
    pixels[offset + 3] = combined * 255;
  }
}

function draw(field) {
  field.backPixels.data.fill(0);
  field.frontPixels.data.fill(0);
  drawLayer(field, 0);
  // Native SVG/text sits between these canvases, preserving crisp shape edges.
  drawLayer(field, 1);
  drawLayer(field, 2);
  field.back.putImageData(field.backPixels, 0, 0);
  field.front.putImageData(field.frontPixels, 0, 0);
}

function settle(field, steps) {
  for (let i = 0; i < steps; i++) field.growth.step();
}

await star.decode();
await document.fonts.ready;
const phone = createField(starField, 144, 177, ink => ink.drawImage(star, 30, 24, 84, 84));
let titleMoss;
function createTitle() {
  const style = getComputedStyle(title);
  const width = Math.ceil((title.offsetWidth + 8) / 1.5);
  const height = Math.ceil((title.offsetHeight + 64) / 1.5);
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
    ink.fillText('Moss', 4, 4 + baseline);
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
