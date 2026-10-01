# Moss

Static GitHub Pages site. No dependencies or build step.

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. The header and title read **Moss [computer icon]**, using the supplied dark-screen computer PNG by default. Moss starts growing on the title before interaction. Tap the phone to block apps in the preview: moss grows on the computer while blocked and dries out after unblocking. Reduced-motion mode displays still images. Green is reserved for the moss.

`moss.js` is the cellular automaton; `moss-field.js` builds and renders its habitat; `script.js` connects the landing-page interaction. The phone uses a 144 × 177 grid (previously 72 × 72); the title uses about 1.5 CSS pixels per cell. Each simulation has three depth slices. The shape occupies the solid middle slice and seeds moss on both faces. Every neighbor within a depth slice has equal influence. The circular habitat fringe also gives every direction the same space, with no downward lanes. Growth crosses depth around the shape's edges. Moss stays in place as it matures; it never detaches or falls.

The renderer draws rear moss, the native SVG/text shape, then middle and front moss. `assets/star.svg` is the fixed outline of ✴ from [DejaVu Sans Mono 2.37](https://github.com/dejavu-fonts/dejavu-fonts/releases/tag/version_2_37), distributed with its license. Its geometry matches the Menlo glyph resolved by this Mac's system-monospace rendering of the app's `✴︎`. No Apple font is bundled. Exact iPhone font resolution has not been checked on hardware. It is rendered at display resolution, independent of the moss grid and system-font fallback. Title habitat follows the browser's actual font metrics and is rebuilt on size changes.

Moss painting uses two reusable ImageData buffers per field, sized when the field is created. Each tick rebuilds their contents from simulation state. The simulations run at 10 updates per second.

`setBlocked(boolean)` changes the simulation's blocking state; `step()` advances one 100 ms tick. The website uses accelerated growth, pauses updates when hidden, and stops updating the phone after unblocked growth clears. The rules are separate from the browser so they can be ported to the iPhone app, which is not changed here.

Run simulation checks with `node --test moss.test.mjs`.

GitHub Pages publishes the repository root on `main`. `CNAME` keeps the custom domain at mosscomputer.com. Work goes to branches and draft PRs targeting `main`.

## Icon prototypes

Open `prototypes.html` to compare the two supplied computer PNGs, with dark and light screens. Each appears in **Moss [computer]** and **M[computer]ss** wordmarks. The page also keeps the three outlined computer glyphs (2, 3.5, and 6-unit strokes), filled silhouette, stone/trunk studies, and river-stone “o.” Use **Grow all**, **Reset**, or tap an individual preview. **Try on site** opens `index.html?icon=<id>`; computer choices also update the title and header. Query values are limited to `icons.js`; unknown values use the supplied dark-screen computer.

`docs/provided-computers.png` compares the supplied images and both wordmark treatments. `docs/computer-studies.png` compares the SVG computer variants with and without moss. `docs/icon-studies.png` and `docs/icon-studies-grown.png` show all previews bare and with equal-direction moss growth.

The supplied PNG files are unchanged. Only their dark pixels count as surface; white backgrounds, screens, and highlights do not seed moss. Moss can still spread into the six-cell fringe around the dark pixels. A separate thin-outline surface experiment fills enclosed screen/bezel regions and uses 45% of the normal spread/seeding probability while keeping maturation and drying unchanged. The original thin outline remains available for comparison. Text counters keep their original open masks. Native PNGs use monochrome contrast and blending to sit on white or black previews.

The tree trunk fills the preview vertically, from roots at the bottom through the top edge. Its moss grid uses approximately 1.5 CSS pixels per cell; regular icons keep a 144-column grid with height following their preview's aspect ratio. The habitat is sampled from the icon's actual placement so both rendering layers align. The landing-page title and river stone wordmark share the same text/image mask operation, using native font metrics and rebuilding when their size changes.
