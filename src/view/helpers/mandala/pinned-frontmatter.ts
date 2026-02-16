import { MandalaView } from 'src/view/view';
import { parseYaml, stringifyYaml } from 'obsidian';
import { updateFrontmatter } from 'src/stores/view/subscriptions/actions/document/update-frontmatter';

const PINNED_SECTIONS_KEY = 'mandala_pinned_sections';

type PinnedFrontmatter = {
    sections: string[];
};

const stripFrontmatter = (frontmatter: string) =>
    frontmatter
        .replace(/^---\n/, '')
        .replace(/\n---\n?$/, '')
        .trim();

const buildFrontmatterWithPinnedSections = (
    frontmatter: string,
    sections: string[],
) => {
    let record: Record<string, unknown> = {};
    if (frontmatter.trim()) {
        const content = stripFrontmatter(frontmatter);
        if (content) {
            try {
                const parsed: unknown = parseYaml(content);
                if (parsed && typeof parsed === 'object') {
                    record = parsed as Record<string, unknown>;
                }
            } catch {
                record = {};
            }
        }
    }

    if (sections.length > 0) {
        record[PINNED_SECTIONS_KEY] = sections;
    } else {
        delete record[PINNED_SECTIONS_KEY];
    }

    const yaml = stringifyYaml(record).trim();
    return yaml ? `---\n${yaml}\n---\n` : '';
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
    const frontmatterText = view.documentStore.getValue().file.frontmatter;
    let sections: string[] = [];

    if (frontmatterText.trim()) {
        const content = stripFrontmatter(frontmatterText);
        if (content) {
            try {
                const parsed: unknown = parseYaml(content);
                if (parsed && typeof parsed === 'object') {
                    sections = normalizeSections(
                        (parsed as Record<string, unknown>)[PINNED_SECTIONS_KEY],
                    );
                }
            } catch {
                sections = [];
            }
        }
    }

    if (sections.length === 0 && view.file) {
        const cache = view.plugin.app.metadataCache.getFileCache(view.file);
        const frontmatter = cache?.frontmatter;
        if (frontmatter) {
            sections = normalizeSections(frontmatter[PINNED_SECTIONS_KEY]);
        }
    }

    if (sections.length === 0) return null;
    return { sections };
};

export const writePinnedToFrontmatter = (
    view: MandalaView,
    sections: string[],
): void => {
    if (!view.file) return;
    const currentFrontmatter = view.documentStore.getValue().file.frontmatter;
    const nextFrontmatter = buildFrontmatterWithPinnedSections(
        currentFrontmatter,
        sections,
    );
    if (nextFrontmatter !== currentFrontmatter) {
        updateFrontmatter(view, nextFrontmatter);
    }

    void view.plugin.app.fileManager.processFrontMatter(
        view.file,
        (frontmatter) => {
            const frontmatterRecord = frontmatter as Record<string, unknown>;
            if (sections.length > 0) {
                frontmatterRecord[PINNED_SECTIONS_KEY] = sections;
            } else {
                delete frontmatterRecord[PINNED_SECTIONS_KEY];
            }
        },
    );
};
