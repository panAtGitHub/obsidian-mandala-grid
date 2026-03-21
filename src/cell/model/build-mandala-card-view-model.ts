import type { MandalaCardViewModel } from 'src/cell/model/card-view-model';

type BuildMandalaCardViewModelOptions = MandalaCardViewModel;

export const buildMandalaCardViewModel = ({
    nodeId,
    section,
    active,
    editing,
    selected,
    pinned,
    style,
    sectionColor,
    metaAccentColor,
    displayPolicy,
    interactionPolicy,
    gridCell,
}: BuildMandalaCardViewModelOptions): MandalaCardViewModel => ({
    nodeId,
    section,
    active,
    editing,
    selected,
    pinned,
    style,
    sectionColor,
    metaAccentColor,
    displayPolicy,
    interactionPolicy,
    gridCell,
});
