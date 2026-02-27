import { mapBranchesToText } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/map-branches-to-text';
import { MandalaView } from 'src/view/view';
import { getActiveNodes } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/get-active-nodes';

export const copyActiveBranchesToClipboard = async (
    view: MandalaView,
    formatted: boolean,
    isInSidebar: boolean,
) => {
    const nodes = getActiveNodes(view, isInSidebar);
    const text = mapBranchesToText(
        view.documentStore.getValue().document,
        nodes,
        formatted ? 'sections' : 'unformatted-text',
    );
    await navigator.clipboard.writeText(text);
};
