import { Notice } from 'obsidian';

import { exportCurrentViewPdf } from './export/pdf-export';
import { exportCurrentViewPng } from './export/png-export';
import type {
    CreateViewOptionsExportActionsArgs,
    ExportMode,
} from './export/types';

export const createViewOptionsExportActions = ({
    view,
    isMobile,
    getExportMode,
    getIncludeSidebarInPngScreen,
    getWhiteThemeMode,
    getSquareLayout,
    getA4Mode,
    createCurrentExportPreset,
    persistLastExportPreset,
    closeExportMode,
}: CreateViewOptionsExportActionsArgs) => {
    const runExport = async (exportMode: ExportMode) => {
        if (exportMode === 'pdf-a4') {
            await exportCurrentViewPdf({
                view,
                a4Mode: getA4Mode(),
                createCurrentExportPreset,
                persistLastExportPreset,
                closeExportMode,
            });
            return;
        }

        await exportCurrentViewPng({
            view,
            mode: exportMode,
            includeSidebarInPngScreen: getIncludeSidebarInPngScreen(),
            whiteThemeMode: getWhiteThemeMode(),
            squareLayout: getSquareLayout(),
            createCurrentExportPreset,
            persistLastExportPreset,
            closeExportMode,
        });
    };

    return {
        async exportCurrentFile() {
            if (isMobile) {
                new Notice('移动端不支持导出，请在桌面端操作');
                return;
            }
            await runExport(getExportMode());
        },
    };
};
