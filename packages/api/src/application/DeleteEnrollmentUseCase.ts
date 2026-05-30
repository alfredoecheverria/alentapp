import { EnrollmentRepository } from "../domain/EnrollmentRepository.ts";
import { EnrollmentValidator } from "../domain/services/EnrollmentValidator.ts";

export class DeleteEnrollmentUseCase {
    constructor(
        private readonly enrollmentRepository: EnrollmentRepository,
        private readonly enrollmentValidator: EnrollmentValidator,
    ) {}

    async execute(id: string) {
        // 1. Valida existencia de la inscripción
        await this.enrollmentValidator.validateEnrollmentExists(id);

        // 2. Ejecuta la eliminacion
        await this.enrollmentRepository.delete(id);
    }
}
