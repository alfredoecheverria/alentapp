import { test, expect } from '@playwright/test';

/**
 * Tests E2E Full-Stack para la edición de sanciones.
 * No mockeamos la red, la prueba trabaja con el frontend real y la DB real.
 *
 * Lo nombro con Z porque los tests de members esperan una DB vacía al arrancar, y discipline crea un socio!
 */

test.describe('Discipline Update Full-Stack E2E', () => {
  test('debe editar una sanción existente y ver el cambio en la tabla', async ({ page }) => {

    // Crear un socio real para adjuntar la sanción
    // DNI único por corrida para evitar conflictos con ejecuciones anteriores
    const uniqueDni = `9${Date.now().toString().slice(-7)}`;
    const memberResponse = await page.request.post('http://localhost:3001/api/v1/socios', {
      data: {
        name: 'Socio E2E',
        dni: uniqueDni,
        email: `e2e.${uniqueDni}@alentapp.test`,
        birthdate: '1991-05-10',
        category: 'Pleno'
      }
    });

    expect(memberResponse.status()).toBe(201);
    const member = await memberResponse.json();

    // Crear una sanción real en la DB para editarla luego
    const disciplineResponse = await page.request.post('http://localhost:3001/api/v1/disciplines', {
      data: {
        member_id: member.data.id,
        reason: 'Falta leve',
        start_date: '2026-07-10',
        end_date: '2026-07-12',
        is_total_suspension: false
      }
    });

    expect(disciplineResponse.status()).toBe(201);

    // Navegar a la vista de sanciones
    await page.goto('/disciplines');
    await expect(page.getByText('Falta leve')).toBeVisible({ timeout: 10000 });

    // Abrir el modal de edición
    await page.getByRole('button', { name: /Editar sanción/i }).first().click();
    await expect(page.getByText('Editar sanción')).toBeVisible();

    // Modificar el motivo de la sanción
    await page.getByPlaceholder('Ej. Conducta inapropiada').fill('Falta moderada');

    // Completar las fechas requeridas
    await page.getByLabel('Fecha de inicio').fill('2026-07-10');
    await page.getByLabel('Fecha de fin').fill('2026-07-12');

    // Guardar los cambios
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    // Verificar que el cambio quedó visible en la tabla
    await expect(page.getByText('Falta moderada')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Falta leve')).toBeHidden();
  });
});