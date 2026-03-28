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
