import { defineConfig, devices } from '@playwright/test';

// Port dédié aux tests (PORT_E2E pour en changer si npm start tourne déjà ailleurs).
const PORT = Number(process.env.PORT_E2E) || 4181;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/`,
    ...devices['Desktop Chrome'],
  },
  projects: [
    {
      name: 'bureau',
      use: { viewport: { width: 1280, height: 800 } },
      grepInvert: /@mobile/,
    },
    // Téléphone : seuls les tests marqués @mobile y passent (les autres fixent leurs propres écrans).
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } }, grep: /@mobile/ },
  ],
  webServer: {
    command: 'node outils/serveur.js',
    env: { PORT: String(PORT) },
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
  },
});
