import { LineageView } from 'src/view/view';
import { derived } from 'src/lib/store/derived';
import invariant from 'tiny-invariant';

export const DocumentStyleRulesStore = (view: LineageView) =>
    derived(view.plugin.settings, (state) => {
        invariant(view.file?.path);
        const documentRules = state.styleRules.documents[view.file.path];
        return documentRules ? documentRules.rules : [];
    });

export const GlobalStyleRulesStore = (view: LineageView) =>
    derived(view.plugin.settings, (state) => {
        return state.styleRules.global.rules;
    });

export const ActiveStyleRulesTab = (view: LineageView) =>
    derived(view.plugin.settings, (state) => {
        return state.styleRules.settings.activeTab;
    });
