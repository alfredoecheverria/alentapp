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
    amount: number;
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
                member: {
                    connect: { id: data.member_id }
                } ,
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

    findAll(): Promise<PaymentDTO[]> {
        return prisma.payment.findMany({
        }).then(payments => payments.map(this.mapToDTO));
    }

    findById(id: string): Promise<PaymentDTO | null> {
        return prisma.payment.findUnique({
            where: { id },
        }).then(payment => payment ? this.mapToDTO(payment) : null);
    }

    findByMemberId(member_id: string): Promise<PaymentDTO[]> {
        return prisma.payment.findMany({
            where: { member_id }
        }).then(payments => payments.map(this.mapToDTO));
    }

    private mapToDTO(payment: DBPayment): PaymentDTO {
        return {
            id: payment.id,
            member_id: payment.member_id,
            amount: payment.amount,
            due_date: payment.due_date.toISOString().split('T')[0] ?? '',
            status: payment.status,
            payment_date: payment.payment_date.toISOString().split('T')[0] ?? '',
            year: payment.year,
            month: payment.month,
        };
    }

    async update(id: string, data: Partial<CreatePaymentRequest>): Promise<PaymentDTO> {
        const payment = await prisma.payment.update({
            where: { id },
            data: {
                ...(data.amount !== undefined && { amount: data.amount }),
                ...(data.status && { status: data.status }),
                ...(data.due_date && { due_date: new Date(data.due_date) }),
                ...(data.payment_date && { payment_date: new Date(data.payment_date) }),
                ...(data.year !== undefined && { year: data.year }),
                ...(data.month !== undefined && { month: data.month }),
                ...(data.member_id && {
                    member: { connect: { id: data.member_id } }
                }),
            },
        });

        return this.mapToDTO(payment);
    }

    async delete(id: string): Promise<void> {    
        await prisma.payment.update({
            where: { id },
            data: { 
                status: 'Cancelado'
            }
        });
    }
}   