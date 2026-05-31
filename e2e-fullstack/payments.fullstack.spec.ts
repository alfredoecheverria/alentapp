import { test, expect } from '@playwright/test';

test.describe('Payments Full-Stack E2E', () => {

  test('debe mostrar el estado vacío cuando no hay pagos en la DB', async ({ page }) => {
    await page.goto('/payments');
    await expect(page.getByText('No se encontraron pagos.')).toBeVisible({ timeout: 10000 });
  });

  test('debe crear un pago real y mostrarlo en la tabla', async ({ page }) => {
    const uniqueDni = `9${Date.now().toString().slice(-7)}`;
    const memberResponse = await page.request.post('http://localhost:3001/api/v1/socios', {
      data: {
        name: 'Socio Test E2E',
        dni: uniqueDni,
        email: `socio.e2e@alentapp.test`,
        birthdate: '2004-11-10',
        category: 'Cadete'
      }
    });

    expect(memberResponse.status()).toBe(201);
    const member = await memberResponse.json();

    await page.goto('/payments');

    // Abrir modal de creación
    await page.locator('button:has-text("Agregar Pago")').click();
    await expect(page.getByText('Agregar Nuevo Pago')).toBeVisible();

     // Seleccionar el socio creado en el select 
    await page.locator('select').first().selectOption(member.data.id);
    await page.getByText(`Socio Test E2E (${uniqueDni})`);

    // Llenar formulario con datos reales
    await page.getByPlaceholder(/Ej. 100/i).fill('100');
    await page.getByLabel(/Fecha de Vencimiento/i).fill('2026-05-30');
    await page.getByLabel(/Fecha de Pago/i).fill('2026-05-29');
    await page.getByRole('combobox', { name: /Estado del Pago/i }).click();
    await page.getByRole('option', { name: 'Pago', exact: true }).click();
    await page.getByPlaceholder(/Ej. 11/i).fill('5');
    await page.getByPlaceholder(/Ej. 2023/i).fill('2026');


    // Guardar
    await page.getByRole('button', { name: 'Crear Pago' }).click();
    await expect(page.getByRole('button', { name: 'Crear Pago' })).toBeHidden();
    const row = page.getByRole('row').filter({has: page.getByText(member.data.id)});
    await expect(row).toBeVisible();
    await expect(row).toContainText(member.data.id);
    await expect(row).toContainText('100');
    await expect(row).toContainText('5');
    await expect(row).toContainText('2026');
    await expect(row).toContainText('2026-05-30');
    await expect(row).toContainText('2026-05-29');
    await expect(row).toContainText('Pago');
  });
});