# Brain Trainer: phased implementation plan

Status: implementation started. See BUILD_PROGRESS.md for actual completion and verification status.
Date: 21 October 2026.

## 1. Product and scope

Build a browser-based collection of interactive spatial puzzles. Players manipulate real 3D objects through clear arrows, selection highlights, and optional gestures. The first release includes a 3×3 cube and one curated, translation-only Burr puzzle.

Primary goals:

- Make legal moves understandable on desktop and touch devices.
- Keep gameplay responsive without a network connection.
- Add new puzzles and compatible modes without rewriting existing games.
- Keep rules deterministic, saves recoverable, and private data access controlled.

Initial modes: practice and introductory guided lessons. Local timed challenges may follow once timing and lifecycle behavior are defined. Public ranked competition is a later phase.

Outside the first release: multiplayer, arbitrary Burr generation, user uploads, payments, arbitrary mechanical rotations, and claims of medical or general cognitive benefit.

## 2. Architecture decisions

Use a modular TypeScript codebase in one repository. Begin with a modular application and one backend, rather than microservices. Extract separate packages only when actual reuse or independent deployment requires them.

| Concern               | Choice                                                | Reason                                                          |
| --------------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| Web UI                | React, TypeScript, Vite                               | Typed components and a straightforward build                    |
| 3D                    | Three.js, React Three Fiber, Drei                     | Interactive scenes and reusable camera helpers                  |
| UI state              | Zustand                                               | Small stores for selection and preferences                      |
| Rules                 | Pure TypeScript                                       | Shared between browser, workers, tests, and server validation   |
| Boundary validation   | Zod or equivalent typed runtime schemas               | Validate imported saves, network input, and worker messages     |
| Solvers               | Web Workers                                           | Keep expensive searches away from rendering                     |
| Local persistence     | IndexedDB behind a repository interface               | Structured sessions and offline progress                        |
| Cloud persistence     | Supabase-managed PostgreSQL                           | Relational data, flexible puzzle states, managed authentication |
| Authentication/API    | Same-origin backend-for-frontend (BFF), Supabase Auth | Keep provider tokens on the server and centralize authorization |
| Verification          | Vitest, property-based tests, Playwright              | Rule invariants, security boundaries, real interaction flows    |
| Dependency management | npm and committed lockfile                            | Reproducible installs using the available runtime; see ADR 0001 |

Choose mutually compatible stable versions during setup and record them in the lockfile. Hosting decision: Cloudflare Workers Static Assets for the frontend, Cloudflare Workers for the same-origin BFF, and Supabase for Auth/PostgreSQL. Use user-scoped Supabase API requests initially; direct SQL/Hyperdrive is optional and requires explicit authorization design. See decisions/0001-foundation.md.

### Layer boundaries

```text
React menus and game scenes
          |
Session controller ---- mode policy
          |
Puzzle engine (pure rules)
          |
Versioned state and move contracts

Session controller -> local save adapter
                   -> authenticated BFF -> PostgreSQL
                   -> solver worker
```

- Engines import no React, Three.js, browser storage, network client, or UI store.
- Renderers consume state and emit commands; mesh transforms never become authoritative state.
- Modes control objectives, timing, hints, and scoring; engines control legal puzzle moves.
- Storage adapters implement shared interfaces and contain persistence details.
- Game modules cannot import another game's implementation.
- Backend validation imports compatible pure engines, not frontend code.
- Enforce these dependencies through lint rules and CI.

### Suggested repository layout

