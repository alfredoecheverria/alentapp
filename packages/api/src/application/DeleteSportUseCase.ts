import { SportRepository } from '../domain/SportRepository.ts';

export class DeleteSportUseCase {
    constructor(
        private readonly sportRepo: SportRepository,
        private readonly sportValidator: SportValidator
    ) {}

    async execute(id: string): Promise<void> {
        // 1. Validar existencia del deporte
        await this.sportValidator.validateSportExists(id);

        // 2. Ejecuta la eliminación
        await this.sportRepo.delete(id);
    }
}
