import type { DocumentState } from 'src/mandala-document/state/document-state-type';
import {
    buildSceneCardInteractionSnapshot,
    buildSceneDisplaySnapshot,
    buildSceneDocumentSnapshot,
} from 'src/mandala-scenes/shared/scene-snapshot-builders';

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

let cachedSceneInputSnapshots: SceneInputRuntimeCacheEntry | null = null;

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
    if (
        cachedSceneInputSnapshots &&
        cachedSceneInputSnapshots.documentState === documentState &&
        cachedSceneInputSnapshots.sectionColors === sectionColors &&
        cachedSceneInputSnapshots.sectionColorOpacity === sectionColorOpacity &&
        cachedSceneInputSnapshots.backgroundMode === backgroundMode &&
        cachedSceneInputSnapshots.showDetailSidebar === showDetailSidebar &&
        cachedSceneInputSnapshots.whiteThemeMode === whiteThemeMode &&
        cachedSceneInputSnapshots.activeNodeId === activeNodeId &&
        cachedSceneInputSnapshots.editingState === editingState &&
        cachedSceneInputSnapshots.selectedNodes === selectedNodes &&
        cachedSceneInputSnapshots.selectedStamp === selectedStamp &&
        cachedSceneInputSnapshots.pinnedSections === pinnedSections &&
        cachedSceneInputSnapshots.pinnedStamp === pinnedStamp
    ) {
        return cachedSceneInputSnapshots.value;
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
    cachedSceneInputSnapshots = {
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
        value,
    };
    return value;
};
