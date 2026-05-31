import { test, expect } from '@playwright/test';

test.describe('Equipment Loans Full-Stack E2E', () => {

  test('debe mostrar el estado vacío cuando no hay préstamos en la DB', async ({ page }) => {
    await page.goto('/equipment-loans');
    await expect(page.getByText('No hay préstamos registrados actualmente.')).toBeVisible({ timeout: 10000 });
  });

  test('debe crear un préstamo de equipo real y mostrarlo en la tabla', async ({ page }) => {
    
    const uniqueDni = `9${Date.now().toString().slice(-7)}`;
    const memberResponse = await page.request.post('http://localhost:3001/api/v1/socios', {
      data: {
        name: 'Socio Test E2E',
        dni: uniqueDni,
        email: `socio.e2e@alentapp.test`,
        birthdate: '2004-11-10',
        category: 'Pleno'
      }
    });

    expect(memberResponse.status()).toBe(201);
    const member = await memberResponse.json();


    await page.goto('/equipment-loans');
    await page.locator('button:has-text("Registrar Préstamo")').click();
    await expect(page.getByText('Registrar Nuevo Préstamo')).toBeVisible();

    const selectSelector = page.locator('select').first();
    await selectSelector.waitFor({ state: 'visible' });
    
    await page.locator('select').first().selectOption(member.data.id);
    await page.getByText(`Socio Test E2E (${uniqueDni})`)

    await page.getByPlaceholder(/Nombre del equipo/i).fill('Pelota de Futbol');
    await page.getByLabel(/Fecha de Préstamo/i).fill('2026-06-01');
    await page.getByLabel(/Fecha de Devolución Estimada/i).fill('2026-06-10');
    

    await page.getByRole('button', { name: 'Confirmar Préstamo' }).click();
    await expect(page.getByRole('button', { name: 'Confirmar Préstamo' })).toBeHidden();

  
    const row = page.getByRole('row').filter({ has: page.getByText('Socio Test E2E') });
    await expect(row).toBeVisible();
    
    await expect(row).toContainText('Socio Test E2E');
    await expect(row).toContainText('Pelota de Futbol');
    await expect(row).toContainText('2026-06-01');
    await expect(row).toContainText('2026-06-10');
    await expect(row).toContainText('Prestado');
  });
});