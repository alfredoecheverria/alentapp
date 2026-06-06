import { test, expect } from '@playwright/test';
import pg from 'pg';

/**
 * Tests E2E Full-Stack para la edición de sanciones.
 * No mockeamos la red, la prueba trabaja con el frontend real y la DB real.
 */

const DB_URL = 'postgresql://admin:password123@localhost:5433/alentapp_test_db';

/**
 * Función auxiliar para limpiar la base de datos al finalizar los tests.
 */
async function cleanDatabase(): Promise<void> {
    const client = new pg.Client({ connectionString: DB_URL });
    await client.connect();

    try {
        const res = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename != '_prisma_migrations';
        `);

        const tables = res.rows.map(row => `"${row.tablename}"`).join(', ');

        if (tables) {
            await client.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
            console.log('[Discipline E2E] Base de datos limpiada después de tests.');
        }
    } finally {
        await client.end();
    }
}

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

  // Ejecuta después de todos los tests en esta suite
  test.afterAll(async () => {
    await cleanDatabase();
  });
});