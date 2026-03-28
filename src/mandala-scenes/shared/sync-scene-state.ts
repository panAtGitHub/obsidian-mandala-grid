import {
    posOfSection9x9,
    sectionAtCell9x9,
} from 'src/mandala-display/logic/mandala-grid';
import { getSectionCore } from 'src/mandala-display/logic/mandala-topology';
import {
    resolveWeekPlanContext,
    type WeekPlanContext,
} from 'src/mandala-display/logic/week-plan-context';
import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import type { DocumentState } from 'src/mandala-document/state/document-state-type';
import { setActiveCell9x9 } from 'src/mandala-interaction/helpers/set-active-cell-9x9';
import { setActiveCellNx9Week7x9 } from 'src/mandala-scenes/view-nx9-week-7x9/set-active-cell';
import type {
    MandalaCustomLayout,
    WeekStart,
} from 'src/mandala-settings/state/settings-type';
import {
    normalizeNx9VisibleSection,
    resolveNx9Context,
} from 'src/mandala-scenes/view-nx9/context';
import { setActiveCellNx9 } from 'src/mandala-scenes/view-nx9/set-active-cell';
import type { MandalaView } from 'src/view/view';

const getBaseTheme = (section: string | undefined) => getSectionCore(section) ?? '1';

type SyncSceneStateArgs = {
    view: MandalaView;
    sceneKey: MandalaSceneKey;
    dayPlanEnabled: boolean;
    subgridTheme: string | null | undefined;
    sectionToNodeId: Record<string, string | undefined>;
    idToSection: Record<string, string | undefined>;
    activeNodeId: string | null | undefined;
    documentState: DocumentState;
    selectedLayoutId: string;
    customLayouts: MandalaCustomLayout[];
    nx9RowsPerPage: number | null | undefined;
    weekAnchorDate: string | null | undefined;
    weekStart: WeekStart;
    weekContext?: WeekPlanContext | null;
};

export const createSceneStateSynchronizer = () => {
    const sync9x9State = ({
        view,
        idToSection,
        activeNodeId,
        selectedLayoutId,
        customLayouts,
    }: Pick<
        SyncSceneStateArgs,
        | 'view'
        | 'idToSection'
        | 'activeNodeId'
        | 'selectedLayoutId'
        | 'customLayouts'
    >) => {
        const section = idToSection[activeNodeId ?? ''];
        const baseTheme = getBaseTheme(section);
        if (!section) {
            if (view.mandalaActiveCell9x9) {
                setActiveCell9x9(view, null);
            }
            return;
        }
        const cell = view.mandalaActiveCell9x9;
        const pos = posOfSection9x9(
            section,
            selectedLayoutId,
            baseTheme,
            customLayouts,
        );
        if (cell) {
            const mapped = sectionAtCell9x9(
                cell.row,
                cell.col,
                selectedLayoutId,
                baseTheme,
                customLayouts,
            );
            if (!mapped || mapped !== section) {
                setActiveCell9x9(view, pos ?? null);
            }
        }
    };

    const syncNx9State = ({
        view,
        idToSection,
        activeNodeId,
        documentState,
        nx9RowsPerPage,
    }: Pick<
        SyncSceneStateArgs,
        | 'view'
        | 'idToSection'
        | 'activeNodeId'
        | 'documentState'
        | 'nx9RowsPerPage'
    >) => {
        const section = idToSection[activeNodeId ?? ''];
        const nx9Context = resolveNx9Context({
            sectionIdMap: documentState.sections.section_id,
            documentContent: documentState.document.content,
            rowsPerPage: nx9RowsPerPage,
            activeSection: section,
            activeCell: view.mandalaActiveCellNx9,
        });
        const visibleSection = normalizeNx9VisibleSection(section);
        const pos = nx9Context.posForSection(section);
        const cell = view.mandalaActiveCellNx9;
        if (!section) {
            if (cell) {
                setActiveCellNx9(view, null);
            }
        } else if (!cell && pos) {
            setActiveCellNx9(view, {
                row: pos.row,
                col: pos.col,
                page: pos.page,
            });
        } else if (cell) {
            const mapped = nx9Context.sectionForCell(
                cell.row,
                cell.col,
                cell.page,
            );
            const isGhostCreateCell = nx9Context.isGhostCreateCell(
                cell.row,
                cell.col,
                cell.page,
            );
            if (!mapped && !isGhostCreateCell) {
                setActiveCellNx9(
                    view,
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
                    view,
                    pos
                        ? {
                              row: pos.row,
                              col: pos.col,
                              page: pos.page,
                          }
                        : null,
                );
            }
        }
    };

    const syncWeekState = ({
        view,
        documentState,
        weekAnchorDate,
        weekStart,
        idToSection,
        activeNodeId,
        weekContext: providedWeekContext,
    }: Pick<
        SyncSceneStateArgs,
        | 'view'
        | 'documentState'
        | 'weekAnchorDate'
        | 'weekStart'
        | 'idToSection'
        | 'activeNodeId'
        | 'weekContext'
    >) => {
        const weekContext =
            providedWeekContext ??
            resolveWeekPlanContext({
                frontmatter: documentState.file.frontmatter,
                anchorDate: weekAnchorDate,
                weekStart,
            });
        const anchorDate = weekContext.anchorDate;
        if (!weekAnchorDate) {
            view.viewStore.dispatch({
                type: 'view/mandala/week-anchor-date/set',
                payload: { date: anchorDate },
            });
        }
        const section = idToSection[activeNodeId ?? ''];
        const pos = weekContext.posForSection(section);
        const cell =
            view.mandalaActiveCellNx9?.page === 0
                ? view.mandalaActiveCellNx9
                : null;
        if (!section) {
            if (cell) {
                setActiveCellNx9Week7x9(view, null);
            }
        } else if (cell) {
            const mapped = weekContext.sectionForCell(cell.row, cell.col);
            if (!mapped || mapped !== section) {
                setActiveCellNx9Week7x9(
                    view,
                    pos
                        ? {
                              row: pos.row,
                              col: pos.col,
                              page: 0,
                          }
                        : null,
                );
            }
        } else if (pos) {
            setActiveCellNx9Week7x9(view, {
                row: pos.row,
                col: pos.col,
                page: 0,
            });
        }
    };

    return (args: SyncSceneStateArgs) => {
        if (args.sceneKey.viewKind === '9x9') {
            sync9x9State(args);
        }
        if (
            args.sceneKey.viewKind === 'nx9' &&
            args.sceneKey.variant !== 'week-7x9'
        ) {
            syncNx9State(args);
        }
        if (
            args.sceneKey.viewKind === 'nx9' &&
            args.sceneKey.variant === 'week-7x9'
        ) {
            syncWeekState(args);
        }
    };
};
