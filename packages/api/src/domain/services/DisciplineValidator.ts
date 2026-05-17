
export class DisciplineValidator {
    validateDates(
        startDate: Date,
        endDate: Date
    ) {
        if(endDate <= startDate) {
            throw new Error("La fecha de finalización debe ser posterior a la fecha de inicio");
        }
    }
}