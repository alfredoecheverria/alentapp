import { PaymentRepository } from "../domain/PaymentRepository.js";
import { PaymentDTO, CreatePaymentRequest } from '@alentapp/shared';
import { PaymentValidator } from '../domain/services/PaymentValidator.js';

export class CreatePaymentUseCase {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly paymentValidator: PaymentValidator 
    ) {}
    async execute(data: CreatePaymentRequest):Promise<PaymentDTO> {

        this.paymentValidator.validateAmount(data.amount);
        this.paymentValidator.validateDateFormat(data.due_date)
        this.paymentValidator.validateDateFormat(data.payment_date)
        this.paymentValidator.validateInitialStatus(data.status)
        this.paymentValidator.validateYearRange(data.year)
        this.paymentValidator.validateMonthRange(data.month)
        this.paymentValidator.validateMemberExists(data.member_id)

        const nuevoPago = await this.paymentRepository.create({
            ...data
        });

        return nuevoPago;
    }
}