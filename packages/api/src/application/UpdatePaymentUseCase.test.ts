import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdatePaymentUseCase } from './UpdatePaymentUseCase.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentValidator } from '../domain/services/PaymentValidator.js';
import { UpdatePaymentRequest, PaymentDTO } from '@alentapp/shared';
import { MemberRepository } from '../domain/MemberRepository.js';

describe('UpdatePaymentUseCase', () => {
    const mockPaymentRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as PaymentRepository;


    const mockPaymentValidator = {
        validateStatusTransition: vi.fn(),
        validateStatusCancelled: vi.fn(),
        validateAmount: vi.fn(),
    } as unknown as PaymentValidator;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const useCase = new UpdatePaymentUseCase(mockPaymentRepo, mockMemberRepo, mockPaymentValidator);

    const mockExistingPayment: PaymentDTO = {
        id: 'uuid-1',
        member_id: 'member-1',
        amount: 100,
        due_date: '2026-05-01',
        payment_date: '2026-05-02',
        status: 'Pendiente',
        year: 2026,
        month: 5,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockPaymentRepo.findById).mockResolvedValue(mockExistingPayment);
        vi.mocked(mockPaymentValidator.validateStatusTransition).mockReturnValue(undefined);
        vi.mocked(mockPaymentValidator.validateAmount).mockReturnValue(undefined);
        vi.mocked(mockMemberRepo.findById).mockResolvedValue({ id: 'member-1', name: 'Socio Test' } as any);
    });
    
    it('debe lanzar error si el pago no existe', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(null);
        await expect(useCase.execute('uuid-no', {})).rejects.toThrow('El pago no existe');
    });

    it('debe actualizar el pago correctamente', async () => {
        const updateData: UpdatePaymentRequest = { amount: 150, status: 'Pago' };
        const updatedPayment: PaymentDTO = { ...mockExistingPayment, ...updateData };
        vi.mocked(mockPaymentRepo.update).mockResolvedValueOnce(updatedPayment);
        
        const result = await useCase.execute('uuid-1', updateData);
        
        expect(mockPaymentRepo.update).toHaveBeenCalledWith('uuid-1', updateData);
        expect(result).toEqual(updatedPayment);
    });

    it('debe validar la transición de estado', async () => {
        const updateData: UpdatePaymentRequest = { status: 'Pago' };
        await useCase.execute('uuid-1', updateData);
        
        expect(mockPaymentValidator.validateStatusTransition).toHaveBeenCalledWith('Pendiente', 'Pago');
    });

    it('debe validar que el miembro exista', async () => {
        const updateData: UpdatePaymentRequest = { amount: 150 };
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);
        
        await expect(useCase.execute('uuid-1', updateData)).rejects.toThrow('El socio con ID member-1 no existe.');
    });
});