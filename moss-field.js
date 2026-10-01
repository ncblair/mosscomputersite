import { MossGrowth } from './moss.js';

const greens = [0xb5c879, 0x8faa55, 0x668c3c, 0x497032, 0x35562b];
const dry = [0xa89b66, 0x83764e, 0x625d43];

export function createHabitat(width, height, surface) {
  const habitat = surface.slice();
  // A circular fringe gives every direction the same room to grow.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (surface[y * width + x] !== 2) continue;
      for (let dy = -6; dy <= 6; dy++) {
        for (let dx = -6; dx <= 6; dx++) {
          if (dx * dx + dy * dy > 36 || x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
          const i = (y + dy) * width + x + dx;
          if (!habitat[i]) habitat[i] = 1;
        }
      }
    }
  }
  return habitat;
}

export function fillEnclosedSurface(surface, width, height) {
  // Flood the exterior; enclosed white screen/bezel regions belong to the computer.
  const exterior = new Uint8Array(surface.length);
  const queue = new Int32Array(surface.length);
  let head = 0;
  let tail = 0;
  function visit(i) {
    if (surface[i] || exterior[i]) return;
    exterior[i] = 1;
    queue[tail++] = i;
  }
  for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
  while (head < tail) {
    const i = queue[head++];
    const x = i % width;
    if (x > 0) visit(i - 1);
    if (x < width - 1) visit(i + 1);
    if (i >= width) visit(i - width);
    if (i + width < surface.length) visit(i + width);
  }
  for (let i = 0; i < surface.length; i++) if (!exterior[i]) surface[i] = 2;
}

function imageMask(image, fillInterior) {
  const mask = document.createElement('canvas');
  mask.width = image.naturalWidth;
  mask.height = image.naturalHeight;
  const ink = mask.getContext('2d', { willReadFrequently: true });
  ink.drawImage(image, 0, 0, mask.width, mask.height);
  const pixels = ink.getImageData(0, 0, mask.width, mask.height);
  const surface = new Uint8Array(mask.width * mask.height);
  for (let i = 0; i < surface.length; i++) {
    const p = i * 4;
    if (pixels.data[p + 3] > 90 && pixels.data[p] + pixels.data[p + 1] + pixels.data[p + 2] < 384) surface[i] = 2;
  }
  if (fillInterior) fillEnclosedSurface(surface, mask.width, mask.height);
  for (let i = 0; i < surface.length; i++) {
    const p = i * 4;
    pixels.data[p] = pixels.data[p + 1] = pixels.data[p + 2] = 0;
    pixels.data[p + 3] = surface[i] ? 255 : 0;
  }
  ink.putImageData(pixels, 0, 0);
  return mask;
}

function paintImage(ink, image, x, y, width, height, fillInterior) {
  const mask = imageMask(image, fillInterior);
  if (getComputedStyle(image).objectFit === 'contain') {
    const scale = Math.min(width / mask.width, height / mask.height);
    x += (width - mask.width * scale) / 2;
    y += (height - mask.height * scale) / 2;
    width = mask.width * scale;
    height = mask.height * scale;
  }
  ink.drawImage(mask, x, y, width, height);
}

export function createField(element, width, height, paintShape, spreadRate = 1) {
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
  const surface = new Uint8Array(width * height);
  for (let i = 0; i < surface.length; i++) if (pixels[i * 4 + 3] > 90) surface[i] = 2;
  const habitat = createHabitat(width, height, surface);
  const backContext = back.getContext('2d');
  const frontContext = front.getContext('2d');
  // Drawing buffers depend only on this field's fixed dimensions.
  return {
    growth: new MossGrowth(width, height, habitat, Math.random, spreadRate),
    back: backContext, front: frontContext,
    backPixels: backContext.createImageData(width, height),
    frontPixels: frontContext.createImageData(width, height),
  };
}

export function createIconField(element, image, options = {}) {
  const { fullHeight = false, fillInterior = false, spreadRate = 1 } = options;
  const container = element.querySelector('.icon-field');
  container.classList.toggle('full-height', fullHeight);
  const bounds = container.getBoundingClientRect();
  const shape = image.getBoundingClientRect();
  const width = fullHeight ? Math.ceil(bounds.width / 1.5) : 144;
  const height = fullHeight ? Math.ceil(bounds.height / 1.5) : Math.round(width * bounds.height / bounds.width);
  // Sample the actual icon placement so the native shape and moss stay aligned.
  return createField(element, width, height, ink => paintImage(ink, image,
    (shape.left - bounds.left) / bounds.width * width,
    (shape.top - bounds.top) / bounds.height * height,
    shape.width / bounds.width * width, shape.height / bounds.height * height, fillInterior), spreadRate);
}

export function createWordmarkField(element, previous, imageOptions = {}) {
  const bounds = element.getBoundingClientRect();
  const width = Math.ceil((bounds.width + 48) / 1.5);
  const height = Math.ceil((bounds.height + 48) / 1.5);
  if (previous && previous.growth.width === width && previous.growth.height === height) return previous;
  for (const canvas of element.querySelectorAll('canvas')) {
    canvas.style.width = `${width * 1.5}px`;
    canvas.style.height = `${height * 1.5}px`;
  }
  return createField(element, width, height, ink => {
    ink.scale(1 / 1.5, 1 / 1.5);
    for (const part of element.querySelectorAll('[data-ink]')) {
      const box = part.getBoundingClientRect();
      const x = 24 + box.left - bounds.left;
      const y = 24 + box.top - bounds.top;
      if (part instanceof HTMLImageElement) {
        paintImage(ink, part, x, y, box.width, box.height, imageOptions.fillInterior);
      } else {
        const style = getComputedStyle(part);
        ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        ink.letterSpacing = style.letterSpacing;
        const metrics = ink.measureText(part.textContent);
        const baseline = (box.height - metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2 + metrics.fontBoundingBoxAscent;
        ink.fillText(part.textContent, x, y + baseline);
      }
    }
  });
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

export function draw(field) {
  field.backPixels.data.fill(0);
  field.frontPixels.data.fill(0);
  drawLayer(field, 0);
  // Native SVG/text sits between these canvases, preserving crisp shape edges.
  drawLayer(field, 1);
  drawLayer(field, 2);
  field.back.putImageData(field.backPixels, 0, 0);
  field.front.putImageData(field.frontPixels, 0, 0);
}

export function settle(field, steps) {
  for (let i = 0; i < steps; i++) field.growth.step();
}
