import type { DocumentState } from 'src/mandala-document/state/document-state-type';
import {
    buildSceneCardInteractionSnapshot,
    buildSceneDisplaySnapshot,
    buildSceneDocumentSnapshot,
} from 'src/mandala-scenes/shared/scene-snapshot-builders';
import {
    createBoundedCache,
    createObjectIdentityKeyResolver,
} from 'src/shared/helpers/bounded-cache';
import type { SceneDraftProjectionSnapshot } from 'src/mandala-scenes/shared/scene-projection';

type SceneInputRuntimeOptions = {
    documentState: DocumentState;
    sectionColors: Record<string, string>;
    sectionColorOpacity: number;
    backgroundMode: string;
    showDetailSidebar: boolean;
    whiteThemeMode: boolean;
    activeNodeId: string | null;
    editingState: {
        activeNodeId: string | null;
        isInSidebar: boolean;
    };
    selectedNodes: Set<string>;
    selectedStamp: string;
    pinnedSections: Set<string>;
    pinnedStamp: string;
    draftProjection?: SceneDraftProjectionSnapshot | null;
};

type SceneInputRuntimeCacheEntry = SceneInputRuntimeOptions & {
    value: ReturnType<typeof buildSceneInputSnapshotsUncached>;
};

const buildSceneInputSnapshotsUncached = ({
    documentState,
    sectionColors,
    sectionColorOpacity,
    backgroundMode,
    showDetailSidebar,
    whiteThemeMode,
    activeNodeId,
    editingState,
    selectedNodes,
    selectedStamp,
    pinnedSections,
    pinnedStamp,
}: SceneInputRuntimeOptions) => ({
    documentSnapshot: buildSceneDocumentSnapshot({
        revision: documentState.meta.mandalaV2.revision,
        contentRevision: documentState.meta.mandalaV2.contentRevision,
        sectionIdMap: documentState.sections.section_id,
        documentContent: documentState.document.content,
    }),
    displaySnapshot: buildSceneDisplaySnapshot({
        sectionColors,
        sectionColorOpacity,
        backgroundMode,
        showDetailSidebar,
        whiteThemeMode,
    }),
    interactionSnapshot: buildSceneCardInteractionSnapshot({
        activeNodeId,
        editingState,
        selectedNodes,
        showDetailSidebar,
        selectedStamp,
        pinnedSections,
        pinnedStamp,
    }),
});

const SNAPSHOT_CACHE_LIMIT = 8;
const snapshotCache = createBoundedCache<SceneInputRuntimeCacheEntry['value']>({
    capacity: SNAPSHOT_CACHE_LIMIT,
});
const resolveObjectKey = createObjectIdentityKeyResolver();
const documentCache = createBoundedCache<
    ReturnType<typeof buildSceneDocumentSnapshot>
>({ capacity: SNAPSHOT_CACHE_LIMIT });
const displayCache = createBoundedCache<
    ReturnType<typeof buildSceneDisplaySnapshot>
>({ capacity: SNAPSHOT_CACHE_LIMIT });

export const buildSceneInputSnapshots = ({
    documentState,
    sectionColors,
    sectionColorOpacity,
    backgroundMode,
    showDetailSidebar,
    whiteThemeMode,
    activeNodeId,
    editingState,
    selectedNodes,
    selectedStamp,
    pinnedSections,
    pinnedStamp,
}: SceneInputRuntimeOptions) => {
    const mandalaRevision = documentState.meta.mandalaV2.revision;
    const mandalaContentRevision = documentState.meta.mandalaV2.contentRevision;
    const sectionIdMap = documentState.sections.section_id;
    const documentContent = documentState.document.content;
    const cacheKey = [
        mandalaRevision,
        mandalaContentRevision,
        resolveObjectKey(sectionIdMap),
        resolveObjectKey(documentContent),
        resolveObjectKey(sectionColors),
        sectionColorOpacity,
        backgroundMode,
        showDetailSidebar ? 'detail' : 'inline',
        whiteThemeMode ? 'white' : 'theme',
        activeNodeId ?? '',
        resolveObjectKey(editingState),
        resolveObjectKey(selectedNodes),
        selectedStamp,
        resolveObjectKey(pinnedSections),
        pinnedStamp,
    ].join('|');
    const cached = snapshotCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const value = buildSceneInputSnapshotsUncached({
        documentState,
        sectionColors,
        sectionColorOpacity,
        backgroundMode,
        showDetailSidebar,
        whiteThemeMode,
        activeNodeId,
        editingState,
        selectedNodes,
        selectedStamp,
        pinnedSections,
        pinnedStamp,
    });
    const documentKey = [
        mandalaRevision,
        mandalaContentRevision,
        resolveObjectKey(sectionIdMap),
        resolveObjectKey(documentContent),
    ].join('|');
    const displayKey = [
        resolveObjectKey(sectionColors),
        sectionColorOpacity,
        backgroundMode,
        showDetailSidebar,
        whiteThemeMode,
    ].join('|');
    value.documentSnapshot =
        documentCache.get(documentKey) ??
        documentCache.set(documentKey, value.documentSnapshot);
    value.displaySnapshot =
        displayCache.get(displayKey) ??
        displayCache.set(displayKey, value.displaySnapshot);
    return snapshotCache.set(cacheKey, value);
};
