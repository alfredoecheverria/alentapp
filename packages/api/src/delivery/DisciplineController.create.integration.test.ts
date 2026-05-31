import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { CreateDisciplineRequest } from '@alentapp/shared';

// Mocks del repositorio (deben registrarse antes de importar la app)
vi.mock('../infrastructure/PostgresDisciplineRepository.js', () => {
    return {
        PostgresDisciplineRepository: class {
            async findById(id: string) { return null; }
            async findAll() { return []; }
            async create(data: any) {
                return {
                    id: 'discipline-2',
                    ...data,
                    deactivated_at: null
                };
            }
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
                if (id === 'member-1') {
                    return {
                        id: 'member-1',
                        name: 'Miembro Existente',
                        dni: '12345678',
                        email: 'test@mate.com',
                        birthdate: '1990-01-01'
                    };
                }
                return null;
            }
            async findByDni(dni: string) { return null; }
            async create(data: any) { return { id: 'member-2', ...data }; }
            async update(id: string, data: any) { return { id, ...data }; }
            async delete(id: string) { return; }
        }
    };
});

describe('Discipline Controller Create Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        // Garantizar que la variable exista antes de importar la app
        process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://test:test@localhost:5432/testdb';

        // Import dinámico para que los mocks y la env estén listos antes de evaluar módulos
        const mod = await import('../app.js');
        app = mod.buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('POST /api/v1/disciplines debe crear una sanción válida', async () => {
        const payload: CreateDisciplineRequest = {
            member_id: 'member-1',
            reason: 'Falta leve',
            start_date: '2026-05-20',
            end_date: '2026-05-22',
            is_total_suspension: false
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/disciplines',
            payload
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);
        expect(body.message).toBe('Sancion creada correctamente');
        expect(body.data.id).toBe('discipline-2');
        expect(body.data.member_id).toBe('member-1');
    });

    it('POST /api/v1/disciplines debe retornar 400 si las fechas son inválidas', async () => {
        const payload: CreateDisciplineRequest = {
            member_id: 'member-1',
            reason: 'Falta leve',
            start_date: '2026-05-22',
            end_date: '2026-05-20',
            is_total_suspension: false
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/disciplines',
            payload
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.message).toContain('fecha');
    });

    it('POST /api/v1/disciplines debe retornar 404 si el socio no existe', async () => {
        const payload: CreateDisciplineRequest = {
            member_id: 'member-404',
            reason: 'Falta leve',
            start_date: '2026-05-20',
            end_date: '2026-05-22',
            is_total_suspension: false
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/disciplines',
            payload
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.payload);
        expect(body.message).toBe('El socio indicado no existe');
    });
});