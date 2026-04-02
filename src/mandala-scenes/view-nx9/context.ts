import { collectTrailingEmptyCoreSections } from 'src/mandala-display/logic/clear-empty-subgrids';
import {
    buildMandalaTopologyIndex,
    getSectionCore,
} from 'src/mandala-display/logic/mandala-topology';
import { DEFAULT_NX9_ROWS_PER_PAGE } from 'src/mandala-settings/state/settings-type';
import type { Content } from 'src/mandala-document/state/document-state-type';

export type Nx9CellPosition = { row: number; col: number };
export type Nx9CellWithPage = Nx9CellPosition & { page: number };
export type Nx9ActiveCell = Nx9CellPosition & { page?: number };

export type Nx9RowModel =
    | {
          kind: 'real-core-row';
          coreSection: string;
      }
    | {
          kind: 'ghost-next-core-row';
          nextCoreSection: string;
      }
    | {
          kind: 'padding-row';
      };

export type Nx9Context = {
    coreSections: string[];
    effectiveCoreSections: string[];
    rowsPerPage: number;
    totalPages: number;
    currentPage: number;
    pageRows: Nx9RowModel[];
    sectionForCell: (row: number, col: number, page?: number) => string | null;
    posForSection: (
        section: string | null | undefined,
    ) => Nx9CellWithPage | null;
    isAddressableCell: (row: number, col: number, page?: number) => boolean;
    isGhostCreateCell: (row: number, col: number, page?: number) => boolean;
    isSelectableCell: (row: number, col: number, page?: number) => boolean;
};

export type Nx9StructureContext = {
    coreSections: string[];
    effectiveCoreSections: string[];
    rowsPerPage: number;
    rows: Nx9RowModel[];
    totalPages: number;
    posForSection: (
        section: string | null | undefined,
    ) => Nx9CellWithPage | null;
};

export type Nx9PageContext = Nx9Context;

const CORE_SECTION_PATTERN = /^\d+$/;

const clampPage = (page: number, totalPages: number) =>
    Math.min(Math.max(page, 0), totalPages - 1);

const createPaddingRows = (count: number): Nx9RowModel[] =>
    Array.from({ length: count }, () => ({ kind: 'padding-row' as const }));

export const normalizeNx9RowsPerPage = (value: number | null | undefined) =>
    typeof value === 'number' && Number.isInteger(value) && value >= 1
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
    buildMandalaTopologyIndex(sectionIdMap).coreSections.filter((section) =>
        CORE_SECTION_PATTERN.test(section),
    );

export const collectEffectiveNx9CoreSections = ({
    sectionIdMap,
    documentContent,
    activeSection,
}: {
    sectionIdMap: Record<string, string | undefined>;
    documentContent: Content;
    activeSection?: string | null | undefined;
}) => {
    const topology = buildMandalaTopologyIndex(sectionIdMap);
    const trailingCoreSections = collectTrailingEmptyCoreSections(
        topology.sectionsWithNode.map((sectionId) => {
            const nodeId = topology.entries[sectionId]?.nodeId;
            return {
                sectionId,
                content: nodeId ? documentContent[nodeId]?.content ?? '' : '',
            };
        }),
    );
    const activeCoreSection = getSectionCore(
        normalizeNx9VisibleSection(activeSection),
    );
    const activeTrailingIndex = activeCoreSection
        ? trailingCoreSections.indexOf(activeCoreSection)
        : -1;
    const removableTrailingCoreSections = new Set(
        activeTrailingIndex === -1
            ? trailingCoreSections
            : trailingCoreSections.slice(activeTrailingIndex + 1),
    );
    return topology.coreSections.filter(
        (section) => !removableTrailingCoreSections.has(section),
    );
};

export const buildNx9Rows = (
    effectiveCoreSections: string[],
    coreSectionMax: number | null = null,
): Nx9RowModel[] => {
    const rows: Nx9RowModel[] = effectiveCoreSections.map((coreSection) => ({
        kind: 'real-core-row',
        coreSection,
    }));
    const lastCoreNumber = Number(effectiveCoreSections.at(-1) ?? '0');
    const nextCoreSection = String(
        Number.isFinite(lastCoreNumber) && lastCoreNumber > 0
            ? lastCoreNumber + 1
            : 1,
    );
    const canCreateNextCore =
        coreSectionMax === null || Number(nextCoreSection) <= coreSectionMax;
    if (canCreateNextCore) {
        rows.push({
            kind: 'ghost-next-core-row',
            nextCoreSection,
        });
    }
    return rows;
};

export const getNx9TotalPages = (rowCount: number, rowsPerPage: number) =>
    Math.max(1, Math.ceil(rowCount / rowsPerPage));

export const buildNx9PageRows = ({
    rows,
    rowsPerPage,
    page,
}: {
    rows: Nx9RowModel[];
    rowsPerPage: number;
    page: number;
}) => {
    const start = page * rowsPerPage;
    const pageRows = rows.slice(start, start + rowsPerPage);
    return pageRows.concat(createPaddingRows(rowsPerPage - pageRows.length));
};

export const sectionAtCellNx9 = (
    row: number,
    col: number,
    pageRows: Nx9RowModel[],
) => {
    const rowModel = pageRows[row];
    if (!rowModel || rowModel.kind !== 'real-core-row') return null;
    if (col === 0) return rowModel.coreSection;
    if (col < 1 || col > 8) return null;
    return `${rowModel.coreSection}.${col}`;
};

