import { WorkspaceLeaf } from 'obsidian';
import { MandalaView } from 'src/view/view';

export function setActiveLeaf(next: (...params: unknown[]) => unknown) {
    return function (leaf: WorkspaceLeaf, param: unknown) {
        const isMandalaViewAndIsEditing =
            leaf.view &&
            leaf.view instanceof MandalaView &&
            leaf.view.inlineEditor?.nodeId;
        if (isMandalaViewAndIsEditing) return;
        return next(leaf, param);
    };
}
