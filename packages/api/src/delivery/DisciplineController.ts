import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/CreateDisciplineUseCase.js';
import { CreateDisciplineRequest } from '@alentapp/shared';

import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/CreateDisciplineUseCase.js';
import { CreateDisciplineRequest } from '@alentapp/shared';

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreateDisciplineRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const result = await this.createDisciplineUseCase.execute(request.body);

            return reply.code(201).send({
                message: 'Sancion creada correctamente',
                data: result 
            });

        } catch (error: any) {
            if (error.message === 'El socio indicado no existe') {
                return reply.code(404).send({
                    message: error.message
                });
            }

            if (error.message.includes('fecha')) {
                return reply.code(400).send({
                    message: error.message
                });
            }

            return reply.code(500).send({
                message: 'Error interno, reintente más tarde'
            });
        }
    }
}