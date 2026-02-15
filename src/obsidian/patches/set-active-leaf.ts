import { Workspace, WorkspaceLeaf } from 'obsidian';
import { MandalaView } from 'src/view/view';

type SetActiveLeafArgs =
    | [WorkspaceLeaf, { focus?: boolean; reveal?: boolean; state?: unknown }?]
    | [WorkspaceLeaf, boolean, boolean];

export function setActiveLeaf(
    next: (this: Workspace, ...args: SetActiveLeafArgs) => unknown,
) {
    return function (this: Workspace, ...args: SetActiveLeafArgs) {
        const nextLeaf = args[0];
        const activeLeaf = this.getMostRecentLeaf();
        const activeView = activeLeaf?.view;
        const isEditingInActiveMandalaLeaf =
            activeView instanceof MandalaView &&
            Boolean(activeView.inlineEditor?.nodeId);
        if (isEditingInActiveMandalaLeaf && activeLeaf !== nextLeaf) return;
        next.call(this, ...args);
    };
}
