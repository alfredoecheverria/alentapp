import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { CreateDisciplineRequest, DisciplineDTO, MemberDTO } from '@alentapp/shared';
import { UpdateDisciplineRequest } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBDiscipline = {
    id: string;
    member_id: string;
    reason: string;
    start_date: Date;
    end_date: Date;
    is_total_suspension: boolean;
    deactivated_at: Date | null;
};

export class PostgresDisciplineRepository implements DisciplineRepository {

    async create(data: CreateDisciplineRequest): Promise<DisciplineDTO> {
        const discipline = await prisma.discipline.create({
            data: {
                member_id: data.member_id,
                reason: data.reason,
                start_date: new Date(data.start_date),
                end_date: new Date(data.end_date),
                is_total_suspension: data.is_total_suspension,
                deactivated_at: null
            }
        });

        return this.mapToDTO(discipline);
    }

    async findMemberById(memberID: string): Promise<MemberDTO | null> {
        const member = await prisma.member.findUnique({
            where: { id: memberID }
        });

        if (!member) return null;

        return {
            id: member.id,
            dni: member.dni,
            name: member.name,
            email: member.email,
            birthdate: member.birthdate ? (member.birthdate.toISOString().split('T')[0] ?? '') : '',
            category: member.category,
            status: member.status,
            created_at: member.created_at.toISOString()
        };
    }

    async findById(id: string): Promise<DisciplineDTO | null> {
        const discipline = await prisma.discipline.findUnique({
            where: { id }
        });

        return discipline ? this.mapToDTO(discipline) : null;
    }

    async findAll(): Promise<DisciplineDTO[]> {
        const disciplines = await prisma.discipline.findMany({
            where: { deactivated_at: null },
            orderBy: { start_date: 'desc' }
        });

        return disciplines.map(this.mapToDTO);
    }

    async update(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO> {
        const discipline = await prisma.discipline.update({
            where: { id },
            data: {
            ...(data.reason && { reason: data.reason }),
            ...(data.start_date && { start_date: new Date(data.start_date) }),
            ...(data.end_date && { end_date: new Date(data.end_date) }),
            ...(data.is_total_suspension !== undefined && {
                is_total_suspension: data.is_total_suspension,
            }),
            },
        });

        return this.mapToDTO(discipline);
        }

    async deactivate(id: string): Promise<DisciplineDTO> {
        const discipline = await prisma.discipline.update({
            where: { id },
            data: {
                deactivated_at: new Date(),
            },
        });

        return this.mapToDTO(discipline);
    }

    private mapToDTO(discipline: DBDiscipline): DisciplineDTO {
        return {
            id: discipline.id,
            member_id: discipline.member_id,
            reason: discipline.reason,
            start_date: discipline.start_date.toISOString(),
            end_date: discipline.end_date.toISOString(),
            is_total_suspension: discipline.is_total_suspension,
            deactivated_at: discipline.deactivated_at
                ? discipline.deactivated_at.toISOString()
                : null
        };
    }
}