import { getContext } from 'svelte';
import type { SplitNodeModalState } from 'src/view/modals/split-node-modal/split-node-modal';

export const getModalState = () => {
    return getContext<SplitNodeModalState>('modal-state');
};
