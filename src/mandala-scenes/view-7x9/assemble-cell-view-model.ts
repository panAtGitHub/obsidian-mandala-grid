import { createDefaultCellDisplayPolicy } from 'src/mandala-cell/model/default-cell-display-policy';
import { resolveSectionBackgroundInput } from 'src/mandala-display/logic/section-colors';
import {
    buildWeekPlanBaseCells,
    type WeekPlanBaseCell,
} from 'src/mandala-display/logic/week-plan-context';
import type { WeekPlanRow } from 'src/mandala-display/logic/day-plan';
import {
    buildSceneCardCellList,
    createSceneCardCellSeed,
    type SceneCardCellDescriptorList,
    type SceneCardCellViewModel,
} from 'src/mandala-scenes/shared/card-scene-cell';
import { build7x9CellDisplayOverrides } from 'src/mandala-scenes/view-7x9/build-cell-display-overrides';

type EditingState = {
    activeNodeId: string | null;
    isInSidebar: boolean;
};

type AssembleDesktopWeekPlanCellsOptions = {
    rows: WeekPlanRow[];
    sectionIdMap: Record<string, string | undefined>;
    activeNodeId: string | null;
    activeCell: { row: number; col: number } | null;
    compactMode: boolean;
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
    activeNodeId: string | null;
    activeCell: { row: number; col: number } | null;
};

export type WeekPlanDesktopCellViewModel = WeekPlanBaseCell &
    SceneCardCellViewModel & {
    isActiveCell: boolean;
    isActiveNode: boolean;
};

export type WeekPlanMobileCellViewModel = WeekPlanBaseCell & {
    title: string;
    body: string;
    isActiveCell: boolean;
    isActiveNode: boolean;
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
        body = normalizeCellPreviewText(lines.slice(1).join('\n')).slice(
            0,
            150,
        );
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
    compactMode,
    editingState,
    selectedNodes,
    pinnedSections,
    sectionColors,
    sectionColorOpacity,
    backgroundMode,
    showDetailSidebar,
    whiteThemeMode,
}: AssembleDesktopWeekPlanCellsOptions): WeekPlanDesktopCellViewModel[] => {
    const displayPolicy = {
        ...createDefaultCellDisplayPolicy(),
        ...build7x9CellDisplayOverrides({
            whiteThemeMode,
            hasGridSelection: Boolean(activeCell),
            compactMode,
        }),
    };
    const descriptors: SceneCardCellDescriptorList<
        Omit<WeekPlanDesktopCellViewModel, keyof SceneCardCellViewModel>
    > = buildWeekPlanBaseCells({ rows, sectionIdMap }).map((cell) => ({
        seed: createSceneCardCellSeed({
            key: `${cell.row}:${cell.col}`,
            section: cell.section ?? `${cell.row}:${cell.col}`,
            nodeId: cell.nodeId,
            contentEnabled: true,
            sectionColor: cell.section
                ? resolveSectionBackgroundInput({
                      section: cell.section,
                      backgroundMode,
                      sectionColorsBySection: sectionColors,
                      sectionColorOpacity,
                  })
                : null,
            metaAccentColor: cell.section
                ? sectionColors[cell.section] ?? null
                : null,
            displayPolicy,
        }),
        extra: {
            row: cell.row,
            col: cell.col,
            isPlaceholder: cell.isPlaceholder,
            isCenterColumn: cell.isCenterColumn,
            emptyLabel: cell.emptyLabel,
            isActiveCell:
                !!activeCell &&
                activeCell.row === cell.row &&
                activeCell.col === cell.col,
            isActiveNode:
                !activeCell && !!cell.nodeId && cell.nodeId === activeNodeId,
        },
    }));

    return buildSceneCardCellList({
        descriptors,
        interaction: {
            activeNodeId,
            editingState,
            selectedNodes,
            pinnedSections,
            showDetailSidebar,
        },
    });
};

export const assembleMobileWeekPlanCells = ({
    rows,
    sectionIdMap,
    documentContent,
    activeNodeId,
    activeCell,
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
            isActiveCell:
                !!activeCell &&
                activeCell.row === cell.row &&
                activeCell.col === cell.col,
            isActiveNode:
                !activeCell && !!cell.nodeId && cell.nodeId === activeNodeId,
        };
    });
