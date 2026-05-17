import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';
import { EquipmentLoanValidator } from '../domain/services/EquipmentLoanValidator.ts';
import { EquipmentLoanDTO, UpdateEquipmentLoanRequest } from '@alentapp/shared';

export class UpdateEquipmentLoanUseCase {
    constructor(
        private readonly equipmentLoanRepository: EquipmentLoanRepository,
        private readonly equipmentLoanValidator: EquipmentLoanValidator
    ) {}

    async execute(id: string, data: UpdateEquipmentLoanRequest): Promise<EquipmentLoanDTO> {

        // Validacion prestamo existe
        await this.equipmentLoanValidator.validateLoanExists(id);

        // Validacion de fechas
        if (data.loan_date && data.due_date) {
            this.equipmentLoanValidator.validateLoanDates(data.loan_date, data.due_date);
        }

        // Validacion de miembro si se intenta actualizar el member_id
        if (data.member_id) {
            await this.equipmentLoanValidator.validateLoanMemberExists(data.member_id);
            await this.equipmentLoanValidator.validateMemberCategoryForLoan(data.member_id);
        }

        //Validacion Socio no tiene categoria Cadet
        if (data.member_id) {
            await this.equipmentLoanValidator.validateMemberCategoryForLoan(data.member_id);
        }
        

        //Persistencia del prestamo modificado
        const updatedLoan = await this.equipmentLoanRepository.update(id, data);
        
        return updatedLoan;
    }
}