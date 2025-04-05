import {
    ClipboardBranch,
    LineageDocument,
    Sections,
} from 'src/stores/document/document-state-type';
import { clone } from 'src/helpers/clone';
import { getBranch } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/get-branch';
import { branchToOutline } from 'src/lib/data-conversion/branch-to-x/branch-to-outline';
import { sortNodeIdsBySectionNumber } from 'src/lib/tree-utils/sort/sort-node-ids-by-section-number';
import { sortNodeIdsByDepthDesc } from 'src/lib/tree-utils/sort/sort-node-ids-by-depth-desc';

export const getSearchResultsFromDocument = (
    results: string[],
    document: LineageDocument,
    sections: Sections,
) => {
    const sortedByDepth = sortNodeIdsByDepthDesc(sections, results);

    const documentClone = clone(document);

    const branches = sortedByDepth.map((node) =>
        getBranch(documentClone.columns, documentClone.content, node, 'cut'),
    );
    const branchesMap = new Map<string, ClipboardBranch>(
        branches.map((branch) => [branch.nodeId, branch]),
    );
    const rootNodes = Array.from(branchesMap.keys());
    const sortedBranches = sortNodeIdsBySectionNumber(sections, rootNodes).map(
        (id) => branchesMap.get(id),
    ) as ClipboardBranch[];

    const isASingleNode =
        branches.length === 1 && branches[0].sortedChildGroups.length === 0;
    return isASingleNode
        ? branches[0].content[branches[0].nodeId].content
        : branchToOutline(sortedBranches);
};
