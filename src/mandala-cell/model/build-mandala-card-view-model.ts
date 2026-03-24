import type { MandalaCardViewModel } from 'src/mandala-cell/model/card-view-model';

// 阅读顺序建议：
// 1. 先看 card-view-model.ts，了解输出结构
// 2. 再看各 scene 的 assemble-cell-view-model.ts，了解调用方从哪里来
// 3. 最后看本文件，理解这一步只是把场景已确定好的字段装配成统一 view model
type BuildMandalaCardViewModelOptions = MandalaCardViewModel;

export const buildMandalaCardViewModel = ({
    nodeId,
    section,
    contentEnabled,
    style,
    sectionColor,
    metaAccentColor,
    displayPolicy,
}: BuildMandalaCardViewModelOptions): MandalaCardViewModel => ({
    nodeId,
    section,
    contentEnabled,
    style,
    sectionColor,
    metaAccentColor,
    displayPolicy,
});
