import { MemberRepository } from "../domain/MemberRepository.js";
import { PaymentRepository } from "../domain/PaymentRepository.js";
import { PaymentDTO, UpdatePaymentRequest } from "@alentapp/shared";
import { PaymentValidator } from "../domain/services/PaymentValidator.js";

export class UpdatePaymentUseCase {
    constructor(
        private readonly paymentRepo: PaymentRepository,
        private readonly memberRepo: MemberRepository,
        private readonly paymentValidator: PaymentValidator
    ) {}

    async execute(id: string, data: UpdatePaymentRequest): Promise<PaymentDTO> {

        const existingPayment = await this.paymentRepo.findById(id);

        if (!existingPayment) {
            throw new Error('El pago no existe');
        }

        if (data.status) {
            this.paymentValidator.validateStatusTransition(existingPayment.status, data.status);
        }

        if (data.amount !== undefined) this.paymentValidator.validateAmount(data.amount);
        if (data.year !== undefined) this.paymentValidator.validateYearRange(data.year);
        if (data.month !== undefined) this.paymentValidator.validateMonthRange(data.month);

        const member = await this.memberRepo.findById(existingPayment.member_id);
        if (!member) {
            throw new Error(`El socio con ID ${existingPayment.member_id} no existe.`);
        }

        if (data.year || data.month) {
            await this.paymentValidator.validateNoDuplicatePayment(
                existingPayment.member_id,
                data.year ?? existingPayment.year,
                data.month ?? existingPayment.month,
                id 
            );
        }

        return this.paymentRepo.update(id, data);
    }
}