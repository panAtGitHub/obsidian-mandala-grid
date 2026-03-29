import {
    getReadableTextTone,
    type TextTone,
    type ThemeTone,
} from 'src/mandala-display/contrast/readable-text-tone';
import {
    resolveGrayBlockSurfaceColor,
    resolveSectionSurfaceColor,
    type SectionColorContext,
} from 'src/mandala-display/palette/section-colors';

export type SectionSurfaceColorContext = SectionColorContext & {
    showGrayBlockBackground?: boolean;
};

export type SectionSurfaceVisual = {
    backgroundColor: string | null;
    textTone: TextTone | null;
    style: string | null;
};

const DARK_TEXT_TOKENS =
    '--text-normal: #0f131a; --text-muted: #2f3a48; --text-faint: #4f5c6b; --text-accent: #0f131a;';

const LIGHT_TEXT_TOKENS =
    '--text-normal: #f3f6fd; --text-muted: #d0d8e6; --text-faint: #b0bbce; --text-accent: #f3f6fd;';

export const resolveSectionSurfaceBackgroundColor = ({
    section,
    colorContext,
}: {
    section: string | null;
    colorContext: SectionSurfaceColorContext | null;
}) => {
    if (!colorContext) return null;
    const customBackground = resolveSectionSurfaceColor({
        section,
        backgroundMode: colorContext.backgroundMode,
        sectionColorsBySection: colorContext.sectionColorsBySection,
        sectionColorOpacity: colorContext.sectionColorOpacity,
    });
    if (customBackground) return customBackground;
    if (
        colorContext.showGrayBlockBackground &&
        colorContext.backgroundMode === 'gray'
    ) {
        return resolveGrayBlockSurfaceColor(colorContext.sectionColorOpacity);
    }
    return null;
};

export const resolveSectionSurfaceVisual = ({
    section,
    colorContext,
    themeTone,
    themeUnderlayColor,
    backgroundCssProperty = 'background-color',
}: {
    section: string | null;
    colorContext: SectionSurfaceColorContext | null;
    themeTone?: ThemeTone;
    themeUnderlayColor?: string;
    backgroundCssProperty?: string;
}): SectionSurfaceVisual => {
    const backgroundColor = resolveSectionSurfaceBackgroundColor({
        section,
        colorContext,
    });
    const textTone =
        backgroundColor && themeTone
            ? getReadableTextTone(backgroundColor, themeTone, themeUnderlayColor)
            : null;
    const styleParts = [];

    if (backgroundColor) {
        styleParts.push(`${backgroundCssProperty}: ${backgroundColor};`);
    }
    if (textTone === 'dark') styleParts.push(DARK_TEXT_TOKENS);
    if (textTone === 'light') styleParts.push(LIGHT_TEXT_TOKENS);

    return {
        backgroundColor,
        textTone,
        style: styleParts.length > 0 ? styleParts.join(' ') : null,
    };
};
