import { describe, expect, it, vi } from 'vitest';
import {
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
});
