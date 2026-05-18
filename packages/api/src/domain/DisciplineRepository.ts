import { DisciplineDTO, CreateDisciplineRequest, UpdateDisciplineRequest } from "../../../shared/index.js";

export interface DisciplineRepository {
    create(discipline: CreateDisciplineRequest): Promise<DisciplineDTO>;
    findById(id: string): Promise<DisciplineDTO | null>;
    findAll(): Promise<DisciplineDTO[]>;
    update(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO>;
}
