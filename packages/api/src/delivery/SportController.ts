import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/CreateSportUseCase.ts'
import { GetSportsUseCase } from '../application/GetSportsUseCase.ts'
import { UpdateSportUseCase } from '../application/UpdateSportUseCase.ts'
import { DeleteSportUseCase } from '../application/DeleteSportUseCase.ts'
import { CreateSportRequest, UpdateSportRequest } from '@alentapp/shared'

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly getSportsUseCase: GetSportsUseCase,
        private readonly updateSportUseCase: UpdateSportsUseCase,
        private readonly deleteSportUseCase: DeleteSportsUseCase,
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreateSportRequest }>,
        reply: FastifyReply
    ) {
        try {
            const sport = await this.createSportUseCase.execute(request.body);
            return reply.status(201).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('Ya existe un deporte con ese nombre')) {
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('Capacidad máxima inválida') || error.message.includes('El valor de precio adicional debe ser un numero igual o mayor a 0')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: error.message });
        }
    }

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const sports = await this.getSportsUseCase.execute();
            return reply.status(200).send({ data: sports });
        } catch (error: any) {
            console.log(sports);
            return reply.status(500).send({ error: error.message });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }, Body: UpdateSportRequest }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;
            const sport = await this.updateSportUseCase.execute(id, request.body);
            return reply.status(200).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('El deporte no existe')
            || error.message.includes('Descripción de deporte inválida')
            || error.message.includes('Capacidad máxima inválida')) {
                return reply.status(400).send({ error: error.message });
            }

            return reply.status(500).send({ error: error.message });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            await this.deleteSportUseCase.execute(id);
            return reply.status(204).send(); // No Content
        } catch (error: any) {
            if (error.message.includes('El deporte no existe') {
                return reply.status(400).send({ error: error.message })
            }
            return reply.status(500).send({ error: 'error del motor de base de datos' });
        }
    }
}
