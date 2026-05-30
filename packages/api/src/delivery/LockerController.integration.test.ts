import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { CreateLockerRequest } from '@alentapp/shared';


vi.mock('../infrastructure/PostgresLockerRepository.js', () => {
    return {
        PostgresLockerRepository: class {
            async create(data: any) { return { id: 'locker-1', ...data, member_id: data.member_id ?? undefined }; }
            // Se mockea para miembro que ya tiene un locker asignado.
            async findByMemberId(memberId: string) {
                return memberId === 'miembro-1'
                    ? { id: 'locker-1', number: 9, location: 'Gimnasio', status: 'Occupied', member_id: memberId }
                    : null;
            }
            // Se mockea para Numero duplicado
            async findByNumber(number: number) {
                return number === 1
                    ? { id: 'locker-2', number: 1, location: 'Gimnasio', status: 'Available' }
                    : null;
            }
        }
    };
});

describe('Locker API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://localhost:5432/test';
        const { buildApp } = await import('../app.js');
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('POST /api/v1/lockers', () => {
        it('debe retornar 201 y crear el locker', async () => {
            const payload: CreateLockerRequest = {
                number: 2,
                location: 'Gimnasio',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload,
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.number).toBe(2);
            expect(body.data.location).toBe('Gimnasio');
            expect(body.data.status).toBe('Available');
        });

        it('debe retornar 409 si el número ya existe', async () => {
            const payload: CreateLockerRequest = {
                number: 1,
                location: 'Gimnasio',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload,
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Ya existe un locker con ese número');
        });

        it('debe retornar 400 si el member_id es no válido', async () => {
            const payload: CreateLockerRequest = {
                number: 3,
                location: 'Natatorio',
                status: 'Occupied',
                member_id: 'asdasdasd',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload,
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('member_id no válido');
        });
    });
});