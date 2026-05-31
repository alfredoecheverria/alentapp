import { describe, it, expect } from 'vitest';
import { DisciplineValidator } from './DisciplineValidator.js';

describe('DisciplineValidator', () => {
    const validator = new DisciplineValidator();

    it('debe lanzar error cuando la fecha de fin es anterior a la de inicio', () => {
        expect(() =>
            validator.validateDates('2026-05-10', '2026-05-11')
        ).not.toThrow();
    });

    it('debe lanzar error cuando la fecha de fin es igual a la de inicio', () => {
        expect(() =>
            validator.validateDates('2026-05-10', '2026-05-10')
        ).toThrow('La fecha de fin debe ser posterior a la fecha de inicio');
    });

});