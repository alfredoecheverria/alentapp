import { EnrollmentRepository } from '../EnrollmentRepository.ts'
import { SportRepository } from '../SportRepository.ts'

export class EnrollmentValidator {
    constructor (
        private readonly enrollmentRepo: EnrollmentRepository,
        private readonly sportRepo: SportRepository
    ) {}

    async validateMemberIsNotEnrolledYet(id: string, member_id: string) {
        const exists = await this.enrollmentRepo.findByMemberIdAndSportId(member_id, sport_id);
        if (exists) {
            throw new Error('Ya existe una inscripcion del socio a este deporte');
        }
    }

    async validateUnderSportsMaxCapacity(sport_id: string) {
        const enrollments = await this.enrollmentRepo.findAllBySportId(sport_id);
        if (enrollments.length > 0) {
            const sport = await this.sportRepo.findById(sport_id);
            if (sport && sport.max_capacity === enrollments.length) {
                throw new Error('Capacidad máxima del deporte excedida')
            }
        }
    }
}
