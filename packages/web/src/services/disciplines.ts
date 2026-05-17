import type { CreateDisciplineRequest } from "@alentapp/shared";

const API_URL = "http://localhost:3000/api/v1";

export const disciplinesService = {
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
};