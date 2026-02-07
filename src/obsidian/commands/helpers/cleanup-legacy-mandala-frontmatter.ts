import { Notice, TFile } from 'obsidian';
import MandalaGrid from 'src/main';

const LEGACY_KEYS = [
    'mandala_view_subgrid_theme',
    'mandala_view_active_section',
    'mandala_view_active_cell_9x9',
    'mandala_view_mode',
    'mandala_view_zoom',
    'mandala_view_left_sidebar',
    'mandala_view_left_sidebar_width',
    'mandala_view_detail_sidebar',
    'mandala_view_detail_sidebar_width',
    'mandala_pinned_active_section',
] as const;

const hasLegacyKeys = (frontmatter: Record<string, unknown>) =>
    LEGACY_KEYS.some((key) => key in frontmatter);

export const cleanupLegacyMandalaFrontmatter = async (plugin: MandalaGrid) => {
    const markdownFiles = plugin.app.vault.getMarkdownFiles();
    const targetFiles: TFile[] = [];

    for (const file of markdownFiles) {
        const cache = plugin.app.metadataCache.getFileCache(file);
        const frontmatter = cache?.frontmatter as Record<string, unknown> | undefined;
        if (!frontmatter) continue;
        if (!hasLegacyKeys(frontmatter)) continue;
        targetFiles.push(file);
    }

    if (targetFiles.length === 0) {
        new Notice('没有发现需要清理的旧版 YAML 视图键。');
        return;
    }

    for (const file of targetFiles) {
        await plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
            for (const key of LEGACY_KEYS) {
                delete frontmatter[key];
            }
        });
    }

    new Notice(`已清理 ${targetFiles.length} 个文档中的旧版 YAML 视图键。`);
};
