import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { CreateLockerRequest } from '@alentapp/shared';

const existingMemberId = '705e6567-e97b-41d1-a012-453204174000';
const nonExistingMemberId = '705e6567-e97b-41d1-a012-453204174001';


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
            async findById(id: string) {
                if (id === 'locker-1') {
                    return { id: 'locker-1', number: 1, location: 'Gimnasio', status: 'Available', member_id: undefined };
                }
                return null;
            }
            async update(id: string, data: any) {
                return {
                    id,
                    number: data.number ?? 1,
                    location: data.location ?? 'Gimnasio',
                    status: data.status ?? 'Available',
                    member_id: data.member_id === undefined ? undefined : data.member_id,
                    ...data
                };
            }
        }
    };
});

vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findById(id: string) {
                return id === existingMemberId
                    ? { id: existingMemberId, name: 'Miembro Existente', dni: '12345678', email: 'test@mate.com', birthdate: '1990-01-01' }
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

    describe('PUT /api/v1/lockers/:id', () => {
        it('debe actualizar un locker existente y retornar 200', async () => {
            const payload = {
                number: 2,
                location: 'Natatorio',
                status: 'Occupied',
                member_id: existingMemberId
            };

            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/lockers/locker-1',
                payload,
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeTruthy();
            expect(body.data.number).toBe(2);
            expect(body.data.location).toBe('Natatorio');
            expect(body.data.member_id).toBe(existingMemberId);
        });

        it('debe retornar 404 si el locker no existe', async () => {
            const payload = { location: 'Cancha 1' };

            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/lockers/locker-9',
                payload,
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El locker no existe');
        });

        it('debe retornar 404 si el member indicado no existe', async () => {
            const payload = { member_id: nonExistingMemberId };

            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/lockers/locker-1',
                payload,
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El miembro indicado no existe');
        });
    });
});