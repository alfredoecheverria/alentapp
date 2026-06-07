import { EnrollmentRepository } from '../domain/EnrollmentRepository.ts'
import { EnrollmentValidator } from '../domain/services/EnrollmentValidator.ts'
import { EnrollmentDTO, CreateEnrollmentRequest } from '@alentapp/shared'

export class CreateEnrollmentUseCase {
    constructor(
        private readonly enrollmentRepository: EnrollmentRepository,
        private readonly enrollmentValidator: EnrollmentValidator,
    ) {}

    async execute(data: CreateEnrollmentRequest): Promise<EnrollmentDTO> {
        // 1. Valido que el socio no este inscripto al deporte
        await this.enrollmentValidator.validateMemberIsNotEnrolledYet(data.member_id, data.sport_id);

        // 2. Valido que el deporte no tenga su cupo lleno
        await this.enrollmentValidator.validateUnderSportsMaxCapacity(data.sport_id);

        // 3. Registro nueva inscripto
        const newEnrollment = await this.enrollmentRepository.create(data);

        return newEnrollment;
    }
}
