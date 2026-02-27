import { MandalaView } from 'src/view/view';
import { copySearchResultsToClipboard } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/copy-search-results-to-clipboard';

export const cutSearchResults = (view: MandalaView) => {
    void copySearchResultsToClipboard(view);
};
