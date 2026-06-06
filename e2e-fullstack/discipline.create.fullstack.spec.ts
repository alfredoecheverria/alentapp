import { test, expect } from '@playwright/test';
import pg from 'pg';

/**
 * Tests E2E Full-Stack para la creación de sanciones.
 * NO hay mocks de red: el browser interactúa con el frontend real en
 * http://localhost:5174 y la API real en http://localhost:3001.
 *
 * Usamos `page.request` únicamente para preparar un socio válido antes
 * de entrar a la vista de sanciones.
 *
 * Lo nombro con Z porque los tests de members esperan una DB vacía al arrancar, y discipline crea un socio!
 *
 */

/**
 * Función auxiliar para limpiar la base de datos
 */
const DB_URL = 'postgresql://admin:password123@localhost:5433/alentapp_test_db';

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


test.describe('Discipline Create Full-Stack E2E', () => {
  test('debe crear una sanción real y mostrarla en la tabla', async ({ page }) => {
    // Preparar un socio real en la base de datos de test
    const uniqueDni = `9${Date.now().toString().slice(-7)}`;
    const memberResponse = await page.request.post('http://localhost:3001/api/v1/socios', {
      data: {
        name: 'Socio E2E',
        dni: uniqueDni,
        email: `e2e.${uniqueDni}@alentapp.test`,
        birthdate: '1992-08-20',
        category: 'Pleno'
      }
    });

    expect(memberResponse.status()).toBe(201);
    const member = await memberResponse.json();

    // Navegar a la vista de sanciones
    await page.goto('/disciplines');

    // Si la tabla está vacía, debe mostrar el estado vacío
    await expect(page.getByText('No se encontraron sanciones.')).toBeVisible();

    // Abrir el modal de creación de sanción
    await page.locator('button:has-text("Nueva sanción")').click();
    await expect(page.getByText('Crear nueva sanción')).toBeVisible();

    // Seleccionar el socio creado en el select personalizado
    await page.locator('button:has-text("Seleccione un socio")').click();
    await page.getByText(`Socio E2E (${uniqueDni})`).click();

    // Completar el formulario con datos reales
    await page.getByPlaceholder('Ej. Conducta inapropiada').fill('Conducta inapropiada grave');
    await page.getByLabel('Fecha de inicio').fill('2026-07-01');
    await page.getByLabel('Fecha de fin').fill('2026-07-05');

    // Enviar el formulario y crear la sanción
    await page.getByRole('button', { name: 'Crear sanción' }).click();

    // Verificar que la sanción creada aparece en la tabla real
    await expect(page.getByText('Conducta inapropiada grave')).toBeVisible();
    await expect(page.getByText(member.data.id)).toBeVisible();
  });

    // Ejecuta después de todos los tests en esta suite
  test.afterAll(async () => {
    await cleanDatabase();
  });
});