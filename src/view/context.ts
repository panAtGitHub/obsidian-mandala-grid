import { getContext } from 'svelte';
import type MandalaGrid from 'src/main';
import type { CellRuntimeContext } from 'src/view/cell-runtime-context';
import type { MandalaView } from 'src/view/view';

export const getPlugin = () => {
    return getContext<MandalaGrid>('plugin');
};

export const getView = () => {
    return getContext<MandalaView>('view');
};

export const getCellRuntime = () => {
    return getContext<CellRuntimeContext>('cell-runtime');
};
