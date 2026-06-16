import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Ejecuta tests en paralelo para acelerar los tiempos */
  fullyParallel: true,
  /* Evita que subas por accidente un test.only al repositorio de CI */
  forbidOnly: !!process.env.CI,
  /* Reintentos en caso de inestabilidad en la máquina virtual de GitHub */
  retries: process.env.CI ? 2 : 0,
  /* Forzamos ejecución secuencial en CI para que Next.js no colapse el CPU de la VM */
  workers: process.env.CI ? 1 : undefined,
  
  /* Configuración multi-reporte limpia para CI y Entorno Local */
  reporter: process.env.CI
    ? [
        ['list'], 
        ['html', { outputFolder: 'playwright-report', open: 'never' }], 
        ['github'] 
      ]
    : 'html', 

  /* Configuración de contexto global */
  use: {
    /* URL Base a la que apuntarán los métodos page.goto() */
    baseURL: 'http://localhost:3000',

    /* Guarda trazas y capturas solo si el test llega a fallar en el primer intento */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  /* Matriz de navegadores en los que se correrán las pruebas */
  projects: [
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

  /* Levanta automáticamente el servidor de desarrollo antes de arrancar los tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutos máximo para compilar Next.js en GitHub Actions
  },
});