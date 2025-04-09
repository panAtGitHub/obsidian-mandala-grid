import { Settings } from 'src/stores/settings/settings-type';

export const filterStaleDocuments = (
    settings: Pick<Settings, 'documents'> & {
        styleRules: Pick<Settings['styleRules'], 'documents'>;
    },
    allFiles: Set<string>,
) => {
    if (allFiles.size === 0) return 0;
    const paths = Object.keys(settings.documents);
    const deletedPaths: Set<string> = new Set();
    for (const path of paths) {
        if (!allFiles.has(path)) {
            deletedPaths.add(path);
            delete settings.documents[path];
            delete settings.styleRules.documents[path];
        }
    }
    return deletedPaths.size;
};
