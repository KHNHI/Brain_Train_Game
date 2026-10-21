# Vendored cube.js algorithm

Source: npm `cubejs@1.3.2`, https://github.com/ldez/cubejs. MIT license included here and in `public/licenses/cubejs.txt` for distribution.

Only `lib/cube.js` and `lib/solve.js` are retained, renamed `.mjs`. The cube's CommonJS/global export wrapper is replaced by an ESM default export; the solver's require/local Cube declaration is replaced by an ESM import. `index.mjs` connects them; `index.d.mts` declares the narrow API we use. Algorithm logic is unchanged. Native ESM is needed for both development and production browser workers.

The npm package unnecessarily depends on an old npm CLI carrying advisories. We do not retain that package or dependency tree. These algorithm files have no network, eval, filesystem, or subprocess operations. They are third-party source, excluded from project formatting/lint rather than rewritten. Their maintenance and license remain our responsibility; npm audit does not audit vendored files.

Execution is confined to a cancellable dedicated worker with a 45-second deadline. Inputs are bounded session records, and the main thread replays and verifies every returned solution. Do not expose arbitrary cube.js APIs or external code loading. Integration tests verify this source's notation against the application's independent rules.
