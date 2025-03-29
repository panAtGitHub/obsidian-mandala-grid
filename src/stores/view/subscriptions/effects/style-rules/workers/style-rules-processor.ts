import { LineageDocument } from 'src/stores/document/document-state-type';
import { NodePropertyResolver } from 'src/stores/view/subscriptions/effects/style-rules/helpers/resolvers/node-property-resolver/node-property-resolver';
import { TargetNodeResolver } from 'src/stores/view/subscriptions/effects/style-rules/helpers/resolvers/target-node-resolver';
import {
    processStyleRules,
    StyleRulesResult,
} from '../helpers/process-style-rules';
import { DocumentStoreAction } from 'src/stores/document/document-store-actions';
import { ExtendedStyleRule } from 'src/stores/view/subscriptions/effects/style-rules/style-rules-processor';

export class StyleRulesProcessor {
    private propertyResolver: NodePropertyResolver;
    private targetResolver: TargetNodeResolver;

    constructor() {}

    processStyleRules = (
        document: LineageDocument,
        rules: ExtendedStyleRule[],
        action: DocumentStoreAction | null,
    ): StyleRulesResult => {
        if (!this.propertyResolver || !this.targetResolver) {
            this.initialize(document);
        } else if (action) {
            this.resetResolversCache(document, action);
        }
        return processStyleRules(
            document,
            rules,
            this.propertyResolver,
            this.targetResolver,
        );
    };

    resetResolversCache = (
        document: LineageDocument,
        action: DocumentStoreAction,
    ) => {
        this.targetResolver.resetCache(action, document.columns);
        this.propertyResolver.resetCache(
            action,
            document.columns,
            document.content,
        );
    };

    private initialize = (document: LineageDocument) => {
        this.targetResolver = new TargetNodeResolver(document.columns);
        this.propertyResolver = new NodePropertyResolver(
            document.columns,
            document.content,
        );
    };
}
