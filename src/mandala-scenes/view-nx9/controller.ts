import type {
    Nx9SceneProjection,
    SceneController,
    SceneRootContext,
} from 'src/mandala-scenes/shared/scene-projection';
import { buildNx9SceneProjection } from 'src/mandala-scenes/view-nx9/build-scene-projection';
import {
    normalizeNx9VisibleSection,
    resolveNx9Context,
} from 'src/mandala-scenes/view-nx9/context';
import { setActiveCellNx9 } from 'src/mandala-scenes/view-nx9/set-active-cell';

const syncNx9SceneState = (context: SceneRootContext) => {
    const section = context.idToSection[context.ui.activeNodeId ?? ''];
    const nx9Context = resolveNx9Context({
        sectionIdMap: context.documentState.sections.section_id,
        documentContent: context.documentState.document.content,
        rowsPerPage: context.settings.nx9RowsPerPage,
        activeSection: section,
        activeCell: context.ui.nx9ActiveCell,
    });
    const visibleSection = normalizeNx9VisibleSection(section);
    const pos = nx9Context.posForSection(section);
    const cell = context.view.mandalaActiveCellNx9;

    if (!section) {
        if (cell) {
            setActiveCellNx9(context.view, null);
        }
        return;
    }

    if (!cell && pos) {
        setActiveCellNx9(context.view, {
            row: pos.row,
            col: pos.col,
            page: pos.page,
        });
        return;
    }

    if (!cell) {
        return;
    }

    const mapped = nx9Context.sectionForCell(cell.row, cell.col, cell.page);
    const isGhostCreateCell = nx9Context.isGhostCreateCell(
        cell.row,
        cell.col,
        cell.page,
    );
    if (!mapped && !isGhostCreateCell) {
        setActiveCellNx9(
            context.view,
            pos
                ? {
                      row: pos.row,
                      col: pos.col,
                      page: pos.page,
                  }
                : null,
        );
        return;
    }

    if (mapped && mapped !== visibleSection) {
        setActiveCellNx9(
            context.view,
            pos
                ? {
                      row: pos.row,
                      col: pos.col,
                      page: pos.page,
                  }
                : null,
        );
    }
};

export const createNx9Controller = (): SceneController => {
    let cachedProjection: Nx9SceneProjection | null = null;
    let cachedDocumentSnapshot: SceneRootContext['documentSnapshot'] | null =
        null;
    let cachedDisplaySnapshot: SceneRootContext['displaySnapshot'] | null = null;
    let cachedInteractionSnapshot:
        | SceneRootContext['interactionSnapshot']
        | null = null;
    let cachedThemeSnapshot: SceneRootContext['sceneThemeSnapshot'] | null = null;
    let cachedGridStyle: SceneRootContext['gridStyles']['nx9'] | null = null;
    let cachedRowsPerPage = 0;
    let cachedActiveSection: string | null = null;
    let cachedActiveCoreSection: string | null = null;
    let cachedActiveCell: SceneRootContext['ui']['nx9ActiveCell'] | null = null;
    let cachedSceneKeyId = '';

    return {
        resolveProjection: (context) => {
            syncNx9SceneState(context);

            const nextSceneKeyId = `${context.sceneKey.viewKind}:${context.sceneKey.variant}`;
            if (
                cachedProjection &&
                cachedSceneKeyId === nextSceneKeyId &&
                cachedDocumentSnapshot === context.documentSnapshot &&
                cachedDisplaySnapshot === context.displaySnapshot &&
                cachedInteractionSnapshot === context.interactionSnapshot &&
                cachedThemeSnapshot === context.sceneThemeSnapshot &&
                cachedGridStyle === context.gridStyles.nx9 &&
                cachedRowsPerPage === context.settings.nx9RowsPerPage &&
                cachedActiveSection === context.ui.activeSection &&
                cachedActiveCoreSection === context.ui.activeCoreSection &&
                cachedActiveCell === context.ui.nx9ActiveCell
            ) {
                return cachedProjection;
            }

            cachedProjection = buildNx9SceneProjection(context.sceneKey, {
                documentSnapshot: context.documentSnapshot,
                themeSnapshot: context.sceneThemeSnapshot,
                gridStyle: context.gridStyles.nx9,
                rowsPerPage: context.settings.nx9RowsPerPage,
                displaySnapshot: context.displaySnapshot,
                interactionSnapshot: context.interactionSnapshot,
                activeSection: context.ui.activeSection,
                activeCoreSection: context.ui.activeCoreSection,
                activeCell: context.ui.nx9ActiveCell,
            });
            cachedSceneKeyId = nextSceneKeyId;
            cachedDocumentSnapshot = context.documentSnapshot;
            cachedDisplaySnapshot = context.displaySnapshot;
            cachedInteractionSnapshot = context.interactionSnapshot;
            cachedThemeSnapshot = context.sceneThemeSnapshot;
            cachedGridStyle = context.gridStyles.nx9;
            cachedRowsPerPage = context.settings.nx9RowsPerPage;
            cachedActiveSection = context.ui.activeSection;
            cachedActiveCoreSection = context.ui.activeCoreSection;
            cachedActiveCell = context.ui.nx9ActiveCell;
            return cachedProjection;
        },
    };
};
