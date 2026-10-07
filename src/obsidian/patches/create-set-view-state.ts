import { ViewState, WorkspaceLeaf } from 'obsidian';
import { MANDALA_VIEW_TYPE } from 'src/view/view';
import MandalaGrid from 'src/main';

export function createSetViewState(plugin: MandalaGrid) {
    return function (next: WorkspaceLeaf['setViewState']) {
        return function (
            this: WorkspaceLeaf,
            state: ViewState,
            eState?: unknown,
        ) {
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
                // strictBindCallApply is disabled: call() otherwise returns any.
                return next.call(this, newState, eState) as Promise<void>;
            } else {
                return next.call(this, state, eState) as Promise<void>;
            }
        };
    };
}
