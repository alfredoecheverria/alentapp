import { SportRepository } from "../SportRepository.ts";

export class SportValidator {
    constructor(private readonly sportRepo: SportRepository) {}

    validateSportExists(id: string): void {
        const exists = await this.sportRepo.findById(id);
        if (exists) {
            throw new Error('El deporte no existe');
        }
    }

    validateMaxCapacity(max_capacity: number): void {
       if(max_capacity <= 0) {
            throw new Error('Capacidad máxima inválida');
       }
    }

    validateAdditionalPrice(additional_price: float): void {
        if(additional_price < 0) {
            throw new Error('El valor de precio adicional debe ser un numero igual o mayor a 0');
        }
    }

    validateEmptyDescription(description: string): void {
        if (description === "") {
            throw new Error('Descripción de deporte inválida');
        }
    }

    async validateNameIsUnique(name: string): Promise<void> {
        const exists = await this.sportRepo.findByName(name);
        if (exists) {
            throw new Error('Ya existe un deporte con ese nombre');
        }
    }
}
