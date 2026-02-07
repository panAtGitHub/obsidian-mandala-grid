import { MarkdownView } from 'obsidian';
import MandalaGrid from 'src/main';
import { logger } from 'src/helpers/logger';

export const vimEnterInsertMode = (plugin: MandalaGrid, view: MarkdownView) => {
    const config = (
        plugin.app.vault as unknown as { config?: { vimMode?: boolean } }
    ).config;
    if (config?.vimMode) {
        try {
            const appWindow = (
                globalThis as {
                    activeWindow?: Window & {
                        CodeMirrorAdapter?: {
                            Vim?: { enterInsertMode: (cm: unknown) => void };
                        };
                    };
                }
            ).activeWindow;
            const cm = (
                view as unknown as {
                    editMode?: { editor?: { cm?: { cm?: unknown } } };
                }
            ).editMode?.editor?.cm?.cm;
            if (appWindow?.CodeMirrorAdapter?.Vim?.enterInsertMode && cm) {
                appWindow.CodeMirrorAdapter.Vim.enterInsertMode(cm);
            }
        } catch {
            logger.warn('could not enter insert mode');
        }
    }
};
