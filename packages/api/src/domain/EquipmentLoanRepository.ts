import { EquipmentLoanDTO } from '@alentapp/shared';

export interface EquipmentLoanRepository {
  create(loan: Omit<EquipmentLoanDTO, 'id'>): Promise<EquipmentLoanDTO>;
}