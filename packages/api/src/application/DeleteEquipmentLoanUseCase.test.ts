import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteEquipmentLoanUseCase } from './DeleteEquipmentLoanUseCase.js';
import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';

describe('DeleteEquipmentLoanUseCase', () => {
    const mockEquipmentLoanRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as EquipmentLoanRepository;

    const mockValidator = {
        validateLoanExists: vi.fn(),
    } as any;

    const useCase = new DeleteEquipmentLoanUseCase(mockEquipmentLoanRepo, mockValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe lanzar error si el prestamo de equipo no existe', async () => {
        vi.mocked(mockValidator.validateLoanExists).mockRejectedValueOnce(new Error('El prestamo de equipo no existe'));
        vi.mocked(mockEquipmentLoanRepo.findById).mockResolvedValueOnce(null);
        
        await expect(useCase.execute('uuid-999')).rejects.toThrow('El prestamo de equipo no existe');
        expect(mockEquipmentLoanRepo.delete).not.toHaveBeenCalled();
    });

    it('debe eliminar el prestamo de equipo si existe', async () => {
        vi.mocked(mockValidator.validateLoanExists).mockResolvedValueOnce(undefined);
        vi.mocked(mockEquipmentLoanRepo.findById).mockResolvedValueOnce({ id: 'uuid-1' } as any);
        
        await useCase.execute('uuid-1');
        expect(mockEquipmentLoanRepo.delete).toHaveBeenCalledWith('uuid-1');
    });
});