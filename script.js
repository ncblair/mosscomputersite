import { MossGrowth } from './moss.js';

const screen = document.querySelector('.screen');
const canvas = document.getElementById('moss');
const context = canvas.getContext('2d');
const size = 72;
const glyph = document.createElement('canvas');
glyph.width = glyph.height = size;
const ink = glyph.getContext('2d', { willReadFrequently: true });
// Match the app's typographic star, then sample it into a mosaic grid.
ink.font = '64px monospace';
ink.textAlign = 'center';
ink.textBaseline = 'middle';
ink.fillText('✴', size / 2, size / 2 + 2);
const pixels = ink.getImageData(0, 0, size, size).data;
const habitat = new Uint8Array(size * size);
for (let i = 0; i < habitat.length; i++) if (pixels[i * 4 + 3] > 90) habitat[i] = 2;
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    if (habitat[y * size + x] !== 2) continue;
    // A small fringe around the star, plus room for hanging strands below it.
    for (let dy = -1; dy <= 16; dy++) {
      const columnNoise = ((x * 1103515245 + 12345) >>> 8) % 100 / 100;
      if (dy > 3 && (columnNoise < .55 || dy > 5 + columnNoise * 12)) continue;
      const reach = dy < 3 ? 2 : 0;
      for (let dx = -reach; dx <= reach; dx++) {
        if (x + dx >= 0 && x + dx < size && y + dy >= 0 && y + dy < size) {
          const i = (y + dy) * size + x + dx;
          if (!habitat[i]) habitat[i] = 1;
        }
      }
    }
  }
}
const growth = new MossGrowth(size, size, habitat);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const greens = ['#b5c879', '#8faa55', '#668c3c', '#497032', '#35562b'];
const dry = ['#a89b66', '#83764e', '#625d43'];
function drawLayer(z) {
  const colors = growth.blocked ? greens : dry;
  for (let i = 0; i < habitat.length; i++) {
    const age = growth.cells[z * growth.area + i];
    if (!age) continue;
    const x = i % size;
    const y = Math.floor(i / size);
    let hash = Math.imul(i + z * growth.area + 1, 0x45d9f3b);
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
    const variation = ((hash ^ (hash >>> 16)) >>> 0) % 3;
    const tone = Math.min(colors.length - 1, Math.floor(age / 80) + variation + (z === 0 ? 1 : 0));
    context.fillStyle = colors[tone];
    context.globalAlpha = growth.blocked ? 1 : Math.min(1, age / 65);
    // A slight depth offset reveals overlapping mosaic edges.
    context.fillRect(x * 2 + z - 1, y * 2, 2, 2);
  }
  context.globalAlpha = 1;
}
function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawLayer(0);
  // The middle slice occludes the rear moss and remains impenetrable.
  context.fillStyle = growth.blocked ? '#f0efe8' : '#111';
  for (let i = 0; i < habitat.length; i++) {
    if (habitat[i] === 2) context.fillRect((i % size) * 2, Math.floor(i / size) * 2, 2, 2);
  }
  drawLayer(1);
  drawLayer(2);
}
function settleReducedMotion() {
  if (growth.blocked) for (let i = 0; i < 450; i++) growth.step();
  else growth.cells.fill(0);
}
screen.addEventListener('click', () => {
  growth.setBlocked(!growth.blocked);
  screen.setAttribute('aria-pressed', String(growth.blocked));
  screen.setAttribute('aria-label', growth.blocked ? 'Unblock apps in the preview' : 'Block apps in the preview and grow moss');
  document.getElementById('state').textContent = growth.blocked ? 'Apps blocked' : 'Apps available';
  document.getElementById('preview-note').textContent = growth.blocked ? 'Tap to unblock' : 'Tap to block';
  if (reducedMotion.matches) settleReducedMotion();
  draw();
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) settleReducedMotion();
  draw();
});
setInterval(() => {
  if (document.hidden || reducedMotion.matches) return;
  growth.step();
  draw();
}, 100);
draw();
