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

    it('reuses the same snapshot object when every input is stable', () => {
        const args = {
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
        };

        const first = buildSceneInputSnapshots(args);
        const second = buildSceneInputSnapshots(args);

        expect(second).toBe(first);
    });

    it('keeps more than one snapshot entry hot at the same time', () => {
        const documentStateA = {
            meta: {
                mandalaV2: {
                    revision: 1,
                    contentRevision: 1,
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
                        content: 'A',
                    },
                },
            },
        } as never;
        const documentStateB = {
            meta: {
                mandalaV2: {
                    revision: 2,
                    contentRevision: 2,
                },
            },
            sections: {
                section_id: {
                    '2': 'node-2',
                },
            },
            document: {
                content: {
                    'node-2': {
                        content: 'B',
                    },
                },
            },
        } as never;
        const baseArgs = {
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
        };

        const first = buildSceneInputSnapshots({
            ...baseArgs,
            documentState: documentStateA,
        });
        buildSceneInputSnapshots({
            ...baseArgs,
            documentState: documentStateB,
            activeNodeId: 'node-2',
            editingState: {
                activeNodeId: 'node-2',
                isInSidebar: false,
            },
            selectedNodes: new Set(['node-2']),
            selectedStamp: 'node-2',
            pinnedSections: new Set(['2']),
            pinnedStamp: '2',
        });
        const revisited = buildSceneInputSnapshots({
            ...baseArgs,
            documentState: documentStateA,
        });

        expect(revisited).toBe(first);
    });

    it('evicts the oldest snapshot after the ninth distinct cache entry', () => {
        const createArgs = (index: number) => ({
            documentState: {
                meta: {
                    mandalaV2: {
                        revision: index,
                        contentRevision: index,
                    },
                },
                sections: {
                    section_id: {
                        [String(index)]: `node-${index}`,
                    },
                },
                document: {
                    content: {
                        [`node-${index}`]: {
                            content: `node-${index}`,
                        },
                    },
                },
            } as never,
            sectionColors: { [String(index)]: '#111' },
            sectionColorOpacity: 60,
            backgroundMode: 'custom',
            showDetailSidebar: false,
            whiteThemeMode: false,
            activeNodeId: `node-${index}`,
            editingState: {
                activeNodeId: `node-${index}`,
                isInSidebar: false,
            },
            selectedNodes: new Set([`node-${index}`]),
            selectedStamp: `node-${index}`,
            pinnedSections: new Set([String(index)]),
            pinnedStamp: String(index),
        });
        const firstArgs = createArgs(0);
        const first = buildSceneInputSnapshots(firstArgs);

        for (let index = 1; index <= 8; index += 1) {
            buildSceneInputSnapshots(createArgs(index));
        }

        const revisited = buildSceneInputSnapshots(firstArgs);
        expect(revisited).not.toBe(first);
    });
});
