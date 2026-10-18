import type { SectionRangeLimit } from 'src/mandala-settings/state/settings-type';
import {
    normalizeNx9VisibleSection,
    resolveNx9PageContext,
    resolveNx9StructureContext,
    type Nx9ActiveCell,
    type Nx9PageContext,
    type Nx9StructureContext,
} from 'src/mandala-scenes/view-nx9/context';
import type { Content } from 'src/mandala-document/state/document-state-type';
import type { SectionLookup } from 'src/mandala-document/runtime/section-lookup';
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

type PerfLogger = (eventName: string, payload: Record<string, unknown>) => void;

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
    const latestStructureByBaseKey = createBoundedCache<Nx9StructureContext>({
        capacity: STRUCTURE_CACHE_LIMIT,
    });
    const stableStructures = createBoundedCache<Nx9StructureContext>({
        capacity: STRUCTURE_CACHE_LIMIT,
    });

    const resolveStructureShapeKey = (context: Nx9StructureContext) =>
        context.effectiveCoreSections.join('|');

    const resolveStructureContext = ({
        documentSnapshot,
        rowsPerPage,
        activeSection,
        sectionLookup,
        coreSectionMax,
    }: {
        documentSnapshot: Nx9ContextDocumentSnapshot;
        rowsPerPage: number;
        activeSection: string | null;
        sectionLookup?: SectionLookup;
        coreSectionMax?: SectionRangeLimit;
    }) => {
        const normalizedActiveSection =
            normalizeNx9VisibleSection(activeSection) ?? '';
        const structureActiveSection =
            normalizedActiveSection.split('.')[0] ?? normalizedActiveSection;
        const baseKey = [
            resolveObjectKey(documentSnapshot.sectionIdMap),
            resolveObjectKey(sectionLookup),
            rowsPerPage,
            coreSectionMax ?? 'unlimited',
            structureActiveSection,
        ].join('|');
        const cacheKey = [baseKey, documentSnapshot.contentRevision].join('|');
        const cached = structureCache.get(cacheKey);
        if (cached) {
            const shapeKey = resolveStructureShapeKey(cached);
            structureKeyByContext.set(
                cached,
                `${resolveObjectKey(documentSnapshot.sectionIdMap)}|${resolveObjectKey(sectionLookup)}|${rowsPerPage}|${coreSectionMax ?? 'unlimited'}|${shapeKey}`,
            );
            latestStructureByBaseKey.set(baseKey, cached);
            return cached;
        }

        const startedAt = performance.now();
        const value = resolveNx9StructureContext({
            sectionIdMap: documentSnapshot.sectionIdMap,
            documentContent: documentSnapshot.documentContent,
            rowsPerPage,
            activeSection,
            sectionLookup,
            coreSectionMax,
        });
        const nextShapeKey = resolveStructureShapeKey(value);
        const shapeKey = `${resolveObjectKey(documentSnapshot.sectionIdMap)}|${resolveObjectKey(sectionLookup)}|${rowsPerPage}|${coreSectionMax ?? 'unlimited'}|${nextShapeKey}`;
        const previous =
            stableStructures.get(shapeKey) ??
            latestStructureByBaseKey.get(baseKey);
        const finalValue =
            previous && resolveStructureShapeKey(previous) === nextShapeKey
                ? previous
                : value;
        structureKeyByContext.set(finalValue, shapeKey);
        stableStructures.set(shapeKey, finalValue);
        latestStructureByBaseKey.set(baseKey, finalValue);
        structureCache.set(cacheKey, finalValue);
        recordPerfEvent?.('trace.nx9.resolve-context', {
            total_ms: Number((performance.now() - startedAt).toFixed(2)),
            rows_per_page: rowsPerPage,
            total_pages: finalValue.totalPages,
            root_section: structureActiveSection || null,
        });
        return finalValue;
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
        const resolvedPage =
            requestedPage ??
            activeCell?.page ??
            structureContext.posForSection(activeSection)?.page ??
            0;
        const key = [
            structureKey,
            Math.max(
                0,
                Math.min(resolvedPage, structureContext.totalPages - 1),
            ),
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
