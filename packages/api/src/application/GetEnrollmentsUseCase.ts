import { EnrollmentRepository } from "../domain/EnrollmentRepository.ts"
import { EnrollmentDTO } from "@alentapp/shared";

export class GetEnrollmentsUseCase {
    constructor(
        private readonly enrollmentRepository: EnrollmentRepository,
    ) {}

    async execute(): Promise<EnrollmentDTO[]> {
        return this.enrollmentRepository.findAll();
    }
}
