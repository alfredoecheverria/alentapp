import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';
import { EquipmentLoanValidator } from '../domain/services/EquipmentLoanValidator.js';
import { EquipmentLoanDTO, CreateEquipmentLoanRequest } from '@alentapp/shared';

export class CreateEquipmentLoanUseCase {
    constructor(
        private readonly equipmentLoanRepository: EquipmentLoanRepository,
        private readonly equipmentLoanValidator: EquipmentLoanValidator
    ) {}

    async execute(data: CreateEquipmentLoanRequest): Promise<EquipmentLoanDTO> {

        // Validaciones de negocio4
        await this.equipmentLoanValidator.validateLoanMemberExists(data.member_id);
        await this.equipmentLoanValidator.validateMemberCategoryForLoan(data.member_id);
        this.equipmentLoanValidator.validateLoanDates(data.loan_date, data.due_date);

        // Persistencia a través de la interfaz
        const nuevoPrestamo = await this.equipmentLoanRepository.create({
            ...data,
            status: 'Loaned'
        });

        return nuevoPrestamo;
    }
}
