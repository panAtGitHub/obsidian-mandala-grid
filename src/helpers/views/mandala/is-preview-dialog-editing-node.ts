export const isPreviewDialogEditingNode = ({
    previewDialogOpen,
    previewDialogNodeId,
    editingActiveNodeId,
    editingIsInSidebar,
    nodeId,
}: {
    previewDialogOpen: boolean;
    previewDialogNodeId: string | null;
    editingActiveNodeId: string | null | undefined;
    editingIsInSidebar: boolean;
    nodeId: string | null | undefined;
}) =>
    previewDialogOpen &&
    !!nodeId &&
    previewDialogNodeId === nodeId &&
    editingActiveNodeId === nodeId &&
    !editingIsInSidebar;