```text
src/
  app/                      # Routes, composition, catalog, application providers
  core/
    contracts/              # Puzzle, mode, save, and worker interfaces
    session/                # Command handling, history, lifecycle
    persistence/            # Repository interfaces and save migrations
  games/
    cube/                   # engine/, scene/, controls/, levels/, tests/
    burr/                   # engine/, scene/, controls/, levels/, tests/
  modes/                    # Practice, tutorial, later timed challenge
  features/                 # Catalog, progress, account settings
  shared/ui/                # Buttons, dialogs, accessible control primitives
  infrastructure/           # IndexedDB and HTTP adapters
  workers/                  # Solver entry points and message handling
server/
  auth/                     # Sessions, CSRF, provider integration
  routes/                   # Thin HTTP handlers
  services/                 # Save synchronization and result validation
  repositories/             # Database access
supabase/
  migrations/               # Schema, constraints, grants, RLS
  tests/                    # Database policy and integration tests
tests/e2e/
docs/
  decisions/                # Architecture decision records
  runbooks/                 # Deployment, restore, incidents
```

### Extension contract

Each game registers metadata, engine, lazy-loaded renderer, controls, supported modes, versioned schemas, and optional solver capabilities. Keep state and move types generic per game; validate their runtime representation at external boundaries.

```ts
interface PuzzleEngine<State, Move> {
  initialState(levelId: string): State;
  legalMoves(state: State): readonly Move[];
  applyMove(state: State, move: Move): State;
  isSolved(state: State): boolean;
}
```

Add explicit serialization, validation, state hashing, and inverse-move capabilities alongside this minimal interface. Do not require every puzzle to support scrambling, undo, or a solver. Registration checks mode requirements against declared capabilities.

Adding a game should require its module, registration, content, and tests. Adding a compatible mode should require its policy, UI, and tests, without editing the engine.

## 3. State, animation, and algorithms

### Shared command lifecycle

1. Convert pointer, keyboard, or tutorial input into a typed command.
2. Validate it against the committed state and current mode.
3. Compute the next state deterministically.
4. Animate from committed state to next state.
5. Commit once, record history, and schedule persistence.

Track a pending transition explicitly. Bound the input queue. On scene disposal, reduced-motion changes, or interrupted animation, settle the accepted command exactly once. Never leave the engine halfway through a move.

Use a monotonic clock for active-play time and define pause/background behavior. Local timings are personal records; competitive timing needs a separate protocol.

### Cube

- Track corner/edge permutations and orientations as discrete values; centers establish the face reference frame.
- Implement and verify face-turn tables independently from visuals.
- Animate affected pieces around a pivot, then derive exact transforms from committed state.
- Provide selection, curved arrows, direction previews, camera reset, and keyboard controls.
- Generate seeded practice scrambles from legal turns; do not describe them as uniformly random states.
- Add a licensed, maintained Kociemba-compatible solver in a cancellable worker later. Solutions need not be shortest.
- Write tutorial lessons separately from solver output; a computed move is not automatically an explanation.

### Burr

- Start with integer voxel geometry, fixed piece orientations, and axis-aligned translation.
- Track piece offsets and occupied cells; check the entire swept path for collisions.
- Define legal translation increments, board bounds, removed-piece handling, and victory precisely.
- Ship curated definitions and verified solution traces before attempting procedural content.
- Use BFS for small bounded state graphs; evaluate A* or iterative deepening with puzzle-appropriate heuristics only when needed.
- Normalize equivalent translations where valid, deduplicate visited states, and impose node, memory, and time limits.
- Cancel stale hint requests when the player moves. Never let an exhausted search freeze gameplay.

## 4. Persistence and data model

PostgreSQL is the authoritative store for account-linked cloud progress. IndexedDB stores local sessions and an outbound synchronization queue. Neither storage layer is needed to render an individual move.

| Entity            | Important fields and constraints                                            |
| ----------------- | --------------------------------------------------------------------------- |
| profiles          | Auth user ID, public display name, preferences; no public email             |
| games             | Stable ID, published metadata, engine compatibility version                 |
| levels            | Game ID, immutable definition version, validated definition JSONB           |
| game_sessions     | Owner, game/level/mode, state JSONB, schema version, revision, timestamps   |
| attempts          | Owner, challenge, summary, verification status; trusted fields server-owned |
| daily_challenges  | Published configuration, seed, rules version, availability window           |
| user_achievements | Owner, achievement ID; uniqueness constraint; awards server-owned           |

