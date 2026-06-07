import { EnrollmentRepository } from "../domain/EnrollmentRepository.ts";
import { EnrollmentValidator } from "../domain/services/EnrollmentValidator.ts";
import { EnrollmentDTO, UpdateEnrollmentRequest } from "@alentapp/shared";

export class UpdateEnrollmentUseCase {
    constructor (
        private readonly enrollmentRepository: EnrollmentRepository,
        private readonly enrollmentValidator: EnrollmentValidator,
    ) {}

    async execute(id: string, data: UpdateEnrollmentRequest): Promise<EnrollmentDTO | void> {
        // Valida que haya datos a modificar en el pedido
        this.enrollmentValidator.validateEmptyRequest(data);

        // Valida que exista la inscripcion
        await this.enrollmentValidator.validateEnrollmentExists(id);

        // Valida que no se intente modificar el socio o deporte
        this.enrollmentValidator.validateNoMemberId(data);
        this.enrollmentValidator.validateNoSportId(data);

        //Me aseguro que solo se puedan actualizar los valores enrollment_date y/o is_active
        let finalData = {enrollment_date: data.enrollment_date, is_active: data.is_active};
        await this.enrollmentRepository.update(id, finalData);
    }
}
