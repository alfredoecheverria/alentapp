import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/CreateDisciplineUseCase.js';
import { GetDisciplinesUseCase } from '../application/GetDisciplinesUseCase.js';
import { CreateDisciplineRequest, UpdateDisciplineRequest } from '@alentapp/shared';
import { UpdateDisciplineUseCase } from '../application/UpdateDisciplineUseCase.js';
import { DeactivateDisciplineUseCase } from '../application/DeactivateDisciplineUseCase.js';

import { metrics } from '@opentelemetry/api';
import { createREDMetrics } from '../infrastructure/Telemetry.ts';

const metricas = createREDMetrics();

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
        private readonly getDisciplinesUseCase: GetDisciplinesUseCase,
        private readonly updateDisciplineUseCase: UpdateDisciplineUseCase,
        private readonly deactivateDisciplineUseCase: DeactivateDisciplineUseCase,
    ) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        try {
            const disciplinas = await this.getDisciplinesUseCase.execute();
            metricas.requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: disciplinas });
        } catch (error: any) {
            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: error.message });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }

    async create(
        _request: FastifyRequest<{ Body: CreateDisciplineRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        try {
            const body = _request.body as CreateDisciplineRequest;
            const result = await this.createDisciplineUseCase.execute(body);

            metricas.requestCounter.add(1, { method, route, status: '201' });

            return reply.code(201).send({
                message: 'Sancion creada correctamente',
                data: result
            });

        } catch (error: any) {
            if (error.message === 'El socio indicado no existe') {
                metricas.errorCounter.add(1, { method, route, status: '404' });
                return reply.code(404).send({
                    message: error.message
                });
            }

            if (error.message.includes('fecha')) {
                metricas.errorCounter.add(1, { method, route, status: '400' });
                return reply.code(400).send({
                    message: error.message
                });
            }

            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.code(500).send({
                message: 'Error interno, reintente más tarde'
            });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }

    async update(
        _request: FastifyRequest<{ Params: { id: string }; Body: UpdateDisciplineRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        try {
            const { id } = _request.params as { id: string };
            const data = _request.body as UpdateDisciplineRequest;

            const result = await this.updateDisciplineUseCase.execute(id, data);

            metricas.requestCounter.add(1, { method, route, status: '200' });

            return reply.code(200).send(result);
        } catch (err: any) {
            if (err.message === "La sanción indicada no existe") {
                metricas.errorCounter.add(1, { method, route, status: '404' });
                return reply.code(404).send({ message: err.message });
            }

            if (err.message.includes("finalizada")) {
                metricas.errorCounter.add(1, { method, route, status: '409' });
                return reply.code(409).send({ message: err.message });
            }
            if (err.message.includes("Debe indicar")) {
                metricas.errorCounter.add(1, { method, route, status: '400' });
            return reply.code(400).send({ message: err.message });
            }

            if (err.message.err.message === "La fecha de fin debe ser posterior a la fecha de inicio") {
                metricas.errorCounter.add(1, { method, route, status: '400' });
                return reply.code(400).send({ message: err.message });
            }

            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply
            .code(500)
            .send({ message: "Error interno, reintente más tarde" });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }

    async deactivate(
        _request: FastifyRequest<{ Params: { id: string } }> ,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        try {
            const { id } = _request.params;
            const result = await this.deactivateDisciplineUseCase.execute(id);

            metricas.requestCounter.add(1, { method, route, status: '200' });

            return reply.code(200).send({ data: result, message: 'Sanción finalizada correctamente' });
        } catch (err: any) {
            if (err.message === 'La sancion indicada no existe') {
                metricas.errorCounter.add(1, { method, route, status: '404' });
                return reply.code(404).send({ message: err.message });
            }
            if (err.message === 'La sanción ya fue finalizada previamente') {
                metricas.errorCounter.add(1, { method, route, status: '409' });
                return reply.code(409).send({ message: err.message });
            }
            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.code(500).send({ message: 'Error interno, reintente más tarde' });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }
}
