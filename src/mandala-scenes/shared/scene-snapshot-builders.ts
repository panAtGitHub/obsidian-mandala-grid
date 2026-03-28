import type {
    SceneCardInteractionSnapshot,
    SceneDisplaySnapshot,
    SceneDocumentSnapshot,
    SceneEditingSnapshot,
} from 'src/mandala-scenes/shared/scene-projection';
import type { Content } from 'src/mandala-document/state/document-state-type';

export const buildSceneDisplaySnapshot = ({
    sectionColors,
    sectionColorOpacity,
    backgroundMode,
    showDetailSidebar,
    whiteThemeMode,
}: SceneDisplaySnapshot): SceneDisplaySnapshot => ({
    sectionColors,
    sectionColorOpacity,
    backgroundMode,
    showDetailSidebar,
    whiteThemeMode,
});

export const buildSceneCardInteractionSnapshot = ({
    activeNodeId,
    editingState,
    selectedNodes,
    showDetailSidebar,
    selectedStamp,
    pinnedSections,
    pinnedStamp,
}: {
    activeNodeId: string | null;
    editingState: SceneEditingSnapshot;
    selectedNodes: Set<string>;
    showDetailSidebar: boolean;
    selectedStamp: string;
    pinnedSections: Set<string>;
    pinnedStamp: string;
}): SceneCardInteractionSnapshot => ({
    activeNodeId,
    editingState,
    selectedNodes,
    showDetailSidebar,
    selectedStamp,
    pinnedSections,
    pinnedStamp,
});

export const buildSceneDocumentSnapshot = ({
    revision,
    contentRevision,
    sectionIdMap,
    documentContent,
}: {
    revision: number;
    contentRevision: number;
    sectionIdMap: Record<string, string>;
    documentContent: Content;
}): SceneDocumentSnapshot => ({
    revision,
    contentRevision,
    sectionIdMap,
    documentContent,
});
