import { EquipmentLoanRepository } from '../EquipmentLoanRepository.js';
import { MemberRepository } from '../MemberRepository.js';

export class EquipmentLoanValidator {
    constructor(
        private readonly equipmentLoanRepo: EquipmentLoanRepository,
        private readonly memberRepo: MemberRepository
    ) {}


    async validateLoanMemberExists(memberId: string): Promise<void> {
        
        const memberExists = await this.memberRepo.findById(memberId);
        
        if (!memberExists) {
            throw new Error('El usuario no existe');
        }
    }


    async validateMemberCategoryForLoan(memberId: string): Promise<void> {
        const member = await this.memberRepo.findById(memberId);
        
        if (member && member.category === 'Cadete') {
            throw new Error('Solo se permite realizar prestamos a miembros con categoria Senior o Lifetime');
        }
    }


    async validateLoanExists(loanId: string): Promise<void> {
        const loanExists = await this.equipmentLoanRepo.findById(loanId);
        
        if (!loanExists) {
            throw new Error('El préstamo de equipamiento solicitado no existe');
        }
    }

    //Fecha de prestamo posterior a fecha de devolucion
    validateLoanDates(loanDate: string, dueDate: string): void {
        const loanDateObj = new Date(loanDate);
        const dueDateObj = new Date(dueDate);
        if (loanDateObj >= dueDateObj) {
            throw new Error('Fecha prestamo no puede ser posterior a Fecha Devolucion');
        }
    }
}
