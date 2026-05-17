import { SportRepository } from '../domain/SportRepository.ts'
import { SportValidator } from '../domain/services/SportValidator.ts'
import { SportDTO, UpdateSportRequest } from '@alentapp/shared'

export class UpdateSportUseCase {
    constructor(
        private readonly sportRepository: SportRepository,
        private readonly sportValidator: SportValidator,
    ) {}

    async execute(id: string, data: UpdateSportRequest): Promise<SportDTO> {
        // Valida que exista el deporte
        await this.sportValidator.validateSportExists(id);

        // Valida que la capacidad sea mayor a 0
        if (data.max_capacity) {
            this.sportValidator.validateMaxCapacity(data.max_capacity);
        }

        // Valida que la descripcion no sea vacia
        this.sportValidator.validateEmptyDescription(data.description);

        let finalData = { max_capacity: data.max_capacity, description: data.description}
        return this.sportRepository.update(id, finalData);
    }
}
