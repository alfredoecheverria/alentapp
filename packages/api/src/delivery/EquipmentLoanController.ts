import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateEquipmentLoanUseCase } from '../application/CreateEquipmentLoanUseCase.js';
import { CreateEquipmentLoanRequest, UpdateEquipmentLoanRequest } from '@alentapp/shared';
import { GetEquipmentLoansUseCase } from '../application/GetEquipmentLoanUseCase.js';
import { UpdateEquipmentLoanUseCase } from '../application/UpdateEquipmentLoanUseCase.js';
import { DeleteEquipmentLoanUseCase } from '../application/DeleteEquipmentLoanUseCase.js';

import { metrics } from '@opentelemetry/api';
import { createREDMetrics } from '../infrastructure/Telemetry.ts';

const metricas = createREDMetrics();

export class EquipmentLoanController {

    constructor(
        private readonly createEquipmentLoanUseCase: CreateEquipmentLoanUseCase,
        private readonly getEquipmentLoansUseCase: GetEquipmentLoansUseCase,
        private readonly updateEquipmentLoanUseCase: UpdateEquipmentLoanUseCase,
        private readonly deleteEquipmentLoanUseCase: DeleteEquipmentLoanUseCase
    ) {}


    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        try {
            const equipmentLoans = await this.getEquipmentLoansUseCase.execute();
            metricas.requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: equipmentLoans });
        } catch (error: any) {
            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: error.message });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }

    async create(
        _request: FastifyRequest<{ Body: CreateEquipmentLoanRequest }>,
        reply: FastifyReply
    ) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        try {
            const equipmentLoan = await this.createEquipmentLoanUseCase.execute(_request.body);
            metricas.requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: equipmentLoan });

        } catch (error: any) {
            if (error.message.includes('El usuario no existe')) {
                metricas.errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }

            if (error.message.includes('Fecha prestamo no puede ser posterior a Fecha Devolucion')) {
                metricas.errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }

            if (error.message.includes('Solo se permite realizar prestamos a miembros con categoria Senior o Lifetime')) {
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
        _request: FastifyRequest<{ Params: { id: string }; Body: UpdateEquipmentLoanRequest }>,
        reply: FastifyReply
    ) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        try {
            const equipmentLoan = await this.updateEquipmentLoanUseCase.execute(_request.params.id, _request.body);
            metricas.requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: equipmentLoan });
        } catch (error: any) {

            if (error.message.includes('El usuario no existe')) {
                metricas.errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }

            if (error.message.includes('El préstamo de equipamiento solicitado no existe')) {
                metricas.errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }

            if (error.message.includes('Fecha prestamo no puede ser posterior a Fecha Devolucion')) {
                metricas.errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }

            if (error.message.includes('Solo se permite realizar prestamos a miembros con categoria Senior o Lifetime')) {
                metricas.errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }

            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: "Error al procesar la operacion, intente mas tarde" });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }

    async delete(_request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        try {
            const { id } = _request.params;
            await this.deleteEquipmentLoanUseCase.execute(id);
            metricas.requestCounter.add(1, { method, route, status: '204' });
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('El préstamo de equipamiento solicitado no existe')) {
                metricas.errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
                //deberia ser 404 pero dejo el 400 por la consistencia con el TDD
            }

            metricas.errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: "Error al procesar la operacion, reintente mas tarde" });
        } finally {
            metricas.requestDuration.record(Date.now() - start, { method, route })
        }
    }
}
