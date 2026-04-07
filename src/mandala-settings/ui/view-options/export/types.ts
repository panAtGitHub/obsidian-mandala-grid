import type { LastExportPreset } from 'src/mandala-settings/state/settings-type';
import type { MandalaView } from 'src/view/view';

export type ExportMode = 'png-square' | 'png-screen' | 'pdf-a4';

export type ElectronDialog = {
    dialog?: {
        showSaveDialog: (options: {
            title: string;
            defaultPath: string;
            filters: { name: string; extensions: string[] }[];
        }) => Promise<{ canceled: boolean; filePath?: string }>;
    };
    remote?: {
        dialog?: {
            showSaveDialog: (options: {
                title: string;
                defaultPath: string;
                filters: { name: string; extensions: string[] }[];
            }) => Promise<{ canceled: boolean; filePath?: string }>;
        };
        getCurrentWindow?: () => {
            webContents?: {
                printToPDF?: (options: {
                    pageSize?: string | { width: number; height: number };
                    printBackground?: boolean;
                    preferCSSPageSize?: boolean;
                    margins?: {
                        marginType?: 'default' | 'none' | 'printableArea' | 'custom';
                        top?: number;
                        bottom?: number;
                        left?: number;
                        right?: number;
                    };
                }) => Promise<Uint8Array>;
            };
        };
    };
};

export type ElectronFs = {
    writeFile: (
        path: string,
        data: Uint8Array,
        cb: (err?: Error) => void,
    ) => void;
};

export type CreateViewOptionsExportActionsArgs = {
    view: MandalaView;
    isMobile: boolean;
    getExportMode: () => ExportMode;
    getIncludeSidebarInPngScreen: () => boolean;
    getWhiteThemeMode: () => boolean;
    getSquareLayout: () => boolean;
    getA4Mode: () => boolean;
    createCurrentExportPreset: () => LastExportPreset;
    persistLastExportPreset: (preset?: LastExportPreset) => void;
    closeExportMode: () => void;
};
