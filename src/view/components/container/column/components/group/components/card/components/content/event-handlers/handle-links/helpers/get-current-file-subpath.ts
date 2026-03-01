import { parseLinktext } from 'obsidian';

type LinkTarget = {
    path: string;
};

type GetCurrentFileSubpathArgs = {
    link: string;
    currentFilePath: string;
    resolveFirstLinkpathDest: (
        path: string,
        sourcePath: string,
    ) => LinkTarget | null;
};

const normalizeSubpath = (subpath: string): string | null => {
    const trimmed = subpath.trim();
    if (!trimmed) return null;
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
};

export const getCurrentFileSubpath = ({
    link,
    currentFilePath,
    resolveFirstLinkpathDest,
}: GetCurrentFileSubpathArgs): string | null => {
    const { path, subpath } = parseLinktext(link);
    const normalizedSubpath = normalizeSubpath(subpath);
    if (!normalizedSubpath) return null;

    const normalizedPath = path.trim();
    if (!normalizedPath) {
        return normalizedSubpath;
    }

    const targetFile = resolveFirstLinkpathDest(
        normalizedPath,
        currentFilePath,
    );
    if (!targetFile || targetFile.path !== currentFilePath) {
        return null;
    }

    return normalizedSubpath;
};
