import { DocumentViewState } from 'src/stores/view/view-state-type';

export type SetDragCanceled = {
    type: 'view/dnd/set-drag-ended';
};
export const onDragEnd = (state: Pick<DocumentViewState, 'dnd'>) => {
    state.dnd = {
        node: '',
        childGroups: new Set(),
    };
};
