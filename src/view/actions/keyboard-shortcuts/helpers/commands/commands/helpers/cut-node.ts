import { MandalaView } from 'src/view/view';
import { copyActiveBranchesToClipboard } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/copy-active-branches-to-clipboard';

export const cutNode = async (view: MandalaView) => {
    await copyActiveBranchesToClipboard(view, true, false);
};
