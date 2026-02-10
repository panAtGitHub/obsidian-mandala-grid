import { getContext } from 'svelte';
import type { SplitNodeModalProps } from 'src/view/modals/split-node-modal/split-node-modal';

export const getModalProps = () => {
    return getContext<SplitNodeModalProps>('modal-props');
};