Use foreign keys, uniqueness constraints, bounded numeric values, payload limits, and indexes matching actual queries. Keep searchable/rankable fields typed; use JSONB for validated game-specific structures. Begin with aggregate results and bounded histories; define retention before storing every move indefinitely.

Synchronization rules:

1. Save locally after committed moves, with short batching as needed.
2. Sync through an authenticated API with idempotency keys.
3. Update using an expected revision in an atomic database operation.
4. On mismatch, preserve both versions and offer a recoverable conflict choice; do not silently overwrite a different device's progress.
5. Partition local data by guest/account identity. Require an explicit merge decision when linking guest progress; clear private caches on sign-out.
6. Migrate older save versions through tested migrations. Reject unsupported future versions without deleting them.

## 5. Security design

Threats to address: cross-account access, script injection, stolen sessions, forged scores, abusive requests, malformed puzzle data, leaked credentials, and accidental data loss.

### Authentication and authorization

- Use Supabase Auth through the BFF; keep access/refresh tokens server-side. The browser receives an opaque Secure, HttpOnly, SameSite session cookie.
- Define session expiry, refresh rotation, revocation, and logout. Never place auth tokens in IndexedDB or localStorage.
- Protect state-changing routes with CSRF tokens and Origin checks. Restrict CORS; do not treat CORS as authentication.
- Validate the authenticated identity server-side; never trust a submitted user ID.
- Enable RLS and least-privilege grants for application tables exposed through Supabase APIs, even when the primary path uses the BFF.
- Use user-scoped database requests for normal operations so RLS remains effective. Isolate privileged operations; service-role credentials bypass RLS and require explicit authorization in server code.
- Keep admin routes separate, require stronger authentication, and audit privileged changes. Public sign-up must never assign admin roles.

### Input, browser, and infrastructure protection

- Validate type, size, range, ownership, and game/version compatibility on server requests. Treat worker messages and local saves as untrusted too.
- Use parameterized database operations; validate and allowlist dynamic sort/filter options.
- Render user text as text. Avoid arbitrary HTML, remote scripts, and user-supplied executable puzzle definitions.
- Deploy HTTPS, restrictive Content Security Policy, frame restrictions, MIME sniffing protection, and an appropriate referrer policy. Test worker and asset loading under the actual CSP.
- Limit body size, pagination, concurrent solver jobs, and expensive search work. Rate-limit login, save, and submission endpoints with shared enforcement across server instances.
- Keep production secrets in the hosting secret manager. Only intentionally public configuration may use Vite's client-exposed environment variables.
- Scan commits/builds for secrets; use least-privilege CI credentials and pinned third-party actions. Review dependency updates and solver licenses.
- Separate development, staging, and production projects and credentials. Never copy production personal data into previews.

### Score integrity and privacy

- Mark offline results as unverified. Do not let clients write verified status, trusted scores, or achievements directly.
- Later ranked submissions must bind to server-issued challenge configuration and replay legal moves server-side with replay protection and work limits.
- Replay validation proves a legal solve, not that a human played or that a client-reported duration is honest. Stronger competition requires server timing and additional abuse controls; document those limits.
- Collect minimal personal information, keep saves private, and expose only opt-in public leaderboard fields.
- Provide account deletion/export and explicit retention rules. Exclude tokens, raw request bodies, and unnecessary personal data from logs.

## 6. Implementation phases

Phases are completion gates, not date promises. Confirm estimates after the interaction prototype exposes device and input risks.

### Phase 0 — Specification and risk prototype

1. Record scope, target browser/device matrix, first Burr geometry, and control diagrams.
2. Prototype cube selection, one legal face turn, camera separation, and touch arrows.
3. Prototype Burr swept-collision rules using one known solvable fixture.
4. Record architecture decisions, initial performance targets, and the threat model.

