# Form & Field — Brain Trainer

A local-first 3D puzzle workshop. The first implementation contains a playable 3×3 cube. Burr and sliding-tile cards are labeled future previews, not playable games.

## Run locally

Requirements: Node.js 22.12+ (Node 24 recommended) and npm.

```sh
npm ci
npm run dev
```

Open the loopback URL printed by Vite. No account, environment variables, API keys, or backend project are required.

## Pages

- `/`: interactive cube preview, up to three filterable game cards, controls/help guide, and expandable questions. The preview uses real cube rules but never changes your saved game.
- `/games`: full catalog with availability labels.
- `/games/cube`: playable cube, instructions, hints, and full solution.
- `/games/cube#instructions`: direct link to the cube instructions.
- `/games/burr` and `/games/sliding-tiles`: descriptions and planned controls; these games are not yet playable.

Home/catalog illustrations are local SVGs and do not load the 3D renderer. In-app navigation away from the cube waits for any accepted turn and its local save to settle. Existing browser saves remain compatible. Unknown paths show a not-found page; static hosting must use the SPA fallback configured in `wrangler.jsonc` for direct game links and reloads.

## Verify

```sh
npm run check
npm audit --audit-level=high
npx playwright install chromium
npm run test:e2e
npm run test:e2e:production
```

`check` runs formatting, lint, rule/save tests, TypeScript, and the production build. Browser tests exercise turns, history, reload persistence, small viewports, and preservation of unsupported saves. Production browser tests also verify the built app under CSP and confirm inline scripts are blocked. Headless graphics results do not replace testing on a physical touch device.

## Controls

- Drag the scene to rotate freely, including upside down; scroll/pinch to zoom. Trackball controls allow roll and do not lock the camera upright.
- Click a sticker or choose a face with the labeled buttons.
- Faces use color names so labels stay meaningful when the view rotates. History letters (U/R/F/D/L/B) keep their fixed starting reference; camera movement does not add puzzle moves.
- An amber border outlines the selected face; its center label is stronger. The border is naturally hidden when that face is behind the cube.
- Use the two arrow buttons to turn the selected face. Clockwise is defined looking directly at that face.
- Undo/redo your moves; generate a new 20-turn practice scramble.
- Reset the view independently from the puzzle. Enable sticker markings for color-independent identification.
- Use **Hint: next turn** to reveal one move without changing the cube. **Show solution** displays color-based instructions for the full sequence; **Apply next turn** performs one animated step. Guidance follows matching manual moves and becomes stale after a different move. Calculations run locally and can be cancelled.
- Keyboard users can Tab between controls and activate them with Enter/Space.

Saves stay in IndexedDB in this browser. Browser storage may be cleared. The game does not upload your progress. An unsupported save is preserved, and writes are disabled for that visit.

## Code boundaries

- `src/games/cube/engine`: pure deterministic rules and versioned session validation.
- `src/games/cube/scene`: lazy-loaded Three.js rendering and animation.
- `src/core`: framework-independent contracts.
- `src/infrastructure`: browser persistence adapters.
- `src/app`: composition and current session UI.
- `public/_headers`: production static-asset security headers.
- `src/features/solution` and `src/workers`: bounded solver requests, verification, and guided steps.
- `vendor/cubejs`: isolated MIT-licensed Kociemba implementation and provenance; it is not a beginner-method lesson engine and does not promise shortest solutions.

`src/app/App.tsx` defines routes and the shared site layout; `src/app/catalog.ts` is the authored source for card content and availability. The cube session UI lives in `src/pages/CubePage.tsx`; extracting a reusable session controller is scheduled before a second playable game. A registry stub documents capabilities but is not yet a generic launcher.

## Cloudflare

`npm run build` produces `dist/`. `wrangler.jsonc` describes a static Cloudflare Workers Assets deployment; publication has not been performed. Use a current Wrangler CLI during deployment setup. No Worker API, bindings, credentials, or Supabase project are provisioned yet.

The `_headers` file is copied into the build and is intended for Cloudflare static assets. Vite development does not enforce these headers; production preview reads and applies the same policy for testing. Future Worker API responses must apply their own headers and private-cache policy. Verify actual deployed headers before release.

## Project documents

- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Build progress, verification, and next steps](docs/BUILD_PROGRESS.md)
- [Security model and release gates](docs/SECURITY.md)
- [Architecture decisions](docs/decisions/0001-foundation.md)

This is an early local prototype, not a production security certification. See the progress document for completed versus outstanding gates.
