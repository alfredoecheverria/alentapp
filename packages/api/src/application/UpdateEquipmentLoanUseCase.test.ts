import { describe, it, vi, beforeEach, expect } from "vitest";
import { UpdateEquipmentLoanUseCase } from "./UpdateEquipmentLoanUseCase.js";
import { EquipmentLoanRepository } from "../domain/EquipmentLoanRepository.js";
import { EquipmentLoanValidator } from "../domain/services/EquipmentLoanValidator.js";
import { EquipmentLoanDTO, EquipmentLoanStatus } from "@alentapp/shared";

describe('UpdateEquipmentLoanUseCase', () => {
    const mockEquipmentLoanRepository = {
        update: vi.fn(),
        findById: vi.fn(),
    } as unknown as EquipmentLoanRepository;


    const mockValidator = {
        validateLoanExists: vi.fn(),
        validateLoanMemberExists: vi.fn(),
        validateMemberCategoryForLoan: vi.fn(),
        validateLoanDates: vi.fn(),
        validateEmptyItemName: vi.fn(),
        validateValidStatus: vi.fn(),
    } as unknown as EquipmentLoanValidator;

    const updateEquipmentLoanUseCase = new UpdateEquipmentLoanUseCase(mockEquipmentLoanRepository, mockValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe fallar si el prestamo no existe', async () => {
        vi.mocked(mockValidator.validateLoanExists).mockRejectedValueOnce(new Error('El préstamo no existe'));
        
        await expect(updateEquipmentLoanUseCase.execute('uuid-test', {}))
            .rejects
            .toThrow('El préstamo no existe');
    });

    it('debe fallar si el miembro no existe', async () => {
        vi.mocked(mockValidator.validateLoanExists).mockResolvedValueOnce(undefined);
        vi.mocked(mockValidator.validateLoanMemberExists).mockRejectedValueOnce(new Error('El usuario no existe'));
        
        await expect(updateEquipmentLoanUseCase.execute('uuid-test', { member_id: 'member-id' }))
            .rejects
            .toThrow('El usuario no existe');
    });

    it('debe fallar si la fecha de prestamo es posterior a la fecha de devolucion', async () => {
        vi.mocked(mockValidator.validateLoanExists).mockResolvedValueOnce(undefined);
        
        vi.mocked(mockValidator.validateLoanDates).mockImplementationOnce(() => {
            throw new Error('Fecha prestamo no puede ser posterior a Fecha Devolucion');
        });

        await expect(updateEquipmentLoanUseCase.execute('uuid-test', { loan_date: '2023-01-10', due_date: '2023-01-01' }))
            .rejects
            .toThrow('Fecha prestamo no puede ser posterior a Fecha Devolucion');
    });

    it('debe actualizar el prestamo correctamente', async () => {
        const updatedLoan: EquipmentLoanDTO = {
            id: 'uuid-test',
            item_name: 'item-name',
            status: "Damaged",
            loan_date: "",
            due_date: "",
            member_id: ""
        };
        
        vi.mocked(mockValidator.validateLoanExists).mockResolvedValueOnce(undefined);
        vi.mocked(mockValidator.validateLoanMemberExists).mockResolvedValueOnce(undefined);
        vi.mocked(mockValidator.validateMemberCategoryForLoan).mockResolvedValueOnce(undefined);
        vi.mocked(mockValidator.validateLoanDates).mockReturnValueOnce(undefined);
        vi.mocked(mockEquipmentLoanRepository.update).mockResolvedValueOnce(updatedLoan);

        const result = await updateEquipmentLoanUseCase.execute('uuid-test', { 
            member_id: 'member-id', 
            loan_date: '2023-01-01', 
            due_date: '2023-01-10' 
        });
        
        expect(result).toEqual(updatedLoan);
        expect(mockValidator.validateLoanExists).toHaveBeenCalledWith('uuid-test');
        expect(mockValidator.validateLoanMemberExists).toHaveBeenCalledWith('member-id');
        expect(mockValidator.validateMemberCategoryForLoan).toHaveBeenCalledWith('member-id');
        expect(mockValidator.validateLoanDates).toHaveBeenCalledWith('2023-01-01', '2023-01-10');
        expect(mockEquipmentLoanRepository.update).toHaveBeenCalledWith('uuid-test', { 
            member_id: 'member-id', 
            loan_date: '2023-01-01', 
            due_date: '2023-01-10' 
        });
    });
});