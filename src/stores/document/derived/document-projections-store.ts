import { derived } from 'src/lib/store/derived';
import { createPinnedSectionSet } from 'src/view/helpers/mandala/section-colors';
import { MandalaView } from 'src/view/view';

// 取出“节点 id -> section” 的映射关系。
// 这个映射通常用来判断某个节点属于哪个分区。
export const IdSectionStore = (view: MandalaView) =>
    derived(view.documentStore, (state) => state.sections.id_section);

// 取出“group id -> parent id” 这类父子关系映射。
// 有了这份数据，界面或逻辑层就能快速知道某个 group 挂在哪个父节点下面。
export const GroupParentIdsStore = (view: MandalaView) =>
    derived(view.documentStore, (state) => state.meta.groupParentIds);

// 取出当前被 pin（固定/置顶） 的节点 id 集合。
// 这里返回的是状态中的原始数据，不做二次加工。
export const PinnedNodesStore = (view: MandalaView) =>
    derived(view.documentStore, (state) => state.pinnedNodes.Ids);

// 取出“被 pin 的 section 集合”。
//
// 这里不是直接读状态字段，而是根据：
// - 所有 section 信息
// - 当前被 pin 的节点 id
// 重新计算出“哪些 section 应该算作被 pin”。
export const PinnedSectionsStore = (view: MandalaView) =>
    derived(view.documentStore, (state) =>
        createPinnedSectionSet(state.sections, state.pinnedNodes.Ids),
    );
