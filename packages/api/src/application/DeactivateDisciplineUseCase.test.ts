import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeactivateDisciplineUseCase } from './DeactivateDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { DisciplineDTO } from '@alentapp/shared';

describe('DeactivateDisciplineUseCase', () => {
    const mockRepo = {
        findById: vi.fn(),
        deactivate: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockValidator = {
        validateDisciplineExists: vi.fn(),
        validateDisciplineIsActive: vi.fn(),
    } as unknown as DisciplineValidator;

    const useCase = new DeactivateDisciplineUseCase(mockRepo, mockValidator);

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

    it('debe desactivar la sanción activa correctamente', async () => {
        vi.mocked(mockRepo.deactivate).mockResolvedValueOnce({
            ...existing,
            deactivated_at: '2026-05-11T00:00:00.000Z'
        });

        const result = await useCase.execute('discipline-1');

        expect(mockValidator.validateDisciplineExists).toHaveBeenCalledWith(existing);
        expect(mockValidator.validateDisciplineIsActive).toHaveBeenCalledWith(existing);
        expect(mockRepo.deactivate).toHaveBeenCalledWith('discipline-1');
        expect(result.deactivated_at).toBe('2026-05-11T00:00:00.000Z');
    });

    it('debe lanzar error si la sanción no existe', async () => {
        vi.mocked(mockRepo.findById).mockResolvedValueOnce(null);
        vi.mocked(mockValidator.validateDisciplineExists).mockImplementation(() => {
            throw new Error('La sancion indicada no existe');
        });

        await expect(useCase.execute('missing')).rejects.toThrow('La sancion indicada no existe');
    });

    it('debe lanzar error si la sanción ya estaba finalizada', async () => {
        const deactivated = { ...existing, deactivated_at: '2026-05-11T00:00:00.000Z' };
        
        vi.mocked(mockRepo.findById).mockResolvedValueOnce(deactivated);
        vi.mocked(mockValidator.validateDisciplineExists).mockReturnValueOnce(undefined);
        vi.mocked(mockValidator.validateDisciplineIsActive).mockImplementation(() => {
            throw new Error('La sanción ya fue finalizada previamente');
        });

        await expect(useCase.execute('discipline-1')).rejects.toThrow(
            'La sanción ya fue finalizada previamente'
        );
    });
});