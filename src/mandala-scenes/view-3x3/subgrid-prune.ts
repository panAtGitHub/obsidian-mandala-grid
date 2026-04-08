import type { DocumentState } from 'src/mandala-document/state/document-state-type';

export type ThreeByThreeSubgridPrunePlan = {
    shouldPrune: boolean;
    parentIds: string[];
    activeNodeId: string | null;
};

type CreateThreeByThreeSubgridPrunePlanArgs = {
    theme: string | null | undefined;
    documentState: Pick<DocumentState, 'sections' | 'meta'>;
    activeNodeId: string | null;
};

const EMPTY_PRUNE_PLAN: ThreeByThreeSubgridPrunePlan = {
    shouldPrune: false,
    parentIds: [],
    activeNodeId: null,
};

export const createThreeByThreeSubgridPrunePlan = ({
    theme,
    documentState,
    activeNodeId,
}: CreateThreeByThreeSubgridPrunePlanArgs): ThreeByThreeSubgridPrunePlan => {
    if (!theme || theme === '1') {
        return {
            ...EMPTY_PRUNE_PLAN,
            activeNodeId,
        };
    }

    const parentNodeId = documentState.sections.section_id[theme];
    if (!parentNodeId) {
        return {
            ...EMPTY_PRUNE_PLAN,
            activeNodeId,
        };
    }

    const counts = documentState.meta.mandalaV2.subtreeNonEmptyCountBySection;
    for (let slot = 1; slot <= 8; slot += 1) {
        const childSection = `${theme}.${slot}`;
        if (!documentState.sections.section_id[childSection]) {
            return {
                ...EMPTY_PRUNE_PLAN,
                activeNodeId,
            };
        }
        if ((counts[childSection] ?? 0) > 0) {
            return {
                ...EMPTY_PRUNE_PLAN,
                activeNodeId,
            };
        }
    }

    return {
        shouldPrune: true,
        parentIds: [parentNodeId],
        activeNodeId,
    };
};
