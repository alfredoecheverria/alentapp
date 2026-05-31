import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreatePaymentUseCase } from './CreatePaymentUseCase.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentValidator } from '../domain/services/PaymentValidator.js';
import { CreatePaymentRequest } from '@alentapp/shared';

describe('CreatePaymentUseCase', () => {
    
    const mockPaymentRepo = {
        create: vi.fn(),
    } as unknown as PaymentRepository;

    const mockPaymentValidator = {
        validateAmount: vi.fn(),
        validateDateFormat: vi.fn(),
        validateInitialStatus: vi.fn(),
        validateYearRange: vi.fn(),
        validateMonthRange: vi.fn(),
        validateMemberExists: vi.fn()
    } as unknown as PaymentValidator; 

    const useCase = new CreatePaymentUseCase(mockPaymentRepo, mockPaymentValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe crear un pago exitosamente si pasa las validaciones', async () => {
        const mockRequest: CreatePaymentRequest = {
            member_id: 'member-uuid',
            amount: 100,
            due_date: '2026-04-28',
            payment_date: '2026-04-28',
            status: 'Pago',
            year: 2026,
            month: 6
        };

        vi.mocked(mockPaymentRepo.create).mockResolvedValueOnce({
            id: 'payment-uuid',
            ...mockRequest
        });   

        const result = await useCase.execute(mockRequest);

        expect(mockPaymentValidator.validateAmount).toHaveBeenCalledWith(mockRequest.amount);
        expect(mockPaymentValidator.validateDateFormat).toHaveBeenCalledWith(mockRequest.due_date);
        expect(mockPaymentValidator.validateDateFormat).toHaveBeenCalledWith(mockRequest.payment_date);
        expect(mockPaymentValidator.validateInitialStatus).toHaveBeenCalledWith(mockRequest.status);
        expect(mockPaymentValidator.validateYearRange).toHaveBeenCalledWith(mockRequest.year);
        expect(mockPaymentValidator.validateMonthRange).toHaveBeenCalledWith(mockRequest.month);
        expect(mockPaymentValidator.validateMemberExists).toHaveBeenCalledWith(mockRequest.member_id);

        expect(mockPaymentRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            member_id: 'member-uuid',
            amount: 100,
            due_date: '2026-04-28',
            payment_date: '2026-04-28',
            status: 'Pago',
            year: 2026,
            month: 6
        }));

        expect(result.id).toBe('payment-uuid');
        expect(result.member_id).toBe('member-uuid');
    });
});