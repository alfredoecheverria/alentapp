import { DisciplineRepository } from "../domain/DisciplineRepository.js";
import { DisciplineValidator } from "../domain/services/DisciplineValidator.js";
import { MemberValidator } from "../domain/services/MemberValidator.js";
import { CreateDisciplineRequest, DisciplineDTO } from "../../../shared/index.js";

export class CreateDisciplineUseCase {
    constructor(
        private readonly disciplineRepo: DisciplineRepository,
        private readonly disciplineValidator: DisciplineValidator,
        private readonly memberValidator: MemberValidator
    ) {}

    async execute(data: CreateDisciplineRequest): Promise<DisciplineDTO> {
        // Validamos que el miembro exista
        await this.memberValidator.validateExists(data.member_id);

        // Validamos las fechas
        this.disciplineValidator.validateDates(
            data.start_date,
            data.end_date
        );

        // Persistimos la sanción
        const discipline = await this.disciplineRepo.create(data);

        return discipline;
    }
}
