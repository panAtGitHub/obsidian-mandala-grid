import Lineage from 'src/main';
import { logger } from 'src/helpers/logger';
import { filterStaleDocuments } from 'src/stores/plugin/subscriptions/effects/remove-stale-documents/helpers/filter-stale-documents';
import { getAllLoadedFiles } from 'src/stores/plugin/subscriptions/effects/remove-stale-documents/helpers/get-all-loaded-files';

const processStaleDocuments = (plugin: Lineage) => {
    const settings = plugin.settings.getValue();
    const allLoadedFiles = getAllLoadedFiles(plugin);
    const deleted = filterStaleDocuments(settings, allLoadedFiles);
    if (deleted === 0) return;

    logger.debug(`[lineage] removed ${deleted} stale documents`);
    plugin.settings.dispatch({
        type: 'settings/documents/remove-stale-documents',
        payload: {
            documents: settings.documents,
        },
    });
};

export const removeStaleDocuments = (plugin: Lineage) => {
    plugin.registerTimeout(
        setTimeout(() => processStaleDocuments(plugin), 1000 * 60 * 5),
    );
};
