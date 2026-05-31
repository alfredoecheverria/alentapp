import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateDisciplineUseCase } from './UpdateDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { UpdateDisciplineRequest, DisciplineDTO } from '@alentapp/shared';

describe('UpdateDisciplineUseCase', () => {
    const mockRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockValidator = {
        validateHasAtLeastOneField: vi.fn(),
        validateDates: vi.fn(),
    } as unknown as DisciplineValidator;

    const useCase = new UpdateDisciplineUseCase(mockRepo, mockValidator);

    const existing: DisciplineDTO = {
        id: 'discipline-1',
        member_id: 'member-1',
        reason: 'Falta grave',
        start_date: '2026-05-10',
        end_date: '2026-05-12',
        is_total_suspension: false,
        deactivated_at: null
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockRepo.findById).mockResolvedValue(existing);
    });

    it('debe lanzar error si la sanción no existe', async () => {
        vi.mocked(mockRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('missing', {})).rejects.toThrow('La sancion indicada no existe');
    });

    it('debe lanzar error si la sanción ya fue finalizada', async () => {
        vi.mocked(mockRepo.findById).mockResolvedValueOnce({
            ...existing,
            deactivated_at: '2026-05-11T00:00:00.000Z'
        });

        await expect(useCase.execute('discipline-1', { reason: 'Otro motivo' })).rejects.toThrow(
            'No se puede actualizar una sanción que ya fue finalizada'
        );
    });

    it('debe actualizar la sanción cuando los datos son válidos', async () => {
        const updateData: UpdateDisciplineRequest = { reason: 'Retraso', end_date: '2026-05-13' };
        vi.mocked(mockRepo.update).mockResolvedValueOnce({ ...existing, ...updateData });

        const result = await useCase.execute('discipline-1', updateData);

        expect(mockValidator.validateHasAtLeastOneField).toHaveBeenCalledWith(updateData);
        expect(mockValidator.validateDates).toHaveBeenCalledWith(undefined, '2026-05-13');
        expect(mockRepo.update).toHaveBeenCalledWith('discipline-1', updateData);
        expect(result.reason).toBe('Retraso');
    });
});