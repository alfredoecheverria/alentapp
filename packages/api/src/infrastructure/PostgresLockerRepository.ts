import { PrismaPg } from '@prisma/adapter-pg';
import { LockerStatus, PrismaClient } from '../generated/client/client.js';
import { CreateLockerRequest, LockerDTO, MemberDTO, UpdateLockerRequest } from '@alentapp/shared';
import { LockerRepository } from '../domain/LockerRepository.js';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBLocker = {
    id: string;
    number: number;
    location: string;
    status: LockerStatus;
    member_id: string | null;
    member?: DBMember | null;
};

type DBMember = {
    id: string;
    dni: string;
    name: string;
    email: string;
    birthdate: Date | null;
    category: MemberDTO['category'];
    status: MemberDTO['status'];
    created_at: Date;
};

export class PostgresLockerRepository implements LockerRepository {
    async create(data: CreateLockerRequest): Promise<LockerDTO> {
        const locker = await prisma.locker.create({
            data: {
                number: data.number,
                location: data.location,
                status: data.status,
                member_id: data.member_id ?? null,
            },
        });

        return this.mapToDTO(locker);
    }

    async findById(id: string): Promise<LockerDTO | null> {
        const locker = await prisma.locker.findUnique({
            where: { id },
        });

        return locker ? this.mapToDTO(locker) : null;
    }

    async findByMemberId(member_id: string): Promise<LockerDTO | null> {
        const locker = await prisma.locker.findFirst({
            where: { member_id },
        });

        return locker ? this.mapToDTO(locker) : null;
    }

    async findByNumber(number: number): Promise<LockerDTO | null> {
        const locker = await prisma.locker.findUnique({ where: { number } });
        return locker ? this.mapToDTO(locker) : null;
    }

    async findAll(): Promise<LockerDTO[]> {
        const lockers = await prisma.locker.findMany({
            orderBy: {number: 'asc'},
            include: {
                member: true,
            },
        })

        return lockers.map((locker) => this.mapToDTO(locker));
    }

    async delete(id: string): Promise<void> {
        await prisma.locker.delete({
            where: { id },
        });
    }

    async update(id: string, data: UpdateLockerRequest): Promise<LockerDTO>{
        const locker = await prisma.locker.update({
            where: { id },
            data: {
                ...(data.number && { number: data.number }),
                ...(data.location && { location: data.location }),
                ...(data.status && { status: data.status }),
                ...(data.member_id !== undefined && { member_id: data.member_id }),
            },
        });

        return this.mapToDTO(locker);
    }
    

    private mapToDTO(locker: DBLocker): LockerDTO {
        return {
            id: locker.id,
            number: locker.number,
            location: locker.location,
            status: locker.status,
            member_id: locker.member_id ?? undefined,
            member: locker.member ? this.mapMemberToDTO(locker.member) : undefined,
        };
    }

    private mapMemberToDTO(member: DBMember): MemberDTO {
        return {
            id: member.id,
            dni: member.dni,
            name: member.name,
            email: member.email,
            birthdate: member.birthdate ? (member.birthdate.toISOString().split('T')[0] ?? '') : '',
            category: member.category,
            status: member.status,
            created_at: member.created_at.toISOString(),
        };
    }
}
