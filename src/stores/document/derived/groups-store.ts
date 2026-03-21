import { MandalaView } from 'src/view/view';
import { derived } from 'src/lib/store/derived';
import { Column, NodeGroup } from 'src/stores/document/document-state-type';

// 在列数组里，根据列 id 找到对应的列对象。
// 找不到时返回 `undefined`。
export const findColumn = (columns: Column[], columnId: string) => {
    return columns.find((c) => c.id === columnId);
};

// 这个 store 用来读取“某一列下的所有 groups”。
//
// 参数：
// - `view`：当前视图
// - `columnId`：目标列的 id
export const groupsStore = (view: MandalaView, columnId: string) => {
    // 缓存已经找到的那一列。
    let column: Column | undefined;

    // 缓存整份 columns 数组的引用。
    // 如果 columns 数组没变，就尽量复用之前找到的列对象。
    let columns: Column[];

    return derived(view.documentStore, (state) => {
        // 只有在以下情况才重新查找列：
        // 1. 之前还没找到过列
        // 2. 文档中的 columns 数组已经换了引用
        if (!column || columns !== state.document.columns) {
            // 更新缓存的列数组引用。
            columns = state.document.columns;

            // 按 id 重新查找目标列。
            column = findColumn(columns, columnId);

            // 如果目标列不存在，返回空数组而不是 undefined。
            // 这样调用方可以稳定地按数组处理。
            if (!column) return [] as NodeGroup[];
        }

        // 返回该列下的 groups。
        return column.groups;
    });
};

// 这个 store 是 groupsStore 的简化版：
// 它不按 id 查找，而是直接取第一列的 groups。
// 常用于“当前文档只关心单列结构”的场景。
export const singleColumnGroupStore = (view: MandalaView) => {
    return derived(view.documentStore, (state) => {
        // 如果至少存在一列，返回第一列的 groups；
        // 否则返回空数组。
        return state.document.columns.length > 0
            ? state.document.columns[0].groups
            : [];
    });
};
