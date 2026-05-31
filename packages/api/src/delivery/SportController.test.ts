import { it, describe, beforeEach, expect, vi } from "vitest";
import { SportController } from './SportController.ts'

describe('SportController', () => {
    // Mockeo los casos de uso
    const mockCreateUseCase = { execute: vi.fn() };
    const mockGetUseCase = { execute: vi.fn() };
    const mockUpdateUseCase = { execute: vi.fn() };
    const mockDeleteUseCase = { execute: vi.fn() };

    const controller = new SportController(
        mockCreateUseCase as any,
        mockGetUseCase as any,
        mockUpdateUseCase as any,
        mockDeleteUseCase as any,
    );

    // Mocks de Fastify
    const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
    };

    const mockRequest = {
        body: { name: 'Basketball', },
        params: { id: '1234'}
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('create', () => {
        it('debe devolver status 201 y los datos si la creación es exitosa', async () => {
            const mockSport = { id: '1', name: 'Basketball' };
            mockCreateUseCase.execute.mockResolvedValueOnce(mockSport);

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(201);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockSport });
        });

        it('debe devolver status 409 Conflict si ya existe un deporte con el mismo nombre', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Ya existe un deporte con ese nombre'))

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Ya existe un deporte con ese nombre' });
        });

        it('debe devolver status 400 Bad Request si la capacidad maxima es <= a 0', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Capacidad máxima inválida'))

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Capacidad máxima inválida' });
        });

        it('debe devolver status 400 Bad Request si el precio adicional es < a 0', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('El valor de precio adicional debe ser un numero igual o mayor a 0'))

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El valor de precio adicional debe ser un numero igual o mayor a 0' });
        });

        it('debe devolver status 500 Internal Server Error para cualquier otro error', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Error de conexion de Prisma...'))

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' });
        });
    });

    describe('update', () => {
        it('debe devolver status 200 OK y los datos si la actualizacion es exitosa', async () => {
            const mockSport = { id: '1', description: 'Nuevo deporte' };
            mockUpdateUseCase.execute.mockResolvedValueOnce(mockSport);

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockSport });
        });

        it('debe devolver status 400 Bad Request si el deporte no existe', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('El deporte no existe'))

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El deporte no existe' });
        });

        it('debe devolver status 400 Bad Request si la descripcion es vacia', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('Descripción de deporte inválida'))

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Descripción de deporte inválida' });
        });

        it('debe devolver status 400 Bad Request si la capacidad es <= 0', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('Capacidad máxima inválida'))

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Capacidad máxima inválida' });
        });

        it('debe devolver status 500 Internal Server Error para cualquier otro error', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('Error de conexion de Prisma...'))

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' });
        });
    });
})
