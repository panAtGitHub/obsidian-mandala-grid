import {
    normalizeNx9VisibleSection,
    resolveNx9PageContext,
    resolveNx9StructureContext,
    type Nx9ActiveCell,
    type Nx9PageContext,
    type Nx9StructureContext,
} from 'src/mandala-scenes/view-nx9/context';
import type { Content } from 'src/mandala-document/state/document-state-type';
import {
    createBoundedCache,
    createObjectIdentityKeyResolver,
} from 'src/shared/helpers/bounded-cache';

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
    const STRUCTURE_CACHE_LIMIT = 12;
    const PAGE_CACHE_LIMIT = 24;
    const structureCache = createBoundedCache<Nx9StructureContext>({
        capacity: STRUCTURE_CACHE_LIMIT,
    });
    const pageCache = createBoundedCache<Nx9PageContext>({
        capacity: PAGE_CACHE_LIMIT,
    });
    const resolveObjectKey = createObjectIdentityKeyResolver();
    const structureKeyByContext = new WeakMap<Nx9StructureContext, string>();

    const resolveStructureContext = ({
        documentSnapshot,
        rowsPerPage,
        activeSection,
    }: {
        documentSnapshot: Nx9ContextDocumentSnapshot;
        rowsPerPage: number;
        activeSection: string | null;
    }) => {
        const normalizedActiveSection =
            normalizeNx9VisibleSection(activeSection) ?? '';
        const structureActiveSection =
            normalizedActiveSection.split('.')[0] ?? normalizedActiveSection;
        const key = [
            resolveObjectKey(documentSnapshot.sectionIdMap),
            documentSnapshot.contentRevision,
            rowsPerPage,
            structureActiveSection,
        ].join('|');
        const cached = structureCache.get(key);
        if (cached) {
            structureKeyByContext.set(cached, key);
            return cached;
        }

        const startedAt = performance.now();
        const value = resolveNx9StructureContext({
            sectionIdMap: documentSnapshot.sectionIdMap,
            documentContent: documentSnapshot.documentContent,
            rowsPerPage,
            activeSection,
        });
        structureKeyByContext.set(value, key);
        structureCache.set(key, value);
        recordPerfEvent?.('trace.nx9.resolve-context', {
            total_ms: Number((performance.now() - startedAt).toFixed(2)),
            rows_per_page: rowsPerPage,
            total_pages: value.totalPages,
            root_section: structureActiveSection || null,
        });
        return value;
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
        const structureKey = structureKeyByContext.get(structureContext) ?? '';
        const normalizedActiveSection =
            normalizeNx9VisibleSection(activeSection) ?? '';
        const resolvedPage =
            requestedPage ??
            activeCell?.page ??
            structureContext.posForSection(activeSection)?.page ??
            0;
        const key = [
            structureKey,
            requestedPage ?? 'auto',
            resolvedPage,
            normalizedActiveSection,
            activeCell?.row ?? '',
            activeCell?.col ?? '',
            activeCell?.page ?? '',
        ].join('|');
        const cached = pageCache.get(key);
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
        return pageCache.set(key, value);
    };

    return {
        resolveStructureContext,
        resolvePageContext,
    };
};
