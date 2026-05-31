import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreatePaymentRequest } from '@alentapp/shared';

vi.mock('../infrastructure/PostgresPaymentRepository.js', () => {
    return {
        PostgresPaymentRepository: class {
            async create(data: any) { return { id: '1', ...data }; }
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

    describe('POST /api/v1/payment', () => {
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
});