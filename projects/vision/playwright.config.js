/**
 * Playwright Configuration - Game 2.5D
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // Timeout global pour chaque test
  timeout: 30000,

  // Nombre de retries en cas d'échec
  retries: process.env.CI ? 2 : 0,

  // Nombre de workers en parallèle
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'tests/reports' }],
    ['list']
  ],

  // Configuration globale des tests
  use: {
    // URL de base (le serveur doit être lancé)
    baseURL: 'http://localhost:5173',

    // Traces pour le debugging
    trace: 'on-first-retry',

    // Screenshots en cas d'échec
    screenshot: 'only-on-failure',

    // Video en cas d'échec
    video: 'on-first-retry',
  },

  // Projets (navigateurs)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Serveur de développement
  webServer: [
    {
      command: 'node server.js --port=5173 --app=game',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'node server.js --port=5174 --app=backoffice',
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'node server.js --port=5175 --app=stage-maker',
      url: 'http://localhost:5175',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
