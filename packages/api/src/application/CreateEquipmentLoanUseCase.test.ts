import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateEquipmentLoanUseCase } from './CreateEquipmentLoanUseCase.js';
import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';
import { EquipmentLoanValidator } from '../domain/services/EquipmentLoanValidator.js';
import { CreateEquipmentLoanRequest } from '@alentapp/shared';

describe('CreateEquipmentLoanUseCase', () => {
    const mockEquipmentLoanRepo = {
        create: vi.fn(),
    } as unknown as EquipmentLoanRepository;

    const mockEquipmentLoanValidator = {
        validateLoanMemberExists: vi.fn(),
        validateMemberCategoryForLoan: vi.fn(),
        validateLoanDates: vi.fn(),
    } as unknown as EquipmentLoanValidator;

    const useCase = new CreateEquipmentLoanUseCase(mockEquipmentLoanRepo, mockEquipmentLoanValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe crear un préstamo de equipo exitosamente si el socio es elegible y el equipo está disponible', async () => {
        const mockRequest: CreateEquipmentLoanRequest = {
            member_id: 'member-123',
            equipment_id: 'equipment-456',
            loan_date: '2026-05-01',
            due_date: '2026-05-10'
        };


        vi.mocked(mockEquipmentLoanValidator.validateLoanMemberExists).mockResolvedValueOnce();
        vi.mocked(mockEquipmentLoanValidator.validateMemberCategoryForLoan).mockResolvedValueOnce();
        vi.mocked(mockEquipmentLoanValidator.validateLoanDates).mockResolvedValueOnce();


        vi.mocked(mockEquipmentLoanRepo.create).mockResolvedValueOnce({
            id: 'loan-789',
            ...mockRequest,
            status: 'Loaned',
            created_at: '2026-04-28T00:00:00.000Z'
        });

        const result = await useCase.execute(mockRequest);


        expect(mockEquipmentLoanValidator.validateLoanMemberExists).toHaveBeenCalledWith(mockRequest.member_id);
        expect(mockEquipmentLoanValidator.validateMemberCategoryForLoan).toHaveBeenCalledWith(mockRequest.member_id);
        expect(mockEquipmentLoanValidator.validateLoanDates).toHaveBeenCalledWith(mockRequest.loan_date, mockRequest.due_date);


        expect(mockEquipmentLoanRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            member_id: 'member-123',
            equipment_id: 'equipment-456',
            status: 'Loaned'
        }));

        expect(result.id).toBe('loan-789');
        expect(result.status).toBe('Loaned');
    });
});