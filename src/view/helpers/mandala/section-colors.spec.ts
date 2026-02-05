import { describe, expect, it, vi } from 'vitest';
import {
    compareSectionIds,
    serializeSectionColorMap,
    setSectionColor,
    type SectionColorMap,
} from 'src/view/helpers/mandala/section-colors';

vi.mock('obsidian', () => ({
    parseYaml: vi.fn(),
    stringifyYaml: vi.fn(),
}));

const createMap = (partial: Partial<SectionColorMap>): SectionColorMap => ({
    '1_white': [],
    '2_rose': [],
    '3_amber': [],
    '4_yellow': [],
    '5_green': [],
    '6_blue': [],
    '7_violet': [],
    '8_graphite': [],
    ...partial,
});

describe('section-colors', () => {
    it('sorts section ids hierarchically', () => {
        const input = ['2.8', '2.10', '2.1', '2'];
        const sorted = [...input].sort(compareSectionIds);

        expect(sorted).toEqual(['2', '2.1', '2.8', '2.10']);
    });

    it('serializes map with deduped and sorted section ids', () => {
        const map = createMap({
            '2_rose': ['2.10', '2.1', '2.1', '2'],
        });

        expect(serializeSectionColorMap(map)).toEqual({
            '2_rose': ['2', '2.1', '2.10'],
        });
    });

    it('moves section between colors without duplicates', () => {
        const map = createMap({
            '2_rose': ['2.1', '2.2'],
            '5_green': ['2.2'],
        });

        const next = setSectionColor(map, '2.2', '2_rose');

        expect(next['2_rose']).toEqual(['2.1', '2.2']);
        expect(next['5_green']).toEqual([]);
    });
});
