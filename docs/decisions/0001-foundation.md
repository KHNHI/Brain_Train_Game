# ADR 0001: local foundation and Cloudflare deployment target

Date: 21 October 2026. Status: accepted for the first implementation milestone.

## Decisions

1. Use Cloudflare Workers Static Assets for the frontend deployment target and Workers for the future same-origin backend. Retain Supabase Auth and PostgreSQL for future cloud accounts and data.
2. Keep the first milestone local-only. Do not provision or publish infrastructure while the rules and interaction gates remain incomplete.
3. Use npm with a committed lockfile because npm is already available in this workspace. This supersedes the proposed pnpm choice; do not maintain two lockfiles.
4. Use exact sticker positions/normals and cubie positions as the initial cube representation. This is easy to inspect and test. A future solver may use a validated adapter to corner/edge coordinates; do not derive logical state from mesh transforms.
5. Store only bounded, schema-validated move histories, scramble, and cursor locally. Reconstruct state by replay. Add periodic snapshots only if profiling justifies them.
6. Keep state local to the first game UI rather than adding Zustand before shared store behavior is needed.
7. Build an accessible HTML control path alongside the canvas. Canvas-only controls would exclude keyboard users.

## Tradeoffs

The current state reconstruction is O(history length) and capped at 2,000 player moves plus 100 scramble moves. The initial registry and mode types describe extension points, not a completed plugin framework. A second game must prove the abstraction before it is generalized.

Rendering resources are simple geometry without external asset hosts. The initial design intentionally uses local system fonts so CSP and privacy do not depend on remote fonts.
