# Moss

Static GitHub Pages site. No dependencies or build step.

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Tap the phone to block apps in the preview: moss grows on the star while blocked and dries out after unblocking. Reduced-motion mode displays a still image. Green is reserved for the moss.

`moss.js` is the cellular automaton; `script.js` builds its habitat and renders it. The simulation has three depth slices. The star occupies the solid middle slice and seeds moss on both faces. Growth favors downward neighbors and crosses depth around the star's edges. The renderer draws rear moss, the occluding star, then middle and front moss.

`setBlocked(boolean)` changes the simulation's blocking state; `step()` advances one 100 ms tick. The website uses accelerated growth and pauses updates when hidden. The rules are separate from the browser so they can be ported to the iPhone app, which is not changed here.

Run simulation checks with `node --test moss.test.mjs`.

GitHub Pages publishes the repository root on `main`. `CNAME` keeps the custom domain at mosscomputer.com. Work goes to branches and draft PRs targeting `main`.
