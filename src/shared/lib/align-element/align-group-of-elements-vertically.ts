import { getCombinedBoundingClientRect } from 'src/shared/lib/align-element/helpers/get-combined-client-rect';
import { AlignBranchContext } from 'src/stores/view/subscriptions/effects/align-branch/helpers/create-context';
import { alignVertically } from 'src/shared/lib/align-element/align-element-vertically';
import { getElementById } from 'src/shared/lib/align-element/helpers/get-element-by-id';

export const alignGroupOfElementsVertically = (
    context: AlignBranchContext,
    column: HTMLElement,
    ids: string[],
    relativeId: string | null,
    center = true,
) => {
    const elements = ids
        .map((id) => getElementById(context.container, id))
        .filter((x) => x) as HTMLElement[];

    const elementRect = getCombinedBoundingClientRect(elements);
    alignVertically(context, column, elementRect, relativeId, center);
};
