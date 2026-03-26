import { describe, expect, it } from 'vitest';
import { createDefaultCellDisplayPolicy } from 'src/mandala-cell/model/default-cell-display-policy';
import {
    buildSceneCardCell,
    buildSceneCardUiState,
    buildSceneCardViewModel,
    createInactiveSceneCardUiState,
} from 'src/mandala-scenes/shared/card-scene-cell';

describe('card-scene-cell', () => {
    it('builds a shared card view model from a scene descriptor', () => {
        expect(
            buildSceneCardViewModel({
                nodeId: 'node-1',
                section: '1.1',
                contentEnabled: true,
                sectionColor: 'red',
                metaAccentColor: 'blue',
                displayPolicy: createDefaultCellDisplayPolicy(),
            }),
        ).toMatchObject({
            nodeId: 'node-1',
            section: '1.1',
            contentEnabled: true,
            sectionColor: 'red',
            metaAccentColor: 'blue',
        });
    });

    it('builds active and editing state from shared card inputs', () => {
        expect(
            buildSceneCardUiState({
                nodeId: 'node-1',
                section: '1.1',
                activeNodeId: 'node-1',
                editingState: {
                    activeNodeId: 'node-1',
                    isInSidebar: false,
                },
                selectedNodes: new Set(['node-1']),
                pinnedSections: new Set(['1.1']),
                showDetailSidebar: false,
            }),
        ).toEqual({
            active: true,
            editing: true,
            selected: true,
            pinned: true,
        });
    });

    it('creates a shared inactive ui state for empty cells', () => {
        expect(createInactiveSceneCardUiState()).toEqual({
            active: false,
            editing: false,
            selected: false,
            pinned: false,
        });
    });

    it('builds a complete shared card cell from descriptor and interaction', () => {
        expect(
            buildSceneCardCell({
                descriptor: {
                    nodeId: 'node-1',
                    section: '1.1',
                    contentEnabled: true,
                    sectionColor: null,
                    metaAccentColor: null,
                    displayPolicy: createDefaultCellDisplayPolicy(),
                },
                interaction: {
                    activeNodeId: 'node-1',
                    editingState: {
                        activeNodeId: null,
                        isInSidebar: false,
                    },
                    selectedNodes: new Set(['node-1']),
                    pinnedSections: new Set(['1.1']),
                    showDetailSidebar: false,
                },
            }),
        ).toMatchObject({
            section: '1.1',
            nodeId: 'node-1',
            cardViewModel: {
                nodeId: 'node-1',
                section: '1.1',
            },
            cardUiState: {
                active: true,
                editing: false,
                selected: true,
                pinned: true,
            },
        });
    });
});
