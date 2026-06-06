import { test, expect } from '@playwright/test';

test.describe('Payments Full-Stack E2E', () => {
  let createdMemberIds: string[] = [];

  test.afterEach(async ({ request }) => {
    const deletePromises = createdMemberIds.map(id =>
      request.delete(`http://localhost:3001/api/v1/socios/${id}`)
    );
    await Promise.all(deletePromises);
    createdMemberIds = [];
  });

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
        email: `socio.create.${uniqueDni}@alentapp.test`,
        birthdate: '2004-11-10',
        category: 'Cadete'
      }
    });
    expect(memberResponse.status()).toBe(201);
    const member = await memberResponse.json();
    createdMemberIds.push(member.data.id);

    await page.goto('/payments');

    await page.locator('button:has-text("Agregar Pago")').click();
    await expect(page.getByText('Agregar Nuevo Pago')).toBeVisible();

    await page.locator('select').first().selectOption(member.data.id);
    await page.getByText(`Socio Test E2E (${uniqueDni})`);

    await page.getByPlaceholder(/Ej. 1000/i).fill('100');
    await page.getByLabel(/Fecha de Vencimiento/i).fill('2026-05-30');
    await page.getByLabel(/Fecha de Pago/i).fill('2026-05-29');
    await page.getByRole('combobox', { name: /Estado del Pago/i }).click();
    await page.getByRole('option', { name: 'Pago', exact: true }).click();
    await page.getByPlaceholder(/Ej. 11/i).fill('5');
    await page.getByPlaceholder(/Ej. 2023/i).fill('2026');

    await page.getByRole('button', { name: 'Crear Pago' }).click();
    await expect(page.getByRole('button', { name: 'Crear Pago' })).toBeHidden();

    const row = page.getByRole('row').filter({ has: page.getByText(member.data.id) });
    await expect(row).toBeVisible();
    await expect(row).toContainText(member.data.id);
    await expect(row).toContainText('100');
    await expect(row).toContainText('5');
    await expect(row).toContainText('2026');
    await expect(row).toContainText('2026-05-30');
    await expect(row).toContainText('2026-05-29');
    await expect(row).toContainText('Pago');
  });

  test('debe editar el pago creado y ver los cambios en la tabla', async ({ page }) => {
    const uniqueDniForUpdate = `8${Date.now().toString().slice(-7)}`;

    const memberResponse = await page.request.post('http://localhost:3001/api/v1/socios', {
      data: {
        name: 'Socio Update E2E',
        dni: uniqueDniForUpdate,
        email: `socio.update.${uniqueDniForUpdate}@alentapp.test`,
        birthdate: '1995-04-12',
        category: 'Pleno'
      }
    });
    const member = await memberResponse.json();
    createdMemberIds.push(member.data.id);

    const paymentResponse = await page.request.post('http://localhost:3001/api/v1/payments', {
      data: {
        member_id: member.data.id,
        amount: 100,
        due_date: '2026-05-30',
        payment_date: '2026-05-29',
        status: 'Pago',
        month: 5,
        year: 2026
      }
    });
    expect(paymentResponse.status()).toBe(201);

    await page.goto('/payments');
    const row = page.getByRole('row').filter({ has: page.getByText(member.data.id) });
    await expect(row).toBeVisible({ timeout: 10000 });

    await row.getByRole('button', { name: /Editar pago/i }).click();
    await expect(page.getByText('Editar Pago')).toBeVisible();

    await expect(page.getByPlaceholder(/Ej. 1000/i)).toHaveValue('100');
    await page.getByPlaceholder(/Ej. 1000/i).fill('150');
    await page.getByLabel(/Fecha de Pago/i).fill('2026-05-27');

    await page.getByRole('button', { name: 'Actualizar Pago' }).click();
    await expect(page.getByRole('button', { name: 'Actualizar Pago' })).toBeHidden();

    const updatedRow = page.getByRole('row').filter({ has: page.getByText(member.data.id) });
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow).toContainText('150');
    await expect(updatedRow).toContainText('2026-05-27');
    await expect(updatedRow).toContainText('5');

    await expect(updatedRow.getByText('100', { exact: true })).toBeHidden();
  });

  test('debe cancelar un pago y ver el estado Cancelado en la tabla', async ({ page }) => {
    const uniqueDni = `7${Date.now().toString().slice(-7)}`;

    const memberResponse = await page.request.post('http://localhost:3001/api/v1/socios', {
      data: {
        name: 'Socio Delete E2E',
        dni: uniqueDni,
        email: `socio.delete.${uniqueDni}@alentapp.test`,
        birthdate: '1990-03-15',
        category: 'Pleno'
      }
    });
    const member = await memberResponse.json();
    createdMemberIds.push(member.data.id);

    const paymentResponse = await page.request.post('http://localhost:3001/api/v1/payments', {
      data: {
        member_id: member.data.id,
        amount: 200,
        due_date: '2026-05-30',
        payment_date: '2026-05-29',
        status: 'Pago',
        month: 5,
        year: 2026
      }
    });
    expect(paymentResponse.status()).toBe(201);

    await page.goto('/payments');

    const row = page.getByRole('row').filter({ has: page.getByText(member.data.id) });
    await expect(row).toBeVisible({ timeout: 10000 });

    page.on('dialog', async (dialog) => await dialog.accept());

    await row.getByRole('button', { name: /Eliminar pago/i }).click();

    const cancelledRow = page.getByRole('row').filter({ has: page.getByText(member.data.id) });
    await expect(cancelledRow).toBeVisible({ timeout: 10000 });
    await expect(cancelledRow).toContainText('Cancelado');
  });
});