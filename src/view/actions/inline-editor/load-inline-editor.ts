type InlineEditorLoaderRuntime = {
    hasActiveFile: () => boolean;
    loadNode: (target: HTMLElement, nodeId: string) => void;
    unloadNode: (nodeId?: string, discardChanges?: boolean) => void;
};

export const createLoadInlineEditorAction = (
    runtime: InlineEditorLoaderRuntime,
) => {
    return (target: HTMLElement, nodeId: string) => {
        if (!runtime.hasActiveFile()) return;
        runtime.loadNode(target, nodeId);
        return {
            destroy: () => {
                runtime.unloadNode(nodeId);
            },
        };
    };
};
