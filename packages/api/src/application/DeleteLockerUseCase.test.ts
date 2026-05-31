import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteLockerUseCase } from './DeleteLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';

describe('DeleteLockerUseCase', () => {
    const mockLockerRepo = {
        delete: vi.fn(),
    } as unknown as LockerRepository;

    const mockLockerValidator = {
        validateLockerExists: vi.fn(),
        validateLockerHasNoMember: vi.fn(),
    } as unknown as LockerValidator;

    const useCase = new DeleteLockerUseCase(mockLockerRepo, mockLockerValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe lanzar error si el locker no existe', async () => {
        vi.mocked(mockLockerValidator.validateLockerExists).mockRejectedValueOnce(new Error('El locker no existe'));

        await expect(useCase.execute('locker-9')).rejects.toThrow('El locker no existe');
        expect(mockLockerRepo.delete).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el locker tiene member asignado', async () => {
        vi.mocked(mockLockerValidator.validateLockerHasNoMember).mockRejectedValueOnce(new Error('No se puede eliminar un locker con member asignado'));

        await expect(useCase.execute('locker-1')).rejects.toThrow('No se puede eliminar un locker con member asignado');
        expect(mockLockerRepo.delete).not.toHaveBeenCalled();
    });

    it('debe eliminar el locker si pasa las validaciones', async () => {
        vi.mocked(mockLockerValidator.validateLockerExists).mockResolvedValueOnce(undefined);
        vi.mocked(mockLockerValidator.validateLockerHasNoMember).mockResolvedValueOnce(undefined);

        await useCase.execute('locker-1');

        expect(mockLockerValidator.validateLockerExists).toHaveBeenCalledWith('locker-1');
        expect(mockLockerValidator.validateLockerHasNoMember).toHaveBeenCalledWith('locker-1');
        expect(mockLockerRepo.delete).toHaveBeenCalledWith('locker-1');
    });
});