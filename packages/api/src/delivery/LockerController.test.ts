import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LockerController } from './LockerController.js';

describe('LockerController', () => {
    // 1. Mocks de los Casos de Uso
    const mockCreateUseCase = { execute: vi.fn() };
    const mockGetUseCase = { execute: vi.fn() };
    const mockUpdateUseCase = { execute: vi.fn() };
    const mockDeleteUseCase = { execute: vi.fn() };

    const controller = new LockerController(
        mockCreateUseCase as any,
        mockGetUseCase as any,
        mockUpdateUseCase as any,
        mockDeleteUseCase as any
    );

    // 2. Mocks de Fastify Request y Reply
    const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn()
    };

    const mockRequest = {
        log: { info: vi.fn() },
        body: { number: 1, location: 'Gimnasio' },
        params: { id: '123' }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('create', () => {
        it('debe devolver status 201 y los datos si la creacion es exitosa', async () => {
            const mockLocker = { id: '1', number: 1, location: 'Gimnasio', status: 'Available' };
            mockCreateUseCase.execute.mockResolvedValueOnce(mockLocker);

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(201);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockLocker });
        });

        it('debe devolver status 409 si el numero ya existe', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Ya existe un locker con ese número'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Ya existe un locker con ese número' });
        });

        it('debe devolver status 400 Bad Request si el number no es entero y mayor a cero', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('number debe ser entero y mayor a cero'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
        });

        it('debe devolver status 400 Bad Request si el member_id es no valido', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('member_id no válido'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'member_id no válido' });
        });

        it('debe devolver status 404 si el miembro indicado no existe', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('El miembro indicado no existe'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El miembro indicado no existe' });
        });

        it('debe devolver status 422 si el miembro ya posee un locker', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('El miembro ya posee un locker'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(422);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El miembro ya posee un locker' });
        });

        it('debe devolver status 422 si el estado y member_id no son compatibles', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Estado Occupied requiere member_id'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(422);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Estado Occupied requiere member_id' });
        });

        it('debe devolver status 500 para cualquier otro error', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Error de conexion de Prisma...'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' });
        });
    });

    describe('update', () => {
        it('debe devolver status 200 y los datos actualizados', async () => {
            const mockLocker = { id: '123', number: 2, location: 'Tatami' };
            mockUpdateUseCase.execute.mockResolvedValueOnce(mockLocker);

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockUpdateUseCase.execute).toHaveBeenCalledWith('123', { number: 1, location: 'Gimnasio' });
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockLocker });
        });

        it('debe devolver status 409 si ya existe el numero', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('Ya existe un locker con ese número'));

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Ya existe un locker con ese número' });
        });

        it('debe devolver status 404 si no existe el locker', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('El locker no existe'));

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El locker no existe' });
        });

        it('debe devolver status 500 por error generico', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('Error de conexion de Prisma...'));

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' });
        });
    });

    describe('delete', () => {
        it('debe devolver status 204 si la eliminación es exitosa', async () => {
            mockDeleteUseCase.execute.mockResolvedValueOnce(undefined);

            await controller.delete(mockRequest as any, mockReply as any);

            expect(mockDeleteUseCase.execute).toHaveBeenCalledWith('123');
            expect(mockReply.status).toHaveBeenCalledWith(204);
            expect(mockReply.send).toHaveBeenCalledWith();
        });

        it('debe devolver status 404 si el locker no existe', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('El locker no existe'));

            await controller.delete(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El locker no existe' });
        });

        it('debe devolver status 422 si el locker tiene member asignado', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('No se puede eliminar un locker con member asignado'));

            await controller.delete(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(422);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'No se puede eliminar un locker con member asignado' });
        });

        it('debe devolver status 500 ante un error generico', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('Error de conexion de Prisma...'));

            await controller.delete(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' });
        });
    });
});