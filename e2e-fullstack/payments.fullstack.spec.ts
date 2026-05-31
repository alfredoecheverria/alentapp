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

  test('debe editar el pago creado y ver los cambios en la tabla', async ({ page }) => {
    await page.goto('/payments');

    // 1. Filtrar e identificar la fila del pago creado anteriormente (Buscamos la fila que contiene el monto '100')
    const row = page.getByRole('row').filter({ has: page.getByText('100') });
    await expect(row).toBeVisible({ timeout: 10000 });

    // 2. Hacer clic en el botón de Editar (IconButton con aria-label="Editar pago")
    await row.getByRole('button', { name: /Editar pago/i }).click();

    // 3. Verificar que el modal cambie su título dinámicamente a "Editar Pago"
    await expect(page.getByText('Editar Pago')).toBeVisible();

    // 4. Modificar los campos del formulario utilizando el orden de inputs del Frontend
    // Cambiamos el Monto de 100 a 150 (Primer input de tipo número: índice 0)
    await page.locator('input[type="number"]').nth(0).fill('150');

    // Cambiamos el Mes de 5 a 6 (Segundo input de tipo número: índice 1)
    await page.locator('input[type="number"]').nth(1).fill('6');

    // Nota: Mantenemos el año en 2026 para que no rompa las validaciones de rango temporal de tu Backend

    // 5. Enviar el formulario haciendo clic en "Actualizar Pago"
    await page.getByRole('button', { name: 'Actualizar Pago' }).click();

    // 6. Asegurar que el modal se cierre correctamente
    await expect(page.getByRole('button', { name: 'Actualizar Pago' })).toBeHidden();

    // 7. Aserciones finales: Validar que la fila se haya actualizado en la tabla real
    const updatedRow = page.getByRole('row').filter({ has: page.getByText('150') });
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow).toContainText('150'); // Nuevo Monto
    await expect(updatedRow).toContainText('6');   // Nuevo Mes
    await expect(updatedRow).toContainText('2026');
    
    // Verificamos que los datos viejos ('100' y mes '5') ya no existan en esa fila exacta
    await expect(updatedRow.getByText('100', { exact: true })).toBeHidden();
  });
});