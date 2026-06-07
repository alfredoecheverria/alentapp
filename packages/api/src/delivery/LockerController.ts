import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateLockerUseCase } from '../application/CreateLockerUseCase.js';
import { CreateLockerRequest, UpdateLockerRequest } from '@alentapp/shared';
import { GetLockersUseCase } from '../application/GetLockersUseCase.js';
import { DeleteLockerUseCase } from '../application/DeleteLockerUseCase.js';
import { UpdateLockerUseCase } from '../application/UpdateLockerUseCase.js';

import { metrics } from '@opentelemetry/api';
import { createREDMetrics } from '../infrastructure/Telemetry.ts';

const metricas = createREDMetrics();

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase,
        private readonly getLockersUseCase: GetLockersUseCase,
        private readonly updateLockerUseCase: UpdateLockerUseCase,
        private readonly deleteLockerUseCase: DeleteLockerUseCase,
    ) {

    }

    async create(
        request: FastifyRequest<{ Body: CreateLockerRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        try {
            const locker = await this.createLockerUseCase.execute(request.body);
            metricas.requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: locker });
        } catch (error: any) {
            const msg = (error && error.message) ? String(error.message) : '';

            if (msg === 'Ya existe un locker con ese número') {
                metricas.errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: msg });
            }

            if (msg === 'number debe ser entero y mayor a cero') {
                metricas.errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: msg });
            }

            if (msg === 'member_id no válido') {
                metricas.errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: msg });
            }

            if (msg === 'El miembro indicado no existe') {
                metricas.errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: msg });
            }

            if (msg === 'El miembro ya posee un locker') {
                metricas.errorCounter.add(1, { method, route, status: '422' });
                return reply.status(422).send({ error: msg });
            }

            if (msg.startsWith('Estado Available') || msg.startsWith('Estado Occupied') || msg.startsWith('Estado Maintenance')) {
                metricas.errorCounter.add(1, { method, route, status: '422' });
                return reply.status(422).send({ error: msg });
            }

            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        try {
            const socios = await this.getLockersUseCase.execute();
            metricas.requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: socios });
        } catch (error: any) {
            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: error.message });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }, Body: UpdateLockerRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        try {
            const { id } = request.params;
            const locker = await this.updateLockerUseCase.execute(id, request.body);
            metricas.requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: locker });
        } catch (error: any) {
            const msg = (error && error.message) ? String(error.message) : '';

            if (msg === 'Ya existe un locker con ese número') {
                metricas.errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: msg });
            }

            if (msg === '`number` debe ser entero y mayor a cero' || msg === 'number debe ser entero y mayor a cero') {
                metricas.errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: msg });
            }

            if (msg === '`member_id` no válido' || msg === 'member_id no válido') {
                metricas.errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: msg });
            }

            if (msg === 'El miembro indicado no existe' || msg === 'El locker no existe') {
                metricas.errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: msg });
            }

            if (msg === 'El miembro ya posee un locker') {
                metricas.errorCounter.add(1, { method, route, status: '422' });
                return reply.status(422).send({ error: msg });
            }

            if (msg.startsWith('Estado Available') || msg.startsWith('Estado Occupied') || msg.startsWith('Estado Maintenance')) {
                metricas.errorCounter.add(1, { method, route, status: '422' });
                return reply.status(422).send({ error: msg });
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
            await this.deleteLockerUseCase.execute(id);
            metricas.requestCounter.add(1, { method, route, status: '204' });
            return reply.status(204).send(); // No Content
        } catch (error: any) {
            const msg = (error && error.message) ? String(error.message) : '';

            if (msg === 'El locker no existe') {
                metricas.errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: msg });
            }

            if (msg === 'No se puede eliminar un locker con member asignado') {
                metricas.errorCounter.add(1, { method, route, status: '422' });
                return reply.status(422).send({ error: msg });
            }

            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }
}
