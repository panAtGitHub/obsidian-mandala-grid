import { ViewState } from 'obsidian';
import { LINEAGE_VIEW_TYPE } from 'src/view/view';
import Lineage from 'src/main';

export function createSetViewState(plugin: Lineage) {
    return function (next: (...params: unknown[]) => unknown) {
        return function (state: ViewState, ...rest: unknown[]) {
            const isMarkdownView = state.type === 'markdown';

            const path = state?.state?.file;
            if (
                isMarkdownView &&
                // @ts-ignore
                plugin.viewType[path]?.viewType === LINEAGE_VIEW_TYPE &&
                // @ts-ignore
                !state.state.inlineEditor
            ) {
                const newState = {
                    ...state,
                    type: LINEAGE_VIEW_TYPE,
                };

                return next.apply(this, [newState, ...rest]);
            } else {
                return next.apply(this, [state, ...rest]);
            }
        };
    };
}
