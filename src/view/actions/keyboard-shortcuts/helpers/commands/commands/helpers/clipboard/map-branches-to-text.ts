import { getBranch } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/get-branch';
import { branchToHtmlComment } from 'src/lib/data-conversion/branch-to-x/branch-to-html-comment';
import { MandalaGridDocument } from 'src/stores/document/document-state-type';
import { branchToText } from 'src/lib/data-conversion/branch-to-x/branch-to-text';

export const mapBranchesToText = (
    document: MandalaGridDocument,
    nodes: Array<string>,
    format: 'sections' | 'unformatted-text',
) => {
    const branches = nodes.map((node) =>
        getBranch(document.columns, document.content, node, 'copy'),
    );

    const isSingleNode =
        nodes.length === 1 && Object.keys(branches[0].content).length === 1;

    if (isSingleNode) {
        return branches[0].content[nodes[0]].content;
    } else if (format === 'sections') {
        return branchToHtmlComment(branches);
    } else if (format === 'unformatted-text') {
        return branchToText(branches);
    }
    throw new Error('Invalid format');
};
