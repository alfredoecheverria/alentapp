export class DisciplineValidator {

    validateHasAtLeastOneField(data: Record<string, any>) {
        if (!data || Object.keys(data).length === 0) {
            throw new Error("Debe indicar al menos un campo a modificar");
        }
    }

    validateDates(startDate?: string, endDate?: string) {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (end <= start) {
                throw new Error("La fecha de fin debe ser posterior a la fecha de inicio");
            }
        }
    }
}