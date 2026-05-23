import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { EnrollmentRepository } from '../domain/EnrollmentRepository.ts';
import { EnrollmentDTO, CreateEnrollmentRequest } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable not set')
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBEnrollment = {
    id: string;
    member_id: string;
    sport_id: string;
    enrollment_date: string;
    is_active: boolean;
}

export class PostgresEnrollmentRepository implements EnrollmentRepository {
    async create(data: CreateEnrollmentRequest): Promise<EnrollmentDTO> {
        const enrollment = await prisma.enrollment.create({
            data: {
                id: data.id,
                member_id: data.member_id,
                sport_id: data.sport_id,
                enrollment_date: new Date(data.enrollment_date),
                is_active: data.is_active,
            },
        });

        return this.mapToDTO(enrollment);
    }

    async findByMemberIdAndSportId(member_id: string, sport_id: string): Promise<EnrollmentDTO | null> {
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                AND: [{
                    member_id: member_id,
                    sport_id: sport_id,
                }],
            },
        });

        return enrollment ? this.mapToDTO(enrollment) : null;
    }

    async findAllBySportId(id: string): Promise<EnrollmentDTO[]> {
        const enrollments = await prisma.enrollment.findMany({
            where: { sport_id: id }
        });

        return enrollments.map(this.mapToDTO);
    }

    async findAll(): Promise<EnrollmentDTO[]> {
        const enrollments = await prisma.enrollment.findMany({
            orderBy: { id: 'desc' },
        });

        return enrollments.map(this.mapToDTO);
    }

    private mapToDTO(enrollment: DBEnrollment): EnrollmentDTO {
        return {
            id: enrollment.id,
            member_id: enrollment.member_id,
            sport_id: enrollment.sport_id,
            enrollment_date: enrollment.enrollment_date.toISOString(),
            is_active: enrollment.is_active,
        }
    }
}