export const isGhostCreateCellNx9 = (
    row: number,
    col: number,
    pageRows: Nx9RowModel[],
) => {
    const rowModel = pageRows[row];
    return rowModel?.kind === 'ghost-next-core-row' && col === 0;
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
    documentContent,
    rowsPerPage,
    activeSection,
    activeCell,
    coreSectionMax,
}: {
    sectionIdMap: Record<string, string | undefined>;
    documentContent: Content;
    rowsPerPage: number | null | undefined;
    activeSection: string | null | undefined;
    activeCell?: Nx9ActiveCell | null | undefined;
    coreSectionMax?: number | null | undefined;
}): Nx9Context => {
    const structureContext = resolveNx9StructureContext({
        sectionIdMap,
        documentContent,
        rowsPerPage,
        activeSection,
        coreSectionMax,
    });
    return resolveNx9PageContext({
        structureContext,
        activeSection,
        activeCell,
    });
};

export const resolveNx9StructureContext = ({
    sectionIdMap,
    documentContent,
    rowsPerPage,
    activeSection,
    coreSectionMax,
}: {
    sectionIdMap: Record<string, string | undefined>;
    documentContent: Content;
    rowsPerPage: number | null | undefined;
    activeSection: string | null | undefined;
    coreSectionMax?: number | null | undefined;
}): Nx9StructureContext => {
    const normalizedRowsPerPage = normalizeNx9RowsPerPage(rowsPerPage);
    const coreSections = collectNx9CoreSections(sectionIdMap);
    const effectiveCoreSections = collectEffectiveNx9CoreSections({
        sectionIdMap,
        documentContent,
        activeSection,
    });
    const rows = buildNx9Rows(effectiveCoreSections, coreSectionMax ?? null);
    const totalPages = getNx9TotalPages(rows.length, normalizedRowsPerPage);

    return {
        coreSections,
        effectiveCoreSections,
        rowsPerPage: normalizedRowsPerPage,
        rows,
        totalPages,
        posForSection: (section) =>
            section
                ? posOfSectionNx9(
                      section,
                      effectiveCoreSections,
                      normalizedRowsPerPage,
                  )
                : null,
    };
};

export const resolveNx9PageContext = ({
    structureContext,
    activeSection,
    activeCell,
}: {
    structureContext: Nx9StructureContext;
    activeSection: string | null | undefined;
    activeCell?: Nx9ActiveCell | null | undefined;
}): Nx9PageContext => {
    const {
        coreSections,
        effectiveCoreSections,
        rowsPerPage,
        rows,
        totalPages,
        posForSection,
    } = structureContext;
    const activePos = activeSection ? posForSection(activeSection) : null;
    const currentPage = clampPage(
        activeCell?.page ?? activePos?.page ?? 0,
        totalPages,
    );
    const pageRowsCache = new Map<number, Nx9RowModel[]>();
    const getPageRows = (page: number) => {
        const normalizedPage = clampPage(page, totalPages);
        const cached = pageRowsCache.get(normalizedPage);
        if (cached) {
            return cached;
        }
        const nextRows = buildNx9PageRows({
            rows,
            rowsPerPage,
            page: normalizedPage,
        });
        pageRowsCache.set(normalizedPage, nextRows);
        return nextRows;
    };
    const pageRows = getPageRows(currentPage);

    return {
        coreSections,
        effectiveCoreSections,
        rowsPerPage,
        totalPages,
        currentPage,
        pageRows,
        sectionForCell: (row, col, page = currentPage) =>
            sectionAtCellNx9(row, col, getPageRows(page)),
        posForSection,
        isAddressableCell: (row, col, page = currentPage) =>
            Boolean(sectionAtCellNx9(row, col, getPageRows(page))),
        isGhostCreateCell: (row, col, page = currentPage) =>
            isGhostCreateCellNx9(row, col, getPageRows(page)),
        isSelectableCell: (row, col, page = currentPage) =>
            Boolean(sectionAtCellNx9(row, col, getPageRows(page))) ||
            isGhostCreateCellNx9(row, col, getPageRows(page)),
    };
};

export const findFirstSelectableNx9Cell = ({
    context,
    page,
}: {
    context: Nx9Context;
    page: number;
}): Nx9CellWithPage | null => {
    for (let row = 0; row < context.rowsPerPage; row += 1) {
        for (let col = 0; col < 9; col += 1) {
            if (!context.isSelectableCell(row, col, page)) continue;
            return { page, row, col };
        }
    }
    return null;
};

export const resolveNx9CurrentCell = ({
    activeCell,
    activeSection,
    context,
}: {
    activeCell: Nx9ActiveCell | null | undefined;
    activeSection: string | null | undefined;
    context: Nx9Context;
}): Nx9CellWithPage => {
    if (activeCell) {
        const page = clampPage(
            activeCell.page ?? context.currentPage,
            context.totalPages,
        );
        if (context.isSelectableCell(activeCell.row, activeCell.col, page)) {
            return {
                page,
                row: activeCell.row,
                col: activeCell.col,
            };
        }
    }

    const pos = activeSection ? context.posForSection(activeSection) : null;
    if (pos) return pos;

    return (
        findFirstSelectableNx9Cell({
            context,
            page: context.currentPage,
        }) ?? {
            page: context.currentPage,
            row: 0,
            col: 0,
        }
    );
};

export const resolveNx9PageNavigationTarget = ({
    context,
    page,
    preferredCol,
}: {
    context: Nx9Context;
    page: number;
    preferredCol: number;
}): Nx9CellWithPage | null => {
    if (context.isGhostCreateCell(0, 0, page)) {
        return { page, row: 0, col: 0 };
    }

    if (context.isSelectableCell(0, preferredCol, page)) {
        return {
            page,
            row: 0,
            col: preferredCol,
        };
    }

    for (let row = 0; row < context.rowsPerPage; row += 1) {
        for (let col = 0; col < 9; col += 1) {
            if (!context.isSelectableCell(row, col, page)) continue;
            return { page, row, col };
        }
    }

    return findFirstSelectableNx9Cell({ context, page });
};
