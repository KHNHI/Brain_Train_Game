# Build progress and handoff

Last updated: 21 October 2026.

## Current milestone

### Initial GitHub delivery — 21 October 2026

- Initialized Git on `main` and configured `https://github.com/KHNHI/Brain_Train_Game.git` as `origin`. Remote inspection found no existing branches/history to merge.
- Reviewed the publication set: source, tests, CI, build configuration, documentation, and licensed solver source. Generated builds, dependencies, browser artifacts, environment files, and local runtime state are ignored. A targeted source scan found no private-key or common cloud/GitHub credential patterns; this is not a comprehensive secret-scanner certification.
- The most recent implementation checks passed 15 unit/integration tests and 14 production browser tests. No application code changed for this delivery. This entry records preparation; the push result and remote commit verification are reported in chat.

### Expanded interactive home page — 21 October 2026

- Replaced the static hero illustration with a working, bounded cube-turn preview. It reuses the cube's pure rules, projects the current sticker colors into a lightweight SVG, and supports three face selections, clockwise/counterclockwise turns, undo, reset, and a live state/count. It does not read or write saves, start solver workers, or load WebGL. Preview history is capped at 60 turns.
- Added featured-game filters (all, available now, in development), keeping the maximum of three game cards. Added a keyboard-operable tabbed guide to exploration, turns, and hints/solutions; detailed practice features; native expandable questions on accounts, local saves, devices, hints, and game availability; and a final link to play.
- Preserved the flat charcoal palette, contrast, reduced-motion setting, and honest availability labels. No new dependencies, external assets, analytics, or security-policy changes.
- Added browser checks for real SVG color changes, preview undo, game filtering, guide keyboard navigation, FAQ expansion, and protection of saved progress from preview actions. Final verification: `npm run check` passed formatting, lint, 15 unit/integration tests, TypeScript, and build; all 14 production browser tests passed, including CSP and the full solver flow. Desktop (1280px) and mobile (390px) screenshots were inspected; no horizontal overflow was observed. Physical-device checks remain outstanding.

Next: physical touch/device performance checks, reusable session/storage contracts, and the Burr risk prototype remain the priority after this home-page iteration.

### Home, catalog, and dedicated game pages — 21 October 2026

- Added a separate home page (`/`) with a brief introduction and at most three featured game cards. **See more** opens `/games`, which lists the full catalog from authored metadata.
- Added per-game descriptions, availability badges, and card actions. **Play now** opens `/games/cube`; **Instructions** deep-links to its instructions. Burr and sliding tiles have dedicated detail pages and explicitly remain unavailable for play.
- Moved the existing cube experience into `src/pages/CubePage.tsx`, preserving controls, color labels, unrestricted rotation, local saves, hints, and the full solution. `App.tsx` now provides shared navigation and routes through React Router. The cube page and its renderer are lazy-loaded; public-page artwork is local SVG.
- Added route titles, active navigation, a keyboard skip link, route-change focus handling, a not-found page, and deep-link/reload support through the existing SPA fallback. In-app navigation waits for an accepted turn/local save to settle. Solver workers stop when their page unmounts.
- Added navigation tests for home/catalog/play, instructions, unknown game IDs, unavailable-game details, mobile width, keyboard skip navigation, browser Back, direct reload, and saved progress after navigation. Final verification: `npm run check` passed formatting/lint/build and 15 unit/integration tests; all 12 production browser tests passed, including the existing solver and CSP tests. Desktop/mobile home screenshots were inspected. Dependency audit after adding React Router: zero known vulnerabilities. Security headers and save schemas are unchanged. Physical touch-device testing and deployed Cloudflare deep-link verification remain outstanding.

Next: test physical touch devices, complete reusable session/storage contracts, and implement the Burr risk prototype before making its card playable.

### Next-turn hints and step-by-step solution — 21 October 2026

- Added `Solve assistance` below the cube with separate **Hint: next turn** and **Show solution** actions. A hint reveals only one color-based 90° instruction without changing the cube; the full solution lists all instructions, highlights the current step, and supports **Select hinted face**, **Apply next turn**, and **Hide solution**.
- Guidance follows matching manual moves and undo/redo; a divergent state requires new guidance. Puzzle changes terminate outstanding searches. Camera movement does not invalidate solutions. Solved cubes need no hint; existing move limits still apply.
- Added a locally bundled Kociemba solver in a dedicated worker, runtime input/output validation, independent replay verification, cancellation, errors, and a 45-second timeout. First-time calculation initializes lookup tables, and may take a few seconds. This is a computed solve sequence, not a beginner-method teaching curriculum or guaranteed shortest solution.
- Security review rejected retaining the npm `cubejs` package: its unused old npm CLI dependency introduced 42 advisories. Removed that package/dependency tree and retained only the two MIT algorithm files, with license, narrow type declarations, provenance, and documented maintenance responsibility in `vendor/cubejs`. No network APIs/eval/filesystem calls are present in those algorithm files. Post-removal installer audit: zero known dependency vulnerabilities. Vendored code is outside npm audit coverage.
- Added independent solver integration tests for every face, seeded scrambles, edited state, malformed results, and failed-solution rejection. Added browser checks for hint-only reveal, full-sequence application to solved state, cancellation, and changing/undoing moves during a search. Final verification: `npm run check` passed with 15 rule/adapter tests; three focused development-browser tests and all nine production browser tests passed after correcting the upstream module wrapper to native ESM. Final npm audit reported zero known dependency vulnerabilities. Solution-panel screenshot inspected.

