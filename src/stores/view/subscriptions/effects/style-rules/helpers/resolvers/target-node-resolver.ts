import { StyleRuleTarget } from 'src/stores/settings/types/style-rules-types';
import { Column } from 'src/stores/document/document-state-type';
import { findGroupByNodeId } from 'src/lib/tree-utils/find/find-group-by-node-id';
import { traverseUp } from 'src/lib/tree-utils/get/traverse-up';
import { findChildGroup } from 'src/lib/tree-utils/find/find-child-group';
import { getAllChildren } from 'src/lib/tree-utils/get/get-all-children';
import { DocumentStoreAction } from 'src/stores/document/document-store-actions';
import {
    STRUCTURE_AND_CONTENT,
    STRUCTURE_ONLY,
} from 'src/stores/view/helpers/get-document-event-type';

const defaultCache = () =>
    ({
        self: {},
        'direct-parent': {},
        'any-parent': {},
        'direct-children': {},
        'any-children': {},
        'self-or-any-parent': {},
        'self-or-direct-parent': {},
        'self-or-any-children': {},
        'self-or-direct-children': {},
    }) satisfies Cache;

type Cache = {
    [scope in StyleRuleTarget]: {
        [nodeId: string]: string[];
    };
};

export class TargetNodeResolver {
    private columns: Column[];
    private cache: Cache;
    private isEmpty = true;

    constructor(columns: Column[]) {
        this.columns = columns;
        this.cache = defaultCache();
    }

    private cacheResult(
        nodeId: string,
        scope: StyleRuleTarget,
        result: string[],
    ): void {
        if (this.isEmpty) {
            this.isEmpty = false;
        }
        this.cache[scope][nodeId] = result;
    }

    public getTargetNodes(scope: StyleRuleTarget, nodeId: string): string[] {
        if (this.cache[scope][nodeId] !== undefined) {
            return this.cache[scope][nodeId]!;
        }

        let result: string[];

        switch (scope) {
            case 'self':
                result = [nodeId];
                break;

            case 'direct-parent': {
                const group = findGroupByNodeId(this.columns, nodeId);
                result = group ? [group.parentId] : [];
                break;
            }

            case 'self-or-direct-parent': {
                const group = findGroupByNodeId(this.columns, nodeId);
                result = group ? [group.parentId, nodeId] : [nodeId];
                break;
            }

            case 'any-parent': {
                result = traverseUp(this.columns, nodeId);
                break;
            }

            case 'self-or-any-parent': {
                result = [...traverseUp(this.columns, nodeId), nodeId];
                break;
            }

            case 'direct-children': {
                const childGroup = findChildGroup(this.columns, nodeId);
                result = childGroup ? childGroup.nodes : [];
                break;
            }

            case 'self-or-direct-children': {
                const childGroup = findChildGroup(this.columns, nodeId);
                result = childGroup ? [nodeId, ...childGroup.nodes] : [nodeId];
                break;
            }

            case 'any-children': {
                result = getAllChildren(this.columns, nodeId);
                break;
            }

            case 'self-or-any-children': {
                result = [nodeId, ...getAllChildren(this.columns, nodeId)];
                break;
            }
        }

        this.cacheResult(nodeId, scope, result);
        return result;
    }

    resetCache = (action: DocumentStoreAction, columns: Column[]) => {
        this.columns = columns;
        if (this.isEmpty) return;
        if (
            STRUCTURE_AND_CONTENT.has(action.type) ||
            STRUCTURE_ONLY.has(action.type)
        ) {
            this.cache = defaultCache();
            this.isEmpty = true;
        }
    };
}
