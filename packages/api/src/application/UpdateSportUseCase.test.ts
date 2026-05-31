import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateSportUseCase } from './UpdateSportUseCase.ts'
import { SportRepository } from '../domain/SportRepository.ts'
import { SportValidator } from '../domain/services/SportValidator.ts'
import { UpdateSportRequest } from '@alentapp/shared'

describe('CreateSportUseCase', () => {
    // Creo mocks de las dependencias
    const mockSportRepository = {
        update: vi.fn(),
        findById: vi.fn(),
    } as unknown as SportRepository;

    const mockSportValidator = {
        validateEmptyDescription: vi.fn(),
        validateMaxCapacity: vi.fn(),
        validateSportExists: vi.fn(),
    } as unknown as SportValidator;

    // Creo instancia del caso de uso a testear usando los mocks
    const updateSportUseCase = new UpdateSportUseCase(mockSportRepository, mockSportValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe fallar si el deporte no existe', async () => {
        vi.mocked(mockSportValidator.validateSportExists).mockRejectedValueOnce(new Error('El deporte no existe'));
        await expect(updateSportUseCase.execute('uuid-test', {})).rejects.toThrow('El deporte no existe')
    });
})