Next for guidance: beginner-method lessons explaining why a move helps, solver timeout/error fault injection, and physical mobile performance measurements. Existing reusable session/storage and Burr work remain on the roadmap.

### Selection and unrestricted rotation — 21 October 2026

- Replaced upright/pole-limited OrbitControls with the installed Drei TrackballControls. Dragging can now roll and flip the view through a full rotation; panning remains disabled, zoom remains bounded, and static movement stops rotation when input stops.
- Added a strong amber perimeter inside the selected face's edges, stronger selected-sticker illumination, and a clearer center label. Depth testing keeps the outline hidden behind other faces. Face colors, turn directions, and save format remain unchanged.
- Updated controls documentation and added a browser regression that drags the view upside down, checks zero puzzle moves, and checks that Reset view restores the original canvas image. Inspected a screenshot with yellow on top and upside-down side labels.
- Final verification: `npm run check` passed formatting, lint, 12 rule/save tests, TypeScript, and build. All six production browser tests passed after the outline refinement, including rotation/reset, face identity, saves, mobile controls, and CSP. Upside-down and default-view screenshots were inspected. No dependencies or security permissions were added. Physical touch-device testing remains outstanding.

### Color-based face identity — 21 October 2026

- Replaced positional face names with White, Red, Green, Yellow, Orange, and Blue on center stickers, selectors, selected-face feedback, turn-button labels, and move announcements.
- Camera orbit changes where a face appears, while its color identity and selection remain stable. Standard U/R/F/D/L/B history and saved moves retain their existing reference and format. Added a short explanation under `How to play`.
- Added a real browser drag/orbit check: selection remains White, orbit adds no moves, and turning White still records U. Existing mobile checks now wait for canvas sizing before measuring arrow placement.
- Rules, save compatibility, dependencies, and security policy are unchanged. Verification: `npm run check` passed (formatting, lint, 12 rule/save tests, TypeScript, build); all five production browser tests passed, including orbit identity and CSP. Updated desktop screenshot inspected.

### Interface revision — 21 October 2026

- Moved clockwise/counterclockwise controls from the side panel to curved SVG arrows beside the cube. They remain within the scene area on desktop and mobile, with button semantics, disabled states, accessible names, and keyboard activation.
- Added subtle names on all six center stickers using locally generated canvas textures. Labels follow face orientation, are naturally occluded by the cube, and are disposed with the scene. Center labels take precedence over optional sticker markings.
- Replaced the pale palette with flat charcoal surfaces and a restrained amber accent. Removed gradients, dot textures, orbit decorations, slogans, unnecessary section numbering, and promotional filler. Kept practical controls, state, history, and persistence feedback.
- Palette: background `#161b22`, scene `#1c232c`, panel `#232b35`, text `#f0f1ed`, secondary text `#b8c2cc`, accent `#e5bd72`. Calculated text contrast: primary 15.25:1 on page background, secondary 7.92:1 on the panel, accent-button text 9.56:1. Decorative faded cube labels and disabled controls are not included in these ratios.
- No dependency changes, external resources, or security-policy relaxation. Local saves and cube rules are unchanged.
- Verification: final `npm run check` passed formatting, lint, 12 domain/save tests, strict TypeScript, and build. All four production browser tests passed, including arrow placement on opposite sides of the canvas, mobile keyboard activation, save recovery/preservation, and CSP enforcement. Desktop/mobile screenshots were inspected; final adjustments increased label size and removed overlapping mobile arrow captions. Physical touch-device testing remains outstanding.

To review: run `npm run dev`, select a face, use either arrow beside the cube, orbit to inspect face labels, and try a narrow viewport. `How to play` contains the detailed controls without adding copy to the main play area.

Local foundation and first cube prototype. Implementation is underway; no production deployment, account system, or Supabase database exists yet.

Phase mapping: Phase 0 is partially complete (cube prototype done, Burr risk fixture/device checks outstanding); Phase 1 has the build/test/security foundation but still needs the reusable session/storage interfaces; Phase 2 has playable cube practice with remaining preview/accessibility/device gates. No full roadmap phase is marked complete yet.

## What has been built

