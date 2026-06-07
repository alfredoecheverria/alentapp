import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/CreateSportUseCase.ts'
import { GetSportsUseCase } from '../application/GetSportsUseCase.ts'
import { UpdateSportUseCase } from '../application/UpdateSportUseCase.ts'
import { DeleteSportUseCase } from '../application/DeleteSportUseCase.ts'
import { CreateSportRequest, UpdateSportRequest } from '@alentapp/shared'

import { metrics } from '@opentelemetry/api';
import { createREDMetrics } from '../infrastructure/Telemetry.ts';

const metricas = createREDMetrics();

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly getSportsUseCase: GetSportsUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase,
        private readonly deleteSportUseCase: DeleteSportUseCase,
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreateSportRequest }>,
        reply: FastifyReply
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        try {
            const sport = await this.createSportUseCase.execute(request.body);
            metricas.requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('Ya existe un deporte con ese nombre')) {
                metricas.errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('Capacidad máxima inválida') || error.message.includes('El valor de precio adicional debe ser un numero igual o mayor a 0')) {
                metricas.errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'Error interno, reintente más tarde'});
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        try {
            const sports = await this.getSportsUseCase.execute();
            metricas.requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: sports });
        } catch (error: any) {
            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: error.message });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }, Body: UpdateSportRequest }>,
        reply: FastifyReply
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        try {
            const { id } = request.params;
            const sport = await this.updateSportUseCase.execute(id, request.body);
            metricas.requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('El deporte no existe')
            || error.message.includes('Descripción de deporte inválida')
            || error.message.includes('Capacidad máxima inválida')) {
                metricas.errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }

            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        try {
            const { id } = request.params;
            await this.deleteSportUseCase.execute(id);
            metricas.requestCounter.add(1, { method, route, status: '204' });
            return reply.status(204).send(); // No Content
        } catch (error: any) {
            if (error.message.includes('El deporte no existe')) {
                metricas.errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message })
            }

            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'error del motor de base de datos' });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }
}
