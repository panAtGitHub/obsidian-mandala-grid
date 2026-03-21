import { MandalaView } from 'src/view/view';
import { derived } from 'src/lib/store/derived';

// 这个 store 的作用：
// 从整个文档状态里，只取出 `columns` 这一小块数据。
//
// 可以把它理解成“从大对象里切一片出来给界面用”。
// 这样使用方就不必关心完整 document 长什么样，只关心列数据即可。
export const columnsStore = (view: MandalaView) =>
    derived(view.documentStore, (state) => state.document.columns);

// 这个 store 用在“只需要第一列”的场景。
//
// 返回值始终是数组：
// - 如果存在第一列，就返回 `[第一列]`
// - 如果不存在，就返回空数组 `[]`
//
// 这样调用方可以继续按“数组”处理，而不用额外分支判断
// “这里拿到的是单个对象，还是空值”。
export const singleColumnStore = (view: MandalaView) =>
    derived(view.documentStore, (state) => {
        // 取出第 0 个元素，也就是第一列。
        const column = state.document.columns[0];

        // 如果第一列存在，就包装成只含一个元素的数组返回；
        // 否则返回空数组，避免返回 `undefined`。
        return column ? [column] : [];
    });
