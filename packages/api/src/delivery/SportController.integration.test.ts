import { CreateSportRequest } from '@alentapp/shared';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';

// Mockeo el repositorio
vi.mock('../infrastructure/PostgresSportRepository.js', () => {
    return {
        PostgresSportRepository: class {
            async create(data: any) { return { id: '2', ...data, additional_price: data.additional_price || 0, }; }
            async findByName(name: string) { return name === 'Deporte Existente' ? { id: '1', name: 'Deporte Existente'} : null }
            async findById(id: string) { return id === '1' ? { id: '1', name: 'Deporte Existente'} : null }
            async findAll() { return [{ id: '1', name: 'Deporte Existente'}]; }
            async update(id: string, data: any) { return { id, ...data }; }
            async delete(id: string) { return; }
        }
    };
});

describe('Sport API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://localhost:5432/test'
        const { buildApp } = await import('../app.js');
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        if(app) {
            await app.close();
        }
    });

    describe('POST api/v1/sports', () => {
        it('debe retornar 201 Created y crear el deporte', async () => {
            const payload: CreateSportRequest = {
                name: 'Basketball',
                description: 'Deporte de pelota',
                max_capacity: 5,
                requires_medical_certificate: true,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.name).toBe('Basketball');
            expect(body.data.id).toBeDefined();
        });

        it('debe pasar las validación y retornar 409 si el nombre ya existe', async () => {
            const payload: CreateMemberRequest = {
                name: 'Deporte Existente',
                description: 'Deporte de pelota',
                max_capacity: 5,
                requires_medical_certificate: true,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Ya existe un deporte con ese nombre');
        });

        it('debe retornar 400 si la capacidad es <= 0', async () => {
            const payload: CreateMemberRequest = {
                name: 'Basketball',
                description: 'Deporte de pelota',
                max_capacity: -1,
                requires_medical_certificate: true,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Capacidad máxima inválida');
        });

        it('debe retornar 400 si el precio adicional es < 0', async () => {
            const payload: CreateMemberRequest = {
                name: 'Basketball',
                description: 'Deporte de pelota',
                max_capacity: 4,
                additional_price: -1,
                requires_medical_certificate: true,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El valor de precio adicional debe ser un numero igual o mayor a 0');
        });
    });
});
