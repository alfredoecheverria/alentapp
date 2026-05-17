import { FastifyReply, FastifyRequest } from 'fastify';
import { NewLockerUseCase } from '../application/NewLockerUseCase.js';
import { CreateLockerRequest } from '@alentapp/shared';

export class LockerController {
    constructor(private readonly newLockerUseCase: NewLockerUseCase) {}

    async create(
        request: FastifyRequest<{ Body: CreateLockerRequest }>,
        reply: FastifyReply,
    ) {
        try {
            request.log.info('Alguien pegó al endpoint de lockers');
            const locker = await this.newLockerUseCase.execute(request.body);
            return reply.status(201).send({ data: locker });
        } catch (error: any) {
            const msg = (error && error.message) ? String(error.message) : '';

            if (msg === 'Ya existe un locker con ese número') {
                return reply.status(409).send({ error: msg });
            }

            if (msg === 'number debe ser entero y mayor a cero') {
                return reply.status(400).send({ error: msg });
            }

            if (msg === '`member_id` no válido') {
                return reply.status(400).send({ error: msg });
            }

            if (msg === 'El miembro indicado no existe') {
                return reply.status(404).send({ error: msg });
            }

            if (msg === 'El miembro ya posee un locker') {
                return reply.status(422).send({ error: msg });
            }

            if (msg.startsWith('Estado Available') || msg.startsWith('Estado Occupied') || msg.startsWith('Estado Maintenance')) {
                return reply.status(422).send({ error: msg });
            }

            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }
}