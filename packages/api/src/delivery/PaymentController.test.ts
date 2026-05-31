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
        body: { amount: 100, member_id: '123', month: 5, year: 2026 },
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
});