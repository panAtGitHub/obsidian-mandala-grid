import { MandalaView } from 'src/view/view';
import { derived } from 'src/lib/store/derived';
import { Content } from 'src/stores/document/document-state-type';

// 这个 store 用来读取“某一个节点”的正文内容。
//
// 参数说明：
// - `view`：当前视图对象，里面持有整个文档的 store
// - `nodeId`：要读取内容的那个节点 id
//
// 返回的是一个派生 store。外部订阅它后，拿到的是字符串内容。
export const contentStore = (view: MandalaView, nodeId: string) => {
    // 缓存“当前节点对应的内容对象”。
    // 这样当 documentStore 更新时，可以先比较引用是否变化，
    // 避免每次都重复做相同的读取。
    let nodeContent: Content[string];

    // 缓存整份 content 映射表。
    // `state.document.content` 通常是一个“nodeId -> 内容对象”的字典。
    let documentContent: Content;

    return derived(view.documentStore, (state) => {
        // 只有在下面几种情况下，才重新从最新状态中取值：
        // 1. 还没有缓存过节点内容
        // 2. 整份 content 对象已经换了引用
        // 3. 当前缓存的节点对象，已经不是这次状态里 nodeId 对应的对象了
        if (
            !nodeContent ||
            documentContent !== state.document.content ||
            nodeContent !== documentContent[nodeId]
        ) {
            // 更新整份 content 的缓存。
            documentContent = state.document.content;

            // 取出当前 nodeId 对应的内容对象并缓存。
            nodeContent = documentContent[nodeId];

            // 如果这个节点还没有内容对象，就返回空字符串。
            // 这样界面层可以直接当作“没有内容”来显示，而不用处理 undefined。
            if (!nodeContent) return '';
        }

        // 真正暴露给外部订阅者的，是内容对象里的 `content` 字段。
        return nodeContent.content;
    });
};

// 这个 store 更直接：把整份文档的 content 映射表原样暴露出去。
// 适合需要一次性读取全部节点内容的地方。
export const documentContentStore = (view: MandalaView) => {
    return derived(view.documentStore, (state) => {
        return state.document.content;
    });
};
