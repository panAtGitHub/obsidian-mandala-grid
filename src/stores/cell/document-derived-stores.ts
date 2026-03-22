import { derived } from 'src/lib/store/derived';
import { sortTreeNodes } from 'src/mandala-document/tree-utils/sort/sort-tree-nodes';
import {
    Column,
    Content,
    NodeGroup,
} from 'src/mandala-document/state/document-state-type';
import { createPinnedSectionSet } from 'src/lib/mandala/section-colors';
import { MandalaView } from 'src/view/view';

// 这一组都是“从 documentStore 派生出某一小块数据”的轻量 store。
// 之前它们被拆在多个很小的文件里，不利于集中查看；
// 现在合并到同一个文件，便于维护和阅读。

export const columnsStore = (view: MandalaView) =>
    derived(view.documentStore, (state) => state.document.columns);

export const singleColumnStore = (view: MandalaView) =>
    derived(view.documentStore, (state) => {
        const column = state.document.columns[0];
        return column ? [column] : [];
    });

export const findColumn = (columns: Column[], columnId: string) => {
    return columns.find((column) => column.id === columnId);
};

export const groupsStore = (view: MandalaView, columnId: string) => {
    let column: Column | undefined;
    let columns: Column[];

    return derived(view.documentStore, (state) => {
        if (!column || columns !== state.document.columns) {
            columns = state.document.columns;
            column = findColumn(columns, columnId);
            if (!column) return [] as NodeGroup[];
        }

        return column.groups;
    });
};

export const singleColumnGroupStore = (view: MandalaView) => {
    return derived(view.documentStore, (state) => {
        return state.document.columns.length > 0
            ? state.document.columns[0].groups
            : [];
    });
};

export const findGroup = (
    columns: Column[],
    columnId: string,
    groupId: string,
) => {
    const column = findColumn(columns, columnId);
    if (column) {
        return column.groups.find((group) => group.parentId === groupId);
    }
};

export const nodesStore = (
    view: MandalaView,
    columnId: string,
    groupId: string,
) => {
    let group: NodeGroup | undefined;
    let columns: Column[];

    return derived(view.documentStore, (state) => {
        if (!group || columns !== state.document.columns) {
            columns = state.document.columns;
            group = findGroup(columns, columnId, groupId);
            if (!group) return [];
        }

        return group.nodes;
    });
};

export const singleColumnNodesStore = (view: MandalaView) => {
    return derived(view.documentStore, (state) => {
        return sortTreeNodes(state.document.columns);
    });
};

export const contentStore = (view: MandalaView, nodeId: string) => {
    let nodeContent: Content[string];
    let documentContent: Content;

    return derived(view.documentStore, (state) => {
        if (
            !nodeContent ||
            documentContent !== state.document.content ||
            nodeContent !== documentContent[nodeId]
        ) {
            documentContent = state.document.content;
            nodeContent = documentContent[nodeId];
            if (!nodeContent) return '';
        }

        return nodeContent.content;
    });
};

export const documentContentStore = (view: MandalaView) => {
    return derived(view.documentStore, (state) => {
        return state.document.content;
    });
};

export const IdSectionStore = (view: MandalaView) =>
    derived(view.documentStore, (state) => state.sections.id_section);

export const GroupParentIdsStore = (view: MandalaView) =>
    derived(view.documentStore, (state) => state.meta.groupParentIds);

export const PinnedNodesStore = (view: MandalaView) =>
    derived(view.documentStore, (state) => state.pinnedNodes.Ids);

export const PinnedSectionsStore = (view: MandalaView) =>
    derived(view.documentStore, (state) =>
        createPinnedSectionSet(state.sections, state.pinnedNodes.Ids),
    );
