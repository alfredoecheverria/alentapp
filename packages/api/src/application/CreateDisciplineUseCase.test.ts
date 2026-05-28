import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateDisciplineUseCase } from './CreateDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { CreateDisciplineRequest, DisciplineDTO } from '@alentapp/shared';

describe('CreateDisciplineUseCase', () => {
    const mockRepo = {
        create: vi.fn()
    } as unknown as DisciplineRepository;

    const mockValidator = {
        validateDates: vi.fn(),
    } as unknown as DisciplineValidator;

    const mockMemberValidator = {
        validateExists: vi.fn(),
    };

    const useCase = new CreateDisciplineUseCase(
        mockRepo,
        mockValidator,
        mockMemberValidator as any
    );

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe crear la sanción cuando los datos son válidos', async () => {
        const request: CreateDisciplineRequest = {
            member_id: 'member-1',
            reason: 'Falta grave',
            start_date: '2026-05-10',
            end_date: '2026-05-12',
            is_total_suspension: false
        };

        vi.mocked(mockMemberValidator.validateExists).mockResolvedValueOnce(undefined);
        vi.mocked(mockRepo.create).mockResolvedValueOnce({
            id: 'discipline-1',
            ...request,
            deactivated_at: null
        } as DisciplineDTO);

        const result = await useCase.execute(request);

        expect(mockMemberValidator.validateExists).toHaveBeenCalledWith('member-1');
        expect(mockValidator.validateDates).toHaveBeenCalledWith('2026-05-10', '2026-05-12');
        expect(mockRepo.create).toHaveBeenCalledWith(request);
        expect(result.id).toBe('discipline-1');
    });

    it('debe propagar el error si el miembro indicado no existe', async () => {
        const request: CreateDisciplineRequest = {
            member_id: 'member-404',
            reason: 'Falta leve',
            start_date: '2026-05-10',
            end_date: '2026-05-12',
            is_total_suspension: false
        };

        vi.mocked(mockMemberValidator.validateExists).mockRejectedValueOnce(
            new Error('El socio indicado no existe')
        );

        await expect(useCase.execute(request)).rejects.toThrow('El socio indicado no existe');
        expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('debe propagar el error de fechas inválidas', async () => {
        const request: CreateDisciplineRequest = {
            member_id: 'member-1',
            reason: 'Falta',
            start_date: '2026-05-10',
            end_date: '2026-05-09',
            is_total_suspension: true
        };

        vi.mocked(mockMemberValidator.validateExists).mockResolvedValueOnce(undefined);
        vi.mocked(mockValidator.validateDates).mockImplementation(() => {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        });

        await expect(useCase.execute(request)).rejects.toThrow(
            'La fecha de fin debe ser posterior a la fecha de inicio'
        );
        expect(mockRepo.create).not.toHaveBeenCalled();
    });
});
