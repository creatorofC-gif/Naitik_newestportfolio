import { defineConfig, devices } from '@playwright/test';

// Mobile + compatibility checks against the production build (served the way GitHub Pages serves it).
const BASE = 'http://localhost:4173/Naitik_newestportfolio/';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: BASE, trace: 'retain-on-failure' },
  projects: [
    { name: 'iPhone 14 (Safari/WebKit)', use: { ...devices['iPhone 14'] } },
    { name: 'Pixel 7 (Chrome)', use: { ...devices['Pixel 7'] } },
    { name: 'iPad (Safari/WebKit)', use: { ...devices['iPad (gen 7)'] } },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
