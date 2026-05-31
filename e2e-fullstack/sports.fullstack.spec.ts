import { test, expect } from "@playwright/test";

test.describe('Sports E2E Full-Stack Tests', () => {
    test('debe mostrar el listado de deportes vacios cuando no hay deportes en la DB', async ({page}) => {
        await page.goto('/sports');
        await expect(page.getByText('No se encontraron deportes.')).toBeVisible({ timeout: 10000 });
    });

    test('debe crear un deporte y mostrarlo en la tabla', async ({ page }) => {
        await page.goto('/sports');

        await page.locator('button:has-text("Agregar Deporte")').click();
        await expect(page.getByText("Agregar Nuevo Deporte")).toBeVisible();

        await page.getByPlaceholder('Ej. Kung-Fu').fill('Test E2E Fullstack');
        await page.getByPlaceholder('Ej. Arte marcial full-contact de origen chino').fill('Descripcion de Prueba');
        await page.getByLabel('Capacidad Máxima de Practicantes').fill('10');
        await page.getByLabel('Coste Adicional').fill('15');

        await page.getByRole('button', { name: 'Crear Deporte'}).click();

        await expect(page.getByRole('button', { name: 'Crear Deporte' })).toBeHidden();
        await expect(page.getByText('Test E2E Fullstack')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Descripcion de Prueba')).toBeVisible();
    });
})
