import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { UpdateDisciplineRequest } from '@alentapp/shared';

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
            async update(id: string, data: any) {
                return {
                    id,
                    member_id: 'member-1',
                    reason: data.reason ?? 'Falta grave',
                    start_date: data.start_date ?? '2026-05-10',
                    end_date: data.end_date ?? '2026-05-12',
                    is_total_suspension: data.is_total_suspension ?? false,
                    deactivated_at: null,
                    ...data
                };
            }
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

describe('Discipline Controller Update Integration Tests', () => {
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

    it('PUT /api/v1/disciplines/:id debe actualizar una sanción existente', async () => {
        const payload: UpdateDisciplineRequest = {
            reason: 'Falta moderada',
            end_date: '2026-05-13'
        };

        const response = await app.inject({
            method: 'PUT',
            url: '/api/v1/disciplines/discipline-1',
            payload
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.reason).toBe('Falta moderada');
        expect(body.end_date).toBe('2026-05-13');
    });

    it('PUT /api/v1/disciplines/:id debe retornar 409 si la sanción ya fue finalizada', async () => {
        const payload: UpdateDisciplineRequest = {
            reason: 'Intento de cambio'
        };

        const response = await app.inject({
            method: 'PUT',
            url: '/api/v1/disciplines/discipline-deactivated',
            payload
        });

        expect(response.statusCode).toBe(409);
        const body = JSON.parse(response.payload);
        expect(body.message).toContain('finalizada');
    });
});