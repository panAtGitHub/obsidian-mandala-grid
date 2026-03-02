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
};

type MandalaCardStyleState = {
    backgroundColor: string | null;
    textTone: TextTone | null;
    cardStyle: string | undefined;
    shouldHideBackgroundStyle: boolean;
};

const getBackgroundColor = ({
    sectionColor,
    style,
}: Pick<
    BuildMandalaCardStyleOptions,
    'sectionColor' | 'style'
>): string | null => {
    if (sectionColor) return sectionColor;
    if (style?.styleVariant === 'background-color') return style.color;
    return null;
};

export const buildMandalaCardStyle = ({
    active: _active,
    sectionColor,
    style,
    themeTone,
    themeUnderlayColor,
}: BuildMandalaCardStyleOptions): MandalaCardStyleState => {
    const backgroundColor = getBackgroundColor({ sectionColor, style });
    const textTone = getReadableTextTone(
        backgroundColor,
        themeTone,
        themeUnderlayColor,
    );

    const cardStyle = [
        backgroundColor ? `background-color: ${backgroundColor}` : '',
        textTone === 'dark'
            ? '--text-normal: #0f131a; --text-muted: #2f3a48; --text-faint: #4f5c6b'
            : '',
        textTone === 'light'
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
            backgroundColor && style?.styleVariant === 'background-color',
        ),
    };
};
