import { describe, expect, it } from 'vitest';
import {
    buildNx9SceneProjection,
    buildNx9SceneProjectionProps,
} from 'src/mandala-scenes/view-nx9/build-scene-projection';
import { resolveCardGridStyle } from 'src/mandala-scenes/shared/grid-style';

const nx9GridStyle = resolveCardGridStyle({
    whiteThemeMode: false,
});

describe('build-nx9-scene-projection', () => {
    it('derives card-mode active highlighting from shared display settings', () => {
        expect(
            buildNx9SceneProjectionProps({
                documentSnapshot: {
                    revision: 1,
                    contentRevision: 2,
                    sectionIdMap: {},
                    documentContent: {},
                },
                themeSnapshot: {
                    themeTone: 'light',
                    themeUnderlayColor: '#fff',
                    activeThemeUnderlayColor: '#eee',
                },
                rowsPerPage: 5,
                displaySnapshot: {
                    sectionColors: {},
                    sectionColorOpacity: 0,
                    backgroundMode: 'none',
                    showDetailSidebar: false,
                    whiteThemeMode: false,
                },
                interactionSnapshot: {
                    activeNodeId: null,
                    editingState: {
                        activeNodeId: null,
                        isInSidebar: false,
                    },
                    selectedNodes: new Set<string>(),
                    showDetailSidebar: false,
                    selectedStamp: '',
                    pinnedSections: new Set<string>(),
                    pinnedStamp: '',
                },
                activeSection: null,
                activeCoreSection: null,
                activeCell: null,
            }).layoutMeta.gridStyle,
        ).toMatchObject({
            selectionStyle: 'node-active',
            cellDisplayPolicy: {
                preserveActiveBackground: false,
            },
        });
    });

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
            layoutKind: 'nx9',
            output: {},
            layoutMeta: {
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
                gridStyle: nx9GridStyle,
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
            rendererKind: 'card-scene',
            props: {
                layoutKind: 'nx9',
                output: {},
                layoutMeta: {
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
                    gridStyle: nx9GridStyle,
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
            },
        });
    });
});
