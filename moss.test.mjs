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

test('growth crosses depth around the shape and cannot enter its solid middle', () => {
  const width = 9;
  const surface = new Uint8Array(width * width);
  for (let y = 3; y <= 5; y++) surface.fill(2, y * width + 3, y * width + 6);
  const growth = new MossGrowth(width, width, createHabitat(width, width, surface), () => 0);
  growth.blocked = true;
  // Mature colonies on the edge exercise depth crossing within the growth cap.
  growth.cells[4 * width + 2] = 16;
  growth.cells[2 * growth.area + 4 * width + 3] = 16;
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

test('non-seeding surfaces retain their fringe and never start colonies', () => {
  const width = 25;
  const surface = new Uint8Array(width * width);
  surface[12 * width + 12] = 3;
  const habitat = createHabitat(width, width, surface);
  assert.equal(habitat[12 * width + 12], 3);
  assert.equal(habitat[12 * width + 18], 1);
  assert.equal(habitat[12 * width + 19], 0);
  const growth = new MossGrowth(width, width, habitat, () => 0);
  assert.equal(growth.spawners.length, 0);
  growth.setBlocked(true);
  for (let n = 0; n < 100; n++) growth.step();
  assert(growth.cells.every(age => age === 0));
});

test('moss spreads onto both screen faces without spawning there or entering the middle', () => {
  const width = 9;
  const habitat = new Uint8Array(width * width);
  for (let y = 1; y <= 7; y++) {
    for (let x = 1; x <= 7; x++) habitat[y * width + x] = x === 1 || x === 7 || y === 1 || y === 7 ? 2 : 3;
  }
  const growth = new MossGrowth(width, width, habitat, () => 0);
  growth.setBlocked(true);
  assert(growth.cells.every((age, i) => !age || habitat[i % growth.area] === 2));
  growth.cells.fill(0);
  growth.step();
  assert(growth.cells.every((age, i) => !age || habitat[i % growth.area] === 2));
  // Place mature moss on each face of the bezel, then let it spread inward.
  for (const z of [0, 2]) growth.cells[z * growth.area + width + 4] = 16;
  for (let n = 0; n < 100; n++) growth.step();
  const screen = 4 * width + 4;
  assert(growth.cells[screen] > 0);
  assert(growth.cells[2 * growth.area + screen] > 0);
  assert.equal(growth.cells[growth.area + screen], 0);
  assert(growth.cells.every((age, i) => !age || !growth.isSolid(i)));
  growth.setBlocked(false);
  for (let n = 0; n < 60; n++) growth.step();
  assert(growth.cells.every(age => age === 0));
});

test('coverage probability tapers between one and one-and-a-half surfaces', () => {
  const habitat = new Uint8Array(25).fill(1);
  habitat.fill(2, 0, 4);
  habitat.fill(3, 4, 10);
  const growth = new MossGrowth(5, 5, habitat);
  assert.equal(growth.surfacePixels, 10);
  assert.equal(growth.growthProbability(0), 1);
  assert.equal(growth.growthProbability(10), 1);
  assert.equal(growth.growthProbability(12.5), .5);
  assert.equal(growth.growthProbability(15), 0);
  assert.equal(growth.growthProbability(30), 0);
});

test('coverage taper suppresses spreading and independent new colonies', () => {
  const normal = new MossGrowth(5, 5, new Uint8Array(25).fill(2), (() => {
    let sample = 0;
    return () => sample++ ? .75 : .045;
  })());
  const tapered = new MossGrowth(5, 5, new Uint8Array(25).fill(2), () => .045);
  for (const growth of [normal, tapered]) {
    growth.blocked = true;
    growth.cells.fill(255, 0, growth.area);
  }
  // Spaced front colonies have at most two neighbors influencing a bare cell.
  for (const plane of [0, 4, 10, 14, 20, 24]) tapered.cells[2 * tapered.area + plane] = 255;
  normal.step();
  tapered.step();
  assert.equal(normal.cells.filter(age => age > 0).length, 26);
  assert.equal(tapered.cells.filter(age => age > 0).length, 31);
});

test('births across all layers respect the cap, settle, then wake for drying and regrowth', () => {
  const habitat = new Uint8Array(25).fill(1);
  habitat.fill(2, 0, 5);
  const growth = new MossGrowth(5, 5, habitat, () => 0);
  growth.blocked = true;
  for (const index of [0, 1, 2, 3, 4, growth.area + 5, 2 * growth.area]) growth.cells[index] = 255;
  assert(growth.needsUpdate());
  growth.step();
  assert.equal(growth.cells.filter(age => age > 0).length, 8);
  assert(growth.needsUpdate()); // The last birth must still mature.
  for (let step = 0; step < 130; step++) growth.step();
  assert.equal(growth.cells.filter(age => age > 0).length, 8);
  assert.equal(growth.needsUpdate(), false);
  growth.setBlocked(false);
  assert(growth.needsUpdate());
  for (let step = 0; step < 60; step++) growth.step();
  assert.equal(growth.needsUpdate(), false);
  assert(growth.cells.every(age => age === 0));
  growth.setBlocked(true);
  assert(growth.needsUpdate());
});

test('initial colonies respect small surface budgets and empty fields can sleep', () => {
  const growth = new MossGrowth(2, 1, new Uint8Array(2).fill(2), (() => {
    let sample = 0;
    return () => (sample++ % 4) / 4;
  })());
  assert.equal(growth.needsUpdate(), false);
  growth.setBlocked(true);
  assert.equal(growth.cells.filter(age => age > 0).length, 3);
  const empty = new MossGrowth(2, 1, new Uint8Array(2));
  empty.setBlocked(true);
  assert.equal(empty.needsUpdate(), false);
});
