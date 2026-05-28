import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateEnrollmentUseCase } from '../application/CreateEnrollmentUseCase.ts'
import { GetEnrollmentsUseCase } from '../application/GetEnrollmentsUseCase.ts'
import { UpdateEnrollmentUseCase } from '../application/UpdateEnrollmentUseCase.ts'
import { DeleteEnrollmentUseCase } from '../application/DeleteEnrollmentUseCase.ts'
import { CreateEnrollmentRequest, UpdateEnrollmentRequest } from '@alentapp/shared'

export class EnrollmentController {
    constructor (
        private readonly createEnrollmentUseCase: CreateEnrollmentUseCase,
        private readonly getEnrollmentsUseCase: GetEnrollmentsUseCase,
        private readonly updateEnrollmentUseCase: UpdateEnrollmentUseCase,
        private readonly deleteEnrollmentUseCase: DeleteEnrollmentUseCase,
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

    async getAll(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        try{
            const enrollments = await this.getEnrollmentsUseCase.execute();
            return reply.status(200).send({ data: enrollments });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    async update(
        request: FastifyRequest<{Params: { id: string }, Body: UpdateEnrollmentRequest}>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;
            const enrollment = await this.updateEnrollmentUseCase.execute(id, request.body);
            return reply.status(200).send({ data: enrollment });
        } catch (error: any) {
            if (error.message.includes('Debe indicar al menos un campo a modificar')) {
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('La inscripción no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('No se puede editar el socio asociado')
            || error.message.includes('No se puede editar el deporte asociado')) {
                return reply.status(409).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde'})
        }
    }

    async delete(
        request: FastifyRequest<{Params: { id: string}}>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;
            await this.deleteEnrollmentUseCase.execute(id);
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('La inscripción no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'error del motor de base de datos'});
        }
    }
}
