import { EnrollmentRepository } from '../EnrollmentRepository.ts'
import { SportRepository } from '../SportRepository.ts'

export class EnrollmentValidator {
    constructor (
        private readonly enrollmentRepo: EnrollmentRepository,
        private readonly sportRepo: SportRepository
    ) {}

    validateEmptyRequest(data: Object) {
        if (data === null || data === undefined || Object.keys(data).length === 0) {
            throw new Error('Debe indicar al menos un campo a modificar');
        }
    }

    validateNoMemberId(data: Object) {
        if('member_id' in data) {
            throw new Error('No se puede editar el socio asociado');
        }
    }

    validateNoSportId(data: Object) {
        if('sport_id' in data) {
            throw new Error('No se puede editar el deporte asociado');
        }
    }

    async validateEnrollmentExists(id: string) {
        const exists = await this.enrollmentRepo.findById(id);
        if (!exists) {
            throw new Error('La inscripción no existe');
        }
    }

    async validateMemberIsNotEnrolledYet(member_id: string, sport_id: string) {
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