Deliverables: runnable interaction spike, curated Burr fixture, architecture decisions, and agreed acceptance checklist.

Exit: face selection and layer rotation work on an actual touch device; camera gestures do not trigger puzzle moves; Burr path checks detect intermediate collisions. Reuse only spike code that meets production module boundaries.

### Phase 1 — Maintainable foundation

1. Initialize the TypeScript application, module layout, scripts, and lockfile.
2. Enable strict type checking, formatting, linting, import-boundary checks, and CI.
3. Implement contracts, registry, session lifecycle, mode compatibility, and command history.
4. Add schema validation, local persistence adapter, save versioning, and error boundaries.
5. Add a minimal accessible UI shell and a mock/test puzzle fixture for framework verification.

Deliverables: navigable shell, documented setup, deterministic session controller, CI pipeline.

Exit: a fresh checkout installs and verifies with documented commands; invalid saves fail safely; engine modules cannot import UI/infrastructure; lifecycle/history tests pass.

### Phase 2 — Complete cube practice game

1. Implement tested cube state, move tables, inverse moves, and solved detection.
2. Build scene, selection highlights, preview arrows, animation, and keyboard/touch controls.
3. Add seeded scramble, reset, undo/redo, move counter, and local saves.
4. Add view reset, color-independent sticker symbols, reduced motion, and accessible controls.
5. Verify reload, interrupted animation, rapid input, and background/resume behavior.

Deliverable: complete offline cube practice experience.

Exit: inverse and four-turn invariants pass; long seeded move sequences remain valid; save/reload and replay match; selected reference devices meet agreed rendering targets without unbounded memory growth.

### Phase 3 — Burr game and extension proof

1. Implement voxel definitions, bounded translations, swept collision, removal, and victory.
2. Build selectable pieces, axis arrows, movement previews, and obstruction highlights.
3. Register the game using shared sessions, saves, history, and settings.
4. Add the curated puzzle, tutorial metadata, and independent solution trace.
5. Document how to add another game; refine only abstractions demonstrated by both games.

Deliverable: a playable, fully validated Burr puzzle.

Exit: the known solution completes; illegal paths are rejected; undo/replay preserve state; adding Burr required no changes to cube rules. Any framework changes have a documented reason.

### Phase 4 — Modes, tutorials, and bounded hints

1. Implement practice and guided-lesson policies with explicit capability requirements.
2. Add local timed challenge rules, including pause, hidden-tab, and reset behavior.
3. Integrate cube solver licensing/loading and bounded Burr search workers.
4. Add request cancellation, progress/timeout states, and stale-result protection.
5. Keep teaching scripts separate from computed solver paths.

Deliverable: compatible modes and responsive hint experiences.

Exit: incompatible combinations cannot launch; worker timeout/cancellation is verified; hints match the current state; mode changes do not alter engine legality.

### Phase 5 — Accounts and secure cloud progress

1. Provision separate staging and production infrastructure; implement the same-origin BFF.
2. Implement cookie sessions, authentication flows, logout, CSRF protection, and rate limits.
3. Add version-controlled migrations, constraints, RLS, grants, and policy tests.
4. Implement account-scoped saves, atomic revision checks, offline sync, and guest merge.
5. Implement deletion/export and sanitized operational logs.
6. Configure backups and perform a restore rehearsal in an isolated environment.

Deliverable: secure cross-device progress.

Exit: anonymous and user-A/user-B tests deny unauthorized reads/writes; trusted fields cannot be forged; expired sessions fail safely; concurrent saves preserve conflicts; credentials are absent from the client bundle; restore rehearsal succeeds.

### Phase 6 — Production readiness and first release

