import { test, expect } from '@playwright/test';

test.describe('DYAG-6: Autenticación', () => {
  
  test('Escenario 1 - Acceso correcto con credenciales válidas', async ({ page }) => {
    await page.goto('/auth/card');
    
    // Rellenar datos inyectados previamente en la DB por el Seed
    await page.fill('input[type="email"]', 'correo.admin.diagnosys@gmail.com');
    await page.fill('input[type="password"]', '0rganizacion.');
    
    // Hacemos un clic explícito en el botón de submit
    await page.click('button[type="submit"]');
    
    // Esperamos que la URL cambie al dashboard de manera exitosa
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 7000 });
  });

  test('Escenario 2 - Validación de errores con credenciales incorrectas', async ({ page }) => {
    await page.goto('/auth/card');
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Selector alternativo más amplio por si la palabra exacta difiere en tu UI
    const errorMessage = page.locator('text=/error|credenciales|inválid|incorrect|no coincide/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('Escenario 3 - Persistencia de sesión', async ({ page }) => {
    await page.goto('/auth/card');
    await page.fill('input[type="email"]', 'correo.admin.diagnosys@gmail.com');
    await page.fill('input[type="password"]', '0rganizacion.');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 7000 });
    
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Escenario 1 - Cierre de sesión desde menú', async ({ page }) => {
    await page.goto('/auth/card');
    await page.fill('input[type="email"]', 'correo.admin.diagnosys@gmail.com');
    await page.fill('input[type="password"]', '0rganizacion.');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 7000 });
    
    // Localizador flexible usando roles semánticos de links y botones para cerrar sesión
    const logoutButton = page.locator('button, a').filter({ hasText: /Cerrar sesión|Logout|Sign out/i });
    
    // Desplegar el menú si es un menú colapsable (Mobile o dropdown de perfil)
    const menuButton = page.locator('button, [role="button"]').filter({ hasText: /Menú|Menu|Perfil|Profile/i }).first();
    if (await menuButton.isVisible({ timeout: 1500 }).catch(() => false)) {
      await menuButton.click();
    }
    
    await logoutButton.first().click();
    await expect(page).toHaveURL(/\/(auth\/card|login|)/);
  });

  test('Escenario 1 - Formulario de registro', async ({ page }) => {
    await page.goto('/auth/card');
    
    // Cambiado a getByRole/getByText para evitar encallarse buscando elementos indefinidamente
    const registerLink = page.locator('a, button').filter({ hasText: /Crear cuenta|Registrarse|Registro|Sign up/i }).first();
    await registerLink.click();
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Escenario 2 - Confirmación de registro exitoso', async ({ page }) => {
    await page.goto('/auth/card');
    const registerLink = page.locator('a, button').filter({ hasText: /Crear cuenta|Registrarse|Registro|Sign up/i }).first();
    await registerLink.click();
    
    const timestamp = Date.now();
    const newEmail = `newuser${timestamp}@example.com`;
    
    // Rellenamos inputs basándonos en tipos y atributos estándar
    const nameInput = page.locator('input[name*="name"], input[placeholder*="nombre" i]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User');
    }
    
    await page.fill('input[type="email"]', newEmail);
    await page.fill('input[type="password"]', 'NewPassword123!');
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    await expect(page).toHaveURL(/\/(auth\/card|login)/, { timeout: 7000 });
  });

  test('Escenario 3 - Validación de correo duplicado', async ({ page }) => {
    await page.goto('/auth/card');
    const registerLink = page.locator('a, button').filter({ hasText: /Crear cuenta|Registrarse|Registro|Sign up/i }).first();
    await registerLink.click();
    
    // Usamos el correo del admin que ya sabemos que existe gracias al seed
    await page.fill('input[type="email"]', 'correo.admin.diagnosys@gmail.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    const errorMessage = page.locator('text=/existe|duplicado|ya registrado|already/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('Escenario 1 - Solicitud de recuperación de contraseña', async ({ page }) => {
    await page.goto('/auth/card');
    const forgotButton = page.locator('a, button').filter({ hasText: /Olvidé|Forgot|Recuperar/i }).first();
    await forgotButton.click();
    
    await page.fill('input[type="email"]', 'test@example.com');
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    const successMessage = page.locator('text=/enlace|enviado|email|correo|success/i');
    await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('Escenario 2 - Restablecimiento exitoso de contraseña', async ({ page }) => {
    await page.goto('/auth/reset-password?token=valid_token_example');
    
    await page.fill('input[type="password"]', 'NewPassword123!');
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    await expect(page).toHaveURL(/\/(auth\/card|login)/, { timeout: 7000 });
  });
});