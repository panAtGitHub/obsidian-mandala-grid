import { describe, expect, it } from 'vitest';
import { buildSceneInputSnapshots } from 'src/mandala-scenes/shared/scene-input-runtime';

describe('scene-input-runtime', () => {
    it('builds document, display, and interaction snapshots together', () => {
        const snapshots = buildSceneInputSnapshots({
            documentState: {
                meta: {
                    mandalaV2: {
                        revision: 3,
                        contentRevision: 7,
                    },
                },
                sections: {
                    section_id: {
                        '1': 'node-1',
                    },
                },
                document: {
                    content: {
                        'node-1': {
                            content: 'hello',
                        },
                    },
                },
            } as never,
            sectionColors: { '1': '#111' },
            sectionColorOpacity: 60,
            backgroundMode: 'custom',
            showDetailSidebar: true,
            whiteThemeMode: false,
            activeNodeId: 'node-1',
            editingState: {
                activeNodeId: 'node-1',
                isInSidebar: false,
            },
            selectedNodes: new Set(['node-1']),
            selectedStamp: 'node-1',
            pinnedSections: new Set(['1']),
            pinnedStamp: '1',
        });

        expect(snapshots).toEqual({
            documentSnapshot: {
                revision: 3,
                contentRevision: 7,
                sectionIdMap: { '1': 'node-1' },
                documentContent: {
                    'node-1': {
                        content: 'hello',
                    },
                },
            },
            displaySnapshot: {
                sectionColors: { '1': '#111' },
                sectionColorOpacity: 60,
                backgroundMode: 'custom',
                showDetailSidebar: true,
                whiteThemeMode: false,
            },
            interactionSnapshot: {
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
            },
        });
    });
});
