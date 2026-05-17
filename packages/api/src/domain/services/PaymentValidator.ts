import { PaymentRepository } from "../PaymentRepository.js";
import { PaymentStatus } from "@alentapp/shared/index.js";

export class PaymentValidator {
    constructor(private readonly paymentRepo: PaymentRepository) {}

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

}