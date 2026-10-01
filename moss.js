// Portable three-layer cellular automaton. One step represents 100 ms.
// Depth 0: behind the shape; 1: solid shape and its fringe; 2: in front.
// Cell values: 0 = bare, 1 = new growth, 255 = mature moss.
// Habitat: 0 = unavailable, 1 = fringe, 2 = seeding surface, 3 = non-seeding surface.
const maxCoverage = 1.8;
const crowdingRadius = 8;

function fillNeighborhoodSums(width, height, sums, occupiedAt) {
  const stride = width + 1;
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      row += occupiedAt(y * width + x) ? 1 : 0;
      sums[(y + 1) * stride + x + 1] = sums[y * stride + x + 1] + row;
    }
  }
}

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
    // Fixed habitat sums and reusable population sums make wide neighborhoods linear-time.
    this.neighborhoodSpace = new Uint32Array((width + 1) * (height + 1));
    this.neighborhoodPopulation = new Uint32Array(this.neighborhoodSpace.length);
    fillNeighborhoodSums(width, height, this.neighborhoodSpace, i => habitat[i]);
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

  crowdingProbability(density) {
    return Math.max(0, Math.min(1, (.65 - density) / .3));
  }

  localCrowding(plane) {
    const { width, height, neighborhoodSpace, neighborhoodPopulation } = this;
    const x = plane % width;
    const y = Math.floor(plane / width);
    const stride = width + 1;
    const left = Math.max(0, x - crowdingRadius);
    const right = Math.min(width, x + crowdingRadius + 1);
    const top = Math.max(0, y - crowdingRadius) * stride;
    const bottom = Math.min(height, y + crowdingRadius + 1) * stride;
    const occupied = neighborhoodPopulation[bottom + right] - neighborhoodPopulation[top + right] - neighborhoodPopulation[bottom + left] + neighborhoodPopulation[top + left];
    const available = neighborhoodSpace[bottom + right] - neighborhoodSpace[top + right] - neighborhoodSpace[bottom + left] + neighborhoodSpace[top + left];
    return available ? occupied / available : 0;
  }

  updateDelay() {
    if (!this.blocked) return this.cells.some(age => age > 0) ? 100 : 0;
    let occupied = 0;
    for (const age of this.cells) if (age) occupied++;
    if (!occupied && !this.spawners.length) return 0;
    return occupied >= this.surfacePixels ? 1000 : 100;
  }

  step() {
    const { width, height, area, cells, next, habitat } = this;
    let occupied = 0;
    for (const age of cells) if (age) occupied++;
    const probability = this.growthProbability(occupied);
    let remainingBirths = Math.max(0, Math.ceil(this.surfacePixels * maxCoverage) - occupied);
    if (this.blocked) fillNeighborhoodSums(width, height, this.neighborhoodPopulation,
      i => cells[i] || cells[area + i] || cells[2 * area + i]);
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
            // Old, crowded cells occasionally die in place; young colonies keep maturing.
            const deathChance = age === 255 ? .001 * (1 - this.crowdingProbability(this.localCrowding(plane))) : 0;
            next[i] = deathChance > 0 && this.random() > 1 - deathChance ? 0 : Math.min(255, age + 2);
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
            const chance = influence * (habitat[plane] >= 2 ? .04 : .012) * this.spreadRate * probability * this.crowdingProbability(this.localCrowding(plane));
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
      if (!next[i] && this.random() < this.crowdingProbability(this.localCrowding(i % area))) next[i] = 1;
    }
    this.cells = next;
    this.next = cells;
  }
}
