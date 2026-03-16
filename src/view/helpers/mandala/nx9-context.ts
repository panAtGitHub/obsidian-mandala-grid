import { compareSectionIds } from 'src/mandala-v2/section-utils';
import { DEFAULT_NX9_ROWS_PER_PAGE } from 'src/stores/settings/settings-type';

export type Nx9CellPosition = { row: number; col: number };
export type Nx9CellWithPage = Nx9CellPosition & { page: number };

export type RowMatrixBaseCell = {
    row: number;
    col: number;
    section: string | null;
    nodeId: string | null;
    isPlaceholder: boolean;
    isCenterColumn: boolean;
    emptyLabel: string | null;
};

export type Nx9Context = {
    coreSections: string[];
    rowsPerPage: number;
    totalPages: number;
    currentPage: number;
    pageRows: Array<string | null>;
    sectionForCell: (row: number, col: number, page?: number) => string | null;
    posForSection: (
        section: string | null | undefined,
    ) => Nx9CellWithPage | null;
};

const CORE_SECTION_PATTERN = /^\d+$/;

export const normalizeNx9RowsPerPage = (value: number | null | undefined) =>
    Number.isInteger(value) && (value ?? 0) >= 1
        ? value
        : DEFAULT_NX9_ROWS_PER_PAGE;

export const normalizeNx9VisibleSection = (
    section: string | null | undefined,
) => {
    if (!section) return null;
    const parts = section.split('.');
    if (parts.length <= 2) return section;
    return parts[0] ?? null;
};

export const collectNx9CoreSections = (
    sectionIdMap: Record<string, string | undefined>,
) =>
    Object.keys(sectionIdMap)
        .filter(
            (section) =>
                CORE_SECTION_PATTERN.test(section) && sectionIdMap[section],
        )
        .sort(compareSectionIds);

export const getNx9TotalPages = (coreSections: string[], rowsPerPage: number) =>
    Math.max(1, Math.ceil(coreSections.length / rowsPerPage));

export const buildNx9PageRows = ({
    coreSections,
    rowsPerPage,
    page,
}: {
    coreSections: string[];
    rowsPerPage: number;
    page: number;
}) => {
    const start = page * rowsPerPage;
    return Array.from(
        { length: rowsPerPage },
        (_, row) => coreSections[start + row] ?? null,
    );
};

export const sectionAtCellNx9 = (
    row: number,
    col: number,
    pageRows: Array<string | null>,
) => {
    const coreSection = pageRows[row];
    if (!coreSection) return null;
    if (col === 0) return coreSection;
    if (col < 1 || col > 8) return null;
    return `${coreSection}.${col}`;
};

export const posOfSectionNx9 = (
    section: string,
    coreSections: string[],
    rowsPerPage: number,
): Nx9CellWithPage | null => {
    const visibleSection = normalizeNx9VisibleSection(section);
    if (!visibleSection) return null;

    const [coreSection, childSlot] = visibleSection.split('.');
    if (!coreSection) return null;

    const flatIndex = coreSections.findIndex((value) => value === coreSection);
    if (flatIndex === -1) return null;

    if (!childSlot) {
        return {
            page: Math.floor(flatIndex / rowsPerPage),
            row: flatIndex % rowsPerPage,
            col: 0,
        };
    }

    const col = Number(childSlot);
    if (!Number.isInteger(col) || col < 1 || col > 8) return null;

    return {
        page: Math.floor(flatIndex / rowsPerPage),
        row: flatIndex % rowsPerPage,
        col,
    };
};

export const resolveNx9Context = ({
    sectionIdMap,
    rowsPerPage,
    activeSection,
}: {
    sectionIdMap: Record<string, string | undefined>;
    rowsPerPage: number | null | undefined;
    activeSection: string | null | undefined;
}): Nx9Context => {
    const normalizedRowsPerPage = normalizeNx9RowsPerPage(rowsPerPage);
    const coreSections = collectNx9CoreSections(sectionIdMap);
    const totalPages = getNx9TotalPages(coreSections, normalizedRowsPerPage);
    const activePos = activeSection
        ? posOfSectionNx9(activeSection, coreSections, normalizedRowsPerPage)
        : null;
    const currentPage = Math.min(activePos?.page ?? 0, totalPages - 1);
    const pageRows = buildNx9PageRows({
        coreSections,
        rowsPerPage: normalizedRowsPerPage,
        page: currentPage,
    });

    return {
        coreSections,
        rowsPerPage: normalizedRowsPerPage,
        totalPages,
        currentPage,
        pageRows,
        sectionForCell: (row, col, page = currentPage) =>
            sectionAtCellNx9(
                row,
                col,
                buildNx9PageRows({
                    coreSections,
                    rowsPerPage: normalizedRowsPerPage,
                    page,
                }),
            ),
        posForSection: (section) =>
            section
                ? posOfSectionNx9(section, coreSections, normalizedRowsPerPage)
                : null,
    };
};

export const resolveNx9CurrentCell = ({
    activeCell,
    activeSection,
    context,
}: {
    activeCell: Nx9CellPosition | null | undefined;
    activeSection: string | null | undefined;
    context: Nx9Context;
}): Nx9CellPosition => {
    if (activeCell) return activeCell;
    const pos = activeSection ? context.posForSection(activeSection) : null;
    if (pos) {
        return {
            row: pos.row,
            col: pos.col,
        };
    }
    return { row: 0, col: 0 };
};

export const buildNx9BaseCells = ({
    pageRows,
    sectionIdMap,
}: {
    pageRows: Array<string | null>;
    sectionIdMap: Record<string, string | undefined>;
}): RowMatrixBaseCell[] => {
    const cells: RowMatrixBaseCell[] = [];
    for (let row = 0; row < pageRows.length; row += 1) {
        const coreSection = pageRows[row];
        for (let col = 0; col < 9; col += 1) {
            const section = sectionAtCellNx9(row, col, pageRows);
            cells.push({
                row,
                col,
                section,
                nodeId: section ? sectionIdMap[section] ?? null : null,
                isPlaceholder: !coreSection,
                isCenterColumn: col === 0,
                emptyLabel: coreSection ? section : '',
            });
        }
    }
    return cells;
};

export const findFirstPopulatedNx9Cell = ({
    context,
    page,
    sectionIdMap,
}: {
    context: Nx9Context;
    page: number;
    sectionIdMap: Record<string, string | undefined>;
}): Nx9CellWithPage | null => {
    for (let row = 0; row < context.rowsPerPage; row += 1) {
        for (let col = 0; col < 9; col += 1) {
            const section = context.sectionForCell(row, col, page);
            if (!section) continue;
            if (sectionIdMap[section]) {
                return { page, row, col };
            }
        }
    }
    for (let row = 0; row < context.rowsPerPage; row += 1) {
        const section = context.sectionForCell(row, 0, page);
        if (!section) continue;
        return { page, row, col: 0 };
    }
    return null;
};

export const resolveNx9PageNavigationTarget = ({
    context,
    page,
    preferredCol,
    sectionIdMap,
}: {
    context: Nx9Context;
    page: number;
    preferredCol: number;
    sectionIdMap: Record<string, string | undefined>;
}): Nx9CellWithPage | null => {
    const section = context.sectionForCell(0, preferredCol, page);
    if (section && sectionIdMap[section]) {
        return {
            page,
            row: 0,
            col: preferredCol,
        };
    }
    return findFirstPopulatedNx9Cell({
        context,
        page,
        sectionIdMap,
    });
};
