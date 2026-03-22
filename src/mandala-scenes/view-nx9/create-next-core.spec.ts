import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createNextNx9Core } from 'src/mandala-scenes/view-nx9/create-next-core';

const noticeMock = vi.fn();

vi.mock('obsidian', () => ({
    Notice: function Notice(message: string) {
        noticeMock(message);
    },
}));

describe('nx9/create-next-core', () => {
    beforeEach(() => {
        noticeMock.mockReset();
    });

    it('creates the next core subtree and focuses the new core cell', () => {
        const documentState = {
            sections: {
                section_id: {
                    '1': 'node-1',
                    '2': 'node-2',
                } as Record<string, string | undefined>,
                id_section: {
                    'node-1': '1',
                    'node-2': '2',
                } as Record<string, string | undefined>,
            },
            document: {
                content: {
                    'node-1': { content: 'filled' },
                    'node-2': { content: 'filled' },
                } as Record<string, { content: string }>,
            },
        };
        const viewDispatch = vi.fn(
            (action: { type: string; payload?: { id?: string } }) => {
                if (action.type !== 'view/set-active-node/mouse-silent') return;
                activeNodeId = action.payload?.id ?? activeNodeId;
            },
        );
        let activeNodeId = 'node-2';

        const view = {
            mandalaActiveCellNx9: null,
            documentStore: {
                getValue: () => documentState,
                dispatch: vi.fn(
                    (action: { type: string; payload: { theme: string } }) => {
                        if (
                            action.type !== 'document/mandala/ensure-core-theme'
                        )
                            return;
                        documentState.sections.section_id[
                            action.payload.theme
                        ] = 'node-3';
                        documentState.sections.id_section['node-3'] =
                            action.payload.theme;
                        documentState.document.content['node-3'] = {
                            content: '',
                        };
                        for (let col = 1; col <= 8; col += 1) {
                            const section = `${action.payload.theme}.${col}`;
                            const nodeId = `node-3-${col}`;
                            documentState.sections.section_id[section] = nodeId;
                            documentState.sections.id_section[nodeId] = section;
                            documentState.document.content[nodeId] = {
                                content: '',
                            };
                        }
                    },
                ),
            },
            viewStore: {
                dispatch: viewDispatch,
                getValue: () => ({
                    document: {
                        activeNode: activeNodeId,
                    },
                }),
            },
            getCurrentNx9RowsPerPage: () => 2,
        };

        expect(createNextNx9Core(view as never, '3')).toBe(true);
        expect(view.documentStore.dispatch).toHaveBeenCalledWith({
            type: 'document/mandala/ensure-core-theme',
            payload: { theme: '3' },
        });
        expect(viewDispatch).toHaveBeenCalledWith({
            type: 'view/set-active-node/mouse-silent',
            payload: { id: 'node-3' },
        });
        expect(view.mandalaActiveCellNx9).toEqual({
            row: 0,
            col: 0,
            page: 1,
        });
    });

    it('blocks creation when the previous core center is still empty', () => {
        const documentState = {
            sections: {
                section_id: {
                    '1': 'node-1',
                    '2': 'node-2',
                } as Record<string, string | undefined>,
                id_section: {
                    'node-1': '1',
                    'node-2': '2',
                } as Record<string, string | undefined>,
            },
            document: {
                content: {
                    'node-1': { content: 'filled' },
                    'node-2': { content: '' },
                } as Record<string, { content: string }>,
            },
        };
        const view = {
            mandalaActiveCellNx9: null,
            documentStore: {
                getValue: () => documentState,
                dispatch: vi.fn(),
            },
            viewStore: {
                dispatch: vi.fn(),
            },
            getCurrentNx9RowsPerPage: () => 2,
        };

        expect(createNextNx9Core(view as never, '3')).toBe(false);
        expect(view.documentStore.dispatch).not.toHaveBeenCalled();
        expect(view.viewStore.dispatch).not.toHaveBeenCalled();
        expect(noticeMock).toHaveBeenCalledWith(
            '请先填写核心 2 的中心格内容，再创建新的核心九宫格。',
        );
    });
});
