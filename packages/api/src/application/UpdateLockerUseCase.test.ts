import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateLockerUseCase } from './UpdateLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { LockerDTO, UpdateLockerRequest } from '@alentapp/shared';

describe('UpdateLockerUseCase', () => {
    const mockLockerRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as LockerRepository;

    const mockLockerValidator = {
        validateNumberIsPositiveAndInt: vi.fn(),
        validateNumberIsUnique: vi.fn(),
        validateFormatMemberId: vi.fn(),
        validateMemberExist: vi.fn(),
        validateMemberHaveLocker: vi.fn(),
        validateStatusAvailableMemberNull: vi.fn(),
        validateStatusMaintenanceMemberNull: vi.fn(),
        validateStatusOccupiedMemberNotNull: vi.fn(),
    } as unknown as LockerValidator;

    const useCase = new UpdateLockerUseCase(mockLockerRepo, mockLockerValidator);

    const mockExistingLocker: LockerDTO = {
        id: 'locker-1',
        number: 1,
        location: 'Gimnasio',
        status: 'Available',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockLockerRepo.findById).mockResolvedValue(mockExistingLocker);
    });

    it('debe lanzar error si el locker no existe', async () => {
        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('locker-2', {})).rejects.toThrow('El locker no existe');
        expect(mockLockerRepo.update).not.toHaveBeenCalled();
    });

    it('debe validar number y member_id y actualizar el locker', async () => {
        const updateData: UpdateLockerRequest = {
            number: 2,
            member_id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'Occupied',
            location: 'Natatorio',
        };

        vi.mocked(mockLockerRepo.update).mockResolvedValueOnce({
            ...mockExistingLocker,
            ...updateData,
        } as LockerDTO);

        await useCase.execute('locker-1', updateData);

        expect(mockLockerValidator.validateNumberIsPositiveAndInt).toHaveBeenCalledWith(2);
        expect(mockLockerValidator.validateNumberIsUnique).toHaveBeenCalledWith(2, 'locker-1');
        expect(mockLockerValidator.validateFormatMemberId).toHaveBeenCalledWith(updateData.member_id);
        expect(mockLockerValidator.validateMemberExist).toHaveBeenCalledWith(updateData.member_id);
        expect(mockLockerValidator.validateMemberHaveLocker).toHaveBeenCalledWith(updateData.member_id);
        expect(mockLockerValidator.validateStatusAvailableMemberNull).toHaveBeenCalledWith('Occupied', updateData.member_id);
        expect(mockLockerValidator.validateStatusMaintenanceMemberNull).toHaveBeenCalledWith('Occupied', updateData.member_id);
        expect(mockLockerValidator.validateStatusOccupiedMemberNotNull).toHaveBeenCalledWith('Occupied', updateData.member_id);
        expect(mockLockerRepo.update).toHaveBeenCalledWith('locker-1', updateData);
    });

});