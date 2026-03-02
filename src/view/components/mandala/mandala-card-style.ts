import type { NodeStyle } from 'src/stores/settings/types/style-rules-types';
import {
    getReadableTextTone,
    type TextTone,
    type ThemeTone,
} from 'src/view/helpers/mandala/contrast-text-tone';

type BuildMandalaCardStyleOptions = {
    active: boolean;
    sectionColor: string | null;
    style: NodeStyle | undefined;
    themeTone: ThemeTone;
    themeUnderlayColor?: string;
    preserveActiveBackground?: boolean;
};

type MandalaCardStyleState = {
    backgroundColor: string | null;
    textTone: TextTone | null;
    cardStyle: string | undefined;
    shouldHideBackgroundStyle: boolean;
};

const getContrastBackgroundColor = ({
    active,
    sectionColor,
    preserveActiveBackground = false,
    style,
}: Pick<
    BuildMandalaCardStyleOptions,
    'active' | 'sectionColor' | 'style' | 'preserveActiveBackground'
>): string | null => {
    const shouldForceActiveBackground = active && !preserveActiveBackground;
    if (sectionColor && !shouldForceActiveBackground) return sectionColor;
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
    sectionColor,
    preserveActiveBackground = false,
    style,
    themeTone,
    themeUnderlayColor,
}: BuildMandalaCardStyleOptions): MandalaCardStyleState => {
    const shouldForceActiveBackground = active && !preserveActiveBackground;
    const backgroundColor = getContrastBackgroundColor({
        active,
        sectionColor,
        preserveActiveBackground,
        style,
    });
    const textTone = getReadableTextTone(
        backgroundColor,
        themeTone,
        themeUnderlayColor,
    );

    const cardStyle = [
        shouldForceActiveBackground
            ? 'background-color: var(--background-active-node) !important'
            : sectionColor
              ? `background-color: ${sectionColor}`
              : '',
        !shouldForceActiveBackground && textTone === 'dark'
            ? '--text-normal: #0f131a; --text-muted: #2f3a48; --text-faint: #4f5c6b'
            : '',
        !shouldForceActiveBackground && textTone === 'light'
            ? '--text-normal: #f3f6fd; --text-muted: #d0d8e6; --text-faint: #b0bbce'
            : '',
    ]
        .filter((chunk) => chunk.length > 0)
        .join('; ');

    return {
        backgroundColor,
        textTone,
        cardStyle: cardStyle.length > 0 ? cardStyle : undefined,
        shouldHideBackgroundStyle: Boolean(
            (sectionColor || shouldForceActiveBackground) &&
                style?.styleVariant === 'background-color',
        ),
    };
};
