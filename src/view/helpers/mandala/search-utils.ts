import type { MandalaView } from 'src/view/view';
import type { NodeSearchResult } from 'src/stores/view/subscriptions/effects/document-search/document-search';
import { logger } from 'src/helpers/logger';

/**
 * Mandala 搜索结果类型
 */
export interface MandalaSearchResult {
    section: string;           // 例如 "3.1.1"
    nodeId: string;            // 对应的 node ID
    contentPreview: string;    // 匹配内容预览
    matchScore: number;        // Fuse.js 匹配分数
}

/**
 * Section 解析结果
 */
interface ParsedSection {
    parent: string | null;  // 父级 section，如果是根节点则为 null
    self: string;           // 当前 section
}

/**
 * 从 section 字符串解析父级和自身
 * @example parseSection("3.1.1") => { parent: "3.1", self: "3.1.1" }
 * @example parseSection("3") => { parent: "1", self: "3" }
 * @example parseSection("1") => { parent: null, self: "1" }
 */
export function parseSection(section: string): ParsedSection {
    const parts = section.split('.');

    if (parts.length === 1) {
        // 核心主题
        return { parent: null, self: section };
    }

    // 多级节点，去掉最后一段作为父级
    const parent = parts.slice(0, -1).join('.');
    return { parent, self: section };
}

/**
 * 预览搜索结果（不记录历史，用于 Hover 和键盘导航）
 * @param section 目标 section（例如 "3.1.1"）
 * @param view MandalaView 实例
 */
export function previewSearchResult(section: string, view: MandalaView): void {
    const { parent, self } = parseSection(section);
    const nodeId = view.documentStore.getValue().sections.section_id[self];

    if (!nodeId) return;

    const theme = parent ?? self ?? '1';
    // 1. 设置 subgrid theme
    view.viewStore.dispatch({
        type: 'view/mandala/subgrid/enter',
        payload: { theme },
    });

    // 2. 激活目标节点（使用 mouse-silent 不记录历史）
    view.viewStore.dispatch({
        type: 'view/set-active-node/mouse-silent',
        payload: { id: nodeId }
    });
}

/**
 * 导航到搜索结果对应的九宫格视图
 * @param section 目标 section（例如 "3.1.1"）
 * @param view MandalaView 实例
 */
export function navigateToSearchResult(section: string, view: MandalaView): void {
    const { parent, self } = parseSection(section);
    const nodeId = view.documentStore.getValue().sections.section_id[self];

    if (!nodeId) {
        logger.error(`Section ${self} 不存在`);
        return;
    }

    const theme = parent ?? self ?? '1';
    // 1. 设置 subgrid theme
    view.viewStore.dispatch({
        type: 'view/mandala/subgrid/enter',
        payload: { theme },
    });

    // 2. 激活目标节点（使用 search 类型表明是搜索触发）
    view.viewStore.dispatch({
        type: 'view/set-active-node/search',
        payload: { id: nodeId }
    });

    // 注意：不自动关闭搜索结果（根据用户选择）
}

/**
 * 从 Fuse.js 搜索结果转换为 Mandala 搜索结果
 * @param fuseResults Fuse 搜索引擎返回的结果 Map
 * @param idToSection nodeId 到 section 的映射
 * @returns 按 section 层级排序的搜索结果数组
 */
export function convertToMandalaResults(
    fuseResults: Map<string, NodeSearchResult>,
    idToSection: Record<string, string>
): MandalaSearchResult[] {
    const results: MandalaSearchResult[] = [];

    for (const [nodeId, fuseResult] of fuseResults) {
        const section = idToSection[nodeId];
        if (!section) continue;

        results.push({
            section,
            nodeId,
            contentPreview: extractPreview(fuseResult.item.content),
            matchScore: fuseResult.score || 0
        });
    }

    // 按 section 层级排序（先浅后深，同级按字母序）
    return results.sort((a, b) => {
        const depthA = a.section.split('.').length;
        const depthB = b.section.split('.').length;
        if (depthA !== depthB) return depthA - depthB;
        return a.section.localeCompare(b.section);
    });
}

/**
 * 提取内容预览（截取前 N 个字符）
 * TODO: 未来可以实现高亮关键词周围的上下文
 */
export function extractPreview(content: string, maxLength = 60): string {
    // 去除换行符和多余空格
    const cleaned = content.replace(/\s+/g, ' ').trim();
    return cleaned.slice(0, maxLength) + (cleaned.length > maxLength ? '...' : '');
}
