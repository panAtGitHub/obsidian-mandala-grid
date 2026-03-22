import { Column } from 'src/mandala-document/state/document-state-type';

enum Mode {
    jump_down = 'jump_down',
    jump_up = 'jump_up',
    step_from_top = 'step_from_top',
    step_from_bottom = 'step_from_bottom',
}

export const updateSelectedNodes = (
    column: Column,
    selectedNodes: Set<string>,
    previousActiveNode: string,
    newActiveNode: string,
) => {
    const allNodeIds: string[] = column.groups.flatMap((group) => group.nodes);

    const previousActiveNodeIndex = allNodeIds.indexOf(previousActiveNode);
    if (previousActiveNodeIndex === -1) return;
    const currentSelectionIsEmpty = selectedNodes.size === 0;
    const lowestSelectedNodeIndex = currentSelectionIsEmpty
        ? previousActiveNodeIndex
        : allNodeIds.findIndex((nodeId) => selectedNodes.has(nodeId));
    const highestSelectedNodeIndex = currentSelectionIsEmpty
        ? previousActiveNodeIndex
        : allNodeIds.findLastIndex((nodeId) => selectedNodes.has(nodeId));

    const newActiveNodeIndex = allNodeIds.indexOf(newActiveNode);
    if (newActiveNodeIndex === -1) return;

    let mode: Mode | null = null;
    if (newActiveNodeIndex - previousActiveNodeIndex > 1) {
        mode = Mode.jump_down;
    } else if (previousActiveNodeIndex - newActiveNodeIndex > 1) {
        mode = Mode.jump_up;
    } else if (previousActiveNodeIndex === lowestSelectedNodeIndex)
        mode = Mode.step_from_top;
    else if (previousActiveNodeIndex === highestSelectedNodeIndex)
        mode = Mode.step_from_bottom;

    const goingUp = previousActiveNodeIndex > newActiveNodeIndex;
    selectedNodes.clear();
    if (!mode) return;
    let startIndex = 0,
        endIndex = 0;
    if (currentSelectionIsEmpty) {
        if (goingUp) {
            startIndex = newActiveNodeIndex;
            endIndex = previousActiveNodeIndex;
        } else {
            startIndex = previousActiveNodeIndex;
            endIndex = newActiveNodeIndex;
        }
    } else if (mode === Mode.jump_down) {
        startIndex = previousActiveNodeIndex;
        endIndex = newActiveNodeIndex;
    } else if (mode === Mode.jump_up) {
        startIndex = newActiveNodeIndex;
        endIndex = previousActiveNodeIndex;
    } else if (mode === Mode.step_from_top) {
        startIndex = newActiveNodeIndex;
        endIndex = highestSelectedNodeIndex;
    } else if (mode === Mode.step_from_bottom) {
        startIndex = lowestSelectedNodeIndex;
        endIndex = newActiveNodeIndex;
    }
    if (startIndex === endIndex) return;

    for (let i = startIndex; i <= endIndex; i++) {
        selectedNodes.add(allNodeIds[i]);
    }
};
