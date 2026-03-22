import {
    getReadableTextTone,
    type ThemeTone,
} from 'src/helpers/views/mandala/contrast-text-tone';
import { applyOpacityToHex } from 'src/lib/mandala/section-colors';
import type {
    SimpleSummaryCellModel,
    SimpleSummaryActiveCell,
} from 'src/mandala-cell/model/simple-summary-cell-model';
import { getMandalaLayoutById } from 'src/view/helpers/mandala/mandala-grid';
import type { MandalaCustomLayout } from 'src/mandala-settings/state/settings-type';

type Build9x9CellsOptions = {
    documentState: {
        sections: {
            section_id: Record<string, string>;
            id_section: Record<string, string>;
        };
        document: {
            content: Record<string, { content?: string }>;
        };
    };
    selectedLayoutId: string;
    customLayouts: MandalaCustomLayout[];
    baseTheme: string;
};

type Decorate9x9CellsOptions = {
    cells: SimpleSummaryCellModel[];
    backgroundMode: string;
    sectionColors: Record<string, string>;
    sectionColorOpacity: number;
    themeTone: ThemeTone;
    themeUnderlayColor: string;
};

const DARK_TEXT_TOKENS =
    '--text-normal: #0f131a; --text-muted: #2f3a48; --text-faint: #4f5c6b; --text-accent: #0f131a;';

const LIGHT_TEXT_TOKENS =
    '--text-normal: #f3f6fd; --text-muted: #d0d8e6; --text-faint: #b0bbce; --text-accent: #f3f6fd;';

const HEADING_RE = /^\s{0,3}#{1,6}\s+/;

const isCrossBlock = (blockRow: number, blockCol: number) =>
    (blockRow === 0 && blockCol === 1) ||
    (blockRow === 1 && blockCol === 0) ||
    (blockRow === 1 && blockCol === 2) ||
    (blockRow === 2 && blockCol === 1);

const normalizeCellPreviewText = (raw: string) =>
    raw
        .replace(/^\s*[-*+]\s+\[[ xX]\]\s*/gm, '')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '')
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();

const buildCellMarkdown = (rawBody: string) =>
    normalizeCellPreviewText(rawBody).slice(0, 150);

const isMarkdownHeading = (line: string) => HEADING_RE.test(line);
const stripHeadingPrefix = (line: string) => line.replace(HEADING_RE, '');

export const getBaseTheme = (section: string | undefined) =>
    section ? section.split('.')[0] : '1';

export const build9x9CellViewModels = ({
    documentState,
    selectedLayoutId,
    customLayouts,
    baseTheme,
}: Build9x9CellsOptions): SimpleSummaryCellModel[] => {
    const layout = getMandalaLayoutById(selectedLayoutId, customLayouts);
    const list: SimpleSummaryCellModel[] = [];

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            let section: string | null = null;
            const blockRow = Math.floor(row / 3);
            const blockCol = Math.floor(col / 3);
            const localRow = row % 3;
            const localCol = col % 3;
            const isCenter = blockRow === 1 && blockCol === 1;
            const isThemeCenter = localRow === 1 && localCol === 1;

            const blockSlot = isCenter
                ? null
                : layout.themeGrid[blockRow]?.[blockCol] ?? null;
            const theme = blockSlot ? `${baseTheme}.${blockSlot}` : baseTheme;
            const isGrayBlock = !isCenter && isCrossBlock(blockRow, blockCol);

            if (isThemeCenter) {
                section = theme;
            } else {
                const slot = layout.themeGrid[localRow]?.[localCol];
                if (slot) {
                    section = `${theme}.${slot}`;
                }
            }

            let titleMarkdown = '';
            let bodyMarkdown = '';
            let nodeId = '';

            if (section) {
                const id = documentState.sections.section_id[section];
                if (id) {
                    nodeId = id;
                    const nodeContent = documentState.document.content[id]?.content;
                    if (nodeContent) {
                        const lines = nodeContent.split('\n');
                        const firstLine = lines[0]?.trim() ?? '';
                        const restLines = lines.slice(1);

                        if (firstLine && isMarkdownHeading(firstLine)) {
                            titleMarkdown = buildCellMarkdown(
                                stripHeadingPrefix(firstLine).trim(),
                            );
                            if (restLines.length > 0) {
                                bodyMarkdown = buildCellMarkdown(
                                    restLines.join('\n').trim().slice(0, 150),
                                );
                            }
                        } else {
                            bodyMarkdown = buildCellMarkdown(
                                lines.join('\n').trim().slice(0, 150),
                            );
                        }
                    }
                }
            }

            list.push({
                row,
                col,
                section,
                titleMarkdown,
                bodyMarkdown,
                nodeId,
                isCenter,
                isThemeCenter,
                isGrayBlock,
                background: null,
                textTone: null,
                style: null,
            });
        }
    }

    return list;
};

export const decorate9x9CellViewModels = ({
    cells,
    backgroundMode,
    sectionColors,
    sectionColorOpacity,
    themeTone,
    themeUnderlayColor,
}: Decorate9x9CellsOptions): SimpleSummaryCellModel[] => {
    const opacity = sectionColorOpacity / 100;

    return cells.map((cell) => {
        const sectionColor =
            backgroundMode === 'custom' && cell.section
                ? sectionColors[cell.section]
                : null;
        const background = sectionColor
            ? applyOpacityToHex(sectionColor, opacity)
            : backgroundMode === 'gray' && cell.isGrayBlock
              ? `color-mix(in srgb, var(--mandala-gray-block-base) ${sectionColorOpacity}%, transparent)`
              : null;
        const textTone = background
            ? getReadableTextTone(background, themeTone, themeUnderlayColor)
            : null;

        const styleParts = [];
        if (background) styleParts.push(`background-color: ${background};`);
        if (textTone === 'dark') styleParts.push(DARK_TEXT_TOKENS);
        if (textTone === 'light') styleParts.push(LIGHT_TEXT_TOKENS);

        return {
            ...cell,
            background,
            textTone,
            style: styleParts.length > 0 ? styleParts.join(' ') : null,
        };
    });
};

export const toActiveSummaryCell = (
    activeCell: { row: number; col: number } | null,
): SimpleSummaryActiveCell =>
    activeCell ? { row: activeCell.row, col: activeCell.col } : null;
