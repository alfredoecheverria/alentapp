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

  test('debe editar un préstamo existente y reflejar los cambios en la tabla', async ({ page }) => {
    const uniqueDni = `8${Date.now().toString().slice(-7)}`;
    
    // 1. Pre-creamos el socio necesario para el flujo
    const memberResponse = await page.request.post('http://localhost:3001/api/v1/socios', {
      data: {
        name: 'Socio Update E2E',
        dni: uniqueDni,
        email: `update.e2e@alentapp.test`,
        birthdate: '1998-03-20',
        category: 'Pleno'
      }
    });
    expect(memberResponse.status()).toBe(201);
    const member = await memberResponse.json();

    // 2. Nos posicionamos en la vista e insertamos un registro inicial para poder editarlo
    await page.goto('/equipment-loans');
    await page.locator('button:has-text("Registrar Préstamo")').click();
    
    const selectSelector = page.locator('select').first();
    await selectSelector.waitFor({ state: 'visible' });
    await selectSelector.selectOption(member.data.id);

    await page.getByPlaceholder(/Nombre del equipo/i).fill('Raqueta vieja');
    await page.getByLabel(/Fecha de Préstamo/i).fill('2026-06-01');
    await page.getByLabel(/Fecha de Devolución Estimada/i).fill('2026-06-10');
    await page.getByRole('button', { name: 'Confirmar Préstamo' }).click();
    
    // 3. Localizamos la fila recién creada mediante el filtro de texto único del socio
    const row = page.getByRole('row').filter({ has: page.getByText('Socio Update E2E') });
    await expect(row).toBeVisible();

    // 4. Hacemos click en el IconButton de edición (LuPencil) dentro de esa fila específica
    // Tu componente usa un IconButton con aria-label="Editar"
    await row.getByRole('button', { name: 'Editar' }).click();

    // 5. Verificamos que el modal se transicione al estado de edición de Chakra UI
    await expect(page.getByText('Editar Préstamo')).toBeVisible();

    // 6. Modificamos los campos del formulario
    await page.getByPlaceholder(/Nombre del equipo/i).fill('Raqueta de Tenis Pro');
    await page.getByLabel(/Fecha de Préstamo/i).fill('2026-06-02');
    await page.getByLabel(/Fecha de Devolución Estimada/i).fill('2026-06-15');

    // Como ahora editingLoanId es verdadero, el select de estado está disponible. 
    // Es el segundo select del formulario (el primero es el del socio).
    const statusSelect = page.locator('select').nth(1);
    await statusSelect.selectOption('Returned'); // Lo cambiamos a "Devuelto"

    // 7. Guardamos los cambios
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(page.getByRole('button', { name: 'Guardar Cambios' })).toBeHidden();

    // 8. Evaluamos que la fila se haya actualizado en tiempo real en la tabla de Chakra UI
    await expect(row).toBeVisible();
    await expect(row).toContainText('Socio Update E2E');
    await expect(row).toContainText('Raqueta de Tenis Pro');
    await expect(row).toContainText('2026-06-02');
    await expect(row).toContainText('2026-06-15');
    await expect(row).toContainText('Devuelto'); // El badge cambia su texto interno basándose en "Returned"
  });
});