import { Column, Content } from 'src/stores/document/document-state-type';
import { getDirectChildrenCount } from 'src/stores/view/subscriptions/effects/style-rules/helpers/resolvers/node-property-resolver/helpers/get-direct-children-count';
import { getLineCount } from 'src/stores/view/subscriptions/effects/style-rules/helpers/resolvers/node-property-resolver/helpers/get-line-count';
import { getWordCount } from 'src/stores/view/subscriptions/effects/style-rules/helpers/resolvers/node-property-resolver/helpers/get-word-count';
import { getCharacterCount } from 'src/stores/view/subscriptions/effects/style-rules/helpers/resolvers/node-property-resolver/helpers/get-character-count';
import { getTotalChildrenCount } from 'src/stores/view/subscriptions/effects/style-rules/helpers/resolvers/node-property-resolver/helpers/get-total-children-count';
import { findNodeColumn } from 'src/lib/tree-utils/find/find-node-column';
import {
    NumericProperty,
    StringProperty,
} from 'src/stores/settings/types/style-rules-types';
import { getHeadings } from 'src/stores/view/subscriptions/effects/style-rules/helpers/resolvers/node-property-resolver/helpers/get-headings';
import { DocumentStoreAction } from 'src/stores/document/document-store-actions';
import {
    STRUCTURE_AND_CONTENT,
    STRUCTURE_ONLY,
} from 'src/stores/view/helpers/get-document-event-type';

const defaultCache = () => ({
    // content
    headings: {},
    content: {},
    'line-count': {},
    'character-count': {},
    'word-count': {},
    'headings-word-count': {},
    // structure
    'direct-children-count': {},
    'total-children-count': {},
    depth: {},
});

type Property = NumericProperty | StringProperty;
type Cache = {
    [key in Property]: {
        [nodeId: string]: number | string;
    };
};

export class NodePropertyResolver {
    private columns: Column[];
    private content: Content;
    private cache: Cache;
    private isEmpty = true;

    constructor(columns: Column[], content: Content) {
        this.columns = columns;
        this.content = content;

        this.cache = defaultCache();
    }

    private cacheResult(
        nodeId: string,
        property: Property,
        value: number | string,
    ): void {
        if (this.isEmpty) {
            this.isEmpty = false;
        }
        this.cache[property][nodeId] = value;
    }

    public getProperty(nodeId: string, property: Property) {
        if (this.cache[property][nodeId] !== undefined) {
            return this.cache[property][nodeId] as number | string;
        }

        let value: number | string;

        switch (property) {
            case 'direct-children-count':
                value = getDirectChildrenCount(this.columns, nodeId);
                break;

            case 'total-children-count':
                value = getTotalChildrenCount(this.columns, nodeId);
                break;

            case 'line-count':
                value = getLineCount(this.content[nodeId]?.content);
                break;

            case 'word-count':
                value = getWordCount(this.content[nodeId]?.content);
                break;

            case 'character-count':
                value = getCharacterCount(this.content[nodeId]?.content);
                break;

            case 'depth':
                value = findNodeColumn(this.columns, nodeId) + 1;
                break;
            case 'headings':
                value = getHeadings(this.content[nodeId]?.content)
                    .join(' ')
                    .toLowerCase();
                break;
            case 'headings-word-count':
                value = getWordCount(
                    this.getProperty(nodeId, 'headings') as string,
                );

                break;
            default:
                throw new Error(`Unsupported property: ${property}`);
        }

        this.cacheResult(nodeId, property, value);
        return value;
    }

    resetCache = (
        action: DocumentStoreAction,
        columns: Column[],
        content: Content,
    ) => {
        this.columns = columns;
        this.content = content;
        if (this.isEmpty) return;
        if (STRUCTURE_AND_CONTENT.has(action.type)) {
            this.cache = defaultCache();
            this.isEmpty = true;
        } else if (STRUCTURE_ONLY.has(action.type)) {
            this.cache['depth'] = {};
            this.cache['direct-children-count'] = {};
            this.cache['total-children-count'] = {};
        } else if (action.type === 'document/update-node-content') {
            delete this.cache.headings[action.payload.nodeId];
            delete this.cache.content[action.payload.nodeId];
            delete this.cache['line-count'][action.payload.nodeId];
            delete this.cache['character-count'][action.payload.nodeId];
            delete this.cache['word-count'][action.payload.nodeId];
            delete this.cache['headings-word-count'][action.payload.nodeId];
        } else if (action.type === 'document/format-headings') {
            this.cache.headings = {};
            this.cache.content = {};
            this.cache['line-count'] = {};
            this.cache['character-count'] = {};
            this.cache['word-count'] = {};
            this.cache['headings-word-count'] = {};
        }
    };
}
