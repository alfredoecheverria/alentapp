import { PrismaPg } from '@prisma/adapter-pg';
import { LockerStatus, PrismaClient } from '../generated/client/client.js';
import { CreateLockerRequest, LockerDTO } from '@alentapp/shared';
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


    private mapToDTO(locker: DBLocker): LockerDTO {
        return {
            id: locker.id,
            number: locker.number,
            location: locker.location,
            status: locker.status,
            member_id: locker.member_id ?? undefined,
        };
    }
}
