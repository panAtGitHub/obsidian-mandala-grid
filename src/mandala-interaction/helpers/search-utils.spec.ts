import { describe, expect, it, vi } from 'vitest';
import {
    compareSectionIds,
    convertToMandalaResults,
    navigateToSearchResult,
    previewSearchResult,
} from 'src/mandala-interaction/helpers/search-utils';

describe('search-utils', () => {
    it('clamps the 3x3 center theme for deep preview targets while keeping the original node active', () => {
        const viewDispatch = vi.fn();
        const view = {
            documentStore: {
                getValue: () => ({
                    sections: {
                        section_id: {
                            '1.2.2.3': 'node-1-2-2-3',
                        },
                    },
                }),
            },
            viewStore: {
                dispatch: viewDispatch,
            },
            getEffectiveMandalaSettings: () => ({
                view: {
                    coreSectionMax: 'unlimited',
                    subgridMaxDepth: 3,
                    enable9x9View: true,
                    enableNx9View: true,
                },
                general: {
                    dayPlanEnabled: true,
                    weekPlanEnabled: true,
                    weekPlanCompactMode: true,
                    weekStart: 'monday',
                    dayPlanDateHeadingFormat: 'zh-short',
                    dayPlanDateHeadingCustomTemplate: '',
                },
            }),
        };

        previewSearchResult('1.2.2.3', view as never);

        expect(viewDispatch.mock.calls).toEqual([
            [
                {
                    type: 'view/mandala/subgrid/enter',
                    payload: { theme: '1.2' },
                },
            ],
            [
                {
                    type: 'view/set-active-node/mouse-silent',
                    payload: { id: 'node-1-2-2-3' },
                },
            ],
        ]);
    });

    it('clamps the 3x3 center theme for deep navigation targets while keeping the original node active', () => {
        const viewDispatch = vi.fn();
        const view = {
            documentStore: {
                getValue: () => ({
                    sections: {
                        section_id: {
                            '1.2.2.3': 'node-1-2-2-3',
                        },
                    },
                }),
            },
            viewStore: {
                dispatch: viewDispatch,
            },
            getEffectiveMandalaSettings: () => ({
                view: {
                    coreSectionMax: 'unlimited',
                    subgridMaxDepth: 3,
                    enable9x9View: true,
                    enableNx9View: true,
                },
                general: {
                    dayPlanEnabled: true,
                    weekPlanEnabled: true,
                    weekPlanCompactMode: true,
                    weekStart: 'monday',
                    dayPlanDateHeadingFormat: 'zh-short',
                    dayPlanDateHeadingCustomTemplate: '',
                },
            }),
        };

        navigateToSearchResult('1.2.2.3', view as never);

        expect(viewDispatch.mock.calls).toEqual([
            [
                {
                    type: 'view/mandala/subgrid/enter',
                    payload: { theme: '1.2' },
                },
            ],
            [
                {
                    type: 'view/set-active-node/search',
                    payload: { id: 'node-1-2-2-3' },
                },
            ],
        ]);
    });

    it('sorts search results by numeric section order', () => {
        const results = new Map([
            [
                '100',
                {
                    item: { sectionId: '100', nodeId: 'node-100', content: '100' },
                    score: 0,
                    refIndex: 0,
                },
            ],
            [
                '89.4',
                {
                    item: { sectionId: '89.4', nodeId: 'node-89-4', content: '89.4' },
                    score: 0,
                    refIndex: 1,
                },
            ],
            [
                '99',
                {
                    item: { sectionId: '99', nodeId: 'node-99', content: '99' },
                    score: 0,
                    refIndex: 2,
                },
            ],
            [
                '100.3',
                {
                    item: { sectionId: '100.3', nodeId: 'node-100-3', content: '100.3' },
                    score: 0,
                    refIndex: 3,
                },
            ],
        ]);

        expect(convertToMandalaResults(results).map((result) => result.section)).toEqual([
            '89.4',
            '99',
            '100',
            '100.3',
        ]);
        expect(
            convertToMandalaResults(results, 'desc').map((result) => result.section),
        ).toEqual(['100.3', '100', '99', '89.4']);
    });

    it('compares nested section ids numerically', () => {
        expect(compareSectionIds('42.8', '100.3')).toBeLessThan(0);
        expect(compareSectionIds('100', '99')).toBeGreaterThan(0);
        expect(compareSectionIds('100', '100.3')).toBeLessThan(0);
    });
});
