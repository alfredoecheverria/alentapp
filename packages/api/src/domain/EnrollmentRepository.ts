import { EnrollmentDTO, UpdateEnrollmentRequest } from '@alentapp/shared';

export interface EnrollmentRepository {
    create(enrollment: Omit<EnrollmentDTO, 'id'>): Promise<EnrollmentDTO>;
    findByMemberIdAndSportId(member_id: string, sport_id: string): Promise<EnrollmentDTO | null>;
    findById(id: string): Promise<EnrollmentDTO | null>;
    findAllBySportId(id: string): Promise<EnrollmentDTO[]>;
    findAll(): Promise<EnrollmentDTO[]>;
    update(id: string, data: UpdateEnrollmentRequest): Promise<EnrollmentDTO>;
    delete(id: string): Promise<void>;
}
