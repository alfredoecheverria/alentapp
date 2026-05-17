import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateEnrollmentUseCase } from '../application/CreateEnrollmentUseCase.ts'
import { CreateEnrollmentRequest } from '@alentapp/shared'

export class EnrollmentController {
    constructor (
        private readonly createEnrollmentUseCase: CreateEnrollmentUseCase,
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreateEnrollmentRequest }>,
        reply: FastifyReply
    ) {
        try {
            const enrollment = await this.createEnrollmentUseCase.execute(request.body);
            return reply.status(201).send({ data: enrollment });
        } catch (error: any) {
            if (error.message.includes('Ya existe una inscripcion del socio a este deporte')
            || error.message.includes('Capacidad máxima del deporte excedida')) {
                return reply.status(409).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
}
