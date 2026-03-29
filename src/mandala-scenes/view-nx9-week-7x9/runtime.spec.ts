import { describe, expect, it } from 'vitest';
import { resolveWeekPlanContext } from 'src/mandala-display/logic/week-plan-context';
import { resolveCardGridStyle } from 'src/mandala-scenes/shared/grid-style';
import { createNx9WeekRuntime } from 'src/mandala-scenes/view-nx9-week-7x9/runtime';

const frontmatter = `---
mandala: true
mandala_plan:
  enabled: true
  year: 2026
  daily_only_3x3: false
---`;

const weekContext = resolveWeekPlanContext({
    frontmatter,
    anchorDate: '2026-03-18',
    weekStart: 'monday',
});

const gridStyle = resolveCardGridStyle({
    whiteThemeMode: false,
    compactMode: true,
});

const displaySnapshot = {
    sectionColors: {},
    sectionColorOpacity: 60,
    backgroundMode: 'custom',
    showDetailSidebar: false,
    whiteThemeMode: false,
};

const sectionIdMap = {
    '75': 'node-75',
    '76': 'node-76',
};

const createInteraction = (overrides: Record<string, unknown> = {}) => ({
    activeNodeId: 'node-75',
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

describe('nx9-week-runtime', () => {
    it('reuses the same cells array for identical inputs', () => {
        const runtime = createNx9WeekRuntime();
        const args = {
            weekContext,
            sectionIdMap,
            gridStyle,
            displaySnapshot,
            interactionSnapshot: createInteraction(),
            activeCell: null,
        };

        const first = runtime.resolveCells(args);
        const second = runtime.resolveCells({
            ...args,
            interactionSnapshot: createInteraction(),
        });

        expect(second).toBe(first);
    });

    it('patches active-only changes without rebuilding unaffected cells', () => {
        const runtime = createNx9WeekRuntime();
        const base = runtime.resolveCells({
            weekContext,
            sectionIdMap,
            gridStyle,
            displaySnapshot,
            interactionSnapshot: createInteraction({
                activeNodeId: 'node-75',
            }),
            activeCell: null,
        });
        const shifted = runtime.resolveCells({
            weekContext,
            sectionIdMap,
            gridStyle,
            displaySnapshot,
            interactionSnapshot: createInteraction({
                activeNodeId: 'node-76',
            }),
            activeCell: null,
        });

        expect(shifted).not.toBe(base);
        expect(shifted[0]).not.toBe(base[0]);
        expect(shifted[9]).not.toBe(base[9]);
        expect(shifted[1]).toBe(base[1]);
    });

    it('evicts the oldest week runtime entries once the bounded cache is full', () => {
        const runtime = createNx9WeekRuntime();
        const firstDisplaySnapshot = {
            ...displaySnapshot,
        };
        const first = runtime.resolveCells({
            weekContext,
            sectionIdMap,
            gridStyle,
            displaySnapshot: firstDisplaySnapshot,
            interactionSnapshot: createInteraction(),
            activeCell: null,
        });

        for (let index = 1; index <= 24; index += 1) {
            runtime.resolveCells({
                weekContext,
                sectionIdMap,
                gridStyle,
                displaySnapshot: {
                    ...displaySnapshot,
                    backgroundMode: `custom-${index}`,
                },
                interactionSnapshot: createInteraction(),
                activeCell: null,
            });
        }

        const revisited = runtime.resolveCells({
            weekContext,
            sectionIdMap,
            gridStyle,
            displaySnapshot: firstDisplaySnapshot,
            interactionSnapshot: createInteraction(),
            activeCell: null,
        });

        expect(revisited).not.toBe(first);
    });
});
