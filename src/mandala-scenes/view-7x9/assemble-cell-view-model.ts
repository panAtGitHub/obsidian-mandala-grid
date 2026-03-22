import { buildMandalaCardViewModel } from 'src/mandala-cell/model/build-mandala-card-view-model';
import type { MandalaCardViewModel } from 'src/mandala-cell/model/card-view-model';
import { buildCellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';
import { buildCellInteractionPolicy } from 'src/mandala-cell/viewmodel/policies/cell-interaction-policy';
import { resolveCustomSectionColor } from 'src/lib/mandala/section-colors';
import {
    buildWeekPlanBaseCells,
    type WeekPlanBaseCell,
} from 'src/lib/mandala/week-plan-context';
import type { WeekPlanRow } from 'src/lib/mandala/day-plan';

type EditingState = {
    activeNodeId: string | null;
    isInSidebar: boolean;
};

type AssembleDesktopWeekPlanCellsOptions = {
    rows: WeekPlanRow[];
    sectionIdMap: Record<string, string | undefined>;
    activeNodeId: string | null;
    activeCell: { row: number; col: number } | null;
    editingState: EditingState;
    selectedNodes: Set<string>;
    pinnedSections: Set<string>;
    sectionColors: Record<string, string>;
    sectionColorOpacity: number;
    backgroundMode: string;
    showDetailSidebar: boolean;
    whiteThemeMode: boolean;
};

type AssembleMobileWeekPlanCellsOptions = {
    rows: WeekPlanRow[];
    sectionIdMap: Record<string, string | undefined>;
    documentContent: Record<string, { content?: string }>;
};

export type WeekPlanDesktopCellViewModel = WeekPlanBaseCell & {
    cardViewModel: MandalaCardViewModel | null;
    isActiveCell: boolean;
    isActiveNode: boolean;
};

export type WeekPlanMobileCellViewModel = WeekPlanBaseCell & {
    title: string;
    body: string;
};

const normalizeCellPreviewText = (raw: string) =>
    raw
        .replace(/^\s*[-*+]\s+\[[ xX]\]\s*/gm, '')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '')
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();

const HEADING_RE = /^\s{0,3}#{1,6}\s+/;

const buildMobileSummary = (content: string) => {
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim() ?? '';
    let title = '';
    let body = '';

    if (firstLine && HEADING_RE.test(firstLine)) {
        title = normalizeCellPreviewText(firstLine.replace(HEADING_RE, ''));
        body = normalizeCellPreviewText(lines.slice(1).join('\n')).slice(0, 150);
    } else {
        body = normalizeCellPreviewText(lines.join('\n')).slice(0, 150);
    }

    return { title, body };
};

export const assembleDesktopWeekPlanCells = ({
    rows,
    sectionIdMap,
    activeNodeId,
    activeCell,
    editingState,
    selectedNodes,
    pinnedSections,
    sectionColors,
    sectionColorOpacity,
    backgroundMode,
    showDetailSidebar,
    whiteThemeMode,
}: AssembleDesktopWeekPlanCellsOptions): WeekPlanDesktopCellViewModel[] => {
    const displayPolicy = buildCellDisplayPolicy({
        preset: 'grid-7x9',
        whiteThemeMode,
        hasGridSelection: Boolean(activeCell),
    });
    const interactionPolicy = buildCellInteractionPolicy({
        preset: 'grid-7x9',
    });

    return buildWeekPlanBaseCells({ rows, sectionIdMap }).map((cell) => ({
        ...cell,
        isActiveCell:
            !!activeCell &&
            activeCell.row === cell.row &&
            activeCell.col === cell.col,
        isActiveNode:
            !activeCell && !!cell.nodeId && cell.nodeId === activeNodeId,
        cardViewModel: cell.nodeId
            ? buildMandalaCardViewModel({
                  nodeId: cell.nodeId,
                  section: cell.section ?? '',
                  active: cell.nodeId === activeNodeId,
                  editing:
                      editingState.activeNodeId === cell.nodeId &&
                      !editingState.isInSidebar &&
                      !showDetailSidebar,
                  selected: selectedNodes.has(cell.nodeId),
                  pinned: cell.section
                      ? pinnedSections.has(cell.section)
                      : false,
                  style: undefined,
                  sectionColor: resolveCustomSectionColor({
                      section: cell.section,
                      backgroundMode,
                      sectionColorsBySection: sectionColors,
                      sectionColorOpacity,
                  }),
                  metaAccentColor: cell.section
                      ? sectionColors[cell.section] ?? null
                      : null,
                  displayPolicy,
                  interactionPolicy,
                  gridCell: {
                      mode: 'week-7x9',
                      row: cell.row,
                      col: cell.col,
                  },
              })
            : null,
    }));
};

export const assembleMobileWeekPlanCells = ({
    rows,
    sectionIdMap,
    documentContent,
}: AssembleMobileWeekPlanCellsOptions): WeekPlanMobileCellViewModel[] =>
    buildWeekPlanBaseCells({ rows, sectionIdMap }).map((cell) => {
        const content = cell.nodeId
            ? documentContent[cell.nodeId]?.content ?? ''
            : '';
        const summary = cell.nodeId
            ? buildMobileSummary(content)
            : { title: '', body: '' };

        return {
            ...cell,
            title: summary.title,
            body: summary.body,
        };
    });
