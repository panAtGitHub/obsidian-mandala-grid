import { getContext } from 'svelte';
import type { MandalaView } from 'src/view/view';
import type MandalaGrid from 'src/main';

export const getPlugin = () => {
    return getContext<MandalaGrid>('plugin');
};
export const getView = () => {
    return getContext<MandalaView>('view');
};
