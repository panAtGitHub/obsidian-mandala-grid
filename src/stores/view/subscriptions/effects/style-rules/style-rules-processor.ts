import { debounce } from 'obsidian';
import { DocumentStoreAction } from 'src/stores/document/document-store-actions';
import { rulesWorker } from 'src/workers/worker-instances';
import { StyleRule } from 'src/stores/settings/types/style-rules-types';
import { LineageView } from 'src/view/view';
import invariant from 'tiny-invariant';
import { StyleRulesResult } from 'src/stores/view/subscriptions/effects/style-rules/helpers/process-style-rules';

export type ExtendedStyleRule = StyleRule & { global?: boolean };

export class StyleRulesProcessor {
    private view: LineageView;
    private rules: ExtendedStyleRule[] = [];

    constructor(view: LineageView) {
        this.view = view;
    }

    onViewMount = async () => {
        this.setRules();
        this.processRules(null);
    };
    onDocumentUpdate = async (action: DocumentStoreAction) => {
        this.processRules(action);
    };

    onRulesUpdate = async () => {
        this.setRules();
        this.processRules(null);
    };

    onViewUnmount = async () => {
        await rulesWorker.run({
            type: 'destroy',
            payload: {
                viewId: this.view.id,
            },
        });
        this.rules = [];
    };

    private processRules = debounce(
        async (action: DocumentStoreAction | null) => {
            let results = null;
            if (this.rules.length > 0) {
                const document = this.view.documentStore.getValue().document;

                results = (await rulesWorker.run({
                    type: 'process-rules',
                    payload: {
                        document,
                        rules: this.rules,
                        action,
                        viewId: this.view.id,
                    },
                })) as StyleRulesResult;
            }
            this.view.viewStore.dispatch({
                type: 'view/style-rules/update-results',
                payload: {
                    results,
                },
            });
        },
        500,
    );

    private setRules = () => {
        const path = this.view.file?.path;
        invariant(path);
        const settings = this.view.plugin.settings.getValue();
        const documentRules = settings.styleRules.documents[path];
        const globalRules = settings.styleRules.global;
        this.rules = [];
        if (documentRules) {
            this.rules.push(...documentRules.rules);
        }
        this.rules.push(
            ...globalRules.rules.map((r) => ({ ...r, global: true })),
        );
    };
}
