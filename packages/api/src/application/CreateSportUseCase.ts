import { SportRepository } from '../domain/SportRepository.ts'
import { SportValidator } from '../domain/services/SportValidator.ts'
import { SportDTO, CreateSportRequest } from '@alentapp/shared'

export class CreateSportUseCase {
    constructor(
        private readonly sportRepository: SportRepository,
        private readonly sportValidator: SportValidator,
    ) {}

    async execute(data: CreateSportRequest): Promise<SportDTO> {
        //1. Validaciones de negocio
        await this.sportValidator.validateNameIsUnique(data.name);
        this.sportValidator.validateMaxCapacity(data.max_capacity);
        if(data.additional_price) {
            this.sportValidator.validateAdditionalPrice(data.additional_price)
        } else {
            data.additional_price = 0;
        }

        //2. Ejecuto registro en base de datos
        const newSport = await this.sportRepository.create(data);

        return newSport;
    }
}
