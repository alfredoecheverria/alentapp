import { test, expect } from '@playwright/test';


test.describe('Equipment Loans Full-Stack E2E', () => {


   const createdMemberIds: string[] = [];


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


   createdMemberIds.push(member.data.id);


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


   createdMemberIds.push(member.data.id);


   await page.goto('/equipment-loans');
   await page.locator('button:has-text("Registrar Préstamo")').click();
  
   const selectSelector = page.locator('select').first();
   await selectSelector.waitFor({ state: 'visible' });
   await selectSelector.selectOption(member.data.id);


   await page.getByPlaceholder(/Nombre del equipo/i).fill('Raqueta vieja');
   await page.getByLabel(/Fecha de Préstamo/i).fill('2026-06-01');
   await page.getByLabel(/Fecha de Devolución Estimada/i).fill('2026-06-10');
   await page.getByRole('button', { name: 'Confirmar Préstamo' }).click();
  
   const row = page.getByRole('row').filter({ has: page.getByText('Socio Update E2E') });
   await expect(row).toBeVisible();


   await row.getByRole('button', { name: 'Editar' }).click();




   await expect(page.getByText('Editar Préstamo')).toBeVisible();




   await page.getByPlaceholder(/Nombre del equipo/i).fill('Raqueta de Tenis Pro');
   await page.getByLabel(/Fecha de Préstamo/i).fill('2026-06-02');
   await page.getByLabel(/Fecha de Devolución Estimada/i).fill('2026-06-15');




   const statusSelect = page.locator('select').nth(1);
   await statusSelect.selectOption('Returned');




   await page.getByRole('button', { name: 'Guardar Cambios' }).click();
   await expect(page.getByRole('button', { name: 'Guardar Cambios' })).toBeHidden();


   await expect(row).toBeVisible();
   await expect(row).toContainText('Socio Update E2E');
   await expect(row).toContainText('Raqueta de Tenis Pro');
   await expect(row).toContainText('2026-06-02');
   await expect(row).toContainText('2026-06-15');
   await expect(row).toContainText('Devuelto');
 });


 test('debe eliminar un préstamo existente y removerlo de la tabla', async ({ page }) => {
   const uniqueDni = `7${Date.now().toString().slice(-7)}`;
  
   const memberResponse = await page.request.post('http://localhost:3001/api/v1/socios', {
     data: {
       name: 'Socio Delete E2E',
       dni: uniqueDni,
       email: `delete@alentapp.test`,
       birthdate: '2000-01-15',
       category: 'Pleno'
     }
   });
  
   expect(memberResponse.status()).toBe(201);
   const member = await memberResponse.json();


   createdMemberIds.push(member.data.id);


   await page.goto('/equipment-loans');
   await page.locator('button:has-text("Registrar Préstamo")').click();
  
   const selectSelector = page.locator('select').first();
   await selectSelector.waitFor({ state: 'visible' });
   await selectSelector.selectOption(member.data.id);


   await page.getByPlaceholder(/Nombre del equipo/i).fill('Mesa de Ping Pong');
   await page.getByLabel(/Fecha de Préstamo/i).fill('2026-06-01');
   await page.getByLabel(/Fecha de Devolución Estimada/i).fill('2026-06-10');
   await page.getByRole('button', { name: 'Confirmar Préstamo' }).click();
  
   const row = page.getByRole('row').filter({ has: page.getByText('Socio Delete E2E') });
   await expect(row).toBeVisible();


   page.once('dialog', async dialog => {
     expect(dialog.message()).toContain('Estas seguro de que deseas eliminar este registro de prestamo?');
     await dialog.accept();
   });


   await row.getByRole('button', { name: 'Eliminar' }).click();
   await expect(row).toBeHidden();
 });


  test.afterEach(async ({ request }) => {
    try {
      const loansResponse = await request.get('http://localhost:3001/api/v1/equipment-loans');
      if (loansResponse.status() === 200) {
        const loansData = await loansResponse.json();
      
        if (loansData && Array.isArray(loansData.data)) {
          for (const loan of loansData.data) {
            await request.delete(`http://localhost:3001/api/v1/equipment-loans/${loan.id}`);
          }
        }
      }
    } catch (error) {
      console.error('[E2E EquipmentLoan Cleanup] Error al vaciar la tabla de préstamos:', error);
    }


    for (const memberId of createdMemberIds) {
      try {
        const response = await request.delete(`http://localhost:3001/api/v1/socios/${memberId}`);
      } catch (error) {
        console.error(`[E2E EquipmentLoan Cleanup] No se pudo limpiar el socio ${memberId}:`, error);
      }
    }
  });
});

