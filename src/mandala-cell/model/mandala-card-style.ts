import type { NodeStyle } from 'src/mandala-settings/state/types/style-rules-types';
import {
    getReadableTextTone,
    type TextTone,
    type ThemeTone,
} from 'src/mandala-display/contrast/readable-text-tone';

export type BuildMandalaCardStyleOptions = {
    active: boolean;
    backgroundColor: string | null;
    style: NodeStyle | undefined;
    themeTone: ThemeTone;
    themeUnderlayColor?: string;
    preserveActiveBackground?: boolean;
};

export type MandalaCardStyleState = {
    backgroundColor: string | null;
    textTone: TextTone | null;
    cardStyle: string | undefined;
    surfaceStyle: string | undefined;
    bodyStyle: string | undefined;
    shouldHideBackgroundStyle: boolean;
};

const DARK_TEXT_TOKENS =
    '--text-normal: #0f131a; --text-muted: #2f3a48; --text-faint: #4f5c6b; --h1-color: #0f131a; --h2-color: #0f131a; --h3-color: #0f131a; --h4-color: #0f131a; --h5-color: #0f131a; --h6-color: #0f131a; --link-color: #2f3a48; --link-color-hover: #0f131a';

const LIGHT_TEXT_TOKENS =
    '--text-normal: #f3f6fd; --text-muted: #d0d8e6; --text-faint: #b0bbce; --h1-color: #f3f6fd; --h2-color: #f3f6fd; --h3-color: #f3f6fd; --h4-color: #f3f6fd; --h5-color: #f3f6fd; --h6-color: #f3f6fd; --link-color: #d0d8e6; --link-color-hover: #f3f6fd';

const getContrastBackgroundColor = ({
    active,
    backgroundColor,
    preserveActiveBackground = false,
    style,
}: Pick<
    BuildMandalaCardStyleOptions,
    'active' | 'backgroundColor' | 'style' | 'preserveActiveBackground'
>): string | null => {
    const shouldForceActiveBackground = active && !preserveActiveBackground;
    if (backgroundColor && !shouldForceActiveBackground) return backgroundColor;
    if (
        style?.styleVariant === 'background-color' &&
        !shouldForceActiveBackground
    ) {
        return style.color;
    }
    return null;
};

export const buildMandalaCardStyle = ({
    active,
    backgroundColor,
    preserveActiveBackground = false,
    style,
    themeTone,
    themeUnderlayColor,
}: BuildMandalaCardStyleOptions): MandalaCardStyleState => {
    const shouldForceActiveBackground = active && !preserveActiveBackground;
    const contrastBackgroundColor = getContrastBackgroundColor({
        active,
        backgroundColor,
        preserveActiveBackground,
        style,
    });
    const textTone = getReadableTextTone(
        contrastBackgroundColor,
        themeTone,
        themeUnderlayColor,
    );

    const surfaceStyle = [
        shouldForceActiveBackground
            ? 'background-color: var(--background-active-node) !important'
            : backgroundColor
              ? `background-color: ${backgroundColor}`
              : !active && style?.styleVariant !== 'background-color'
                ? 'background-color: var(--background-primary)'
                : '',
    ]
        .filter((chunk) => chunk.length > 0)
        .join('; ');

    const bodyStyle = [
        !active ? 'opacity: var(--inactive-card-opacity)' : '',
        !shouldForceActiveBackground && textTone === 'dark'
            ? DARK_TEXT_TOKENS
            : '',
        !shouldForceActiveBackground && textTone === 'light'
            ? LIGHT_TEXT_TOKENS
            : '',
        !contrastBackgroundColor && active
            ? '--text-normal: var(--color-active-node)'
            : !contrastBackgroundColor
              ? '--text-normal: var(--color-active-parent)'
              : '',
    ]
        .filter((chunk) => chunk.length > 0)
        .join('; ');

    const cardStyle = [
        shouldForceActiveBackground
            ? 'background-color: var(--background-active-node) !important'
            : backgroundColor
              ? `background-color: ${backgroundColor}`
              : '',
        !shouldForceActiveBackground && textTone === 'dark'
            ? DARK_TEXT_TOKENS
            : '',
        !shouldForceActiveBackground && textTone === 'light'
            ? LIGHT_TEXT_TOKENS
            : '',
    ]
        .filter((chunk) => chunk.length > 0)
        .join('; ');

    return {
        backgroundColor: contrastBackgroundColor,
        textTone,
        cardStyle: cardStyle.length > 0 ? cardStyle : undefined,
        surfaceStyle: surfaceStyle.length > 0 ? surfaceStyle : undefined,
        bodyStyle: bodyStyle.length > 0 ? bodyStyle : undefined,
        shouldHideBackgroundStyle: Boolean(
            (backgroundColor || shouldForceActiveBackground) &&
                style?.styleVariant === 'background-color',
        ),
    };
};
