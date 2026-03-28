import {
    resolveNx9PageContext,
    resolveNx9StructureContext,
    type Nx9ActiveCell,
    type Nx9PageContext,
    type Nx9StructureContext,
} from 'src/mandala-scenes/view-nx9/context';
import type { Content } from 'src/mandala-document/state/document-state-type';

type Nx9ContextDocumentSnapshot = {
    revision: number;
    contentRevision: number;
    sectionIdMap: Record<string, string>;
    documentContent: Content;
};

type PerfLogger = (
    eventName: string,
    payload: Record<string, unknown>,
) => void;

export const createNx9ContextRuntime = ({
    recordPerfEvent,
}: {
    recordPerfEvent?: PerfLogger;
} = {}) => {
    let cachedStructureKey = '';
    let cachedStructureContext: Nx9StructureContext | null = null;
    let cachedPageContexts = new Map<number, Nx9PageContext>();

    const resolveStructureContext = ({
        documentSnapshot,
        rowsPerPage,
        activeSection,
    }: {
        documentSnapshot: Nx9ContextDocumentSnapshot;
        rowsPerPage: number;
        activeSection: string | null;
    }) => {
        const key = [
            documentSnapshot.revision,
            documentSnapshot.contentRevision,
            rowsPerPage,
            activeSection?.split('.')[0] ?? '',
        ].join('|');
        if (key === cachedStructureKey && cachedStructureContext) {
            return cachedStructureContext;
        }
        const startedAt = performance.now();
        cachedStructureContext = resolveNx9StructureContext({
            sectionIdMap: documentSnapshot.sectionIdMap,
            documentContent: documentSnapshot.documentContent,
            rowsPerPage,
            activeSection,
        });
        cachedPageContexts = new Map();
        cachedStructureKey = key;
        recordPerfEvent?.('trace.nx9.resolve-context', {
            total_ms: Number((performance.now() - startedAt).toFixed(2)),
            rows_per_page: rowsPerPage,
            total_pages: cachedStructureContext.totalPages,
            root_section: activeSection?.split('.')[0] ?? null,
        });
        return cachedStructureContext;
    };

    const resolvePageContext = ({
        structureContext,
        activeSection,
        activeCell,
        requestedPage,
    }: {
        structureContext: Nx9StructureContext;
        activeSection: string | null;
        activeCell: Nx9ActiveCell | null;
        requestedPage?: number | null;
    }) => {
        const resolvedPage =
            requestedPage ??
            activeCell?.page ??
            structureContext.posForSection(activeSection)?.page ??
            0;
        const cached = cachedPageContexts.get(resolvedPage);
        if (cached) {
            return cached;
        }
        const value = resolveNx9PageContext({
            structureContext,
            activeSection,
            activeCell:
                requestedPage === null || requestedPage === undefined
                    ? activeCell
                    : {
                          row: activeCell?.row ?? 0,
                          col: activeCell?.col ?? 0,
                          page: requestedPage,
                      },
        });
        cachedPageContexts.set(resolvedPage, value);
        return value;
    };

    return {
        resolveStructureContext,
        resolvePageContext,
    };
};
