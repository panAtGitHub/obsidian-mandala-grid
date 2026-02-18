import { writable } from 'svelte/store';

export const exportModeModalViewId = writable<string | null>(null);

export const openExportModeModalForView = (viewId: string) => {
    exportModeModalViewId.set(viewId);
};

export const closeExportModeModal = () => {
    exportModeModalViewId.set(null);
};
