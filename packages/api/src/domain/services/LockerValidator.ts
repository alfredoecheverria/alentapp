import { LockerStatus, MemberDTO } from "@alentapp/shared";
import { LockerRepository } from "../LockerRepository.js";
import { MemberRepository } from "../MemberRepository.js";

export class LockerValidator {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly memberRepository: MemberRepository
    ) {

    }

    async validateNumberIsUnique(number: number, excludeLockerId?: string): Promise<void> {
        const lockerWithSameNumber = await this.lockerRepository.findByNumber(number);
        if (lockerWithSameNumber && lockerWithSameNumber.id !== excludeLockerId) {
            throw new Error('Ya existe un locker con ese número');
        }
    }

    validateNumberIsPositiveAndInt(number: number): void{
        if(number <= 0 || !Number.isInteger(number)){
            throw new Error("`number` debe ser entero y mayor a cero");
        }
    }

    async validateMemberExist(member_id: string): Promise<void>{
        const member: MemberDTO | null = await this.memberRepository.findById(member_id);
        if(member == null){
            throw new Error("El miembro indicado no existe");
        }
    }

    async validateMemberHaveLocker(member_id: string): Promise<void>{
        const locker = await this.lockerRepository.findByMemberId(member_id);
        if (locker) {
            throw new Error('El miembro ya posee un locker');
        }

    }

    validateStatusAvailableMemberNull(status: LockerStatus, member_id?: string): void{
        if(status === "Available" && member_id != null){
            throw new Error("Estado Available no permite member_id");
        }
    }

    validateStatusOccupiedMemberNotNull(status: LockerStatus, member_id?: string): void{
        if(status === "Occupied" && member_id == null){
            throw new Error("Estado Occupied requiere member_id");
        }
    }

    validateStatusMaintenanceMemberNull(status: LockerStatus, member_id?: string): void{
        if(status === "Maintenance" && member_id != null){
            throw new Error("Estado Maintenance no permite member_id");
        }
    }
    
    validateFormatMemberId(member_id?: string): void{
        if (member_id == null) return;

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(member_id)) {
            throw new Error('member_id no válido');
        }
    }
    
    async validateLockerExists(id: string): Promise<void>{
        const locker = await this.lockerRepository.findById(id);

        if (locker == null){
            throw new Error("El locker no existe");
        }
    }

    async validateLockerHasNoMember(id: string): Promise<void>{
        const locker = await this.lockerRepository.findById(id);

        if (locker?.member_id) {
            throw new Error('No se puede eliminar un locker con member asignado');
        }
    }

}
