import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/CreateDisciplineUseCase.js';
import { GetDisciplinesUseCase } from '../application/GetDisciplinesUseCase.js';
import { CreateDisciplineRequest, UpdateDisciplineRequest } from '@alentapp/shared';
import { UpdateDisciplineUseCase } from '../application/UpdateDisciplineUseCase.js';

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
        private readonly getDisciplinesUseCase: GetDisciplinesUseCase,
        private readonly updateDisciplineUseCase: UpdateDisciplineUseCase,
    ) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const disciplinas = await this.getDisciplinesUseCase.execute();
            return reply.status(200).send({ data: disciplinas });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    } 
       
    async create(
        request: FastifyRequest<{ Body: CreateDisciplineRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const body = request.body as CreateDisciplineRequest;
            const result = await this.createDisciplineUseCase.execute(body);

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

    async update(
        req: FastifyRequest<{ Params: { id: string }; Body: UpdateDisciplineRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = req.params as { id: string };
            const data = req.body as UpdateDisciplineRequest;

            const result = await this.updateDisciplineUseCase.execute(id, data);

            return reply.code(200).send(result);
        } catch (err: any) {
            if (err.message === "La sanción indicada no existe") {
                return reply.code(404).send({ message: err.message });
            }

            if (err.message.includes("finalizada")) {
                return reply.code(409).send({ message: err.message });
            }
            if (err.message.includes("Debe indicar")) {
            return reply.code(400).send({ message: err.message });
            }

            if (err.message.err.message === "La fecha de fin debe ser posterior a la fecha de inicio") {
            return reply.code(400).send({ message: err.message });
            }

            return reply
            .code(500)
            .send({ message: "Error interno, reintente más tarde" });
        }
    }
}