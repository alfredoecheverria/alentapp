import { PaymentRepository } from "../domain/PaymentRepository.js";
import { PaymentDTO } from "@alentapp/shared/index.js";

export class GetPaymentUseCase {
    constructor(private readonly paymentRepo: PaymentRepository) {}

    async execute(): Promise<PaymentDTO[]> {
        return this.paymentRepo.findAll();
    }
}