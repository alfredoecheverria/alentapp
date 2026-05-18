import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.ts';
import { EquipmentLoanValidator } from '../domain/services/EquipmentLoanValidator.ts';


export class DeleteEquipmentLoanUseCase {
   constructor(
       private readonly equipmentLoanRepository: EquipmentLoanRepository,
       private readonly equipmentLoanValidator: EquipmentLoanValidator
   ) {}


   async execute(id: string): Promise<void> {
      
       await this.equipmentLoanValidator.validateLoanExists(id);


       await this.equipmentLoanRepository.delete(id);
   }
}
