import { describe, expect, it } from 'vitest';
import { sectionAtCell9x9, posOfSection9x9 } from 'src/mandala-display/logic/mandala-grid';
import { tryMandala9x9Navigation } from 'src/mandala-interaction/keyboard/try-mandala-9x9-navigation';
import { createNineByNineController } from 'src/mandala-scenes/view-9x9/controller';
import type { SceneRootContext } from 'src/mandala-scenes/shared/scene-projection';

const layoutId = 'builtin:left-to-right';
const baseTheme = '1';

const buildSectionMaps = () => {
    const section_id: Record<string, string> = {};
    const id_section: Record<string, string> = {};
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const section = sectionAtCell9x9(row, col, layoutId, baseTheme, []);
            if (!section || section_id[section]) continue;
            const nodeId = `node:${section}`;
            section_id[section] = nodeId;
            id_section[nodeId] = section;
        }
    }
    return { section_id, id_section };
};

const findAliasCell = (section: string) => {
    const canonical = posOfSection9x9(section, layoutId, baseTheme, []);
    if (!canonical) return null;

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const mapped = sectionAtCell9x9(row, col, layoutId, baseTheme, []);
            if (mapped !== section) continue;
            if (row === canonical.row && col === canonical.col) continue;
            return { row, col };
        }
    }

    return null;
};

describe('tryMandala9x9Navigation loop guard', () => {
    it('moves continuously from duplicated section cells without falling into a 2-cell loop', () => {
        const { section_id, id_section } = buildSectionMaps();
        const startSection = '1.7';
        const startNodeId = section_id[startSection];
        const aliasCell = findAliasCell(startSection);

        expect(startNodeId).toBeTruthy();
        expect(aliasCell).toBeTruthy();

        let activeNodeId = startNodeId;
        let activeCell = aliasCell;

        const view = {
            mandalaMode: '9x9',
            documentStore: {
                getValue: () => ({
                    meta: { isMandala: true },
                    sections: {
                        section_id,
                        id_section,
                    },
                }),
            },
            viewStore: {
                getValue: () => ({
                    document: {
                        activeNode: activeNodeId,
                        selectedNodes: new Set<string>(),
                    },
                }),
                dispatch: (action: { type: string; payload: { id: string } }) => {
                    if (action.type === 'view/set-active-node/9x9-nav') {
                        activeNodeId = action.payload.id;
                    }
                },
            },
            plugin: {
                settings: {
                    getValue: () => ({
                        view: {
                            mandalaGridCustomLayouts: [],
                        },
                    }),
                },
            },
            getCurrentMandalaLayoutId: () => layoutId,
            get mandalaActiveCell9x9() {
                return activeCell;
            },
            set mandalaActiveCell9x9(cell: { row: number; col: number } | null) {
                activeCell = cell;
            },
            recordPerfAfterNextPaint: () => undefined,
        } as never;

        const visitedCells: Array<{ row: number; col: number }> = [];

        for (let i = 0; i < 4; i++) {
            const handled = tryMandala9x9Navigation(view, 'right');
            expect(handled).toBe(true);
            expect(activeCell).not.toBeNull();
            visitedCells.push({
                row: activeCell!.row,
                col: activeCell!.col,
            });
        }

        expect(visitedCells[0]).toEqual({
            row: aliasCell!.row,
            col: aliasCell!.col + 1,
        });
        expect(visitedCells[1]).toEqual({
            row: aliasCell!.row,
            col: aliasCell!.col + 2,
        });
        expect(visitedCells[2]).toEqual({
            row: aliasCell!.row,
            col: aliasCell!.col + 3,
        });
        expect(visitedCells[3]).toEqual({
            row: aliasCell!.row,
            col: aliasCell!.col + 4,
        });

        expect(
            visitedCells[0].row === visitedCells[2].row &&
                visitedCells[0].col === visitedCells[2].col &&
                visitedCells[1].row === visitedCells[3].row &&
                visitedCells[1].col === visitedCells[3].col,
        ).toBe(false);
    });

    it('does not snap back after moving onto a section that has no node', () => {
        const { section_id, id_section } = buildSectionMaps();
        const startSection = '1.7';
        const startNodeId = section_id[startSection];
        const aliasCell = findAliasCell(startSection);

        expect(startNodeId).toBeTruthy();
        expect(aliasCell).toBeTruthy();

        const firstMoveSection = sectionAtCell9x9(
            aliasCell!.row,
            aliasCell!.col + 1,
            layoutId,
            baseTheme,
            [],
        );
        expect(firstMoveSection).toBeTruthy();

        if (firstMoveSection) {
            delete section_id[firstMoveSection];
        }

        let activeNodeId = startNodeId;
        let activeCell = aliasCell;

        const view = {
            mandalaMode: '9x9',
            documentStore: {
                getValue: () => ({
                    meta: { isMandala: true },
                    sections: {
                        section_id,
                        id_section,
                    },
                }),
            },
            viewStore: {
                getValue: () => ({
                    document: {
                        activeNode: activeNodeId,
                        selectedNodes: new Set<string>(),
                    },
                }),
                dispatch: (action: { type: string; payload: { id: string } }) => {
                    if (action.type === 'view/set-active-node/9x9-nav') {
                        activeNodeId = action.payload.id;
                    }
                },
            },
            plugin: {
                settings: {
                    getValue: () => ({
                        view: {
                            mandalaGridCustomLayouts: [],
                        },
                    }),
                },
            },
            getCurrentMandalaLayoutId: () => layoutId,
            get mandalaActiveCell9x9() {
                return activeCell;
            },
            set mandalaActiveCell9x9(cell: { row: number; col: number } | null) {
                activeCell = cell;
            },
            recordPerfAfterNextPaint: () => undefined,
        } as never;

        const handled = tryMandala9x9Navigation(view, 'right');
        expect(handled).toBe(true);
        expect(activeCell).toEqual({
            row: aliasCell!.row,
            col: aliasCell!.col + 1,
        });
        expect(activeNodeId).toBe(startNodeId);

        const controller = createNineByNineController();
        controller.resolveProjection({
            sceneKey: {
                viewKind: '9x9',
                variant: 'default',
            },
            view,
            ui: {
                activeNodeId,
            },
            idToSection: id_section,
            sectionToNodeId: section_id,
            settings: {
                selectedLayoutId: layoutId,
                customLayouts: [],
            },
        } as unknown as SceneRootContext);

        expect(activeCell).toEqual({
            row: aliasCell!.row,
            col: aliasCell!.col + 1,
        });
    });
});
