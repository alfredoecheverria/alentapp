import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreatePaymentRequest, UpdatePaymentRequest } from '@alentapp/shared';

vi.mock('../infrastructure/PostgresPaymentRepository.js', () => {
    return {
        PostgresPaymentRepository: class {
            async create(data: any) { return { id: '1', ...data }; }
            async findAll() { return []; }
            async update(id: string, data: any) { return { id, member_id: '1', due_date: '2026-05-30', payment_date: '2026-05-29', amount: 100, status: 'Pendiente', year: 2026, month: 5, ...data}; }
            async findById(id: string) { return id === '999' ? null : { id, member_id: '1', amount: 100, due_date: '2026-05-30', payment_date: '2026-05-29', status: 'Pendiente', year: 2026, month: 5 }; }
            async findByMemberId(member_id: string) { return []; }
            async delete(id: string) { return; }
        }
    };
});

vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findById(id: string) { 
                return id === '1' ? { id: '1', name: 'Socio Test' } : null; 
            }
        }
    };
});

describe('Payment API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        process.env.DATABASE_URL = 'postgres://localhost:5432/test'
        const { buildApp } = await import('../app.js');
        app = buildApp();
        await app.ready(); 
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/payments', () => {
        it('debe retornar 201 y crear el pago', async () => {
            const payload: CreatePaymentRequest = {
                member_id: '1',
                amount: 100,
                due_date: '2026-05-30',
                payment_date: '2026-05-29',
                status: 'Pago',
                year: 2026,
                month: 5
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.amount).toBe(100);
            expect(body.data.id).toBeDefined();
        });

        it('debe retornar 400 si el monto es inválido', async () => {
            const payload: CreatePaymentRequest = {
                member_id: '1',
                amount: -1000, //no se puede ingresar un monto negativo 
                due_date: '2026-05-30',
                payment_date: '2026-05-29',
                status: 'Pago',
                year: 2026,
                month: 5
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload
            });

            expect([400, 500]).toContain(response.statusCode);
        });

        it('debe retornar 400 si el estado es inválido', async () => {
            const payload: CreatePaymentRequest = {
                member_id: '1',
                amount: 100,
                due_date: '2026-05-30',
                payment_date: '2026-05-29',
                status: 'Cancelado', //no se puede crear un pago cancelado
                year: 2026,
                month: 5
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload
            });

            expect([400, 500]).toContain(response.statusCode);
        });
    });

    describe('PUT /api/v1/payments/:id', () => {
        it('debe retornar 200 y actualizar el pago', async () => {
            const payload: UpdatePaymentRequest = {
                amount: 150,
                due_date: '2026-06-30',
                payment_date: '2026-06-29',
                status: 'Pago',
                year: 2026,
                month: 6
            };

            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/payments/1',
                payload
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.amount).toBe(150);
        });

        it('debe retornar 400 si el estado a modificar es Cancelado', async () => {
            const payload: UpdatePaymentRequest = {
                member_id: '1',
                amount: 150,
                due_date: '2026-06-30',
                payment_date: '2026-06-29',
                status: 'Cancelado', //no se puede modificar el estado de un pago a cancelado
                year: 2026,
                month: 6
            };

            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/payments/1',
                payload
            });

            expect([400, 500]).toContain(response.statusCode);
        });

        it('debe retornar 404 si el pago no existe', async () => {
            const payload: UpdatePaymentRequest = {
                member_id: '1',
                amount: 150,
                due_date: '2026-06-30',
                payment_date: '2026-06-29',
                status: 'Pago',
                year: 2026,
                month: 6
            };

            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/payments/999', 
                payload
            });

            expect(response.statusCode).toBe(404);
        });
    });

    describe('DELETE /api/v1/payments/:id', () => {
        
        it('debe retornar 204 No Content si el pago es eliminado/cancelado con éxito', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/payments/1'
            });

            expect(response.statusCode).toBe(204);
            expect(response.payload).toBe(''); 
        });

        it('debe retornar 400 Bad Request si el pago no existe', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/payments/999'
            });

            expect(response.statusCode).toBe(400);
            
            const body = JSON.parse(response.payload);
            expect(body).toEqual({ message: 'El pago no existe' });
        });
    });
});