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
});