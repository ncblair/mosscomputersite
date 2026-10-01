# Moss

Static GitHub Pages site. No dependencies or build step.

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. The header and title read **Moss Computer**, with the computer icon appearing only in the phone preview. The tagline explains that old transit cards, hotel keys, or other NFC tags can block distracting apps for free. Moss starts growing on the title before interaction. Tap the phone to block apps in the preview: moss grows on the supplied light-screen computer while blocked and dries out after unblocking. Reduced-motion mode displays still images. Green is reserved for the moss.

`moss.js` is the cellular automaton; `moss-field.js` builds and renders its habitat; `script.js` connects the landing-page interaction. The phone uses a 144 × 177 grid (previously 72 × 72); the title uses about 1.5 CSS pixels per cell. Each simulation has three depth slices. The shape occupies the solid middle slice and seeds moss on both faces. Every neighbor within a depth slice has equal influence. The circular habitat fringe also gives every direction the same space, with no downward lanes. Growth crosses depth around the shape's edges. Moss stays in place as it matures; it never detaches or falls.

The renderer draws rear moss, the native SVG/text shape, then middle and front moss. `assets/star.svg` is the fixed outline of ✴ from [DejaVu Sans Mono 2.37](https://github.com/dejavu-fonts/dejavu-fonts/releases/tag/version_2_37), distributed with its license. Its geometry matches the Menlo glyph resolved by this Mac's system-monospace rendering of the app's `✴︎`. No Apple font is bundled. Exact iPhone font resolution has not been checked on hardware. It is rendered at display resolution, independent of the moss grid and system-font fallback. Title habitat follows the browser's actual font metrics and is rebuilt on size changes.

Moss painting uses two reusable ImageData buffers per field, sized when the field is created. Each tick rebuilds their contents from simulation state. The simulations run at 10 updates per second.

`setBlocked(boolean)` changes the simulation's blocking state; `step()` advances one 100 ms tick. The website uses accelerated growth, pauses updates when hidden, and stops updating the phone after unblocked growth clears. The rules are separate from the browser so they can be ported to the iPhone app, which is not changed here.

Run simulation checks with `node --test moss.test.mjs`.

GitHub Pages publishes the repository root on `main`. `CNAME` keeps the custom domain at mosscomputer.com. Work goes to branches and draft PRs targeting `main`.

## Icon prototypes

Open `prototypes.html` to compare the three supplied computer PNGs, with dark, light, and rounded screens. The rounded computer and a geometric SVG interpretation appear in interactive full-page previews at the top. The SVG uses a polygon and four rounded rectangles to straighten the edges and regularize the corners. Both versions also appear in **Moss [computer]** and **M[computer]ss** wordmarks. The page keeps the three outlined computer glyphs (2, 3.5, and 6-unit strokes), filled silhouette, stone/trunk studies, and river-stone “o.” Use **Grow all**, **Reset**, or tap an individual preview. **Try on site** opens `index.html?icon=<id>` and changes only the phone icon. Query values are limited to `icons.js`; unknown values use the supplied light-screen computer.

`docs/provided-computers.png` compares the supplied images and both wordmark treatments. `docs/computer-studies.png` compares the SVG computer variants with and without moss. `docs/icon-studies.png` and `docs/icon-studies-grown.png` show all previews bare and with equal-direction moss growth.

The supplied PNG files are unchanged. Only dark pixels seed new colonies. Enclosed white screens and highlights are surface too, allowing existing moss to spread across their front and back faces without spawning there. The middle slice stays solid. The exterior background supports only the six-cell fringe around the computer. Text counters keep their original open masks. Native PNGs use monochrome contrast and blending to sit on white or black previews.

The habitat is one byte per cell: 0 = unavailable, 1 = fringe, 2 = seeding surface, 3 = non-seeding surface. Seed sites come only from value 2; both 2 and 3 block the middle slice and use the surface spread rate. An optional second image-mask pass adds enclosed surface with value 3 while preserving the original dark seed pixels and text masks. The separately labeled thin-outline surface experiment continues to seed across its filled silhouette at 45% of normal spread/seeding probability; maturation and drying are unchanged.

The tree trunk fills the preview vertically, from roots at the bottom through the top edge. Its moss grid uses approximately 1.5 CSS pixels per cell; regular icons keep a 144-column grid with height following their preview's aspect ratio. The habitat is sampled from the icon's actual placement so both rendering layers align. The landing-page title and river stone wordmark share the same text/image mask operation, using native font metrics and rebuilding when their size changes.
