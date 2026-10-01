import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MossGrowth } from './moss.js';
import { createHabitat, fillEnclosedSurface } from './moss-field.js';

function simulation(seed = 17) {
  const habitat = new Uint8Array(72 * 72).fill(1);
  for (let x = 26; x < 46; x++) habitat[18 * 72 + x] = 2;
  return new MossGrowth(72, 72, habitat, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  });
}

test('growth occupies all depths and cannot enter the solid star', () => {
  const growth = simulation();
  growth.setBlocked(true);
  for (let step = 0; step < 150; step++) growth.step();
  const layers = [0, 0, 0];
  growth.cells.forEach((age, index) => {
    if (!age) return;
    assert.equal(growth.isSolid(index), false);
    layers[Math.floor(index / growth.area)]++;

  });
  assert(layers.every(count => count > 0));
});

test('unblocking clears mature moss and reblocking seeds fresh growth', () => {
  const growth = simulation();
  growth.setBlocked(true);
  for (let step = 0; step < 150; step++) growth.step();
  assert(growth.cells.some(age => age === 255));
  growth.setBlocked(false);
  for (let step = 0; step < 60; step++) growth.step();
  assert(growth.cells.every(age => age === 0));
  growth.setBlocked(true);
  assert(growth.cells.some(age => age > 0));
});

test('matching random sequences produce matching independent simulations', () => {
  const first = simulation();
  const second = simulation();
  first.setBlocked(true);
  second.setBlocked(true);
  for (let step = 0; step < 100; step++) {
    first.step();
    second.step();
  }
  assert.deepEqual(first.cells, second.cells);
  first.setBlocked(false);
  first.step();
  assert.notDeepEqual(first.cells, second.cells);
});


test('blocked growth stays at its original cells as colonies mature', () => {
  const growth = simulation();
  growth.setBlocked(true);
  for (let step = 0; step < 300; step++) {
    const before = growth.cells.slice();
    growth.step();
    before.forEach((age, index) => {
      if (age) assert(growth.cells[index] >= age, `Growth detached at cell ${index}`);
    });
  }
});


test('neighbors above, below, and beside a colony have equal growth influence', () => {
  const width = 5;
  const growth = new MossGrowth(width, width, new Uint8Array(width * width).fill(2), () => .035);
  growth.blocked = true;
  const front = 2 * growth.area;
  growth.cells[front + 2 * width + 2] = 16;
  growth.step();
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx || dy) assert.equal(growth.cells[front + (2 + dy) * width + 2 + dx], 1);
    }
  }
});

test('habitat has a circular fringe with equal room on every side', () => {
  const width = 25;
  const surface = new Uint8Array(width * width);
  surface[12 * width + 12] = 2;
  const habitat = createHabitat(width, width, surface);
  assert.equal(surface.filter(value => value).length, 1);
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      const radius = (x - 12) ** 2 + (y - 12) ** 2;
      assert.equal(habitat[y * width + x], radius === 0 ? 2 : radius <= 36 ? 1 : 0);
    }
  }
});

test('computer masks fill enclosed screens while preserving exterior and open gaps', () => {
  const width = 11;
  const height = 9;
  const outline = new Uint8Array(width * height);
  for (let y = 2; y <= 6; y++) {
    for (let x = 2; x <= 6; x++) {
      if (x === 2 || x === 6 || y === 2 || y === 6) outline[y * width + x] = 2;
    }
    outline[y * width + 9] = 2;
  }
  const filled = outline.slice();
  fillEnclosedSurface(filled, width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      assert.equal(filled[y * width + x], x >= 2 && x <= 6 && y >= 2 && y <= 6 ? 2 : outline[y * width + x]);
    }
  }
  outline[2 * width + 4] = 0;
  const open = outline.slice();
  fillEnclosedSurface(open, width, height);
  assert.deepEqual(open, outline);
});

test('slower spread reduces births without changing maturation or drying', () => {
  const normal = new MossGrowth(5, 5, new Uint8Array(25).fill(2), () => .025);
  const slow = new MossGrowth(5, 5, new Uint8Array(25).fill(2), () => .025, .45);
  for (const growth of [normal, slow]) {
    growth.blocked = true;
    growth.cells[12] = 16;
    growth.step();
    assert.equal(growth.cells[12], 18);
  }
  for (let y = 1; y <= 3; y++) {
    for (let x = 1; x <= 3; x++) {
      if (x === 2 && y === 2) continue;
      assert.equal(normal.cells[y * 5 + x], 1);
      assert.equal(slow.cells[y * 5 + x], 0);
    }
  }
  for (const growth of [normal, slow]) {
    growth.setBlocked(false);
    growth.step();
    assert.equal(growth.cells[12], 13);
  }
});
