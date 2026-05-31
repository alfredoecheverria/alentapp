import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentController } from './PaymentController.js';

describe('PaymentController', () => {
    // Mocks de los Casos de Uso
    const mockCreateUseCase = { execute: vi.fn() };
    const mockListUseCase = { execute: vi.fn() };
    const mockUpdateUseCase = { execute: vi.fn() };
    const mockDeleteUseCase = { execute: vi.fn() };
    
    const controller = new PaymentController(
        mockCreateUseCase as any,
        mockListUseCase as any,
        mockUpdateUseCase as any,
        mockDeleteUseCase as any
    );

    // Mocks de Fastify Request y Reply
    const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn()
    };

    const mockRequest = {
        log: { info: vi.fn() },
        body: { amount: 100, member_id: '123', month: 5, year: 2026, status: 'Pago' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    //test para crear un pago
    describe('create', () => {
        it('debe devolver status 201 y los datos si la creación es exitosa', async () => {
            const mockPayment = { 
                    id: '1', 
                    amount: 100, 
                    member_id: '123', 
                    month: 5, 
                    year: 2026
            };
            mockCreateUseCase.execute.mockResolvedValueOnce(mockPayment);
            
            await controller.create(mockRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(201);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockPayment });
        });

        it('debe devolver status 400 Bad Request si el monto es inválido', async () => {
            const badRequest = { ...mockRequest, body: { ...mockRequest.body, amount: -50 } };
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Monto inválido'));
            
            await controller.create(badRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Monto inválido' });
        });

        it('debe devolver status 400 Bad Request si el mes es inválido', async () => {

            const badRequest = { ...mockRequest, body: { ...mockRequest.body, month: 13 } };
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Mes inválido'));
            
            await controller.create(badRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Mes inválido' });
        });

        it('debe devolver status 400 Bad Request si el año es inválido', async () => {

            const badRequest = { ...mockRequest, body: { ...mockRequest.body, year: 2024 } };
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Año inválido'));
            
            await controller.create(badRequest as any, mockReply as any);  

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Año inválido' });
        });

        it('debe devolver status 500 Internal Server Error si ocurre un error inesperado', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Error inesperado'));
            
            await controller.create(mockRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' });
        });
    });


    //test para actualizar un pago
    describe('update', () => {
        it('debe devolver status 200 y los datos si la actualización es exitosa', async () => {
            const mockPayment = { 
                    id: '1', 
                    amount: 150, 
                    member_id: '123', 
                    month: 5, 
                    year: 2026, 
                    status: 'Pago'
            };
            mockUpdateUseCase.execute.mockResolvedValueOnce(mockPayment);
            
            const mockUpdateRequest = { ...mockRequest, body: { ...mockRequest.body, amount: 150 }, params: { id: '1' } };
            await controller.update(mockUpdateRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockPayment });
        });

        it('debe devolver status 400 Bad Request si el monto es inválido', async () => {
            const badRequest = { ...mockRequest, body: { ...mockRequest.body, amount: -50 } };
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Monto inválido'));
            
            await controller.create(badRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Monto inválido' });
        });

        it('debe devolver status 404 Not Found si el pago no existe', async () => {
            const mockUpdateRequest = { ...mockRequest, body: { ...mockRequest.body, amount: 150 }, params: { id: '999' } };
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('El pago no existe.'));
            
            await controller.update(mockUpdateRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El pago no existe.'});
        });

        it('debe devolver status 400 Bad Request si se quiere cancelar el pago desde la edición', async () => {
            const mockUpdateRequest = { ...mockRequest, body: { ...mockRequest.body, amount: 150, status: 'Cancelado' }, params: { id: '1' } };
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('No se puede cancelar un pago desde la edición. Use el botón de eliminar.'));
            
            await controller.update(mockUpdateRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'No se puede cancelar un pago desde la edición. Use el botón de eliminar.' });
        });

        it('debe devolver status 400 Bad Request si se intenta cambiar el estado a Pendiente desde Pago', async () => {
            const mockUpdateRequest = { ...mockRequest, body: { ...mockRequest.body, amount: 150, status: 'Pendiente' }, params: { id: '1' } };
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('No se puede cambiar el estado de un pago que ya fue pagado a Pendiente'));
            
            await controller.update(mockUpdateRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'No se puede cambiar el estado de un pago que ya fue pagado a Pendiente' });
        });

        it('debe devolver status 500 Internal Server Error si ocurre un error inesperado', async () => {
            const mockUpdateRequest = { ...mockRequest, body: { ...mockRequest.body, amount: 150 }, params: { id: '1' } };
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('Error inesperado'));
            
            await controller.update(mockUpdateRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' });
        });
    });
});