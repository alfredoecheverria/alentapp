import { test, expect } from '@playwright/test';

/**
 * Tests E2E Full-Stack para la vista de Lockers.
 * NO hay ningún mock de red. Playwright interactúa con:
 *   - El Frontend React en http://localhost:5173
 *   - La API Fastify real en http://localhost:3001
 *   - La base de datos PostgreSQL de test (alentapp_test_db)
 *
 * El global-setup se encarga de limpiar la DB antes de correr la suite,
 * por lo que cada test empieza desde un estado conocido y limpio.
 */

test.describe('Lockers Full-Stack E2E', () => {

  test('debe mostrar el estado vacío cuando no hay lockers en la DB', async ({ page }) => {
    await page.goto('/lockers');
    await expect(page.getByText('No se encontraron lockers.')).toBeVisible({ timeout: 10000 });
  });

  test('debe crear un locker real y mostrarlo en la tabla', async ({ page }) => {
    await page.goto('/lockers');

    // Abrir dialog de creación
    await page.locator('button:has-text("Agregar Locker")').click();
    await expect(page.getByText('Agregar Nuevo Locker')).toBeVisible();

    // Llenar formulario con datos reales
    await page.getByLabel('Número').fill('12');
    await page.getByPlaceholder('Ej. Natatorio').fill('Sector Norte');

    // Guardar
    await page.getByRole('button', { name: 'Agregar Locker' }).last().click();

    // Esperar que el dialog se cierre y el locker aparezca en la tabla real
    await expect(page.getByText('Agregar Nuevo Locker')).toBeHidden();
    await expect(page.getByText('12')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Sector Norte')).toBeVisible();
    await expect(page.getByText('Available', { exact: true })).toBeVisible();
    await expect(page.getByText('Sin asignar')).toBeVisible();
  });

  test('debe editar un locker real y ver el cambio en la tabla', async ({ page }) => {
    await page.goto('/lockers');

    // Crear un locker real para editarlo luego
    await page.locator('button:has-text("Agregar Locker")').click();
    await expect(page.getByText('Agregar Nuevo Locker')).toBeVisible();

    await page.getByLabel('Número').fill('21');
    await page.getByPlaceholder('Ej. Natatorio').fill('Sector Sur');
    await page.getByRole('button', { name: 'Agregar Locker' }).last().click();

    await expect(page.getByText('21')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Sector Sur')).toBeVisible();

    // Abrir el modal de edición de la fila del locker recién creado
    await page.locator('tr', { hasText: '21' }).getByLabel('Editar locker').click();
    await expect(page.getByText('Editar Locker')).toBeVisible();

    // Cambiar datos visibles
    await page.getByLabel('Número').fill('22');
    await page.getByPlaceholder('Ej. Natatorio').fill('Sector Este');

    // Guardar los cambios
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    // Verificar que el cambio quedó visible en la tabla
    await expect(page.getByText('22')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Sector Este')).toBeVisible();
    await expect(page.getByText('Sector Sur')).toBeHidden();
  });


  test('debe eliminar el locker creado y remover su fila', async ({ page }) => {
    await page.goto('/lockers');

    // Crear un locker real para eliminarlo luego
    await page.locator('button:has-text("Agregar Locker")').click();
    await expect(page.getByText('Agregar Nuevo Locker')).toBeVisible();

    await page.getByLabel('Número').fill('31');
    await page.getByPlaceholder('Ej. Natatorio').fill('Zona Borrado');
    await page.getByRole('button', { name: 'Agregar Locker' }).last().click();

    await expect(page.getByText('31')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Zona Borrado')).toBeVisible();

    // Aceptar el confirm del navegador automáticamente
    page.on('dialog', (dialog) => dialog.accept());

    // Eliminar el locker recién creado
    await page.locator('tr', { hasText: '31' }).getByLabel('Eliminar locker').click();

    // Verificar que la fila eliminada ya no exista
    await expect(page.locator('tr', { hasText: '31' })).toHaveCount(0);
    await expect(page.getByText('Zona Borrado')).toHaveCount(0);
  });
  
});