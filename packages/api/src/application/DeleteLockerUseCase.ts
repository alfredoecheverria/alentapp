import { LockerValidator } from "../domain/services/LockerValidator.js";
import { LockerRepository } from "../domain/LockerRepository.js";

export class DeleteLockerUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly lockerValidator: LockerValidator
    ) {}

    async execute(id: string): Promise<void> {
        await this.lockerValidator.validateLockerExists(id);
        await this.lockerValidator.validateLockerHasNoMember(id);

        await this.lockerRepository.delete(id);
    }
}
