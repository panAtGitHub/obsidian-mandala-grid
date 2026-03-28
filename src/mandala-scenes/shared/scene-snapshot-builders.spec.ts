import { describe, expect, it } from 'vitest';
import {
    buildSceneCardInteractionSnapshot,
    buildSceneDisplaySnapshot,
    buildSceneDocumentSnapshot,
} from 'src/mandala-scenes/shared/scene-snapshot-builders';

describe('scene-snapshot-builders', () => {
    it('builds display, interaction, and document snapshots', () => {
        expect(
            buildSceneDisplaySnapshot({
                sectionColors: { '1': '#111' },
                sectionColorOpacity: 60,
                backgroundMode: 'custom',
                showDetailSidebar: true,
                whiteThemeMode: false,
            }),
        ).toEqual({
            sectionColors: { '1': '#111' },
            sectionColorOpacity: 60,
            backgroundMode: 'custom',
            showDetailSidebar: true,
            whiteThemeMode: false,
        });

        expect(
            buildSceneCardInteractionSnapshot({
                activeNodeId: 'node-1',
                editingState: {
                    activeNodeId: 'node-1',
                    isInSidebar: false,
                },
                selectedNodes: new Set(['node-1']),
                showDetailSidebar: true,
                selectedStamp: 'node-1',
                pinnedSections: new Set(['1']),
                pinnedStamp: '1',
            }),
        ).toEqual({
            activeNodeId: 'node-1',
            editingState: {
                activeNodeId: 'node-1',
                isInSidebar: false,
            },
            selectedNodes: new Set(['node-1']),
            showDetailSidebar: true,
            selectedStamp: 'node-1',
            pinnedSections: new Set(['1']),
            pinnedStamp: '1',
        });

        expect(
            buildSceneDocumentSnapshot({
                revision: 1,
                contentRevision: 2,
                sectionIdMap: { '1': 'node-1' },
                documentContent: { 'node-1': { content: 'hello' } },
            }),
        ).toEqual({
            revision: 1,
            contentRevision: 2,
            sectionIdMap: { '1': 'node-1' },
            documentContent: { 'node-1': { content: 'hello' } },
        });
    });
});
