# Security model and release gates

Security takes precedence over feature breadth. This document records implemented controls and explicitly unimplemented production requirements; no claim of complete security is implied.

## Current attack surface

This milestone has no backend, accounts, uploaded files, cloud credentials, third-party analytics, or externally loaded assets. The browser runs puzzle rules and reads/writes a guest IndexedDB save. Dependencies and deployment configuration remain part of the supply chain.

Trust boundaries:

- Browser storage is untrusted. Parse saves with a strict versioned schema, cap arrays/cursors, and replay legal moves rather than accepting arbitrary transforms.
- The 3D scene is presentation. Only typed engine commands change logical state.
- UI state and local results are user-controlled and cannot become verified rankings.
- Dependency source is not automatically trustworthy: lock versions, audit, review updates, and avoid arbitrary remote scripts.

## Implemented controls

- Strict TypeScript and engine import restrictions.
- Integer move rules, bounded history, no executable puzzle definitions.
- Strict runtime validation of save fields and sizes; unknown fields/versions rejected.
- Unsupported saves preserved rather than silently replaced.
- React text rendering; no raw HTML injection or HTML from save data.
- Local storage contains puzzle moves only, no credentials or auth tokens.
- Secrets/runtime files ignored by source-control configuration.
- Cloudflare static-header policy: self-hosted scripts/connections, no plugins, no framing, no camera/microphone/geolocation/payment access.
- Inline styles are allowed for React/Three presentation; inline scripts and eval are not allowed by the production CSP. Reassess style policy when introducing new UI libraries.
- Read-only CI repository permissions and pinned setup/checkout actions.
- Cube hints run in a self-hosted dedicated worker, started only on request, with cancellation and a 45-second deadline. Worker input uses the bounded save schema; output uses a bounded move schema and must solve the current cube when replayed by our independent engine. Changed sessions terminate stale searches.
- The MIT cube.js algorithm files are vendored without the upstream package's vulnerable unused npm CLI dependency. Provenance and license are in `vendor/cubejs`; npm audit does not cover this source, which requires code review and integration tests. No remote execution or CSP relaxation was added.

## Requirements before accounts

- Same-origin BFF with opaque Secure/HttpOnly/SameSite session cookies; provider tokens remain server-side.
- Durable, revocable server sessions with expiry, rotation, and account isolation.
- CSRF protection, Origin checks, request-size limits, and shared rate-limit enforcement.
- Server identity validation, least-privilege database access, RLS/grants, and real cross-account denial tests.
- Keep privileged Supabase keys server-side and out of client-prefixed environment variables. Privileged connections bypass RLS; authorize every privileged operation explicitly.
- Cache-Control: no-store for private/auth responses. Never store private saves in shared Cloudflare caches.
- Data export/deletion, privacy/retention policy, sanitized monitoring, and verified backup restoration.
- Deployment secret scanning and production-header checks.

## Requirements before ranked play

Server-issued challenges, idempotent/replay-resistant submissions, legal-move replay with work limits, server-owned verified fields, and documented timing/automation limitations. Offline/client times remain unverified. No trusted-score APIs currently exist.

## Verification and incidents

Run `npm run check`, `npm audit --audit-level=high`, and browser tests before release. Run `npm run test:e2e:production` after building to verify the built application under the same static security headers and confirm inline scripts are blocked. Dependency audits are one source of evidence, not proof of security. Vite development does not apply `_headers`; preview does through explicit configuration. Inspect actual Cloudflare response headers before release as well.

Do not publish until the applicable phase gates in IMPLEMENTATION_PLAN.md pass. If credentials are accidentally exposed, revoke/rotate them, inspect access logs, and rebuild artifacts. If save validation fails, preserve the record, disable overwriting for the visit, and explain the limitation.

No public vulnerability inbox exists yet. Establish a private reporting channel before opening public registration.

References: [OWASP browser storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Cloudflare Workers](https://developers.cloudflare.com/workers/).
