import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSportUseCase } from './CreateSportUseCase.ts'
import { SportRepository } from '../domain/SportRepository.ts'
import { SportValidator } from '../domain/services/SportValidator.ts'
import { CreateSportRequest } from '@alentapp/shared'

describe('CreateSportUseCase', () => {
    // Creo mocks de las dependencias
    const mockSportRepository = {
        create: vi.fn(),
    } as unknown as SportRepository;

    const mockSportValidator = {
        validateNameIsUnique: vi.fn(),
        validateMaxCapacity: vi.fn(),
        validateAdditionalPrice: vi.fn(),
    } as unknown as SportValidator;

    // Creo instancia del caso de uso a testear usando los mocks
    const createSportUseCase = new CreateSportUseCase(mockSportRepository, mockSportValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe crear un deporte con precio adicional 0 si pasa las validaciones y precio adicional no esta presente', async () => {
        const mockRequest: CreateSportRequest = {
            name: 'Basketball',
            description: 'Deporte de pelota',
            max_capacity: 5,
            requires_medical_certificate: true,
        };

        vi.mocked(mockSportRepository.create).mockResolvedValueOnce({
            id: 'uuid-1',
            ...mockRequest,
            additional_price: 0,
        });

        const result = await createSportUseCase.execute(mockRequest);

        expect(mockSportValidator.validateNameIsUnique).toHaveBeenCalledWith(mockRequest.name);
        expect(mockSportValidator.validateMaxCapacity).toHaveBeenCalledWith(mockRequest.max_capacity);

        expect(mockSportRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            additional_price: 0,
        }));

        expect(result.id).toBe('uuid-1');
        expect(result.additional_price).toBe(0);
    });
})
