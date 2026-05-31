import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { DisciplineDTO } from '@alentapp/shared';

let disciplines: DisciplineDTO[] = [];

vi.mock('../infrastructure/PostgresDisciplineRepository.js', () => {
    return {
        PostgresDisciplineRepository: class {
            async findAll() { return disciplines; }
            async findById(id: string) {
                return disciplines.find((item) => item.id === id) || null;
            }
            async create(data: any) {
                const created = { id: 'discipline-2', ...data, deactivated_at: null };
                disciplines.push(created);
                return created;
            }
            async update(id: string, data: any) {
                const index = disciplines.findIndex((item) => item.id === id);
                if (index === -1) return null;
                disciplines[index] = { ...disciplines[index], ...data };
                return disciplines[index];
            }
            async deactivate(id: string) {
                const index = disciplines.findIndex((item) => item.id === id);
                if (index === -1) return null;
                disciplines[index].deactivated_at = '2026-05-11T00:00:00.000Z';
                return disciplines[index];
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

describe('Discipline Controller Get Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://test:test@localhost:5432/testdb';
        const mod = await import('../app.js');
        app = mod.buildApp();
        await app.ready();
    });

    beforeEach(() => {
        disciplines = [
            {
                id: 'discipline-1',
                member_id: 'member-1',
                reason: 'Falta grave',
                start_date: '2026-05-10',
                end_date: '2026-05-12',
                is_total_suspension: false,
                deactivated_at: null
            }
        ];
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /api/v1/disciplines debe retornar la lista de sanciones', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/disciplines'
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data[0].id).toBe('discipline-1');
    });

    it('GET /api/v1/disciplines debe retornar array vacío cuando no hay sanciones', async () => {
        disciplines = [];

        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/disciplines'
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.data).toEqual([]);
    });
});