import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MossGrowth } from './moss.js';

function simulation(seed = 17) {
  const habitat = new Uint8Array(72 * 72).fill(1);
  for (let x = 26; x < 46; x++) habitat[18 * 72 + x] = 2;
  return new MossGrowth(72, 72, habitat, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  });
}

test('growth occupies all depths, flows downward, and cannot enter the solid star', () => {
  const growth = simulation();
  growth.setBlocked(true);
  for (let step = 0; step < 150; step++) growth.step();
  const layers = [0, 0, 0];
  let above = 0;
  let below = 0;
  growth.cells.forEach((age, index) => {
    if (!age) return;
    assert.equal(growth.isSolid(index), false);
    layers[Math.floor(index / growth.area)]++;
    const y = Math.floor((index % growth.area) / growth.width);
    if (y < 18) above++;
    if (y > 18) below++;
  });
  assert(layers.every(count => count > 0));
  assert(below > above * 2, `${below} cells below, ${above} above`);
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
