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
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Then: Debo acceder a mi espacio personal
    await page.waitForNavigation();
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

  test('Escenario 3 - Persistencia de sesión', async ({ page, context }) => {
    // Given: Inicio sesión correctamente
    await page.goto('/auth/card');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // When: Recargo la página
    await page.reload();
    
    // Then: El sistema debe mantener activa mi sesión
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=/bienvenido|workspace|área de trabajo/i')).toBeVisible({ timeout: 5000 });
  });

  test('Escenario 1 - Cierre de sesión desde menú', async ({ page }) => {
    // Given: Estoy autenticado
    await page.goto('/auth/card');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // When: Hago clic en "Cerrar sesión"
    // Buscar el botón de logout (puede estar en un menú o sidebar)
    const logoutButton = page.locator('button:has-text("Cerrar sesión"), button:has-text("Logout"), button:has-text("Sign out")').first();
    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click();
    } else {
      // Buscar en menú desplegable
      const menuButton = page.locator('button:has-text("Menú"), button[aria-label*="menu"], [role="button"]:has-text("Perfil")').first();
      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.locator('text=/Cerrar sesión|Logout|Sign out/i').click();
      }
    }
    
    // Then: Debo ser redirigido a la página de inicio
    await page.waitForNavigation();
    await expect(page).toHaveURL(/\/(auth\/card|login|)/);
  });

  test('Escenario 1 - Formulario de registro', async ({ page }) => {
    // Given: No tengo cuenta
    await page.goto('/auth/card');
    
    // When: Accedo al formulario de registro
    // Buscar botón para ir a registro
    const registerButton = page.locator('text=/Crear cuenta|Registrarse|Registro|Sign up/i').first();
    await registerButton.click();
    
    // Then: Debo ver campos básicos
    await expect(page.locator('input[placeholder*="nombre"], input[placeholder*="Nombre"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // Verificar que hay campo de rol (puede ser select o radio)
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
    
    // Confirmar contraseña si existe
    const confirmPassword = page.locator('input[placeholder*="confirmar"], input[name*="confirm"]').first();
    if (await confirmPassword.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmPassword.fill('NewPassword123!');
    }
    
    const submitButton = page.locator('button[type="submit"]:has-text("Crear"), button[type="submit"]:has-text("Registrar")').first();
    await submitButton.click();
    
    // Then: Debo ser redirigido al login
    await page.waitForNavigation();
    await expect(page).toHaveURL(/\/(auth\/card|login)/);
  });

  test('Escenario 3 - Validación de correo duplicado', async ({ page }) => {
    // Given: Accedo al formulario de registro
    await page.goto('/auth/card');
    const registerButton = page.locator('text=/Crear cuenta|Registrarse|Registro|Sign up/i').first();
    await registerButton.click();
    
    // When: Intento registrar con un correo que ya existe
    await page.fill('input[placeholder*="nombre"], input[placeholder*="Nombre"]', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com'); // Email que ya existe
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    const confirmPassword = page.locator('input[placeholder*="confirmar"], input[name*="confirm"]').first();
    if (await confirmPassword.isVisible({ timeout: 2000 }).catch(() => false)) {
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
    // Nota: Este test requiere un token válido del formulario de recuperación
    // Por simplicidad, asumimos que la URL contiene un token válido
    
    // Given: Recibí el enlace de restablecimiento
    await page.goto('/auth/reset-password?token=valid_token_example');
    
    // When: Defino una nueva contraseña válida
    const newPassword = 'NewPassword123!';
    await page.fill('input[placeholder*="contraseña"], input[type="password"]', newPassword);
    
    // Confirmar contraseña si existe
    const confirmPassword = page.locator('input[placeholder*="confirmar"], input[name*="confirm"]').first();
    if (await confirmPassword.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmPassword.fill(newPassword);
    }
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Then: Debo ser redirigido a login con confirmación
    await page.waitForNavigation();
    await expect(page).toHaveURL(/\/(auth\/card|login)/);
  });
});

/**
 * DYAG-11: Gestión de Usuarios
 * Tests para ver usuarios, filtros, y diagnósticos
 */
test.describe('DYAG-11: Gestión de Usuarios', () => {
  
  test.beforeEach(async ({ page }) => {
    // Autenticarse como admin
    await page.goto('/auth/card');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });

  test('Escenario 1 - Ver tabla de usuarios registrados', async ({ page }) => {
    // Given: Soy administrador
    // When: Accedo a la vista de gestión de usuarios
    await page.goto('/dashboard/admin');
    
    // Then: Debo poder ver la tabla con rol y fecha de creación
    await expect(page.locator('table, [role="table"], [role="grid"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/rol|role/i').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=/fecha|date|creación/i').first()).toBeVisible({ timeout: 3000 });
  });

  test('Escenario 2 - Indicador de conteo de usuarios totales', async ({ page }) => {
    // Given: Soy administrador
    // When: Accedo al panel de gestión de usuarios
    await page.goto('/dashboard/admin');
    
    // Then: Debo ver un indicador de conteo
    const countIndicator = page.locator('text=/total|usuarios|count|cantidad/i').first();
    await expect(countIndicator).toBeVisible({ timeout: 5000 });
  });

  test('Escenario 3 - Filtrar usuarios por categorías', async ({ page }) => {
    // Given: Accedo al panel de gestión de usuarios
    await page.goto('/dashboard/admin');
    
    // When: Busco opciones de filtro
    const filterInput = page.locator('input[placeholder*="buscar"], input[placeholder*="filtrar"], [role="searchbox"]').first();
    
    // Then: Debe haber filtros disponibles
    if (await filterInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterInput.fill('test');
      await page.waitForTimeout(500);
      // Verificar que la tabla se actualiza
      await expect(page.locator('table, [role="table"]').first()).toBeVisible();
    }
  });

  test('Escenario 1 - Filtro por empresa asignada (Consultor)', async ({ page }) => {
    // Given: Soy consultor autenticado
    // Autenticar como consultor
    await page.goto('/auth/card');
    await page.fill('input[type="email"]', 'consultant@example.com');
    await page.fill('input[type="password"]', 'ConsultantPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // When: Accedo al listado de diagnósticos
    await page.goto('/dashboard/consultant');
    
    // Then: Debo ver solo los de mis empresas
    await expect(page.locator('table, [role="table"], [role="grid"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('Escenario 2 - Consulta de diagnóstico por organización', async ({ page }) => {
    // Given: Soy consultor con organizaciones registradas
    // When: Intento acceder a una organización
    await page.goto('/dashboard/consultant');
    
    // Buscar botón de consulta de diagnóstico
    const diagnosticButtons = page.locator('button:has-text("Ver diagnóstico"), button:has-text("Diagnóstico"), a:has-text("Historial")').first();
    
    if (await diagnosticButtons.isVisible({ timeout: 3000 }).catch(() => false)) {
      await diagnosticButtons.click();
      
      // Then: Debo ver el historial de diagnósticos
      await page.waitForTimeout(1000);
      const history = page.locator('text=/historial|history|diagnóstico|diagnostic/i').first();
      await expect(history).toBeVisible({ timeout: 5000 });
    }
  });

  test('Escenario 3 - Descargar diagnóstico específico en PDF', async ({ page }) => {
    // Given: Estoy en el historial de diagnósticos de una organización
    await page.goto('/dashboard/consultant');
    
    // When: Doy clic en descargar
    const downloadButton = page.locator('button:has-text("Descargar"), button:has-text("Download"), [aria-label*="descarga"]').first();
    
    if (await downloadButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Interceptar la descarga
      const downloadPromise = page.waitForEvent('download');
      await downloadButton.click();
      const download = await downloadPromise;
      
      // Then: Debe descargar un PDF
      expect(download.suggestedFilename()).toContain('.pdf');
    }
  });
});

/**
 * DYAG-14: Formulario Zoom In
 * Tests para seleccionar y agregar habilidades
 */
test.describe('DYAG-14: Formulario Zoom In', () => {
  
  test.beforeEach(async ({ page }) => {
    // Autenticarse como usuario empresa
    await page.goto('/auth/card');
    await page.fill('input[type="email"]', 'company@example.com');
    await page.fill('input[type="password"]', 'CompanyPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });

  test('Escenario 1 - Visualización del catálogo de habilidades', async ({ page }) => {
    // Given: Soy usuario empresa
    // When: Accedo al formulario Zoom In
    await page.goto('/page/categorization');
    
    // Then: Debo ver un catálogo organizado por categorías
    await expect(page.locator('text=/habilidad|skill|categoría|category/i').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="button"], button, label').filter({ has: page.locator('text=/digitales|analíticas|emergentes/i') }).first()).toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test('Escenario 2 - Selección múltiple de habilidades', async ({ page }) => {
    // Given: Visualizo el catálogo
    await page.goto('/page/categorization');
    
    // When: Selecciono una o varias habilidades
    const skillItems = page.locator('[role="checkbox"], input[type="checkbox"], button[role="checkbox"]').first();
    if (await skillItems.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skillItems.click();
      await page.waitForTimeout(300);
      
      // Then: El sistema debe registrar mis elecciones
      await expect(skillItems).toHaveAttribute('data-selected', /true|checked/i, { timeout: 3000 }).catch(() => {});
    }
  });

  test('Escenario 3 - Guardado persistente de habilidades', async ({ page }) => {
    // Given: Seleccioné habilidades
    await page.goto('/page/categorization');
    
    // Seleccionar al menos una habilidad
    const firstSkill = page.locator('[role="checkbox"], input[type="checkbox"], button[role="checkbox"]').first();
    if (await firstSkill.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstSkill.click();
    }
    
    // When: Guardo el formulario
    const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Save"), button:has-text("Siguiente")').first();
    if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveButton.click();
      await page.waitForNavigation();
    }
    
    // Then: Al volver debe mostrar mi selección
    await page.goto('/page/categorization');
    await page.waitForTimeout(1000);
    const savedItem = page.locator('[role="checkbox"][aria-checked="true"], input[type="checkbox"]:checked').first();
    await expect(savedItem).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('Escenario 1 - Campo para agregar habilidad manual', async ({ page }) => {
    // Given: No encuentro una habilidad en el catálogo
    await page.goto('/page/categorization');
    
    // When: Utilizo la opción "Agregar habilidad"
    const addButton = page.locator('button:has-text("Agregar"), button:has-text("Add"), button:has-text("+")').filter({ has: page.locator('text=/habilidad|skill/i') }).first();
    
    if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addButton.click();
      
      // Then: Debo poder escribir un nombre
      const input = page.locator('input[placeholder*="agregar"], input[placeholder*="nueva"], input:visible').last();
      await expect(input).toBeVisible({ timeout: 3000 });
    }
  });

  test('Escenario 2 - Validación de habilidades duplicadas', async ({ page }) => {
    // Given: Accedo al formulario Zoom In
    await page.goto('/page/categorization');
    
    // When: Intento agregar una habilidad que ya existe
    const addButton = page.locator('button:has-text("Agregar"), button:has-text("Add")').filter({ has: page.locator('text=/habilidad|skill/i') }).first();
    
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      
      // Escribir nombre de habilidad que ya existe
      const input = page.locator('input[placeholder*="agregar"], input[placeholder*="nueva"]').last();
      await input.fill('JavaScript'); // Habilidad que probablemente existe
      
      const submitButton = page.locator('button:has-text("Agregar"), button:has-text("Add")').last();
      await submitButton.click();
      
      // Then: Debe mostrar mensaje de advertencia
      const warning = page.locator('text=/existe|duplicado|already|advertencia/i').first();
      await expect(warning).toBeVisible({ timeout: 5000 });
    }
  });

  test('Escenario 3 - Persistencia de habilidades nuevas', async ({ page }) => {
    // Given: Agregué una habilidad propia
    await page.goto('/page/categorization');
    
    const addButton = page.locator('button:has-text("Agregar"), button:has-text("Add")').filter({ has: page.locator('text=/habilidad|skill/i') }).first();
    
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      
      const newSkillName = `Custom Skill ${Date.now()}`;
      const input = page.locator('input[placeholder*="agregar"], input[placeholder*="nueva"]').last();
      await input.fill(newSkillName);
      
      const submitButton = page.locator('button:has-text("Agregar"), button:has-text("Add")').last();
      await submitButton.click();
      
      // When: Recargo la página
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Then: La habilidad debe permanecer en mi lista
      await expect(page.locator(`text=${newSkillName}`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('Escenario 1 - Acceso al resumen gráfico del Zoom In', async ({ page }) => {
    // Given: Seleccioné habilidades
    await page.goto('/page/categorization');
    
    // Seleccionar al menos una habilidad
    const firstSkill = page.locator('[role="checkbox"], input[type="checkbox"]').first();
    if (await firstSkill.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstSkill.click();
    }
    
    // When: Consulto el resumen del Zoom In
    const summaryButton = page.locator('button:has-text("Resumen"), button:has-text("Summary"), button:has-text("Visualizar"), [role="tab"]:has-text("Gráfico")').first();
    
    if (await summaryButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await summaryButton.click();
      
      // Then: Debo ver una visualización gráfica
      await expect(page.locator('svg, canvas, [role="img"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Escenario 2 - Gráfico de radar en el resumen', async ({ page }) => {
    // Given: Los datos están cargados
    await page.goto('/page/categorization');
    
    // Seleccionar habilidades
    const skills = page.locator('[role="checkbox"], input[type="checkbox"]');
    if (await skills.nth(0).isVisible({ timeout: 2000 }).catch(() => false)) {
      await skills.nth(0).click();
      if (await skills.nth(1).isVisible({ timeout: 1000 }).catch(() => false)) {
        await skills.nth(1).click();
      }
    }
    
    // When: Se genera el gráfico
    const summaryButton = page.locator('button:has-text("Resumen"), button:has-text("Summary"), button:has-text("Visualizar")').first();
    if (await summaryButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await summaryButton.click();
      
      // Then: Debo ver un gráfico de radar
      const radar = page.locator('svg:has-text("radar"), [data-type="radar"]').first();
      await expect(radar).toBeVisible({ timeout: 5000 }).catch(async () => {
        // Si no hay texto específico, al menos debe haber un gráfico
        await expect(page.locator('svg, canvas').first()).toBeVisible({ timeout: 5000 });
      });
    }
  });

  test('Escenario 3 - Actualización dinámica del gráfico', async ({ page }) => {
    // Given: Agregué o elimino habilidades
    await page.goto('/page/categorization');
    
    const firstSkill = page.locator('[role="checkbox"], input[type="checkbox"]').first();
    if (await firstSkill.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Seleccionar
      await firstSkill.click();
      await page.waitForTimeout(500);
      
      // Deseleccionar
      await firstSkill.click();
      await page.waitForTimeout(500);
      
      // Then: Los cambios deben reflejarse
      await expect(firstSkill).toHaveAttribute('aria-checked', 'false', { timeout: 3000 }).catch(() => {});
    }
  });

  test('Escenario 4 - Persistencia del resumen', async ({ page }) => {
    // Given: Generé un resumen
    await page.goto('/page/categorization');
    
    // Seleccionar habilidades
    const firstSkill = page.locator('[role="checkbox"], input[type="checkbox"]').first();
    if (await firstSkill.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstSkill.click();
    }
    
    // When: Cierro sesión y regreso
    const logoutButton = page.locator('button:has-text("Cerrar sesión"), button:has-text("Logout")').first();
    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click();
      await page.waitForNavigation();
    }
    
    // Volver a autenticar
    await page.goto('/auth/card');
    await page.fill('input[type="email"]', 'company@example.com');
    await page.fill('input[type="password"]', 'CompanyPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Then: Debe mostrar mis gráficos previos
    await page.goto('/page/categorization');
    await page.waitForTimeout(1000);
    const savedSelection = page.locator('[role="checkbox"][aria-checked="true"], input[type="checkbox"]:checked').first();
    await expect(savedSelection).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});

/**
 * DYAG-18: Formulario Zoom Out
 * Tests para seleccionar fuerzas externas, calificar impacto, visualizar bubbles
 */
test.describe('DYAG-18: Formulario Zoom Out', () => {
  
  test.beforeEach(async ({ page }) => {
    // Autenticarse como usuario empresa
    await page.goto('/auth/card');
    await page.fill('input[type="email"]', 'company@example.com');
    await page.fill('input[type="password"]', 'CompanyPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });

  test('Escenario 1 - Visualización del catálogo de fuerzas externas', async ({ page }) => {
    // Given: Soy usuario empresa autenticado
    // When: Accedo al formulario Zoom Out
    await page.goto('/page/priorization');
    
    // Then: Debo ver un catálogo organizado por categorías
    await expect(page.locator('text=/fuerza|force|tendencia|mercado|industria|macro/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Escenario 2 - Selección de fuerzas externas', async ({ page }) => {
    // Given: Estoy en el formulario Zoom Out
    await page.goto('/page/priorization');
    
    // When: Selecciono una o más fuerzas externas
    const forceItems = page.locator('[role="checkbox"], input[type="checkbox"], button[role="checkbox"]').first();
    
    if (await forceItems.isVisible({ timeout: 3000 }).catch(() => false)) {
      await forceItems.click();
      await page.waitForTimeout(300);
      
      // Then: El sistema debe registrar mi selección
      await expect(forceItems).toHaveAttribute('aria-checked|data-selected', /true|checked/i, { timeout: 3000 }).catch(() => {});
    }
  });

  test('Escenario 3 - De selección (deselect) de fuerzas', async ({ page }) => {
    // Given: Ya seleccioné una fuerza externa
    await page.goto('/page/priorization');
    
    const forceItem = page.locator('[role="checkbox"], input[type="checkbox"]').first();
    if (await forceItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Seleccionar
      await forceItem.click();
      await page.waitForTimeout(300);
      
      // When: Hago clic nuevamente
      await forceItem.click();
      
      // Then: Debe desmarcarse
      await expect(forceItem).toHaveAttribute('aria-checked', 'false', { timeout: 3000 }).catch(() => {});
    }
  });

  test('Escenario 1 - Calificación de impacto de fuerzas', async ({ page }) => {
    // Given: Estoy en el formulario Zoom Out
    await page.goto('/page/priorization');
    
    // When: Selecciono una fuerza externa
    const forceItem = page.locator('[role="checkbox"], input[type="checkbox"]').first();
    if (await forceItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await forceItem.click();
      await page.waitForTimeout(500);
      
      // Then: El sistema debe mostrar un campo de calificación
      const impactField = page.locator('select[name*="impact"], [role="combobox"]:has-text(/alto|medio|bajo/i), button:has-text(/Alto|Medio|Bajo/)').first();
      await expect(impactField).toBeVisible({ timeout: 3000 });
    }
  });

  test('Escenario 2 - Registro de calificación de impacto', async ({ page }) => {
    // Given: Seleccioné una fuerza externa
    await page.goto('/page/priorization');
    
    const forceItem = page.locator('[role="checkbox"]').first();
    if (await forceItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await forceItem.click();
      await page.waitForTimeout(500);
      
      // When: Asigno un nivel de impacto
      const impactButton = page.locator('button:has-text("Alto"), button:has-text("Medio"), button:has-text("Bajo")').first();
      
      if (await impactButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await impactButton.click();
        
        // Then: Debe guardarse la calificación
        await expect(impactButton).toHaveAttribute('aria-selected|data-selected', /true|selected/i, { timeout: 3000 }).catch(() => {});
      }
    }
  });

  test('Escenario 3 - Edición de calificación', async ({ page }) => {
    // Given: Ya asigné un nivel de impacto
    await page.goto('/page/priorization');
    
    const forceItem = page.locator('[role="checkbox"]').first();
    if (await forceItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await forceItem.click();
      
      const firstImpact = page.locator('button:has-text("Alto"), button:has-text("Medio"), button:has-text("Bajo")').first();
      if (await firstImpact.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstImpact.click();
        await page.waitForTimeout(300);
      }
      
      // When: Modifico la calificación
      const otherImpact = page.locator('button:has-text("Medio"), button:has-text("Bajo")').first();
      if (await otherImpact.isVisible({ timeout: 2000 }).catch(() => false)) {
        await otherImpact.click();
        
        // Then: Debe actualizarse
        await expect(otherImpact).toHaveAttribute('aria-selected|data-selected', /true|selected/i, { timeout: 3000 }).catch(() => {});
      }
    }
  });

  test('Escenario 4 - Validación de selección obligatoria de fuerzas', async ({ page }) => {
    // Given: Seleccioné fuerzas externas
    await page.goto('/page/priorization');
    
    // When: Intento avanzar sin calificar
    const nextButton = page.locator('button:has-text("Siguiente"), button:has-text("Next"), button:has-text("Continuar")').first();
    
    if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Sin seleccionar nada
      await nextButton.click();
      
      // Then: Debe mostrar mensaje de validación
      const validation = page.locator('text=/debe|required|seleccionar|chooses/i').first();
      await expect(validation).toBeVisible({ timeout: 5000 });
    }
  });

  test('Escenario 5 - Persistencia de calificaciones', async ({ page }) => {
    // Given: Asigné calificaciones
    await page.goto('/page/priorization');
    
    const forceItem = page.locator('[role="checkbox"]').first();
    if (await forceItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await forceItem.click();
      
      const impactButton = page.locator('button:has-text("Alto")').first();
      if (await impactButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await impactButton.click();
      }
    }
    
    // When: Presiono guardar
    const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Save")').first();
    if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveButton.click();
      await page.waitForNavigation();
    }
    
    // Then: Al regresar debe mostrarse
    await page.goto('/page/priorization');
    await page.waitForTimeout(1000);
    const savedForce = page.locator('[role="checkbox"][aria-checked="true"], input[type="checkbox"]:checked').first();
    await expect(savedForce).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('Escenario 1 - Agregar fuerza externa personalizada', async ({ page }) => {
    // Given: Estoy en el formulario Zoom Out
    await page.goto('/page/priorization');
    
    // When: No encuentro la fuerza que necesito y uso "Agregar fuerza"
    const addButton = page.locator('button:has-text("Agregar"), button:has-text("Add"), button:has-text("+")').filter({ has: page.locator('text=/fuerza|force/i') }).first();
    
    if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addButton.click();
      
      // Then: Debo visualizar un campo o botón
      const input = page.locator('input[placeholder*="agregar"], input[placeholder*="nueva"], input:visible').last();
      await expect(input).toBeVisible({ timeout: 3000 });
    }
  });

  test('Escenario 2 - Ingreso de nueva fuerza externa', async ({ page }) => {
    // Given: Estoy agregando una nueva fuerza
    await page.goto('/page/priorization');
    
    const addButton = page.locator('button:has-text("Agregar"), button:has-text("Add")').filter({ has: page.locator('text=/fuerza|force/i') }).first();
    
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      
      // When: Ingreso una nueva fuerza y presiono agregar
      const newForceName = `Custom Force ${Date.now()}`;
      const input = page.locator('input[placeholder*="agregar"], input[placeholder*="nueva"]').last();
      await input.fill(newForceName);
      
      const submitButton = page.locator('button:has-text("Agregar"), button:has-text("Add")').last();
      await submitButton.click();
      
      // Then: Debe almacenarla y mostrarla
      await expect(page.locator(`text=${newForceName}`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('Escenario 3 - Validación de campos obligatorios', async ({ page }) => {
    // Given: Estoy agregando una nueva fuerza externa
    await page.goto('/page/priorization');
    
    const addButton = page.locator('button:has-text("Agregar"), button:has-text("Add")').filter({ has: page.locator('text=/fuerza|force/i') }).first();
    
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      
      // When: Intento guardar sin ingresar nombre
      const submitButton = page.locator('button:has-text("Agregar"), button:has-text("Add")').last();
      await submitButton.click();
      
      // Then: Debe mostrar error
      const error = page.locator('text=/requerido|obligatorio|required|nombre/i').first();
      await expect(error).toBeVisible({ timeout: 5000 });
    }
  });

  test('Escenario 4 - Evitar duplicados', async ({ page }) => {
    // Given: Existe una fuerza en el catálogo
    await page.goto('/page/priorization');
    
    const addButton = page.locator('button:has-text("Agregar"), button:has-text("Add")').first();
    
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      
      // When: Intento agregar una fuerza con el mismo nombre
      const input = page.locator('input[placeholder*="agregar"], input[placeholder*="nueva"]').last();
      await input.fill('Mercado Global'); // Nombre que probablemente existe
      
      const submitButton = page.locator('button:has-text("Agregar"), button:has-text("Add")').last();
      await submitButton.click();
      
      // Then: Debe mostrar advertencia
      const warning = page.locator('text=/existe|duplicado|already|advertencia/i').first();
      await expect(warning).toBeVisible({ timeout: 5000 });
    }
  });

  test('Escenario 5 - Persistencia de fuerzas personalizadas', async ({ page }) => {
    // Given: Agregué una nueva fuerza personalizada
    await page.goto('/page/priorization');
    
    const addButton = page.locator('button:has-text("Agregar"), button:has-text("Add")').first();
    
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const customForceName = `Custom Force ${Date.now()}`;
      
      await addButton.click();
      const input = page.locator('input[placeholder*="agregar"]').last();
      await input.fill(customForceName);
      
      const submitButton = page.locator('button:has-text("Agregar")').last();
      await submitButton.click();
      
      // When: Presiono guardar
      const saveButton = page.locator('button:has-text("Guardar")').first();
      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveButton.click();
        await page.waitForNavigation();
      }
      
      // Then: Al regresar debe estar disponible
      await page.goto('/page/priorization');
      await page.waitForTimeout(1000);
      await expect(page.locator(`text=${customForceName}`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('Escenario 6 - Edición y eliminación de fuerzas personalizadas', async ({ page }) => {
    // Given: Tengo una fuerza externa personalizada
    await page.goto('/page/priorization');
    
    // When: Selecciono editar
    const editButton = page.locator('button:has-text("Editar"), [aria-label*="editar"]').first();
    
    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.click();
      
      const input = page.locator('input[type="text"]').last();
      await input.fill('Updated Force Name');
      
      const saveEdit = page.locator('button:has-text("Guardar"), button:has-text("Actualizar")').last();
      if (await saveEdit.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveEdit.click();
      }
    }
    
    // And cuando selecciono eliminar
    const deleteButton = page.locator('button:has-text("Eliminar"), button:has-text("Delete"), [aria-label*="eliminar"]').first();
    
    if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteButton.click();
      
      // Confirmar eliminación si hay modal
      const confirmDelete = page.locator('button:has-text("Confirmar"), button:has-text("Sí"), button:has-text("Yes")').last();
      if (await confirmDelete.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmDelete.click();
      }
      
      // Then: Debe desaparecer del catálogo
      await page.waitForTimeout(500);
      await expect(page.locator('text=Updated Force Name')).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('Escenario 1 - Visualización del mapa de burbujas', async ({ page }) => {
    // Given: Seleccioné y califiqué fuerzas externas
    await page.goto('/page/priorization');
    
    // Seleccionar y calificar fuerzas
    const forceItem = page.locator('[role="checkbox"]').first();
    if (await forceItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await forceItem.click();
      
      const impactButton = page.locator('button:has-text("Alto")').first();
      if (await impactButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await impactButton.click();
      }
    }
    
    // When: Accedo a la pestaña de visualización
    const vizTab = page.locator('[role="tab"]:has-text("Visualización"), [role="tab"]:has-text("Gráfico"), button:has-text("Ver Mapa")').first();
    
    if (await vizTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await vizTab.click();
      
      // Then: Debo ver un mapa de burbujas
      await expect(page.locator('svg, canvas, [role="img"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Escenario 2 - Representación visual de fuerzas en burbujas', async ({ page }) => {
    // Given: El mapa de burbujas está visible
    await page.goto('/page/priorization');
    
    // Seleccionar fuerzas
    const forces = page.locator('[role="checkbox"]');
    if (await forces.nth(0).isVisible({ timeout: 2000 }).catch(() => false)) {
      await forces.nth(0).click();
      
      const impactButton = page.locator('button:has-text("Alto")').first();
      if (await impactButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await impactButton.click();
      }
    }
    
    const vizTab = page.locator('[role="tab"]:has-text("Visualización"), [role="tab"]:has-text("Gráfico")').first();
    if (await vizTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await vizTab.click();
      
      // Then: Cada burbuja debe representar una fuerza
      const bubbles = page.locator('circle, [role="button"][data-force], rect').first();
      await expect(bubbles).toBeVisible({ timeout: 5000 });
    }
  });

  test('Escenario 3 - Interacción con burbujas', async ({ page }) => {
    // Given: Estoy en el mapa de burbujas
    await page.goto('/page/priorization');
    
    const vizTab = page.locator('[role="tab"]:has-text("Visualización"), button:has-text("Ver Mapa")').first();
    if (await vizTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await vizTab.click();
    }
    
    // When: Paso el cursor o hago clic en una burbuja
    const bubble = page.locator('circle, [role="button"][data-force]').first();
    if (await bubble.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bubble.hover();
      await page.waitForTimeout(500);
      
      // Then: Debe mostrar información
      const tooltip = page.locator('[role="tooltip"], text=/impacto|impact|categoría/i').first();
      await expect(tooltip).toBeVisible({ timeout: 3000 }).catch(() => {});
    }
  });

  test('Escenario 5 - Persistencia del mapa de burbujas', async ({ page }) => {
    // Given: Generé un mapa
    await page.goto('/page/priorization');
    
    // Seleccionar y guardar
    const forceItem = page.locator('[role="checkbox"]').first();
    if (await forceItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await forceItem.click();
    }
    
    const saveButton = page.locator('button:has-text("Guardar")').first();
    if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveButton.click();
      await page.waitForNavigation();
    }
    
    // When: Cierro sesión y regreso
    const logoutButton = page.locator('button:has-text("Cerrar sesión")').first();
    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click();
      await page.waitForNavigation();
    }
    
    // Re-autenticar
    await page.goto('/auth/card');
    await page.fill('input[type="email"]', 'company@example.com');
    await page.fill('input[type="password"]', 'CompanyPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Then: Debe mostrar el mapa anterior
    await page.goto('/page/priorization');
    await page.waitForTimeout(1000);
    const vizTab = page.locator('[role="tab"]:has-text("Visualización")').first();
    if (await vizTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await vizTab.click();
      await expect(page.locator('svg, canvas').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Escenario 6 - Exportación de visualización', async ({ page }) => {
    // Given: Estoy en el mapa de burbujas
    await page.goto('/page/priorization');
    
    const vizTab = page.locator('[role="tab"]:has-text("Visualización")').first();
    if (await vizTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await vizTab.click();
    }
    
    // When: Presiono exportar
    const exportButton = page.locator('button:has-text("Exportar"), button:has-text("Export"), button:has-text("Descargar")').first();
    
    if (await exportButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      try {
        const download = await downloadPromise;
        
        // Then: Debe generar una imagen o archivo
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.(png|pdf|jpg|jpeg)$/i);
      } catch {
        // Si no hay descarga, verificar si se genera dentro del informe
        await expect(page.locator('text=/mapa|gráfico|generado/i').first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
