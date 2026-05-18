import { PaymentRepository } from "../PaymentRepository.js";
import { MemberRepository } from "../MemberRepository.js";
import { PaymentStatus } from "@alentapp/shared/index.js";

export class PaymentValidator {
    constructor(
        private readonly paymentRepo: PaymentRepository,
        private readonly memberRepo: MemberRepository) {}

    //validacion del monto
    validateAmount(amount: number): void {
        if (amount <= 0) {
            throw new Error('El monto del pago debe ser mayor a cero');
        }
    }

    //validacion del formato de fecha
    validateDateFormat(date: string): void {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/; 
        if (!dateRegex.test(date)) {
            throw new Error('El formato de fecha debe ser YYYY-MM-DD');        }
        
        const parsedDate = Date.parse(date);
        if (isNaN(parsedDate)) {
            throw new Error('La fecha proporcionada no es válida');
        }
    }

    //validacion de estoado de pago
    validateInitialStatus(status: PaymentStatus): void {
        if(status === 'Cancelado') {
            throw new Error('Un pago no puede crearse con estado Cancelado')
        }
    }

    //validacion del rango de año. Basicamente que el año de la cuota puede ser el actual (p.ej. 2026), o el anterior (2025) o el siguiente (2027)
    validateYearRange(year: number): void {
        const currentYear = new Date().getUTCFullYear(); 

        if (year < currentYear - 1 || year > currentYear + 1) { 
            throw new Error(`El año ${year} no está permitido. Debe ser ${currentYear - 1}, ${currentYear} o ${currentYear + 1}`);
        }
    }

    //validacion del rengo de mes. El mes debe ser entre 1 y 12.
    validateMonthRange(month: number): void {
        if (month < 1 || month > 12) { 
            throw new Error(`El mes ${month} es inválido. Debe estar entre 1 y 12`); 
        }
    }

    //validacion de que exista el socio
    async validateMemberExists(memberId: string): Promise<void> {
        const member = await this.memberRepo.findById(memberId);
        
        if (!member) {
            throw new Error(`El socio con ID ${memberId} no existe.`);
        }
    }

    //validacion de que no exista un pago para el mismo socio, año y mes. Esto es para evitar que se creen pagos duplicados.
    async validateNoDuplicatePayment(memberId: string, year: number, month: number, paymentIdToExclude?: string): Promise<void> {
        const payments = await this.paymentRepo.findByMemberId(memberId);
        
        const duplicatePayment = payments.find(payment => 
            payment.year === year && 
            payment.month === month && 
            payment.id !== paymentIdToExclude 
        );
        
        if (duplicatePayment) {
            throw new Error(`Ya existe un pago para el socio ${memberId} en el año ${year} y mes ${month}.`);
        }
    }

    //validacion de que el pago exista
    async validatePaymentExists(paymentId: string): Promise<void> {
        const payment = await this.paymentRepo.findById(paymentId);
        
        if (!payment) {
            throw new Error(`El pago con ID ${paymentId} no existe.`);
        }
    }

    //validacion de que el pago si esta pago no se pueda cambiar a pendiente o cancelado. Tampoco se puede cambiar de pendiente a cancelado.
    // packages/api/src/domain/services/PaymentValidator.ts

    validateStatusTransition(currentStatus: PaymentStatus, newStatus: PaymentStatus): void {
        if (currentStatus === newStatus) return;

        // Si está en Pago, no puede volver a Pendiente
        if (currentStatus === 'Pago' && newStatus === 'Pendiente') {
            throw new Error('No se puede cambiar el estado de un pago que ya fue pagado a Pendiente');
        }

        // Si está modificando, no puede pasar a Cancelado
        if (newStatus === 'Cancelado') {
            throw new Error('No se puede cancelar un pago desde la edición. Use el botón de eliminar.');
        }

        // Si ya está cancelado, es irreversible
        if (currentStatus === 'Cancelado') {
            throw new Error('Un pago cancelado no puede volver a modificarse');
        }
    }

    // esta es para la "baja" 
    validateStatusCancelled(currentStatus: PaymentStatus): void {
        if (currentStatus === 'Cancelado') {
            throw new Error('El pago ya se encuentra cancelado, no se puede realizar ninguna acción');
        }    
    }
}