# Working on Brain Trainer

Security is the user's first priority. Read `docs/SECURITY.md` and `docs/BUILD_PROGRESS.md` before feature work. Update the progress document in every implementation milestone with completed work, actual checks, limitations, and ordered next steps. The roadmap is `docs/IMPLEMENTATION_PLAN.md`; do not mark a phase complete without its exit criteria.

- Keep puzzle engines pure TypeScript, independent of UI, Three.js, networking, and storage.
- Treat local saves, browser input, and network data as untrusted. Preserve unsupported save versions.
- Never introduce client-side secrets, trusted client scores, or private responses in shared caches.
- Accounts/cloud saves must meet the BFF, cookie, CSRF, RLS, and authorization gates before release.
- Use npm and the single committed package-lock.json. Do not introduce another lockfile.
- Run `npm run check` after meaningful changes. Run relevant Playwright tests for behavior changes and `npm run test:e2e:production` after changes affecting built assets or security headers.
- Run `npm audit --audit-level=high` after dependency changes. Resolve findings or document a concrete assessment; do not silently suppress them.
- Hosting target: Cloudflare Workers Static Assets + future same-origin Worker BFF; Supabase Auth/PostgreSQL. No infrastructure is provisioned yet.
- Keep unfinished games explicitly labeled as unavailable. Avoid generic abstractions until a second real use proves them.
- Do not add proactive sub-agents; this repository does not require parallel agent work.
