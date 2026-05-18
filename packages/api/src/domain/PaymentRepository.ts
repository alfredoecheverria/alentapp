import { PaymentDTO } from "@alentapp/shared/index.js";

export interface PaymentRepository {
    create(payment: Omit<PaymentDTO, 'id'>): Promise<PaymentDTO>;
    findByMemberId(member_id: string): Promise<PaymentDTO[]>;
    findAll(): Promise<PaymentDTO[]>;
    findById(id: string): Promise<PaymentDTO | null>;
    update(id: string, payment: Partial<Omit<PaymentDTO, 'id'>>): Promise<PaymentDTO>;
    delete(id: string): Promise<void>;
}

