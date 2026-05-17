import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/CreatePaymentUseCase.js';
import { GetPaymentUseCase } from '../application/GetPaymentUseCase.js';
import { UpdatePaymentUseCase } from '../application/UpdatePaymentUseCase.js';

import { CreatePaymentRequest, UpdatePaymentRequest } from '@alentapp/shared/index.js';

export class PaymentController {
    constructor(
        private readonly createPaymentUseCase: CreatePaymentUseCase,
        private readonly getPaymentUseCase: GetPaymentUseCase,
        private readonly updatePaymentUseCase: UpdatePaymentUseCase,
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

                return reply.status(500).send({
                    error: error.message,
                    stack: error.stack
                });
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