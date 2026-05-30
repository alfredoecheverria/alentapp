import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateLockerUseCase } from './CreateLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { CreateLockerRequest, LockerDTO } from '@alentapp/shared';

describe('CreateLockerUseCase', () => {
    // 1. Creamos mocks de nuestras dependencias (puertos y servicios)
    const mockLockerRepository = {
        create: vi.fn(),
    } as unknown as LockerRepository;

    const mockLockerValidator = {
        validateNumberIsPositiveAndInt: vi.fn(),
        validateFormatMemberId: vi.fn(),
        validateMemberExist: vi.fn(),
        validateMemberHaveLocker: vi.fn(),
        validateStatusAvailableMemberNull: vi.fn(),
        validateStatusMaintenanceMemberNull: vi.fn(),
        validateStatusOccupiedMemberNotNull: vi.fn(),
        validateNumberIsUnique: vi.fn(),
    } as unknown as LockerValidator;

    // 2. Instanciamos el caso de uso inyectando los mocks
    const useCase = new CreateLockerUseCase(mockLockerRepository, mockLockerValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe crear un locker con status Available cuando no se envía status ni member_id', async () => {
        const mockRequest: CreateLockerRequest = {
            number: 1,
            location: 'Gimnasio',
        };

        vi.mocked(mockLockerRepository.create).mockResolvedValueOnce({
            id: 'locker-1',
            number: 1,
            location: 'Gimnasio',
            status: 'Available',
        } as LockerDTO);

        const result = await useCase.execute(mockRequest);

        expect(mockLockerValidator.validateNumberIsPositiveAndInt).toHaveBeenCalledWith(1);
        expect(mockLockerValidator.validateStatusAvailableMemberNull).toHaveBeenCalledWith('Available', undefined);
        expect(mockLockerValidator.validateStatusMaintenanceMemberNull).toHaveBeenCalledWith('Available', undefined);
        expect(mockLockerValidator.validateStatusOccupiedMemberNotNull).toHaveBeenCalledWith('Available', undefined);
        expect(mockLockerValidator.validateNumberIsUnique).toHaveBeenCalledWith(1);

        expect(mockLockerRepository.create).toHaveBeenCalledWith({
            number: 1,
            location: 'Gimnasio',
            status: 'Available',
        });

        expect(result.id).toBe('locker-1');
        expect(result.status).toBe('Available');
    });

    it('debe validar member_id y crear el locker con el status enviado', async () => {
        const mockRequest: CreateLockerRequest = {
            number: 2,
            location: 'Natatorio',
            status: 'Occupied',
            member_id: '1234e4567-e89b-12d3-a456-426614174000',
        };

        vi.mocked(mockLockerRepository.create).mockResolvedValueOnce({
            id: 'locker-2',
            number: 2,
            location: 'Natatorio',
            status: 'Occupied',
            member_id: mockRequest.member_id,
        } as LockerDTO);

        const result = await useCase.execute(mockRequest);

        expect(mockLockerValidator.validateNumberIsPositiveAndInt).toHaveBeenCalledWith(2);
        expect(mockLockerValidator.validateFormatMemberId).toHaveBeenCalledWith(mockRequest.member_id);
        expect(mockLockerValidator.validateMemberExist).toHaveBeenCalledWith(mockRequest.member_id);
        expect(mockLockerValidator.validateMemberHaveLocker).toHaveBeenCalledWith(mockRequest.member_id);
        expect(mockLockerValidator.validateStatusAvailableMemberNull).toHaveBeenCalledWith('Occupied', mockRequest.member_id);
        expect(mockLockerValidator.validateStatusMaintenanceMemberNull).toHaveBeenCalledWith('Occupied', mockRequest.member_id);
        expect(mockLockerValidator.validateStatusOccupiedMemberNotNull).toHaveBeenCalledWith('Occupied', mockRequest.member_id);
        expect(mockLockerValidator.validateNumberIsUnique).toHaveBeenCalledWith(2);

        expect(mockLockerRepository.create).toHaveBeenCalledWith({
            number: 2,
            location: 'Natatorio',
            status: 'Occupied',
            member_id: mockRequest.member_id,
        });

        expect(result.id).toBe('locker-2');
        expect(result.member_id).toBe(mockRequest.member_id);
    });
});