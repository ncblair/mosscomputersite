# Moss Computer

Static GitHub Pages site. No dependencies or build step.

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. The landing page uses the geometric computer SVG and a text “Moss Computer” title. Moss begins growing on the title before interaction. Tap the phone to block apps in the preview: moss grows on the computer while blocked and dries out after unblocking. Reduced-motion mode displays still images. Green is reserved for the moss.

`moss.js` is the cellular automaton; `moss-field.js` builds and renders its habitat; `script.js` connects the landing-page interaction. The phone uses a 144 × 177 grid; title cells cover about 1.5 CSS pixels. Each field has three depth slices. The shape blocks the middle slice and seeds moss on both faces. Enclosed white screen/bezel regions support propagation without spawning colonies. A circular six-cell fringe gives every direction equal room to grow. Growth has no downward incentive or falling strands.

Native text and SVG sit between rear moss and middle/front moss. Title masks follow browser font metrics and rebuild on resize. Two reusable ImageData buffers draw each field. Growth runs at full probability until occupied cells across all three layers equal the solid surface's pixel count, including non-seeding screen areas. Spreading and new colonies then taper linearly to zero at 180% of that count, with a per-tick birth budget enforcing the cap. Text uses the same rule based on its ink surface.

Updates run at 10 ticks per second and pause when hidden or reduced motion is enabled. Capped fields finish maturing before updates stop. The timer is removed once both fields settle or dry completely; blocking/unblocking, title resizing, and visibility/motion changes restart it when needed.

`setBlocked(boolean)` changes the blocking state; `step()` advances one 100 ms tick. The rules are separate from the browser so they can be ported to the iPhone app, which is not changed here. Run simulation checks with `node --test moss.test.mjs`.

GitHub Pages publishes the repository root on `main`. `CNAME` keeps the custom domain at mosscomputer.com. Work goes to branches and draft PRs targeting `main`. Icon studies remain on the separate `codex/denser-moss` prototype branch.
