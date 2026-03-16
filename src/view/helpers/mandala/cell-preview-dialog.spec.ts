import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toggleCellPreviewDialog } from 'src/view/helpers/mandala/cell-preview-dialog';

vi.mock('obsidian', () => ({
    Platform: {
        isMobile: false,
    },
}));

describe('cell-preview-dialog', () => {
    const createView = ({
        open = false,
        activeNode = 'node-1',
    }: {
        open?: boolean;
        activeNode?: string;
    }) => {
        const dispatch = vi.fn();
        return {
            mandalaMode: '3x3',
            mandalaActiveCell9x9: null,
            mandalaActiveCellWeek7x9: null,
            viewStore: {
                getValue: () => ({
                    document: {
                        activeNode,
                    },
                    ui: {
                        previewDialog: {
                            open,
                            nodeId: open ? activeNode : null,
                        },
                        mandala: {
                            activeCell9x9: null,
                            activeCellWeek7x9: null,
                            weekAnchorDate: null,
                        },
                    },
                }),
                dispatch,
            },
            documentStore: {
                getValue: () => ({
                    file: {
                        frontmatter: '',
                    },
                    sections: {
                        id_section: {
                            [activeNode]: '1',
                        },
                        section_id: {
                            '1': activeNode,
                        },
                    },
                }),
            },
            getCurrentMandalaLayoutId: () => 'builtin:left-to-right',
            plugin: {
                settings: {
                    getValue: () => ({
                        general: {
                            weekStart: 'monday',
                        },
                        view: {
                            mandalaGridCustomLayouts: [],
                        },
                    }),
                },
            },
        };
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('opens the preview dialog for the resolved node', () => {
        const view = createView({});

        expect(toggleCellPreviewDialog(view as never)).toBe(true);
        expect(view.viewStore.dispatch).toHaveBeenCalledWith({
            type: 'view/preview-dialog/open',
            payload: { nodeId: 'node-1' },
        });
    });

    it('closes the preview dialog when it is already open', () => {
        const view = createView({ open: true });

        expect(toggleCellPreviewDialog(view as never)).toBe(true);
        expect(view.viewStore.dispatch).toHaveBeenCalledWith({
            type: 'view/preview-dialog/close',
        });
    });

    it('does nothing when no node can be resolved', () => {
        const view = createView({ activeNode: '' });

        expect(toggleCellPreviewDialog(view as never)).toBe(false);
        expect(view.viewStore.dispatch).not.toHaveBeenCalled();
    });
});
