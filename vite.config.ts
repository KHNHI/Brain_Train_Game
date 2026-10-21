import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

// Apply the same policy during production preview as Cloudflare static assets.
// Development intentionally keeps Vite's HMR policy separate.
const securityHeaders = Object.fromEntries(
  readFileSync(new URL('./public/_headers', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.startsWith('  '))
    .map((line) => {
      const colon = line.indexOf(':');
      return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
    }),
);

export default defineConfig({
  plugins: [react()],
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
  server: { host: '127.0.0.1', strictPort: true },
  preview: { host: '127.0.0.1', strictPort: true, headers: securityHeaders },
  build: { sourcemap: false },
});
