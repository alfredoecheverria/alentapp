import { PaymentDTO } from "@alentapp/shared/index.js";

export interface PaymentRepository {
    create(payment: Omit<PaymentDTO, 'id'>): Promise<PaymentDTO>;
    findByMemberId(member_id: string): Promise<PaymentDTO[]>;
}

