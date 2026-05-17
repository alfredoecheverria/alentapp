import { LockerDTO, UpdateLockerRequest } from "@alentapp/shared";
import { LockerRepository } from "../domain/LockerRepository.js";
import { LockerValidator } from "../domain/services/LockerValidator.js";

export class UpdateLockerUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly lockerValidator: LockerValidator
    ) {}

    async execute(id: string, data: UpdateLockerRequest): Promise<LockerDTO> {
        const existingLocker = await this.lockerRepository.findById(id);
        if (!existingLocker) {
            throw new Error("El locker no existe");
        }

        if (data.number !== undefined) {
            this.lockerValidator.validateNumberIsPositiveAndInt(data.number);
            await this.lockerValidator.validateNumberIsUnique(data.number, id);
        }

        const finalStatus = data.status ?? existingLocker.status;
        const finalMemberId = data.member_id !== undefined ? data.member_id ?? undefined : existingLocker.member_id;
        const memberChanged = data.member_id !== undefined && data.member_id !== existingLocker.member_id;

        if (finalMemberId) {
            this.lockerValidator.validateFormatMemberId(finalMemberId);
            await this.lockerValidator.validateMemberExist(finalMemberId);

            if (memberChanged) {
                await this.lockerValidator.validateMemberHaveLocker(finalMemberId);
            }
        }

        this.lockerValidator.validateStatusAvailableMemberNull(finalStatus, finalMemberId);
        this.lockerValidator.validateStatusMaintenanceMemberNull(finalStatus, finalMemberId);
        this.lockerValidator.validateStatusOccupiedMemberNotNull(finalStatus, finalMemberId);

        return this.lockerRepository.update(id, data);
    }
}
