import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateEnrollmentUseCase } from '../application/CreateEnrollmentUseCase.ts'
import { GetEnrollmentsUseCase } from '../application/GetEnrollmentsUseCase.ts'
import { UpdateEnrollmentUseCase } from '../application/UpdateEnrollmentUseCase.ts'
import { DeleteEnrollmentUseCase } from '../application/DeleteEnrollmentUseCase.ts'
import { CreateEnrollmentRequest, UpdateEnrollmentRequest } from '@alentapp/shared'

import { metrics } from '@opentelemetry/api';
import { createREDMetrics } from '../infrastructure/Telemetry.ts';

const metricas = createREDMetrics();

export class EnrollmentController {
    constructor (
        private readonly createEnrollmentUseCase: CreateEnrollmentUseCase,
        private readonly getEnrollmentsUseCase: GetEnrollmentsUseCase,
        private readonly updateEnrollmentUseCase: UpdateEnrollmentUseCase,
        private readonly deleteEnrollmentUseCase: DeleteEnrollmentUseCase,
    ) {}

    async create(
        _request: FastifyRequest<{ Body: CreateEnrollmentRequest }>,
        reply: FastifyReply
    ) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        try {
            const enrollment = await this.createEnrollmentUseCase.execute(_request.body);
            metricas.requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: enrollment });
        } catch (error: any) {
            if (error.message.includes('Ya existe una inscripcion del socio a este deporte')
            || error.message.includes('Capacidad máxima del deporte excedida')) {
                metricas.errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }

    async getAll(
        _request: FastifyRequest,
        reply: FastifyReply
    ) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        try{
            const enrollments = await this.getEnrollmentsUseCase.execute();
            metricas.requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: enrollments });
        } catch (error: any) {
            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: error.message });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }

    async update(
        _request: FastifyRequest<{Params: { id: string }, Body: UpdateEnrollmentRequest}>,
        reply: FastifyReply
    ) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        try {
            const { id } = _request.params;
            const enrollment = await this.updateEnrollmentUseCase.execute(id, _request.body);
            metricas.requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: enrollment });
        } catch (error: any) {
            if (error.message.includes('Debe indicar al menos un campo a modificar')) {
                metricas.errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('La inscripción no existe')) {
                metricas.errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('No se puede editar el socio asociado')
            || error.message.includes('No se puede editar el deporte asociado')) {
                metricas.errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
                metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'Error interno, reintente más tarde'})
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }

    async delete(
        _request: FastifyRequest<{Params: { id: string}}>,
        reply: FastifyReply
    ) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        try {
            const { id } = _request.params;
            await this.deleteEnrollmentUseCase.execute(id);
            metricas.requestCounter.add(1, { method, route, status: '204' });
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('La inscripción no existe')) {
                metricas.errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'error del motor de base de datos'});
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }
}
