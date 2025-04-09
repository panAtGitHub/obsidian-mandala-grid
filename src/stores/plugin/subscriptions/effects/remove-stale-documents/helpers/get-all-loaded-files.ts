import { TFile } from 'obsidian';
import Lineage from 'src/main';

export const getAllLoadedFiles = (plugin: Lineage) => {
    const allFiles = plugin.app.vault.getAllLoadedFiles();

    const allPaths = new Set<string>();
    for (const maybeFile of allFiles) {
        if (maybeFile instanceof TFile) {
            allPaths.add(maybeFile.path);
        }
    }
    return allPaths;
};
