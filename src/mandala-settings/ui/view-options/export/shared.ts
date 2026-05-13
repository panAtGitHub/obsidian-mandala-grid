import { toPng } from 'html-to-image';
import { applyCssProps } from 'src/shared/helpers/apply-css-props';

export const applyInlineStyles = (
    element: HTMLElement,
    styles: Partial<CSSStyleDeclaration>,
) => {
    Object.assign(element.style, styles);
};

export const collectCssVariables = (elements: HTMLElement[]) => {
    const vars: Record<string, string> = {};
    for (const element of elements) {
        const computed = getComputedStyle(element);
        for (let i = 0; i < computed.length; i += 1) {
            const key = computed[i];
            if (!key.startsWith('--')) continue;
            const value = computed.getPropertyValue(key).trim();
            if (!value) continue;
            vars[key] = value;
        }
    }
    return vars;
};

export const applyCssVariables = (
    element: HTMLElement,
    vars: Record<string, string>,
) => {
    applyCssProps(element, vars);
};

export const withPrintTarget = (
    target: HTMLElement,
    callback: () => Promise<void>,
) => {
    activeDocument.body.classList.add('mandala-print-export');
    activeDocument.body.classList.add('mandala-export-hide-controls');
    target.classList.add('mandala-print-target');
    return callback().finally(() => {
        activeDocument.body.classList.remove('mandala-print-export');
        activeDocument.body.classList.remove('mandala-export-hide-controls');
        target.classList.remove('mandala-print-target');
    });
};

export const withExportControlsHidden = async (
    callback: () => Promise<void>,
) => {
    activeDocument.body.classList.add('mandala-export-hide-controls');
    try {
        await callback();
    } finally {
        activeDocument.body.classList.remove('mandala-export-hide-controls');
    }
};

export const renderToPNGDataUrl = async (
    target: HTMLElement,
    options?: {
        width?: number;
        height?: number;
        pixelRatio?: number;
    },
) => {
    const backgroundColor = getComputedStyle(
        activeDocument.documentElement,
    ).getPropertyValue('--background-primary');
    const safeBackground =
        backgroundColor && backgroundColor.trim().length > 0
            ? backgroundColor.trim()
            : '#ffffff';
    return toPng(target, {
        pixelRatio: options?.pixelRatio ?? 2,
        backgroundColor: safeBackground,
        width: options?.width,
        height: options?.height,
    });
};

export const buildTimestampedFilename = (extension: 'png' | 'pdf') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `mandala-${timestamp}.${extension}`;
};
