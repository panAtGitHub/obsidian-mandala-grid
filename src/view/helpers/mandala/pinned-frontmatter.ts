import { MandalaView } from 'src/view/view';

const PINNED_SECTIONS_KEY = 'mandala_pinned_sections';

type PinnedFrontmatter = {
    sections: string[];
};

const normalizeSections = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string');
    }
    if (typeof value === 'string') {
        return [value];
    }
    return [];
};

export const readPinnedFromFrontmatter = (
    view: MandalaView,
): PinnedFrontmatter | null => {
    if (!view.file) return null;
    const cache = view.plugin.app.metadataCache.getFileCache(view.file);
    const frontmatter = cache?.frontmatter;
    if (!frontmatter) return null;
    const sections = normalizeSections(frontmatter[PINNED_SECTIONS_KEY]);
    if (sections.length === 0) return null;
    return { sections };
};

export const writePinnedToFrontmatter = (
    view: MandalaView,
    sections: string[],
): void => {
    if (!view.file) return;
    void view.plugin.app.fileManager.processFrontMatter(
        view.file,
        (frontmatter) => {
            if (sections.length > 0) {
                frontmatter[PINNED_SECTIONS_KEY] = sections;
            } else {
                delete frontmatter[PINNED_SECTIONS_KEY];
            }
        },
    );
};
