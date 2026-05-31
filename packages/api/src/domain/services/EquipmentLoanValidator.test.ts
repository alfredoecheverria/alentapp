import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EquipmentLoanRepository } from '../EquipmentLoanRepository.js';
import { EquipmentLoanValidator } from './EquipmentLoanValidator.js';
import { MemberRepository } from '../MemberRepository.js';

describe('EquipmentLoanValidator', () => {

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const mockEquipmentLoanRepo = {
        findById: vi.fn(),
    } as unknown as EquipmentLoanRepository;


    const validator = new EquipmentLoanValidator(mockEquipmentLoanRepo, mockMemberRepo);


    beforeEach(() => {
        vi.clearAllMocks();
    });


    describe('validateLoanMemberExists', () => {
        it('debe pasar si el miembro no existe en la base de datos', async () => {
            vi.mocked(mockMemberRepo.findById).mockResolvedValue(null);
            await expect(validator.validateLoanMemberExists('nonexistent-member-id')).rejects.toThrow('El usuario no existe');
            expect(mockMemberRepo.findById).toHaveBeenCalledWith('nonexistent-member-id');
        });
    });

    describe('validateMemberCategoryForLoan', () => {
        it('debe pasar si el miembro tiene categoria Senior o Lifetime', async () => {
            vi.mocked(mockMemberRepo.findById).mockResolvedValue({ id: 'member-id', category: 'Senior' });
            await expect(validator.validateMemberCategoryForLoan('member-id')).resolves.toBeUndefined();
            expect(mockMemberRepo.findById).toHaveBeenCalledWith('member-id');
        });

        it('debe lanzar error si el miembro tiene categoria Cadete', async () => {
            vi.mocked(mockMemberRepo.findById).mockResolvedValue({ id: 'member-id', category: 'Cadete' });
            await expect(validator.validateMemberCategoryForLoan('member-id')).rejects.toThrow('Solo se permite realizar prestamos a miembros con categoria Senior o Lifetime');
            expect(mockMemberRepo.findById).toHaveBeenCalledWith('member-id');
        });
    });

    describe('validateLoanDates', () => {
        it('debe pasar si la fecha de prestamo es anterior a la fecha de devolucion', () => {
            expect(() => validator.validateLoanDates('2023-01-01', '2023-01-10')).not.toThrow();
        });

        it('debe lanzar error si la fecha de prestamo es posterior a la fecha de devolucion', () => {
            expect(() => validator.validateLoanDates('2023-01-10', '2023-01-01')).toThrow('Fecha prestamo no puede ser posterior a Fecha Devolucion');
        });

        it('debe lanzar error si la fecha de prestamo es igual a la fecha de devolucion', () => {
            expect(() => validator.validateLoanDates('2023-01-01', '2023-01-01')).toThrow('Fecha prestamo no puede ser posterior a Fecha Devolucion');
        });
    });

    describe('validateLoanExists', () => {
       it('debe pasar si el préstamo de equipamiento existe en la base de datos', async () => {
           vi.mocked(mockEquipmentLoanRepo.findById).mockResolvedValue({ id: 'loan-id' });
           await expect(validator.validateLoanExists('loan-id')).resolves.toBeUndefined();
           expect(mockEquipmentLoanRepo.findById).toHaveBeenCalledWith('loan-id');
       });
  
       it('debe lanzar error si el préstamo de equipamiento no existe en la base de datos', async () => {
           vi.mocked(mockEquipmentLoanRepo.findById).mockResolvedValue(null);
           await expect(validator.validateLoanExists('nonexistent-loan-id')).rejects.toThrow('El préstamo de equipamiento solicitado no existe');
           expect(mockEquipmentLoanRepo.findById).toHaveBeenCalledWith('nonexistent-loan-id');
       });
   });
});