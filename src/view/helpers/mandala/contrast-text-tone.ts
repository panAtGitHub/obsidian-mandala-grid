export type ThemeTone = 'dark' | 'light';
export type TextTone = 'dark' | 'light';

type Rgba = {
    r: number;
    g: number;
    b: number;
    a: number;
};

const DARK_THEME_BACKGROUND: Rgba = { r: 35, g: 41, b: 56, a: 1 };
const LIGHT_THEME_BACKGROUND: Rgba = { r: 250, g: 250, b: 250, a: 1 };

const clampChannel = (value: number) => Math.max(0, Math.min(255, value));
const clampAlpha = (value: number) => Math.max(0, Math.min(1, value));

const hexToRgba = (color: string): Rgba | null => {
    const hex = color.trim().replace(/^#/, '');
    if (![3, 4, 6, 8].includes(hex.length)) return null;

    const normalized =
        hex.length === 3 || hex.length === 4
            ? hex
                  .split('')
                  .map((char) => `${char}${char}`)
                  .join('')
            : hex;

    const hasAlpha = normalized.length === 8;
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    const a = hasAlpha ? Number.parseInt(normalized.slice(6, 8), 16) / 255 : 1;

    if ([r, g, b].some((channel) => Number.isNaN(channel)) || Number.isNaN(a)) {
        return null;
    }

    return { r, g, b, a };
};

const parseRgbChannel = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
        const percent = Number.parseFloat(trimmed.slice(0, -1));
        if (Number.isNaN(percent)) return null;
        return clampChannel((percent / 100) * 255);
    }
    const numeric = Number.parseFloat(trimmed);
    if (Number.isNaN(numeric)) return null;
    return clampChannel(numeric);
};

const rgbToRgba = (color: string): Rgba | null => {
    const match = color.trim().match(/^rgba?\(([^)]+)\)$/i);
    if (!match) return null;

    const parts = match[1].split(',');
    if (parts.length !== 3 && parts.length !== 4) return null;

    const r = parseRgbChannel(parts[0]);
    const g = parseRgbChannel(parts[1]);
    const b = parseRgbChannel(parts[2]);
    if (r === null || g === null || b === null) return null;

    const rawAlpha = parts[3]?.trim();
    const a = rawAlpha ? clampAlpha(Number.parseFloat(rawAlpha)) : 1;
    if (Number.isNaN(a)) return null;

    return { r, g, b, a };
};

const parseToRgba = (color: string): Rgba | null => {
    if (!color) return null;
    const trimmed = color.trim();
    if (trimmed.startsWith('#')) return hexToRgba(trimmed);
    if (trimmed.toLowerCase().startsWith('rgb')) return rgbToRgba(trimmed);
    return null;
};

const blendWithBackground = (foreground: Rgba, background: Rgba): Rgba => {
    const alpha = clampAlpha(foreground.a);
    const mixedAlpha = alpha + background.a * (1 - alpha);
    if (mixedAlpha <= 0) return background;
    return {
        r: clampChannel(
            (foreground.r * alpha + background.r * background.a * (1 - alpha)) /
                mixedAlpha,
        ),
        g: clampChannel(
            (foreground.g * alpha + background.g * background.a * (1 - alpha)) /
                mixedAlpha,
        ),
        b: clampChannel(
            (foreground.b * alpha + background.b * background.a * (1 - alpha)) /
                mixedAlpha,
        ),
        a: mixedAlpha,
    };
};

const toLinear = (channel: number) => {
    const value = channel / 255;
    if (value <= 0.04045) return value / 12.92;
    return ((value + 0.055) / 1.055) ** 2.4;
};

const luminance = (color: Rgba) =>
    0.2126 * toLinear(color.r) +
    0.7152 * toLinear(color.g) +
    0.0722 * toLinear(color.b);

const contrast = (l1: number, l2: number) => {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
};

export const getReadableTextTone = (
    backgroundColor: string | null | undefined,
    theme: ThemeTone,
): TextTone | null => {
    if (!backgroundColor) return null;
    const parsed = parseToRgba(backgroundColor);
    if (!parsed) return null;

    const defaultBackground =
        theme === 'dark' ? DARK_THEME_BACKGROUND : LIGHT_THEME_BACKGROUND;
    const effectiveBg =
        parsed.a < 1 ? blendWithBackground(parsed, defaultBackground) : parsed;

    const bgLuminance = luminance(effectiveBg);
    const blackContrast = contrast(bgLuminance, 0);
    const whiteContrast = contrast(bgLuminance, 1);
    return blackContrast >= whiteContrast ? 'dark' : 'light';
};
