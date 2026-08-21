import { describe, expect, it } from 'vitest';
import { resolveInitialTarget } from 'src/mandala-document/runtime/initial-target-resolver';
import { buildSectionIndex } from 'src/mandala-document/runtime/section-index';

const index = buildSectionIndex(
    ['<!--section: 1-->a', '<!--section: 1.1-->b', '<!--section: 2-->c'].join(
        '\n',
    ),
);

const generic = {
    kind: 'generic' as const,
    targetSection: null,
    hotCoreSections: new Set<string>(),
    notice: null,
    dayPlan: null,
};

describe('resolveInitialTarget', () => {
    it('prefers explicit jumps over day-plan and persisted state', () => {
        const result = resolveInitialTarget({
            index,
            profile: {
                ...generic,
                kind: 'day-plan',
                targetSection: '2',
            },
            persistedCenter: '1',
            persistedActive: '1.1',
            explicitTarget: '1.1',
        });

        expect(result).toEqual({
            centerSection: '1',
            activeSection: '1.1',
            source: 'explicit-jump',
        });
    });

    it('uses today before persisted center for day plans', () => {
        const result = resolveInitialTarget({
            index,
            profile: {
                ...generic,
                kind: 'day-plan',
                targetSection: '2',
            },
            persistedCenter: '1',
            persistedActive: '1.1',
        });

        expect(result.source).toBe('day-plan-today');
        expect(result.centerSection).toBe('2');
    });

    it('falls back from invalid center to an existing active ancestor', () => {
        const result = resolveInitialTarget({
            index,
            profile: generic,
            persistedCenter: '9',
            persistedActive: '1.1',
        });

        expect(result).toMatchObject({
            centerSection: '1',
            activeSection: '1.1',
            source: 'persisted-active',
        });
    });

    it('falls back to the first root when persisted state is invalid', () => {
        const result = resolveInitialTarget({
            index,
            profile: generic,
            persistedCenter: '9',
            persistedActive: '9.1',
        });

        expect(result).toEqual({
            centerSection: '1',
            activeSection: '1',
            source: 'default',
        });
    });
});
