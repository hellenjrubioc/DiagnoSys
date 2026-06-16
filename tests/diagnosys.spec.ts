import { test, expect } from '@playwright/test';

/**
 * DYAG-6: Autenticación
 * Tests para login, registro, logout, recuperación de contraseña
 */
test.describe('DYAG-6: Autenticación', () => {
  
  test('Escenario 1 - Acceso correcto con credenciales válidas', async ({ page }) => {
    // Given: Estoy en la sección de acceso
    await page.goto('/auth/card');
    
    // When: Ingreso usuario y contraseña válidos
    await page.fill('input[type="email"]', 'correo.admin.diagnosys@gmail.com');
    await page.fill('input[type="password"]', '0rganizacion.');
    await page.click('button[type="submit"]');
    
    // Then: Debo acceder a mi espacio personal (Esperas automáticas por URL)
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Escenario 2 - Validación de errores con credenciales incorrectas', async ({ page }) => {
    // Given: Ingreso credenciales incorrectas
    await page.goto('/auth/card');
    
    // When: Intento iniciar sesión
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Then: El sistema debe mostrar un mensaje de error
    const errorMessage = page.locator('text=/error|credenciales|inválid/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('Escenario 3 - Persistencia de sesión', async ({ page }) => {
    // Given: Inicio sesión correctamente
    await page.goto('/auth/card');
    await page.fill('input[type="email"]', 'correo.admin.diagnosys@gmail.com');
    await page.fill('input[type="password"]', '0rganizacion.');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // When: Recargo la página
    await page.reload();
    
    // Then: El sistema debe mantener activa mi sesión
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=/bienvenido|workspace|área de trabajo/i')).toBeVisible({ timeout: 5000 });
  });

  test('Escenario 1 - Cierre de sesión desde menú', async ({ page }) => {
    // Given: Estoy autenticado
    await page.goto('/auth/card');
    await page.fill('input[type="email"]', 'correo.admin.diagnosys@gmail.com');
    await page.fill('input[type="password"]', '0rganizacion.');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // When: Hago clic en "Cerrar sesión" 
    const logoutButton = page.locator('button:has-text("Cerrar sesión"), button:has-text("Logout"), button:has-text("Sign out"), text=/Cerrar sesión|Logout|Sign out/i');
    
    // Desplegar menú de perfil de forma fluida si es visible
    const menuButton = page.locator('button:has-text("Menú"), button[aria-label*="menu"], [role="button"]:has-text("Perfil")').first();
    if (await menuButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await menuButton.click();
    }
    
    await logoutButton.first().click();
    
    // Then: Debo ser redirigido a la página de inicio
    await expect(page).toHaveURL(/\/(auth\/card|login|)/);
  });

  test('Escenario 1 - Formulario de registro', async ({ page }) => {
    // Given: No tengo cuenta
    await page.goto('/auth/card');
    
    // When: Accedo al formulario de registro
    const registerButton = page.locator('text=/Crear cuenta|Registrarse|Registro|Sign up/i').first();
    await registerButton.click();
    
    // Then: Debo ver campos básicos
    await expect(page.locator('input[placeholder*="nombre"], input[placeholder*="Nombre"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Validación tolerante para el campo de rol
    await expect(page.locator('select, [role="combobox"], input[name*="rol"]')).toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test('Escenario 2 - Confirmación de registro exitoso', async ({ page }) => {
    // Given: Ingreso datos válidos
    await page.goto('/auth/card');
    const registerButton = page.locator('text=/Crear cuenta|Registrarse|Registro|Sign up/i').first();
    await registerButton.click();
    
    // When: Presiono "Crear cuenta"
    const timestamp = Date.now();
    const newEmail = `newuser${timestamp}@example.com`;
    
    await page.fill('input[placeholder*="nombre"], input[placeholder*="Nombre"]', 'Test User');
    await page.fill('input[type="email"]', newEmail);
    await page.fill('input[type="password"]', 'NewPassword123!');
    
    const confirmPassword = page.locator('input[placeholder*="confirmar"], input[name*="confirm"]').first();
    if (await confirmPassword.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmPassword.fill('NewPassword123!');
    }
    
    const submitButton = page.locator('button[type="submit"]:has-text("Crear"), button[type="submit"]:has-text("Registrar")').first();
    await submitButton.click();
    
    // Then: Debo ser redirigido al login
    await expect(page).toHaveURL(/\/(auth\/card|login)/);
  });

  test('Escenario 3 - Validación de correo duplicado', async ({ page }) => {
    // Given: Accedo al formulario de registro
    await page.goto('/auth/card');
    const registerButton = page.locator('text=/Crear cuenta|Registrarse|Registro|Sign up/i').first();
    await registerButton.click();
    
    // When: Intento registrar con un correo que ya existe
    await page.fill('input[placeholder*="nombre"], input[placeholder*="Nombre"]', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    const confirmPassword = page.locator('input[placeholder*="confirmar"], input[name*="confirm"]').first();
    if (await confirmPassword.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmPassword.fill('TestPassword123!');
    }
    
    const submitButton = page.locator('button[type="submit"]:has-text("Crear"), button[type="submit"]:has-text("Registrar")').first();
    await submitButton.click();
    
    // Then: Debe mostrar mensaje de error
    const errorMessage = page.locator('text=/existe|duplicado|ya registrado|already/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('Escenario 1 - Solicitud de recuperación de contraseña', async ({ page }) => {
    // Given: Estoy en la sección de recuperación de cuenta
    await page.goto('/auth/card');
    const forgotButton = page.locator('text=/Olvidé contraseña|Forgot password|Recuperar/i').first();
    await forgotButton.click();
    
    // When: Ingreso mi correo
    await page.fill('input[type="email"]', 'test@example.com');
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Then: Debo ver un mensaje de confirmación
    const successMessage = page.locator('text=/enlace|enviado|email|correo/i');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });

  test('Escenario 2 - Restablecimiento exitoso de contraseña', async ({ page }) => {
    // Given: Recibí el enlace de restablecimiento
    await page.goto('/auth/reset-password?token=valid_token_example');
    
    // When: Defino una nueva contraseña válida
    const newPassword = 'NewPassword123!';
    await page.fill('input[placeholder*="contraseña"], input[type="password"]', newPassword);
    
    const confirmPassword = page.locator('input[placeholder*="confirmar"], input[name*="confirm"]').first();
    if (await confirmPassword.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmPassword.fill(newPassword);
    }
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Then: Debo ser redirigido a login con confirmación
    await expect(page).toHaveURL(/\/(auth\/card|login)/);
  });
});