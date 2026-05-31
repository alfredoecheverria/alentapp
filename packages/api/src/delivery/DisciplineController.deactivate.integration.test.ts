import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';

vi.mock('../infrastructure/PostgresDisciplineRepository.js', () => {
    return {
        PostgresDisciplineRepository: class {
            async findAll() { return []; }
            async findById(id: string) {
                if (id === 'discipline-1') {
                    return {
                        id: 'discipline-1',
                        member_id: 'member-1',
                        reason: 'Falta grave',
                        start_date: '2026-05-10',
                        end_date: '2026-05-12',
                        is_total_suspension: false,
                        deactivated_at: null
                    };
                }
                if (id === 'discipline-deactivated') {
                    return {
                        id: 'discipline-deactivated',
                        member_id: 'member-1',
                        reason: 'Falta grave',
                        start_date: '2026-05-10',
                        end_date: '2026-05-12',
                        is_total_suspension: false,
                        deactivated_at: '2026-05-11T00:00:00.000Z'
                    };
                }
                return null;
            }
            async create(data: any) { return { id: 'discipline-2', ...data, deactivated_at: null }; }
            async update(id: string, data: any) { return { id, ...data }; }
            async deactivate(id: string) {
                return {
                    id,
                    member_id: 'member-1',
                    reason: 'Falta grave',
                    start_date: '2026-05-10',
                    end_date: '2026-05-12',
                    is_total_suspension: false,
                    deactivated_at: '2026-05-11T00:00:00.000Z'
                };
            }
        }
    };
});

vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findById(id: string) {
                return id === 'member-1'
                    ? { id: 'member-1', name: 'Miembro Existente', dni: '12345678', email: 'test@mate.com', birthdate: '1990-01-01' }
                    : null;
            }
            async findByDni(dni: string) { return null; }
            async create(data: any) { return { id: 'member-2', ...data }; }
            async update(id: string, data: any) { return { id, ...data }; }
            async delete(id: string) { return; }
        }
    };
});

describe('Discipline Controller Deactivate Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://test:test@localhost:5432/testdb';
        const mod = await import('../app.js');
        app = mod.buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('PUT /api/v1/disciplines/:id/deactivate debe finalizar una sanción activa', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: '/api/v1/disciplines/discipline-1/deactivate'
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.data.deactivated_at).toBe('2026-05-11T00:00:00.000Z');
        expect(body.message).toBe('Sanción finalizada correctamente');
    });

    it('PUT /api/v1/disciplines/:id/deactivate debe retornar 404 si la sanción no existe', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: '/api/v1/disciplines/no-existe/deactivate'
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.payload);
        expect(body.message).toBe('La sancion indicada no existe');
    });

    it('PUT /api/v1/disciplines/:id/deactivate debe retornar 409 si la sanción ya estaba finalizada', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: '/api/v1/disciplines/discipline-deactivated/deactivate'
        });

        expect(response.statusCode).toBe(409);
        const body = JSON.parse(response.payload);
        expect(body.message).toBe('La sanción ya fue finalizada previamente');
    });
});