1. Finish end-to-end desktop/mobile and accessibility checks for both games.
2. Measure initial download, interaction latency, frame time, worker memory, and API performance.
3. Load-test expected API usage and document the tested workload and limits.
4. Verify CSP, CSRF, authorization, dependency findings, and abuse limits in staging.
5. Add error monitoring, service alerts, health checks, and support diagnostics without sensitive payloads.
6. Document deployment, rollback, secret rotation, data recovery, and incident response.
7. Release through staging and smoke-test the production deployment.

Provisional performance targets: smooth play near 60 fps on the selected desktop reference and at least 30 fps on the selected mobile reference; visible input feedback within 100 ms under normal load. Record devices, scenarios, and measurements; these are acceptance targets, not universal guarantees.

Deliverable: production cube/Burr collection with local play, accounts, cloud progress, and operational documentation.

Exit: all earlier gates pass; no unresolved critical/high security findings without a recorded assessment; production backup coverage and recovery objectives are verified; rollback is rehearsed. Set numeric recovery-time and recovery-point objectives before enabling real accounts, based on budget and selected backup plan.

### Phase 7 — Optional growth after release

1. Add sliding tiles or Soma cube through the documented game contract.
2. Add daily challenges and server-validated move-count leaderboards before time-based rankings.
3. Evaluate multiplayer requirements independently; use authoritative session servers when needed.
4. Introduce caching, queues, table partitioning, or separate services only after measurements identify a bottleneck.
5. Treat user-generated levels as a new security boundary with validation, quotas, moderation, and bounded computation.

Exit for each addition: module/mode contract tests, authorization review, performance checks, and support documentation pass without regressions to existing games.

## 7. Engineering quality gates

Every meaningful change must have a clear owner, focused scope, explanatory naming, and appropriate verification. Prefer composition and small explicit modules over generic frameworks with speculative features.

CI stages:

1. Reproducible install, formatting, linting, and strict type checking.
2. Engine invariants and deterministic fixture tests.
3. Persistence migration and API/database integration tests when affected.
4. Browser smoke tests for critical user journeys.
5. Production build, secret detection, and dependency/security checks.

Test domain behavior rather than implementation details. Use property-based tests for move invariants and malformed-state handling. Run policy tests with real anonymous and user-scoped credentials; a privileged database connection cannot prove RLS works.

Definition of done:

- Rules, UI, and persistence responsibilities remain separated.
- Public contracts and persisted formats are versioned when changed.
- Relevant success, failure, and unauthorized paths have been checked.
- Loading/error/empty states and accessibility are covered.
- Documentation and migrations match the implementation.
- No unexplained dependencies, secrets, or known release-blocking failures.

## 8. Operational responsibilities and remaining decisions

Before Phase 1: choose reference devices and browser support; confirm first Burr definition.
Before Phase 5: choose hosting region/platform, authentication methods, data retention, backup budget, and recovery objectives.
Before ranked play: define score metric, threat assumptions, replay limits, and what the verification badge means.

Scale by measuring database latency, connection usage, slow queries, save volume, and worker/server costs. Use connection pooling for serverless deployments and paginate all collection APIs. Avoid per-frame and per-animation database writes. Keep 3D assets on static hosting/CDN rather than in relational rows.

Supabase database backup coverage and retention depend on the selected plan/configuration. Asset storage needs its own recovery strategy; do not assume database backups restore uploaded files. Restore rehearsals must cover the actual application data and assets.

## 9. References

These sources inform the design; implementation must recheck provider behavior and dependency compatibility at setup and before release.

- [React Three Fiber introduction](https://r3f.docs.pmnd.rs/getting-started/introduction)
- [React Three Fiber performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [Kociemba two-phase algorithm](https://www.kociemba.org/twophase.htm)
- [Supabase database overview](https://supabase.com/docs/guides/database/overview)
- [Supabase JSON/JSONB support](https://supabase.com/docs/guides/database/json)
- [Supabase row-level security and privileged-key behavior](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Supabase backup documentation](https://supabase.com/docs/guides/platform/backups)
- [OWASP HTML5 security guidance](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [OWASP session management guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
