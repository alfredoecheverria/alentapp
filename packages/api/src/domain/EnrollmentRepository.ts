import { EnrollmentDTO } from '@alentapp/shared';

export interface EnrollmentRepository {
    create(enrollment: Omit<EnrollmentDTO, 'id'>): Promise<EnrollmentDTO>;
}
