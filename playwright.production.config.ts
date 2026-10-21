import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig(base, {
  projects: [{ name: 'production' }],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run preview',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
