import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    posOfSection9x9: vi.fn(),
    sectionAtCell9x9: vi.fn(),
}));

vi.mock('src/mandala-display/logic/mandala-grid', () => ({
    posOfSection9x9: mocks.posOfSection9x9,
    sectionAtCell9x9: mocks.sectionAtCell9x9,
}));

import { tryMandala9x9Navigation } from 'src/mandala-interaction/keyboard/try-mandala-9x9-navigation';

describe('tryMandala9x9Navigation', () => {
    it('advances using the concrete grid coordinate and keeps movement continuity', () => {
        const dispatch = vi.fn();
        const recordPerfAfterNextPaint = vi.fn();
        let activeCell: { row: number; col: number } | null = {
            row: 4,
            col: 1,
        };

        mocks.sectionAtCell9x9.mockReturnValue('1.2');
        mocks.posOfSection9x9.mockReturnValue({ row: 4, col: 1 });

        const view = {
            mandalaMode: '9x9',
            documentStore: {
                getValue: () => ({
                    meta: { isMandala: true },
                    sections: {
                        id_section: { 'node-1': '1.2' },
                        section_id: { '1.2': 'node-1' },
                    },
                }),
            },
            viewStore: {
                getValue: () => ({
                    document: {
                        activeNode: 'node-1',
                        selectedNodes: new Set<string>(),
                    },
                    ui: {
                        mandala: {
                            sceneState: {
                                nineByNine: {
                                    activeCell,
                                },
                            },
                        },
                    },
                }),
                dispatch,
            },
            plugin: {
                settings: {
                    getValue: () => ({
                        view: {
                            mandalaGridCustomLayouts: [],
                        },
                    }),
                },
            },
            getCurrentMandalaLayoutId: () => 'builtin:left-to-right',
            get mandalaActiveCell9x9() {
                return activeCell;
            },
            set mandalaActiveCell9x9(cell: { row: number; col: number } | null) {
                activeCell = cell;
            },
            recordPerfAfterNextPaint,
        } as never;

        const handled = tryMandala9x9Navigation(view, 'right');

        expect(handled).toBe(true);
        expect(activeCell).toEqual({ row: 4, col: 2 });
        expect(dispatch).not.toHaveBeenCalled();
        expect(recordPerfAfterNextPaint).toHaveBeenCalledWith(
            'interaction.9x9.navigate',
            expect.any(Number),
            expect.objectContaining({
                to_row: 4,
                to_col: 2,
            }),
        );
    });
});
