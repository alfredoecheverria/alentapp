import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LockerRepository } from '../LockerRepository.js';
import { LockerValidator } from './LockerValidator.js';
import { MemberRepository } from '../MemberRepository.js';

describe('LockerValidator', () => {
    const mockLockerRepository = {
        findByNumber: vi.fn(),
        findById: vi.fn(),
        findByMemberId: vi.fn(),
    } as unknown as LockerRepository;

    const mockMemberRepository = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const validator = new LockerValidator(mockLockerRepository, mockMemberRepository);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validateNumberIsUnique', () => {
        it('debe pasar si el número no existe en la base de datos', async () => {
            vi.mocked(mockLockerRepository.findByNumber).mockResolvedValueOnce(null);

            await expect(validator.validateNumberIsUnique(2)).resolves.not.toThrow();
            expect(mockLockerRepository.findByNumber).toHaveBeenCalledWith(2);
        });

        it('debe lanzar error si existe otro locker con el mismo número', async () => {
            vi.mocked(mockLockerRepository.findByNumber).mockResolvedValueOnce({ id: 'locker-1', number: 2 } as any);

            await expect(validator.validateNumberIsUnique(2)).rejects.toThrow('Ya existe un locker con ese número');
            expect(mockLockerRepository.findByNumber).toHaveBeenCalledWith(2);
        });

        it('debe pasar si el locker encontrado tiene el mismo id ', async () => {
            vi.mocked(mockLockerRepository.findByNumber).mockResolvedValueOnce({ id: 'locker-1', number: 2 } as any);

            await expect(validator.validateNumberIsUnique(2, 'locker-1')).resolves.not.toThrow();
            expect(mockLockerRepository.findByNumber).toHaveBeenCalledWith(2);
        });
    });

    describe('validateNumberIsPositiveAndInt', () => {
        it('debe pasar con un número entero positivo', () => {
            expect(() => validator.validateNumberIsPositiveAndInt(2)).not.toThrow();
            expect(() => validator.validateNumberIsPositiveAndInt(1)).not.toThrow();
        });

        it('debe lanzar si el número no es entero o no es positivo', () => {
            expect(() => validator.validateNumberIsPositiveAndInt(0)).toThrow('`number` debe ser entero y mayor a cero');
            expect(() => validator.validateNumberIsPositiveAndInt(-1)).toThrow('`number` debe ser entero y mayor a cero');
            expect(() => validator.validateNumberIsPositiveAndInt(1.5)).toThrow('`number` debe ser entero y mayor a cero');
        });
    });

    describe('validateMemberExist', () => {
        it('debe pasar si el miembro existe', async () => {
            vi.mocked(mockMemberRepository.findById).mockResolvedValueOnce({ id: 'miembro-1' } as any);

            await expect(validator.validateMemberExist('miembro-1')).resolves.not.toThrow();
            expect(mockMemberRepository.findById).toHaveBeenCalledWith('miembro-1');
        });

        it('debe lanzar si el miembro no existe', async () => {
            vi.mocked(mockMemberRepository.findById).mockResolvedValueOnce(null);

            await expect(validator.validateMemberExist('missing')).rejects.toThrow('El miembro indicado no existe');
        });
    });

    describe('validateMemberHaveLocker', () => {
        it('debe pasar si el miembro no tiene locker', async () => {
            vi.mocked(mockLockerRepository.findByMemberId).mockResolvedValueOnce(null);

            await expect(validator.validateMemberHaveLocker('miembro-1')).resolves.not.toThrow();
            expect(mockLockerRepository.findByMemberId).toHaveBeenCalledWith('miembro-1');
        });

        it('debe lanzar si el miembro ya tiene un locker', async () => {
            vi.mocked(mockLockerRepository.findByMemberId).mockResolvedValueOnce({ id: 'locker-1', member_id: 'miembro-1' } as any);

            await expect(validator.validateMemberHaveLocker('member-1')).rejects.toThrow('El miembro ya posee un locker');
        });
    });

    describe('validateStatusAvailableMemberNull', () => {
        it('debe pasar cuando status es Available y member_id es null/undefined', () => {
            expect(() => validator.validateStatusAvailableMemberNull('Available')).not.toThrow();
            expect(() => validator.validateStatusAvailableMemberNull('Available', undefined)).not.toThrow();
        });

        it('debe lanzar si status es Available y member_id no es null', () => {
            expect(() => validator.validateStatusAvailableMemberNull('Available', 'miembro-1')).toThrow('Estado Available no permite member_id');
        });
    });

    describe('validateStatusOccupiedMemberNotNull', () => {
        it('debe pasar cuando status es Occupied y member_id no es null', () => {
            expect(() => validator.validateStatusOccupiedMemberNotNull('Occupied', 'miembro-1')).not.toThrow();
        });

        it('debe lanzar si status es Occupied y member_id es null/undefined', () => {
            expect(() => validator.validateStatusOccupiedMemberNotNull('Occupied')).toThrow('Estado Occupied requiere member_id');
            expect(() => validator.validateStatusOccupiedMemberNotNull('Occupied', undefined)).toThrow('Estado Occupied requiere member_id');
        });
    });

    describe('validateStatusMaintenanceMemberNull', () => {
        it('debe pasar cuando status es Maintenance y member_id es null/undefined', () => {
            expect(() => validator.validateStatusMaintenanceMemberNull('Maintenance')).not.toThrow();
            expect(() => validator.validateStatusMaintenanceMemberNull('Maintenance', undefined)).not.toThrow();
        });

        it('debe lanzar si status es Maintenance y member_id no es null', () => {
            expect(() => validator.validateStatusMaintenanceMemberNull('Maintenance', 'miembro-1')).toThrow('Estado Maintenance no permite member_id');
        });
    });

    describe('validateFormatMemberId', () => {
        it('debe pasar cuando member_id es null/undefined', () => {
            expect(() => validator.validateFormatMemberId()).not.toThrow();
            expect(() => validator.validateFormatMemberId(undefined)).not.toThrow();
        });

        it('debe pasar con ID válido', () => {
            const validUuid = '705e6567-e97b-41d1-a012-453204174000';
            expect(() => validator.validateFormatMemberId(validUuid)).not.toThrow();
        });

        it('debe lanzar si el ID es inválido', () => {
            expect(() => validator.validateFormatMemberId('asdfads')).toThrow('member_id no válido');
            expect(() => validator.validateFormatMemberId('1234')).toThrow('member_id no válido');
        });
    });

});
