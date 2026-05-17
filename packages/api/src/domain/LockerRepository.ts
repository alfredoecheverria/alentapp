import { LockerDTO, UpdateLockerRequest } from "@alentapp/shared";

export interface LockerRepository {
    create(locker: Omit<LockerDTO, 'id'>): Promise<LockerDTO>;
    findByNumber(number: number): Promise<LockerDTO | null>;
    findByMemberId(member_id: string): Promise<LockerDTO | null>;
    findAll(): Promise<LockerDTO[]>;
    findById(id: string): Promise<LockerDTO | null>;
    delete(id: string): Promise<void>;
    update(id: string, data: UpdateLockerRequest): Promise<LockerDTO>;
}