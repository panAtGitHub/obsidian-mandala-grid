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
const snapshotCache =
    createBoundedCache<SceneInputRuntimeCacheEntry['value']>({
        capacity: SNAPSHOT_CACHE_LIMIT,
    });
const resolveObjectKey = createObjectIdentityKeyResolver();

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
    return snapshotCache.set(cacheKey, value);
};
