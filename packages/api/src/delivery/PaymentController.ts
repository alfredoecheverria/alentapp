import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/CreatePaymentUseCase.js';
import { GetPaymentUseCase } from '../application/GetPaymentUseCase.js';
import { UpdatePaymentUseCase } from '../application/UpdatePaymentUseCase.js';
import { DeletePaymentUseCase } from '../application/DeletePaymentUseCase.js';
import { CreatePaymentRequest, UpdatePaymentRequest } from '@alentapp/shared';

import { metrics } from '@opentelemetry/api';
import { createREDMetrics } from '../infrastructure/Telemetry.ts';

const metricas = createREDMetrics();

export class PaymentController {
    constructor(
        private readonly createPaymentUseCase: CreatePaymentUseCase,
        private readonly getPaymentUseCase: GetPaymentUseCase,
        private readonly updatePaymentUseCase: UpdatePaymentUseCase,
        private readonly deletePaymentUseCase: DeletePaymentUseCase
    ) {}

    async create(
        _request: FastifyRequest<{ Body: CreatePaymentRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        try {
            const pago = await this.createPaymentUseCase.execute(_request.body);
            metricas.requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: pago });
        } catch (error: any) {
            if (error.message.includes('inválido')) {
                metricas.errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }

    async update(
        _request: FastifyRequest<{ Params: {id: string}; Body: UpdatePaymentRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        try {
            const { id } = _request.params;
            const pago = await this.updatePaymentUseCase.execute(id, _request.body);
            metricas.requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: pago });
        } catch (error: any) {
            if (error.message.includes('El pago no existe')) {
                metricas.errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (
                error.message.includes('inválido') ||
                error.message.includes('No se puede') ||
                error.message.includes('irreversible') ||
                error.message.includes('volver a modificarse')
            ) {
                metricas.errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }

            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({
                error: "Error interno, reintente más tarde"
            });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }

    async deletePayment(
        _request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        try {
            const { id } = _request.params;
            await this.deletePaymentUseCase.execute(id);
            metricas.requestCounter.add(1, { method, route, status: '204' });
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message === 'El pago no existe') {
                metricas.errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ message: error.message });
            }
            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ message: 'Error al procesar la operación' });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        try {
            const pagos = await this.getPaymentUseCase.execute();
            metricas.requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: pagos });
        } catch (error: any) {
            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: error.message });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }
}
