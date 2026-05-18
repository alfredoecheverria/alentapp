import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { UpdateDisciplineRequest } from '../../../shared/index.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';

export class UpdateDisciplineUseCase {
  constructor(
    private repo: DisciplineRepository,
    private validator: DisciplineValidator
  ) {}

  async execute(id: string, data: UpdateDisciplineRequest) {

    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new Error("La sancion indicada no existe");
    }

    if (existing.deactivated_at) {
      throw new Error("No se puede actualizar una sanción que ya fue finalizada");
    }

    this.validator.validateHasAtLeastOneField(data);
    this.validator.validateDates(data.start_date, data.end_date);

    return this.repo.update(id, data);
  }
}