import type { EnrollmentDTO, CreateEnrollmentRequest, UpdateEnrollmentRequest } from '@alentapp/shared';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const enrollmentsService = {
    async create(data: CreateEnrollmentRequest): Promise<EnrollmentDTO> {
        const response = await fetch(`${API_URL}/enrollments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear la inscripcion');
        }
        const result = await response.json();
        return result.data;
    },

    async getAll(): Promise<EnrollmentDTO[]> {
        const response = await fetch(`${API_URL}/enrollments`);
        if (!response.ok) {
            throw new Error('Error al obtener las inscripciones');
        }
        const result = await response.json();
        return result.data;
    },

    async update(id: string, data: UpdateEnrollmentRequest): Promise<EnrollmentDTO> {
        const response = await fetch(`${API_URL}/enrollments/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar la inscripción');
        }
        const result = await response.json();
        return result.data;
    },
}
