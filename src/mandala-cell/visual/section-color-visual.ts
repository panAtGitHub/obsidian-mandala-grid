import {
    getReadableTextTone,
    type TextTone,
    type ThemeTone,
} from 'src/mandala-display/contrast/readable-text-tone';
import {
    resolveGrayBlockSurfaceColor,
    resolveSectionAccentColor,
    resolveSectionSurfaceColor,
    type SectionColorContext,
} from 'src/mandala-display/palette/section-colors';
import { resolveSectionColorPolicy } from 'src/mandala-display/policies/section-color-policy';
import type {
    CellSectionIndicatorVariant,
    CellSectionMetaVariant,
} from 'src/mandala-cell/model/card-types';

export type CellSectionColorContext = SectionColorContext & {
    showGrayBlockBackground?: boolean;
};

export type CellSectionColorVisual = {
    backgroundColor: string | null;
    metaVariant: CellSectionMetaVariant;
    metaAccentColor: string | null;
    metaBackgroundColor: string | null;
    metaTextTone: TextTone | null;
    showPin: boolean;
};

const resolveCellBackgroundColor = ({
    section,
    colorContext,
}: {
    section: string;
    colorContext: CellSectionColorContext | null;
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

export const resolveCellSectionColorVisual = ({
    section,
    colorContext,
    indicatorVariant,
    pinned,
    themeTone,
    themeUnderlayColor,
}: {
    section: string;
    colorContext: CellSectionColorContext | null;
    indicatorVariant: CellSectionIndicatorVariant;
    pinned: boolean;
    themeTone: ThemeTone;
    themeUnderlayColor?: string;
}): CellSectionColorVisual => {
    const backgroundColor = resolveCellBackgroundColor({
        section,
        colorContext,
    });
    const accentColor = colorContext
        ? resolveSectionAccentColor({
              section,
              sectionColorsBySection: colorContext.sectionColorsBySection,
          })
        : null;
    const policy = resolveSectionColorPolicy({
        indicatorVariant,
        hasBackgroundColor: Boolean(backgroundColor),
        pinned,
    });
    const metaBackgroundColor =
        policy.metaColorSource === 'surface'
            ? backgroundColor
            : policy.metaColorSource === 'accent'
              ? accentColor
              : null;

    return {
        backgroundColor,
        metaVariant: policy.metaMode,
        metaAccentColor: accentColor,
        metaBackgroundColor,
        metaTextTone: metaBackgroundColor
            ? getReadableTextTone(
                  metaBackgroundColor,
                  themeTone,
                  themeUnderlayColor,
              )
            : null,
        showPin: policy.showPin,
    };
};
