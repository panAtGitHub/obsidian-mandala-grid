import MandalaGrid from 'src/main';
import { logger } from 'src/shared/helpers/logger';
import { filterStaleDocuments } from 'src/stores/plugin/subscriptions/effects/remove-stale-documents/helpers/filter-stale-documents';
import { getAllLoadedFiles } from 'src/stores/plugin/subscriptions/effects/remove-stale-documents/helpers/get-all-loaded-files';

const processStaleDocuments = (plugin: MandalaGrid) => {
    const settings = plugin.settings.getValue();
    const allLoadedFiles = getAllLoadedFiles(plugin);
    const deleted = filterStaleDocuments(settings, allLoadedFiles);
    if (deleted === 0) return;

    logger.debug(`[mandala] removed ${deleted} stale documents`);
    plugin.settings.dispatch({
        type: 'settings/documents/remove-stale-documents',
        payload: {
            documents: settings.documents,
        },
    });
};

export const removeStaleDocuments = (plugin: MandalaGrid) => {
    plugin.registerTimeout(
        setTimeout(() => processStaleDocuments(plugin), 1000 * 60 * 5),
    );
};
