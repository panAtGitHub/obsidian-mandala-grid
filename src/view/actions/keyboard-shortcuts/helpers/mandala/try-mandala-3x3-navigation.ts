import { MandalaView } from 'src/view/view';
import { AllDirections } from 'src/stores/document/document-store-actions';
import {
    posOfSection3x3,
    getMandalaLayout,
} from 'src/view/helpers/mandala/mandala-grid';

const deltas: Record<AllDirections, { dr: number; dc: number }> = {
    up: { dr: -1, dc: 0 },
    down: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 },
};

export const tryMandala3x3Navigation = (
    view: MandalaView,
    direction: AllDirections,
    options?: { extendSelection?: boolean },
) => {
    const docState = view.documentStore.getValue();
    if (view.mandalaMode !== '3x3') return false;

    const activeNodeId = view.viewStore.getValue().document.activeNode;
    const activeSectionRaw = docState.sections.id_section[activeNodeId];
    if (!activeSectionRaw) return false;

    const subgridTheme = view.viewStore.getValue().ui.mandala.subgridTheme;
    const gridOrientation =
        view.plugin.settings.getValue().view.mandalaGridOrientation ??
        'left-to-right';
    const { slotPositions, themeGrid } = getMandalaLayout(gridOrientation);
    const theme = subgridTheme ?? '1';

    const pos = (() => {
        if (activeSectionRaw === theme) return { row: 1, col: 1 };
        if (activeSectionRaw.startsWith(`${theme}.`)) {
            const suffix = activeSectionRaw.slice(theme.length + 1);
            if (suffix.includes('.')) return null;
            return slotPositions[suffix] ?? null;
        }
        return posOfSection3x3(activeSectionRaw, gridOrientation);
    })();
    if (!pos) return false;

    const { dr, dc } = deltas[direction];
    const nextRow = pos.row + dr;
    const nextCol = pos.col + dc;

    const nextSection = (() => {
        if (nextRow === 1 && nextCol === 1) return theme;
        const slot = themeGrid[nextRow]?.[nextCol] ?? null;
        return slot ? `${theme}.${slot}` : null;
    })();

    if (!nextSection) return true;

    const nextNodeId = docState.sections.section_id[nextSection];
    if (!nextNodeId) return true;

    if (options?.extendSelection) {
        const selected = new Set(
            view.viewStore.getValue().document.selectedNodes,
        );
        selected.add(activeNodeId);
        selected.add(nextNodeId);
        view.viewStore.dispatch({
            type: 'view/selection/set-selection',
            payload: { ids: Array.from(selected) },
        });
    }

    view.viewStore.dispatch({
        type: 'view/set-active-node/mouse-silent',
        payload: { id: nextNodeId },
    });
    return true;
};
