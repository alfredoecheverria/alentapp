import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client/index.js";
import { PaymentRepository } from "../domain/PaymentRepository.js";
import { PaymentDTO, CreatePaymentRequest } from "@alentapp/shared";

if(!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL enviroment varable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL)
});

type DBPayment = {
    id: string;
    member_id: string;
    amount: float;
    due_date: Date;
    status: 'Pendiente' | 'Pago' | 'Cancelado';
    payment_date: Date;
    year: number;
    month: number;
}

export class PostgresPaymentRepository implements PaymentRepository {
    async create(data: CreatePaymentRequest): Promise<PaymentDTO> {
        const payment = await prisma.payment.create({
            data: {
                member_id: data.member_id,
                amount: data.amount,
                due_date: new Date(data.due_date),
                status: data.status,
                payment_date: new Date(data.payment_date),
                year: data.year,
                month: data.month,
            },
        });

        return this.mapToDTO(payment);
    }

    private mapToDTO(payment: DBPayment): PaymentDTO {
        return {
            id: payment.id,
            member_id: payment.member_id,
            amount: payment.amount,
            due_date: payment.due_date.toISOString().split('T')[0],
            status: payment.status,
            payment_date: payment.payment_date.toISOString().split('T')[0],
            year: payment.year,
            month: payment.month,
        };
    }
}   