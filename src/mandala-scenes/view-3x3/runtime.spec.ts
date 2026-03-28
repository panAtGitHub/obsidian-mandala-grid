import { describe, expect, it } from 'vitest';
import { buildMandalaTopologyIndex } from 'src/mandala-display/logic/mandala-topology';
import { resolveCardGridStyle } from 'src/mandala-scenes/shared/grid-style';
import { createThreeByThreeRuntime } from 'src/mandala-scenes/view-3x3/runtime';

const topology = buildMandalaTopologyIndex({
    '1': 'node-1',
    '1.1': 'node-1-1',
    '1.2': 'node-1-2',
    '1.3': 'node-1-3',
    '1.4': 'node-1-4',
    '1.5': 'node-1-5',
    '1.6': 'node-1-6',
    '1.7': 'node-1-7',
    '1.8': 'node-1-8',
});

const gridStyle = resolveCardGridStyle({
    whiteThemeMode: false,
});

const displaySnapshot = {
    sectionColors: {},
    sectionColorOpacity: 60,
    backgroundMode: 'custom',
    showDetailSidebar: false,
    whiteThemeMode: false,
};

const createInteraction = (overrides: Record<string, unknown> = {}) => ({
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
    ...overrides,
});

describe('three-by-three-runtime', () => {
    it('reuses the same cells array for identical inputs', () => {
        const runtime = createThreeByThreeRuntime();
        const args = {
            theme: '1',
            selectedLayoutId: null,
            customLayouts: [],
            topology,
            interaction: createInteraction(),
            gridStyle,
            displaySnapshot,
        };

        const prepared = runtime.resolveCells(args);
        const committed = runtime.resolveCells({
            ...args,
            interaction: createInteraction(),
        });

        expect(committed).toBe(prepared);
    });

    it('keeps cached results per interaction snapshot', () => {
        const runtime = createThreeByThreeRuntime();
        const args = {
            theme: '1',
            selectedLayoutId: null,
            customLayouts: [],
            topology,
            interaction: createInteraction(),
            gridStyle,
            displaySnapshot,
        };

        const inactive = runtime.resolveCells(args);
        const active = runtime.resolveCells({
            ...args,
            interaction: createInteraction({
                activeNodeId: 'node-1',
            }),
        });
        const activeAgain = runtime.resolveCells({
            ...args,
            interaction: createInteraction({
                activeNodeId: 'node-1',
            }),
        });

        expect(active).not.toBe(inactive);
        expect(activeAgain).toBe(active);
    });
});
