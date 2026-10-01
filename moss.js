// Portable three-layer cellular automaton. One step represents 100 ms.
// Depth 0: behind the star; 1: solid star and its fringe; 2: in front.
// Cell values: 0 = bare, 1 = new growth, 255 = mature moss.
export class MossGrowth {
  constructor(width, height, habitat, random = Math.random) {
    this.width = width;
    this.height = height;
    this.depth = 3;
    this.area = width * height;
    this.habitat = habitat;
    this.random = random;
    this.cells = new Uint8Array(this.area * this.depth);
    this.next = new Uint8Array(this.cells.length);
    this.blocked = false;
    this.spawners = [];
    this.bottom = new Int16Array(width).fill(-1);
    this.falling = [];
    habitat.forEach((value, i) => {
      // The solid middle slice seeds its two exposed faces.
      if (value === 2) {
        this.spawners.push(i, 2 * this.area + i);
        this.bottom[i % width] = Math.floor(i / width);
      }
    });
  }

  isSolid(index) {
    return Math.floor(index / this.area) === 1 && this.habitat[index % this.area] === 2;
  }

  setBlocked(blocked) {
    this.blocked = blocked;
    if (blocked && !this.cells.some(value => value > 0)) {
      for (let n = 0; n < 12 && this.spawners.length; n++) {
        this.cells[this.spawners[Math.floor(this.random() * this.spawners.length)]] = 1;
      }
    }
  }

  step() {
    const { width, height, area, cells, next, habitat } = this;
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
          } else {
            let influence = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if ((!dx && !dy) || x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
                if (cells[z * area + (y + dy) * width + x + dx] > 12) {
                  // Gravity favors growth from a neighbor above.
                  influence += dy === -1 ? (dx === 0 ? 7 : 2) : dy === 0 ? .5 : .06;
                }
              }
            }
            // Cross-depth growth goes around the star, never through it.
            if (z > 0 && cells[i - area] > 12) influence += .7;
            if (z < this.depth - 1 && cells[i + area] > 12) influence += .7;
            const chance = influence * (habitat[plane] === 2 ? .04 : .012);
            if (influence && this.random() < chance) next[i] = 1;
          }
        }
      }
    }
    // Occasional new colonies on either face while blocking remains active.
    if (this.blocked && this.spawners.length && this.random() < .06) {
      const i = this.spawners[Math.floor(this.random() * this.spawners.length)];
      if (!next[i]) next[i] = 1;
    }
    this.cells = next;
    this.next = cells;
    this.dropStrands();
  }

  dropStrands() {
    const { width, height, area, cells } = this;
    for (const strand of this.falling) {
      strand.velocity += .35;
      strand.y += strand.velocity;
    }
    this.falling = this.falling.filter(strand => strand.y < height);
    if (!this.blocked) return;
    for (let z = 0; z < this.depth; z++) {
      for (let x = 0; x < width; x++) {
        const start = this.bottom[x] + 1;
        if (start === 0) continue;
        let length = 0;
        while (start + length < height && cells[z * area + (start + length) * width + x] > 12) length++;
        // A long pendant strand breaks below its attachment and falls as a strip.
        if (length < 12 || this.random() >= .012) continue;
        const cut = start + Math.floor(length / 2);
        const ages = new Uint8Array(start + length - cut);
        for (let n = 0; n < ages.length; n++) {
          const i = z * area + (cut + n) * width + x;
          ages[n] = cells[i];
          cells[i] = 0;
        }
        this.falling.push({ x, y: cut, z, ages, velocity: .25 });
      }
    }
  }
}
