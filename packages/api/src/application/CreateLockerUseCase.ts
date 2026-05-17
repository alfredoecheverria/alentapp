import { CreateLockerRequest, LockerDTO } from "@alentapp/shared";
import { LockerRepository } from "../domain/LockerRepository.js";
import { LockerValidator } from "../domain/services/LockerValidator.js";

export class CreateLockerUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly lockerValidator: LockerValidator
    ) {}

    async execute(data: CreateLockerRequest): Promise<LockerDTO> {
        const status = data.status ?? 'Available';

        // 1. Validaciones de negocio (centralizadas)
        this.lockerValidator.validateNumberIsPositiveAndInt(data.number);

        if (data.member_id) {
            this.lockerValidator.validateFormatMemberId(data.member_id);
            await this.lockerValidator.validateMemberExist(data.member_id);
            await this.lockerValidator.validateMemberHaveLocker(data.member_id);
        }

        this.lockerValidator.validateStatusAvailableMemberNull(status, data.member_id);
        this.lockerValidator.validateStatusMaintenanceMemberNull(status, data.member_id);
        this.lockerValidator.validateStatusOccupiedMemberNotNull(status, data.member_id);
        await this.lockerValidator.validateNumberIsUnique(data.number);

        // 2. Persistencia a través de la interfaz (sin saber qué DB es)
        const nuevoLocker = await this.lockerRepository.create({
            ...data,
            status,
        });

        return nuevoLocker;
    }
}
