# Moss

Static GitHub Pages site. No dependencies or build step.

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Moss starts growing on the title before interaction. Tap the phone to block apps in the preview: moss grows on the star while blocked and dries out after unblocking. Reduced-motion mode displays still images. Green is reserved for the moss.

`moss.js` is the cellular automaton; `script.js` builds its habitat and renders it. The phone uses a 144 × 177 grid (previously 72 × 72); the title uses about 1.5 CSS pixels per cell. Each simulation has three depth slices. The star occupies the solid middle slice and seeds moss on both faces. Growth favors downward neighbors and crosses depth around the shape's edges. Hanging runs of at least 12 cells can break in half; detached strips accelerate downward and leave the field. The lowest solid cell in each column is cached as the attachment boundary; it is immutable for that field's habitat.

The renderer draws rear moss, the native SVG/text shape, then middle and front moss. `assets/star.svg` is the fixed outline of the ✴ glyph from [Noto Sans Symbols 2](https://github.com/google/fonts/tree/main/ofl/notosanssymbols2), distributed with its OFL license. It is rendered at display resolution, independent of the moss grid and system-font fallback. Title habitat follows the browser's actual font metrics and is rebuilt on size changes.

Moss painting uses two reusable ImageData buffers per field, sized when the field is created. Each tick rebuilds their contents from simulation state. On this machine, a 1280 px Chromium preview with mature title and phone moss averaged about 4.2 ms per 100 ms tick (95th percentile 5.3 ms), down from 7–10 ms with individual rectangle draws. These are local desktop measurements, not device benchmarks. The simulation and pixel buffers use about 0.8 MB at that viewport, excluding browser canvas/GPU storage.

`setBlocked(boolean)` changes the simulation's blocking state; `step()` advances one 100 ms tick. The website uses accelerated growth, pauses updates when hidden, and stops updating the phone after unblocked growth clears. The rules are separate from the browser so they can be ported to the iPhone app, which is not changed here.

Run simulation checks with `node --test moss.test.mjs`.

GitHub Pages publishes the repository root on `main`. `CNAME` keeps the custom domain at mosscomputer.com. Work goes to branches and draft PRs targeting `main`.
