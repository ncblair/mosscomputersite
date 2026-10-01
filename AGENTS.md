# Project preferences

Use these preferences alongside current project docs and explicit decisions.

- Inspect implementations and callers before adding code. Reuse canonical operations and keep one authoritative representation. Remove redundant state and duplicate paths.
- Write compact, linear, explicit code. Extract helpers for substantive operations or meaningful duplication; avoid frameworks for hypothetical variants. Prefer few dependencies.
- Keep ownership and data flow obvious. Painting reads simulation state; interaction changes that state. Keep cached drawing inputs only when their dependencies and lifecycle are clear.
- Preserve intentional behavior during cleanup. Separate correctness fixes, taste changes, and product decisions. Preserve settled choices unless new evidence changes them.
- Trace bugs through reachable states. Distinguish broken behavior from preferences and product questions. Measure before adding caches or fast paths.
- Keep simulation rendering deterministic for the same state and random sequence. Add tests for meaningful math, state isolation, and lifecycle regressions rather than obvious setters.
- Inspect visual changes when feasible and report exactly what was tested. Keep updates casual and concrete.

## Handoff

Nathan works on this machine headlessly and reviews on his laptop. For requested changes, push a task branch and open or update a draft PR targeting `main`; do not stop at local edits. Prefer small, coherent PRs.

For prototype iterations, use a quick visual check and focused tests for changed simulation rules, then push promptly for Nathan's feedback. Reserve broader browser sweeps for concrete issues or a review stage. Nathan prefers being in the loop and iterating quickly.

Use additive commits once review begins. Do not force-push, rewrite reviewed history, merge, or claim Nathan approved work without explicit authorization. Preserve unrelated work.