| Area       | Implementation                                                             | Status                                                              |
| ---------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Foundation | React/TypeScript/Vite, strict types, lint boundaries, formatting, lockfile | Local checks passed                                                 |
| Domain     | Exact integer cube rules, deterministic practice scramble, replay          | 12 domain/save tests passed                                         |
| Session    | Turn, undo/redo, reset, bounded history, accepted-move settling            | Browser turn/history/reset checks passed                            |
| 3D         | Lazy-loaded cube scene, selection, orbit, zoom, animated layers            | Browser rendered; desktop/mobile screenshots inspected              |
| Interface  | Responsive workshop, labeled face/turn controls, markings, reduced motion  | 390px viewport checked; physical device checks outstanding          |
| Saves      | Strict schema, IndexedDB, unsupported-save preservation                    | Reload and unsupported-save preservation checks passed              |
| Security   | Local-only scope, static headers, no credentials, security model           | Built-app CSP test passed; deployed-header verification outstanding |
| CI         | Lint, engine tests, build, audit, browser workflow                         | Added; not executed in hosted CI                                    |
| Deployment | Cloudflare static-assets configuration                                     | Prepared only; not deployed                                         |

## How to run and verify

Use Node 24 and run `npm ci`, then `npm run dev`. The server binds to loopback. No secrets are needed.

Run `npm run check` for formatting, lint, engine/save tests, TypeScript, and production build. Run `npm audit --audit-level=high` for dependency advisories. Install a test browser with `npx playwright install chromium`, then run `npm run test:e2e` and `npm run test:e2e:production`.

The tests cover turn inverses/four-turn cycles, seeded long-history reversibility, move convention, malformed and oversized saves, branching history, browser undo/redo, reload recovery, small viewports, and preservation of unsupported data.

## Verification results

- `npm run check`: passed formatting, lint, 12 domain/save tests, strict type checking, and the production build.
- `npm run test:e2e`: three interaction/persistence tests passed before the production-only policy test was added. The production-only test is intentionally skipped in development runs.
- `npm run test:e2e:production`: all four tests passed against the built application: CSP/headers/blocked inline script, turn/undo/redo/reload/reset, 390px layout/markings, and unsupported-save preservation.
- Dependency installation initially found three advisories in test tooling. Updated Vitest to 5.0.5 and its dependency tree. Final `npm audit --audit-level=high`: passed, zero known vulnerabilities across the installed dependency tree.
- Desktop and mobile full-page screenshots were inspected. One mobile heading spacing defect was corrected and included in the subsequent production build/test run.
- Build warnings: the lazy 3D scene is approximately 903 KB minified / 244 KB gzip; optimize after profiling. Zod produces harmless Rollup comment-annotation warnings. These do not fail the build.
- CI configuration exists but has not run on a hosted Git repository. No deployment or physical-device test has been performed.
- Test browser downloads and local preview/browser execution required network/process permissions outside the sandbox. Verification used local loopback only.

Screenshots are generated at `test-results/workshop-desktop.png` and `test-results/workshop-mobile.png` and are intentionally untracked.

## Next steps, in order

1. Extract the cube session hook and persistence contract from application composition before extending the UI further; add transition interruption and multi-tab save coordination checks.
2. Verify real touch-device control separation and select reference devices/performance budgets.
3. Build the curated Burr collision prototype to close Phase 0's remaining risk gate.
4. Extract reusable session/persistence interfaces and prove mode capability enforcement before adding a second playable game.
5. Complete cube visual move previews, tutorial interactions, and scene/resource lifecycle verification.
6. Implement Burr using shared infrastructure; add independent geometry and solution fixtures.
7. Extend cube guidance with beginner-method lessons and fault-injection coverage; add Burr solver workers and compatible modes.
8. Implement Cloudflare BFF/Supabase accounts only after the account security gates are implemented and tested.
9. Rehearse backup restore, deployment headers, monitoring, and rollback before public release.

## Known limits

- Burr and sliding tiles have descriptive catalog/detail pages but remain unplayable.
- No beginner-method tutorials, timer, rankings, multiplayer, cloud sync, or service-worker offline asset caching yet. Cube computed hints/solution instructions are implemented; Burr solving is not.
- Local progress survives reload but may be cleared by the browser. Network-independent gameplay after loading is not a full offline-installable application.
- HTML arrow buttons work; curved in-scene arrow previews remain future work.
- Registry/contracts are initial scaffolding, not a finished generic game framework.
- Current local storage is designed for one active puzzle tab. Concurrent tabs can overwrite the same guest save; tab coordination is outstanding.
- Browser security headers are checked in production preview; actual Cloudflare responses remain unverified.

## Updating this document

For each milestone, record what changed, relevant files/decisions, exact verification outcomes, failures/limits, and the next ordered tasks. Keep the implementation plan as the intended roadmap and this document as the evidence of actual progress. Do not mark an entire phase complete until its exit criteria pass.
