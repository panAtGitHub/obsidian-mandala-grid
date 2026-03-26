import { describe, expect, it } from 'vitest';
import { createDefaultCellDisplayPolicy } from 'src/mandala-cell/model/default-cell-display-policy';
import {
    buildSceneCardCell,
    buildSceneCardUiState,
    buildSceneCardViewModel,
    createSceneCardCellSeed,
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
        const seed = createSceneCardCellSeed({
            key: '1.1',
            section: '1.1',
            nodeId: 'node-1',
            contentEnabled: true,
            sectionColor: null,
            metaAccentColor: null,
            displayPolicy: createDefaultCellDisplayPolicy(),
        });

        expect(
            buildSceneCardCell({
                seed,
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
            key: '1.1',
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

    it('creates a reusable shared card cell seed', () => {
        expect(
            createSceneCardCellSeed({
                key: '1.2',
                section: '1.2',
                nodeId: 'node-2',
                contentEnabled: false,
                sectionColor: 'red',
                metaAccentColor: 'blue',
                displayPolicy: createDefaultCellDisplayPolicy(),
            }),
        ).toMatchObject({
            frame: {
                key: '1.2',
                section: '1.2',
                nodeId: 'node-2',
            },
            descriptor: {
                nodeId: 'node-2',
                section: '1.2',
                contentEnabled: false,
                sectionColor: 'red',
                metaAccentColor: 'blue',
            },
        });
    });
});
