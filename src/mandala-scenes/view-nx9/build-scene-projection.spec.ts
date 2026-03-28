import { describe, expect, it } from 'vitest';
import {
    buildNx9SceneProjection,
    buildNx9SceneProjectionProps,
} from 'src/mandala-scenes/view-nx9/build-scene-projection';

describe('build-nx9-scene-projection', () => {
    it('builds nx9 scene projection props from a theme snapshot', () => {
        expect(
            buildNx9SceneProjectionProps({
                documentSnapshot: {
                    revision: 1,
                    contentRevision: 2,
                    sectionIdMap: { '1': 'node-1' },
                    documentContent: { 'node-1': { content: 'hello' } },
                },
                themeSnapshot: {
                    themeTone: 'light',
                    themeUnderlayColor: '#fff',
                    activeThemeUnderlayColor: '#eee',
                },
                rowsPerPage: 5,
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
                activeSection: '1.2',
                activeCoreSection: '1',
                activeCell: { row: 1, col: 2, page: 0 },
            }),
        ).toEqual({
            documentSnapshot: {
                revision: 1,
                contentRevision: 2,
                sectionIdMap: { '1': 'node-1' },
                documentContent: { 'node-1': { content: 'hello' } },
            },
            themeSnapshot: {
                themeTone: 'light',
                themeUnderlayColor: '#fff',
                activeThemeUnderlayColor: '#eee',
            },
            rowsPerPage: 5,
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
            activeSection: '1.2',
            activeCoreSection: '1',
            activeCell: { row: 1, col: 2, page: 0 },
        });
    });

    it('wraps nx9 default scenes as a dedicated projection', () => {
        expect(
            buildNx9SceneProjection({
                viewKind: 'nx9',
                variant: 'default',
            }, {
                documentSnapshot: {
                    revision: 1,
                    contentRevision: 2,
                    sectionIdMap: { '1': 'node-1' },
                    documentContent: { 'node-1': { content: 'hello' } },
                },
                themeSnapshot: {
                    themeTone: 'light',
                    themeUnderlayColor: '#fff',
                    activeThemeUnderlayColor: '#eee',
                },
                rowsPerPage: 5,
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
                activeSection: '1.2',
                activeCoreSection: '1',
                activeCell: { row: 1, col: 2, page: 0 },
            }),
        ).toEqual({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'default',
            },
            rendererKind: 'nx9-layout',
            props: {
                documentSnapshot: {
                    revision: 1,
                    contentRevision: 2,
                    sectionIdMap: { '1': 'node-1' },
                    documentContent: { 'node-1': { content: 'hello' } },
                },
                themeSnapshot: {
                    themeTone: 'light',
                    themeUnderlayColor: '#fff',
                    activeThemeUnderlayColor: '#eee',
                },
                rowsPerPage: 5,
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
                activeSection: '1.2',
                activeCoreSection: '1',
                activeCell: { row: 1, col: 2, page: 0 },
            },
        });
    });
});
