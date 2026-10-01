// Portable three-layer cellular automaton. One step represents 100 ms.
// Depth 0: behind the shape; 1: solid shape and its fringe; 2: in front.
// Cell values: 0 = bare, 1 = new growth, 255 = mature moss.
// Habitat: 0 = unavailable, 1 = fringe, 2 = seeding surface, 3 = non-seeding surface.
const maxCoverage = 1.8;

export class MossGrowth {
  constructor(width, height, habitat, random = Math.random, spreadRate = 1) {
    this.width = width;
    this.height = height;
    this.depth = 3;
    this.area = width * height;
    this.habitat = habitat;
    this.random = random;
    this.spreadRate = spreadRate;
    this.cells = new Uint8Array(this.area * this.depth);
    this.next = new Uint8Array(this.cells.length);
    this.blocked = false;
    this.spawners = [];
    this.surfacePixels = 0;
    habitat.forEach((value, i) => {
      if (value >= 2) this.surfacePixels++;
      // The solid middle slice seeds its two exposed faces.
      if (value === 2) this.spawners.push(i, 2 * this.area + i);
    });
  }

  isSolid(index) {
    return Math.floor(index / this.area) === 1 && this.habitat[index % this.area] >= 2;
  }

  setBlocked(blocked) {
    this.blocked = blocked;
    if (blocked && !this.cells.some(value => value > 0)) {
      const seeds = Math.min(12, Math.ceil(this.surfacePixels * maxCoverage));
      for (let n = 0; n < seeds && this.spawners.length; n++) {
        this.cells[this.spawners[Math.floor(this.random() * this.spawners.length)]] = 1;
      }
    }
  }

  growthProbability(occupiedCells) {
    // Full speed through one surface's worth of moss, zero at 1.8 surfaces.
    if (!this.surfacePixels) return 0;
    return Math.max(0, Math.min(1, (this.surfacePixels * maxCoverage - occupiedCells) / (this.surfacePixels * (maxCoverage - 1))));
  }

  needsUpdate() {
    if (!this.blocked) return this.cells.some(age => age > 0);
    let occupied = 0;
    for (const age of this.cells) {
      if (!age) continue;
      if (age < 255) return true;
      occupied++;
    }
    return this.growthProbability(occupied) > 0 && (occupied > 0 || this.spawners.length > 0);
  }

  step() {
    const { width, height, area, cells, next, habitat } = this;
    let occupied = 0;
    for (const age of cells) if (age) occupied++;
    const probability = this.growthProbability(occupied);
    let remainingBirths = Math.max(0, Math.ceil(this.surfacePixels * maxCoverage) - occupied);
    next.fill(0);
    for (let z = 0; z < this.depth; z++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const plane = y * width + x;
          const i = z * area + plane;
          if (!habitat[plane] || this.isSolid(i)) continue;
          const age = cells[i];
          if (!this.blocked) {
            next[i] = Math.max(0, age - 5 - Math.floor(this.random() * 8));
          } else if (age) {
            next[i] = Math.min(255, age + 2);
          } else if (remainingBirths > 0) {
            let influence = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if ((!dx && !dy) || x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
                if (cells[z * area + (y + dy) * width + x + dx] > 12) {
                  // Every neighbor in this slice contributes equally.
                  influence++;
                }
              }
            }
            // Cross-depth growth goes around the shape, never through it.
            if (z > 0 && cells[i - area] > 12) influence += .7;
            if (z < this.depth - 1 && cells[i + area] > 12) influence += .7;
            const chance = influence * (habitat[plane] >= 2 ? .04 : .012) * this.spreadRate * probability;
            if (influence && this.random() < chance) {
              next[i] = 1;
              remainingBirths--;
            }
          }
        }
      }
    }
    // Occasional new colonies on either face while blocking remains active.
    if (this.blocked && remainingBirths > 0 && this.spawners.length && this.random() < .06 * this.spreadRate * probability) {
      const i = this.spawners[Math.floor(this.random() * this.spawners.length)];
      if (!next[i]) next[i] = 1;
    }
    this.cells = next;
    this.next = cells;
  }
}
