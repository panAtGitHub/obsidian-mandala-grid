import { TreeNode } from 'src/lib/data-conversion/x-to-json/columns-to-json';
import { level } from 'src/lib/data-conversion/helpers/html-comment-marker/create-html-comment-marker';
import { createHtmlElementMarker } from 'src/lib/data-conversion/helpers/html-element-marker/create-html-element-marker';

export const jsonToHtmlElement = (
    tree: TreeNode[],
    parentNumber = '',
    text = '',
) => {
    for (let i = 0; i < tree.length; i++) {
        const node = tree[i];

        const index = i + 1;
        if (text) text = text + '\n\n';

        let content = node.content.trimStart();

        const marker = createHtmlElementMarker(parentNumber, index);
        if (content.match(/^#+ /)) {
            // an additional '\n' is needed as a workaround for a bug in obsidian
            content = `${marker}\n\n${content}`;
        } else if (content.match(/^#[^\s#\uFEFF\u200B]+/)) {
            // BOM (\uFEFF) and zero-width spaces (\u200B) are matched to avoid issues with emojis
            const tag = content.match(/^#[^\s#\uFEFF\u200B]+/)?.[0];
            content = `${tag}${marker}${content.slice(tag!.length)}`;
        } else if (content.startsWith('>')) {
            content = `${marker}\n${content}`;
        } else if (content.match(/^[-*+]\s\[.\]\s/)) {
            // tasks
            const taskPrefix = content.match(/^[-*+]\s\[.\]\s/)?.[0];
            content = `${taskPrefix}${marker}${content.slice(taskPrefix!.length).trim()}`;
        } else if (content.match(/^[-*+]\s/)) {
            const bullet = content.match(/^[-*+]\s/)?.[0];
            content = `${bullet}${marker}${content.slice(bullet!.length).trim()}`;
        } else if (content.match(/^\d+\.\s/)) {
            // numbered list
            const number = content.match(/^\d+\.\s/)?.[0];
            content = `${number} ${marker}${content.slice(number!.length).trim()}`;
        } else if (content.startsWith('```')) {
            content = `${marker}\n${content}`;
        } else if (content.startsWith('|')) {
            // table
            content = `${marker}\n\n${content}`;
        } else {
            content = `${marker}${content}`;
        }

        text += content;

        if (node.children.length > 0) {
            text = jsonToHtmlElement(
                node.children,
                level(parentNumber, index),
                text,
            );
        }
    }
    return text;
};
