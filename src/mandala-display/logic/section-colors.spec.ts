import { describe, expect, it } from 'vitest';
import {
    compareSectionIds,
    createPinnedSectionSet,
    parsePinnedSectionsFromPersistedState,
    resolveCustomSectionColor,
    serializeSectionColorMap,
    setSectionColor,
    swapSectionColors,
    swapSectionSubtreeColors,
    type SectionColorMap,
} from 'src/mandala-display/logic/section-colors';

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

    it('swaps section colors between two sections', () => {
        const map = createMap({
            '2_rose': ['2.1'],
            '6_blue': ['2.2'],
        });

        const next = swapSectionColors(map, '2.1', '2.2');

        expect(next['2_rose']).toEqual(['2.2']);
        expect(next['6_blue']).toEqual(['2.1']);
    });

    it('moves color to target when source has color and target has none', () => {
        const map = createMap({
            '2_rose': ['2.1'],
        });

        const next = swapSectionColors(map, '2.1', '2.2');

        expect(next['2_rose']).toEqual(['2.2']);
    });

    it('swaps colors for whole descendant subtrees', () => {
        const map = createMap({
            '2_rose': ['2.3', '2.3.7'],
            '6_blue': ['2.7.2', '9.1'],
        });

        const next = swapSectionSubtreeColors(map, '2.3', '2.7');

        expect(next['2_rose']).toEqual(['2.7', '2.7.7']);
        expect(next['6_blue']).toEqual(['2.3.2', '9.1']);
    });

    it('parses persisted pinned sections with sorted unique values', () => {
        expect(
            parsePinnedSectionsFromPersistedState([2, '1.2', 1.2, '1.2', 1]),
        ).toEqual(['1', '1.2', '2']);
    });

    it('resolves custom section colors by section id', () => {
        expect(
            resolveCustomSectionColor({
                section: '1.2',
                backgroundMode: 'custom',
                sectionColorsBySection: {
                    '1.2': '#677FEF',
                },
                sectionColorOpacity: 65,
            }),
        ).toBe('rgba(103, 127, 239, 0.65)');
    });

    it('creates pinned section sets from current section occupancy', () => {
        expect(
            createPinnedSectionSet(
                {
                    section_id: {
                        '1.1': 'node-a',
                        '1.2': 'node-b',
                    },
                    id_section: {
                        'node-a': '1.1',
                        'node-b': '1.2',
                    },
                },
                ['node-b'],
            ),
        ).toEqual(new Set(['1.2']));
    });
});
