import { test, expect } from '@playwright/test';

/**
 * Tests E2E Full-Stack para la finalización de sanciones.
 * La prueba acepta el diálogo de confirmación y verifica el alert
 * de éxito mostrado por la aplicación.
 *
 * Lo nombro con Z porque los tests de members esperan una DB vacía al arrancar, y discipline crea un socio!
 */

test.describe('Discipline Deactivate Full-Stack E2E', () => {
  test('debe finalizar una sanción activa y mostrar alerta de éxito', async ({ page }) => {

    // Crear un socio real de soporte
    // DNI único por corrida para evitar conflictos con ejecuciones anteriores
    const uniqueDni = `9${Date.now().toString().slice(-7)}`;
    const memberResponse = await page.request.post('http://localhost:3001/api/v1/socios', {
      data: {
        name: 'Socio E2E',
        dni: uniqueDni,
        email: `e2e.${uniqueDni}@alentapp.test`,
        birthdate: '1993-09-10',
        category: 'Pleno'
      }
    });

    expect(memberResponse.status()).toBe(201);
    const member = await memberResponse.json();

    // Crear una sanción real en DB para finalizarla
    const disciplineResponse = await page.request.post('http://localhost:3001/api/v1/disciplines', {
      data: {
        member_id: member.data.id,
        reason: 'Falta grave',
        start_date: '2026-07-15',
        end_date: '2026-07-20',
        is_total_suspension: false
      }
    });

    expect(disciplineResponse.status()).toBe(201);

    // Capturar el mensaje del alert que muestra la UI
    let alertMessage = '';
    page.on('dialog', (dialog) => {
      alertMessage = dialog.message();
      dialog.accept();
    });

    // Navegar a la vista de sanciones
    await page.goto('/disciplines');
    await expect(page.getByText('Falta grave')).toBeVisible({ timeout: 10000 });

    // Finalizar la sanción usando el botón de la UI
    await page.getByRole('button', { name: /Finalizar sanción/i }).first().click();

    // Verificar que se disparó el alert de éxito
    await expect.poll(() => alertMessage).toBe('Sanción finalizada correctamente');
  });
});