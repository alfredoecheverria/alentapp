import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/CreatePaymentUseCase.js';
import { GetPaymentUseCase } from '../application/GetPaymentUseCase.js';
import { UpdatePaymentUseCase } from '../application/UpdatePaymentUseCase.js';
import { DeletePaymentUseCase } from '../application/DeletePaymentUseCase.js';

import { CreatePaymentRequest, UpdatePaymentRequest } from '@alentapp/shared';

export class PaymentController {
    constructor(
        private readonly createPaymentUseCase: CreatePaymentUseCase,
        private readonly getPaymentUseCase: GetPaymentUseCase,
        private readonly updatePaymentUseCase: UpdatePaymentUseCase,
        private readonly deletePaymentUseCase: DeletePaymentUseCase
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreatePaymentRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const pago = await this.createPaymentUseCase.execute(request.body);
            return reply.status(201).send({ data: pago });
        } catch (error: any) {
            if (error.message.includes('inválido')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }

    async update(
        request: FastifyRequest<{ Params: {id: string}; Body: UpdatePaymentRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            const pago = await this.updatePaymentUseCase.execute(id, request.body);
            return reply.status(200).send({ data: pago });
        } catch (error: any) {
            console.error(error);

            if (error.message.includes('El pago no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            if (
                error.message.includes('inválido') || 
                error.message.includes('No se puede') || 
                error.message.includes('irreversible') ||
                error.message.includes('volver a modificarse')
            ) {
                return reply.status(400).send({ error: error.message });
            }

            return reply.status(500).send({
                error: "Error interno, reintente más tarde"
            });
        }
    }

    async deletePayment(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            await this.deletePaymentUseCase.execute(id);

            return reply.status(204).send();
        } catch (error: any) {
            if (error.message === 'El pago no existe') {
                return reply.status(400).send({ message: error.message });
            }
            return reply.status(500).send({ message: 'Error al procesar la operación' });
        }
    }

    async getAll(_request: FastifyRequest, reply: FastifyReply) { 
        try {
            const pagos = await this.getPaymentUseCase.execute();
            return reply.status(200).send({ data: pagos });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }
}