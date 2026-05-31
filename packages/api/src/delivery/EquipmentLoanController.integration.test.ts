import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateEquipmentLoanRequest } from '../../../shared/index.js';

vi.mock('../infrastructure/PostgresEquipmentLoanRepository.js', () => {
    return {
        PostgresEquipmentLoanRepository: class {
            async create(data: any) { 
                return { id: '2', ...data }; 
            }
        }
    };
});


vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findById(id: string) { 

                if (id === 'nonexistent-member-id') {
                    return null;
                }

                if (id === 'cadete-member-id') {
                    return { id, name: 'Socio Cadete', category: 'Cadete' };
                }
                
                return { id, name: 'Socio Existente', category: 'Senior' }; 
            }
        }
    };
});


describe('EquipmentLoan API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        process.env.DATABASE_URL = 'postgres://localhost:5432/testdb';
        const { buildApp } = await import('../app.js');
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/equipment-loans', () => {
        it('debe retornar 201 y crear el préstamo de equipamiento', async () => {
            const payload: CreateEquipmentLoanRequest = {
                item_name: 'Pelota de Futbol',
                status: 'Loaned',
                loan_date: '2023-01-01',
                due_date: '2023-01-10',
                member_id: 'member-id'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/equipment-loans',
                payload
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.item_name).toBe('Pelota de Futbol');
            expect(body.data.id).toBeDefined();
        });

        it('debe retornar 404 si el miembro no existe', async () => {
            const payload: CreateEquipmentLoanRequest = {
                item_name: 'Pelota de Futbol',
                status: 'Loaned',
                loan_date: '2023-01-01',
                due_date: '2023-01-10',
                member_id: 'nonexistent-member-id'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/equipment-loans',
                payload
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El usuario no existe');
        });

        it('debe retornar 400 si la fecha de prestamo es posterior a la fecha de devolucion', async () => {
            const payload: CreateEquipmentLoanRequest = {
                item_name: 'Pelota de Futbol',
                status: 'Loaned',
                loan_date: '2023-01-10',
                due_date: '2023-01-01',
                member_id: 'member-id'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/equipment-loans',
                payload
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Fecha prestamo no puede ser posterior a Fecha Devolucion');
        });

        it('debe retornar 400 si el miembro tiene categoria Cadete', async () => {
            const payload: CreateEquipmentLoanRequest = {
                item_name: 'Pelota de Futbol',
                status: 'Loaned',
                loan_date: '2023-01-01',
                due_date: '2023-01-10',
                member_id: 'cadete-member-id'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/equipment-loans',
                payload
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Solo se permite realizar prestamos a miembros con categoria Senior o Lifetime');
        });
    });
});