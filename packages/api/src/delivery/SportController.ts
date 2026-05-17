import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/CreateSportUseCase.ts'
import { GetSportsUseCase } from '../application/GetSportsUseCase.ts'
import { CreateSportRequest } from '@alentapp/shared'

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportRequest,
        private readonly getSportsUseCase: GetSportsUseCase,
    ) {}

    async create(
        request: FastifyRequest<{ body: CreateSportRequest }>,
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
}
