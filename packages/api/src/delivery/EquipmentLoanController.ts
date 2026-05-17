import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateEquipmentLoanUseCase } from '../application/CreateEquipmentLoanUseCase.js';
import { CreateEquipmentLoanRequest } from '@alentapp/shared';
import { GetEquipmentLoansUseCase } from '../application/GetEquipmentLoanUseCase.js';

export class EquipmentLoanController {

    constructor(
        private readonly createEquipmentLoanUseCase: CreateEquipmentLoanUseCase,
        private readonly getEquipmentLoansUseCase: GetEquipmentLoansUseCase
    ) {}


    async getAll(_request: FastifyRequest, reply: FastifyReply) {
       try {
           const equipmentLoans = await this.getEquipmentLoansUseCase.execute();
           return reply.status(200).send({ data: equipmentLoans });
       } catch (error: any) {
           return reply.status(500).send({ error: error.message });
       }
   }

    async create(
        request: FastifyRequest<{ Body: CreateEquipmentLoanRequest }>,
        reply: FastifyReply
    ) {
        try {
            request.log.info('Alguien pegó al endpoint de ping');
            const equipmentLoan = await this.createEquipmentLoanUseCase.execute(request.body);
            return reply.status(201).send({ data: equipmentLoan });
        } catch (error: any) {
            
            request.log.error(error);

            if (error.message.includes('El usuario no existe')) {
                return reply.status(404).send({ error: error.message });
            }

            if (error.message.includes('Fecha prestamo no puede ser posterior a Fecha Devolucion')) {
                return reply.status(400).send({ error: error.message });
            }

            if (error.message.includes('Solo se permite realizar prestamos a miembros con categoria Senior o Lifetime')) {
                return reply.status(400).send({ error: error.message });
            }

            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }
}

