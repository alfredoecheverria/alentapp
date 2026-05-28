import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetDisciplinesUseCase } from './GetDisciplinesUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineDTO } from '@alentapp/shared';

describe('GetDisciplinesUseCase', () => {
    const mockRepo = {
        findAll: vi.fn(),
    } as unknown as DisciplineRepository;

    const useCase = new GetDisciplinesUseCase(mockRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe devolver la lista de disciplinas cuando hay resultados', async () => {
        const mockDisciplines: DisciplineDTO[] = [
            {
                id: 'discipline-1',
                member_id: 'member-1',
                reason: 'Falta grave',
                start_date: '2026-05-10',
                end_date: '2026-05-12',
                is_total_suspension: false,
                deactivated_at: null
            }
        ];

        vi.mocked(mockRepo.findAll).mockResolvedValueOnce(mockDisciplines);

        const result = await useCase.execute();

        expect(mockRepo.findAll).toHaveBeenCalled();
        expect(result).toEqual(mockDisciplines);
    });

    it('debe devolver un arreglo vacío cuando no hay sanciones', async () => {
        vi.mocked(mockRepo.findAll).mockResolvedValueOnce([]);

        const result = await useCase.execute();

        expect(result).toEqual([]);
    });

    it('debe propagar el error si el repositorio falla', async () => {
        vi.mocked(mockRepo.findAll).mockRejectedValueOnce(new Error('DB no disponible'));

        await expect(useCase.execute()).rejects.toThrow('DB no disponible');
    });
});