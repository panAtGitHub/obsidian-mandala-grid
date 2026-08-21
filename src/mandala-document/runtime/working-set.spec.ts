import { describe, expect, it } from 'vitest';
import { buildSectionIndex } from 'src/mandala-document/runtime/section-index';
import {
    buildThreeByThreeSectionIds,
    materializeThreeByThreeWorkingSet,
} from 'src/mandala-document/runtime/working-set';

describe('WorkingSet', () => {
    it('materializes only the requested 3x3 sections', () => {
        const source = [
            '<!--section: 1-->root',
            '<!--section: 1.1-->a',
            '<!--section: 1.8-->h',
            '<!--section: 2-->other',
        ].join('\n');
        const index = buildSectionIndex(source);
        const workingSet = materializeThreeByThreeWorkingSet({
            source,
            index,
            centerSection: '1',
        });

        expect(workingSet.requestedSectionIds).toEqual(
            buildThreeByThreeSectionIds('1'),
        );
        expect(workingSet.materializedSectionIds).toEqual(['1', '1.1', '1.8']);
        expect(workingSet.missingSectionIds).toContain('1.2');
        expect(workingSet.sections.get('1.8')?.content).toBe('h');
        expect(workingSet.sections.has('2')).toBe(false);
    });
});
