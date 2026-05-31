import { describe, it, expect, vi, beforeEach } from "vitest";
import { PaymentValidator } from "./PaymentValidator.js";
import { PaymentRepository } from "../PaymentRepository.js";
import { MemberRepository } from "../MemberRepository.js";

describe('PaymentValidator', () => {
    //se crea el mock para aislar el test de la bd
    const mockPaymentRepository = {} as unknown as PaymentRepository;
    const mockMemberRepository = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const validator = new PaymentValidator(mockPaymentRepository, mockMemberRepository);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    //test de monto valido (< 0)
    describe('validateAmount', () => {
        it('debe pasar correctamente si el monto es mayor a cero', () => {
            expect(() => validator.validateAmount(100)).not.toThrow();
        });
        
        it('debe lanzar un error si el monto es menor o igual a cero', () => {
            expect(() => validator.validateAmount(0)).toThrow('El monto del pago debe ser mayor a cero');
            expect(() => validator.validateAmount(-50)).toThrow('El monto del pago debe ser mayor a cero');
        });
    });

    //test de formato de fecha (YYYY-MM-DD)
    describe('validateDateFormat', () => {
        it('debe pasar correctamente si el formato de fecha es válido', () => {
            expect(() => validator.validateDateFormat('2024-06-01')).not.toThrow();
        });

        it('debe lanzar un error si el formato de fecha es inválido', () => {
            expect(() => validator.validateDateFormat('01-06-2024')).toThrow('El formato de fecha debe ser YYYY-MM-DD');
            expect(() => validator.validateDateFormat('2024/06/01')).toThrow('El formato de fecha debe ser YYYY-MM-DD');
        });
    });

    //test de estado inicial (no puede ser Cancelado)
    describe('validateInitialStatus', () => {
        it('debe pasar correctamente si el estado inicial es válido', () => {
            expect(() => validator.validateInitialStatus('Pendiente')).not.toThrow();
            expect(() => validator.validateInitialStatus('Pago')).not.toThrow();
        });

        it('debe lanzar un error si el estado inicial es Cancelado', () => {
            expect(() => validator.validateInitialStatus('Cancelado')).toThrow('Un pago no puede crearse con estado Cancelado');
        });
    });

    //test de rango de año (año actual, anterior o siguiente)
    describe('validateYearRange', () => {
        it('debe pasar correctamente si el año está dentro del rango permitido', () => {
            const currentYear = new Date().getUTCFullYear();
            expect(() => validator.validateYearRange(currentYear)).not.toThrow();
            expect(() => validator.validateYearRange(currentYear - 1)).not.toThrow();
            expect(() => validator.validateYearRange(currentYear + 1)).not.toThrow();
        });

        it('debe lanzar un error si el año está fuera del rango permitido', () => {
            const currentYear = new Date().getUTCFullYear();
            expect(() => validator.validateYearRange(currentYear - 2)).toThrow(`El año ${currentYear - 2} no está permitido. Debe ser ${currentYear - 1}, ${currentYear} o ${currentYear + 1}`);
            expect(() => validator.validateYearRange(currentYear + 2)).toThrow(`El año ${currentYear + 2} no está permitido. Debe ser ${currentYear - 1}, ${currentYear} o ${currentYear + 1}`);
        });
    });

    //test rango de mes (1<= mes <= 12)
    describe('validateMonthRange', () => {
        it('debe pasar correctamente si el mes está dentro del rango permitido', () => {
            expect(() => validator.validateMonthRange(1)).not.toThrow();
            expect(() => validator.validateMonthRange(6)).not.toThrow();
            expect(() => validator.validateMonthRange(12)).not.toThrow();
        });
        
        it('debe lanzar un error si el mes está fuera del rango permitido', () => {
            expect(() => validator.validateMonthRange(0)).toThrow('El mes 0 es inválido. Debe estar entre 1 y 12');
            expect(() => validator.validateMonthRange(13)).toThrow('El mes 13 es inválido. Debe estar entre 1 y 12');
        });
    });
});