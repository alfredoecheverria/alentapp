import type { DisciplineDTO, CreateDisciplineRequest } from "@alentapp/shared";

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const disciplinesService = {
  async getAll(): Promise<DisciplineDTO[]> {
    const response = await fetch(`${API_URL}/disciplines`);
    if (!response.ok) {
      throw new Error('Error al obtener las sanciones disciplinarias');
    }
    const result = await response.json();
    return result.data;
  },
  
  async create(data: CreateDisciplineRequest) {
    const res = await fetch(`${API_URL}/disciplines`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Error creando sanción");
    }

    return res.json();
  },

  async update(id: string, data: Partial<CreateDisciplineRequest> & { status?: string }): Promise<DisciplineDTO> {
      const response = await fetch(`${API_URL}/disciplines/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar la sanción');
      }
      const result = await response.json();
      return result.data;
    },

  async deactivate(id: string): Promise<DisciplineDTO> {
    const response = await fetch(`${API_URL}/disciplines/${id}/deactivate`, {
      method: 'PUT',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al finalizar la sanción');
    }

    const result = await response.json();
    return result.data;
  },
  
};