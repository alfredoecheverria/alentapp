import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EquipmentLoanController } from './EquipmentLoanController.js';

describe('EquipmentLoanController', () => {

    const mockCreateUseCase = { execute: vi.fn() };
    const mockGetUseCase = { execute: vi.fn() };
    const mockUpdateUseCase = { execute: vi.fn() };
    const mockDeleteUseCase = { execute: vi.fn() };

    const controller = new EquipmentLoanController(
        mockCreateUseCase as any,
        mockGetUseCase as any,
        mockUpdateUseCase as any,
        mockDeleteUseCase as any
    );

    const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn()
    };

    const mockRequest = {
        log: { info: vi.fn(), error: vi.fn() },
        body: { item_name: 'item-name', status: 'Loaned', loan_date: '2023-01-01', due_date: '2023-01-10', member_id: 'member-id' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('create', () => {
        it('debe devolver status 201 y los datos si la creación es exitosa', async () => {
            const mockLoan = { id: '1', item_name: 'item-name' };
            mockCreateUseCase.execute.mockResolvedValueOnce(mockLoan);
            
            await controller.create(mockRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(201);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockLoan });
        });

        it('debe devolver status 404 si el miembro no existe', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('El usuario no existe'));
            
            await controller.create(mockRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El usuario no existe' });
        });

        it('debe devolver status 400 si la fecha de prestamo es posterior a la fecha de devolucion', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Fecha prestamo no puede ser posterior a Fecha Devolucion'));
            
            await controller.create(mockRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Fecha prestamo no puede ser posterior a Fecha Devolucion' });
        });

        it('debe devolver status 400 si el miembro tiene categoria Cadete', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Solo se permite realizar prestamos a miembros con categoria Senior o Lifetime'));
            
            await controller.create(mockRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Solo se permite realizar prestamos a miembros con categoria Senior o Lifetime' });
        });

        it('debe devolver status 500 si ocurre un error inesperado', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Error inesperado'));
            
            await controller.create(mockRequest as any, mockReply as any);
            
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' });
        });
    });
});
