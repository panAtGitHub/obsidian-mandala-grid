import { ViewState } from 'obsidian';
import { MANDALA_VIEW_TYPE } from 'src/view/view';
import MandalaGrid from 'src/main';

export function createSetViewState(plugin: MandalaGrid) {
    return function (next: (...params: unknown[]) => unknown) {
        return function (state: ViewState, ...rest: unknown[]) {
            const isMarkdownView = state.type === 'markdown';

            const stateData = state.state as
                | { file?: string; inlineEditor?: boolean }
                | undefined;
            const path = stateData?.file;
            if (
                isMarkdownView &&
                !!path &&
                plugin.viewType[path]?.viewType === MANDALA_VIEW_TYPE &&
                !stateData?.inlineEditor
            ) {
                const newState = {
                    ...state,
                    type: MANDALA_VIEW_TYPE,
                };
                return next(newState, ...rest);
            } else {
                return next(state, ...rest);
            }
        };
    };
}
