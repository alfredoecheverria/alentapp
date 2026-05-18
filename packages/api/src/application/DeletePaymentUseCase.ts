import { PaymentRepository } from "../domain/PaymentRepository.js";
import { PaymentValidator } from "../domain/services/PaymentValidator.js";

export class DeletePaymentUseCase {
    constructor(private readonly paymentRepo: PaymentRepository, private readonly paymentValidator: PaymentValidator) {}

    async execute(id: string): Promise<void> {

        const existingPayment = await this.paymentRepo.findById(id);
        
        if (!existingPayment) {
            throw new Error('El pago no existe');
        }
        this.paymentValidator.validateStatusCancelled(existingPayment.status);

        await this.paymentRepo.delete(id);
    }
}