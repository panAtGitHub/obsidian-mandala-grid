import { Notice } from 'obsidian';
import { MandalaView } from 'src/view/view';
import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
import { formatWikiLink } from 'src/view/actions/context-menu/card-context-menu/helpers/format-wiki-link';

const ATX_HEADING_PATTERN = /^(#{1,6})\s+(.+)$/;
const TRAILING_HEADING_MARKERS_PATTERN = /\s*#+\s*$/;

export const extractFirstHeadingFromMarkdown = (
    content: string,
): string | null => {
    const lines = content.split('\n');
    for (const line of lines) {
        const match = ATX_HEADING_PATTERN.exec(line.trimStart());
        if (!match) continue;
        const headingText = match[2]
            .replace(TRAILING_HEADING_MARKERS_PATTERN, '')
            .trim();
        if (headingText.length > 0) {
            return headingText;
        }
    }
    return null;
};

type CopyLinkToHeadingOptions = {
    embed?: boolean;
};

export const buildHeadingWikiLink = (
    fileName: string,
    headingText: string,
    embed = false,
) => formatWikiLink(`${fileName}#${headingText}`, embed);

export const copyLinkToHeading = async (
    view: MandalaView,
    activeNode: string,
    options?: CopyLinkToHeadingOptions,
) => {
    const file = view.file;
    if (!file) return;

    const viewState = view.viewStore.getValue();
    const isEditing = Boolean(viewState.document.editing.activeNodeId);
    if (isEditing) {
        saveNodeContent(view);
        setTimeout(() => {
            void copyLinkToHeading(view, activeNode, options);
        }, 100);
        return;
    }

    const text =
        view.documentStore.getValue().document.content[activeNode]?.content ??
        '';
    const headingText = extractFirstHeadingFromMarkdown(text);
    if (!headingText) {
        new Notice('Could not copy heading link to clipboard');
        return;
    }

    const link = buildHeadingWikiLink(
        file.basename,
        headingText,
        options?.embed ?? false,
    );
    await navigator.clipboard.writeText(link);
    new Notice('Copied');
};
