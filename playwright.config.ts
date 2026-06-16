import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: process.env.CI
    ? [
        ['list'], 
        ['html', { outputFolder: 'playwright-report', open: 'never' }], 
        ['github'] 
      ]
    : 'html', 

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  /* En CI forzamos usar solo Chromium para acelerar el pipeline de autenticación */
  projects: process.env.CI 
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        }
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
      ],

  /* El webServer corre la aplicación ya compilada y optimizada en el puerto 3000 */
  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, 
  },
});