import { parseDayPlanFrontmatter } from 'src/mandala-display/logic/day-plan';
import {
    posOfSection9x9,
    sectionAtCell9x9,
} from 'src/mandala-display/logic/mandala-grid';
import { resolveWeekPlanContext } from 'src/mandala-display/logic/week-plan-context';
import type { DocumentState } from 'src/mandala-document/state/document-state-type';
import { setActiveCell9x9 } from 'src/mandala-interaction/helpers/set-active-cell-9x9';
import { setActiveCellWeek7x9 } from 'src/mandala-interaction/helpers/set-active-cell-week-7x9';
import type {
    MandalaCustomLayout,
    MandalaMode,
    WeekStart,
} from 'src/mandala-settings/state/settings-type';
import {
    normalizeNx9VisibleSection,
    resolveNx9Context,
} from 'src/mandala-scenes/view-nx9/context';
import { setActiveCellNx9 } from 'src/mandala-scenes/view-nx9/set-active-cell';
import type { MandalaView } from 'src/view/view';

const getBaseTheme = (section: string | undefined) =>
    section ? section.split('.')[0] : '1';

type SyncSceneStateArgs = {
    view: MandalaView;
    mode: MandalaMode;
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
};

export const createSceneStateSynchronizer = () => {
    let cachedDayPlanFrontmatter: string | null = null;
    let cachedDayPlan = parseDayPlanFrontmatter('');

    const getCachedDayPlan = (frontmatter: string) => {
        if (frontmatter !== cachedDayPlanFrontmatter) {
            cachedDayPlanFrontmatter = frontmatter;
            cachedDayPlan = parseDayPlanFrontmatter(frontmatter);
        }
        return cachedDayPlan;
    };

    return ({
        view,
        mode,
        dayPlanEnabled,
        subgridTheme,
        sectionToNodeId,
        idToSection,
        activeNodeId,
        documentState,
        selectedLayoutId,
        customLayouts,
        nx9RowsPerPage,
        weekAnchorDate,
        weekStart,
    }: SyncSceneStateArgs) => {
        if (mode && !subgridTheme) {
            view.viewStore.dispatch({
                type: 'view/mandala/subgrid/enter',
                payload: { theme: '1' },
            });
        }

        if (
            mode === 'week-7x9' &&
            (!dayPlanEnabled ||
                !view.plugin.settings.getValue().general.weekPlanEnabled ||
                !getCachedDayPlan(documentState.file.frontmatter))
        ) {
            view.ensureCompatibleMandalaMode(documentState.file.frontmatter);
        }

        if (mode === 'nx9' && !view.canUseNx9Mode(documentState.file.frontmatter)) {
            view.ensureCompatibleMandalaMode(documentState.file.frontmatter);
        }

        if (
            mode === '3x3' &&
            subgridTheme &&
            subgridTheme !== '1' &&
            !sectionToNodeId[subgridTheme]
        ) {
            view.viewStore.dispatch({
                type: 'view/mandala/subgrid/enter',
                payload: { theme: '1' },
            });
        }

        if (mode !== '9x9') {
            if (view.mandalaActiveCell9x9) {
                setActiveCell9x9(view, null);
            }
        } else {
            const section = idToSection[activeNodeId ?? ''];
            const baseTheme = getBaseTheme(section);
            if (!section) {
                if (view.mandalaActiveCell9x9) {
                    setActiveCell9x9(view, null);
                }
            } else {
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
            }
        }

        if (mode !== 'nx9') {
            if (view.mandalaActiveCellNx9) {
                setActiveCellNx9(view, null);
            }
        } else {
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
                } else if (mapped && mapped !== visibleSection) {
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
        }

        if (mode !== 'week-7x9') {
            if (view.mandalaActiveCellWeek7x9) {
                setActiveCellWeek7x9(view, null);
            }
            return;
        }

        const weekContext = resolveWeekPlanContext({
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
        const cell = view.mandalaActiveCellWeek7x9;
        if (!section) {
            if (cell) {
                setActiveCellWeek7x9(view, null);
            }
        } else if (cell) {
            const mapped = weekContext.sectionForCell(cell.row, cell.col);
            if (!mapped || mapped !== section) {
                setActiveCellWeek7x9(view, pos ?? null);
            }
        }
    };
};
