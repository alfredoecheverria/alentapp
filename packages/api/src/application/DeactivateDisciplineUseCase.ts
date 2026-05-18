import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';

export class DeactivateDisciplineUseCase {
  constructor(
    private readonly disciplineRepo: DisciplineRepository,
    private readonly disciplineValidator: DisciplineValidator,
  ) {}

  async execute(id: string) {
    const existing = await this.disciplineRepo.findById(id);
    this.disciplineValidator.validateDisciplineExists(existing);
    this.disciplineValidator.validateDisciplineIsActive(existing);

    return this.disciplineRepo.deactivate(id);
  }
}
