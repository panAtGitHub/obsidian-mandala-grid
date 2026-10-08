import {
    getReadableTextTone,
    resolveOpaqueFillColor,
    type TextTone,
    type ThemeTone,
} from 'src/mandala-display/contrast/readable-text-tone';
import {
    applyOpacityToHex,
    resolveSectionAccentColor,
} from 'src/mandala-display/palette/section-colors';
import { resolveSectionColorPolicy } from 'src/mandala-display/policies/section-color-policy';
import type {
    CellSectionIndicatorVariant,
    CellSectionMetaVariant,
} from 'src/mandala-cell/model/card-types';
import {
    resolveSectionSurfaceBackgroundColor,
    type SectionSurfaceColorContext,
} from 'src/mandala-display/contrast/section-surface-visual';

export type CellSectionColorContext = SectionSurfaceColorContext;

export type CellSectionColorVisual = {
    backgroundColor: string | null;
    metaVariant: CellSectionMetaVariant;
    metaAccentColor: string | null;
    metaBackgroundColor: string | null;
    metaTextTone: TextTone | null;
    showPin: boolean;
};

export const resolveCellSectionColorVisual = ({
    section,
    colorContext,
    indicatorVariant,
    pinned,
    themeTone,
    themeUnderlayColor,
    colorIndicatorOpacity = 100,
    colorIndicatorUnderlayColor,
}: {
    section: string;
    colorContext: CellSectionColorContext | null;
    indicatorVariant: CellSectionIndicatorVariant;
    pinned: boolean;
    themeTone: ThemeTone;
    themeUnderlayColor?: string;
    colorIndicatorOpacity?: number;
    colorIndicatorUnderlayColor?: string;
}): CellSectionColorVisual => {
    const backgroundColor = resolveSectionSurfaceBackgroundColor({
        section,
        colorContext,
    });
    const accentColor = colorContext
        ? resolveSectionAccentColor({
              section,
              sectionColorsBySection: colorContext.sectionColorsBySection,
          })
        : null;
    const indicatorColor = accentColor
        ? resolveOpaqueFillColor(
              applyOpacityToHex(accentColor, colorIndicatorOpacity / 100),
              themeTone,
              colorIndicatorUnderlayColor ?? themeUnderlayColor,
          )
        : null;
    const policy = resolveSectionColorPolicy({
        indicatorVariant,
        hasBackgroundColor:
            colorContext?.backgroundMode === 'custom' &&
            Boolean(backgroundColor),
        hasAccentColor: Boolean(accentColor),
        pinned,
    });
    const metaBackgroundColor =
        policy.metaColorSource === 'surface'
            ? backgroundColor
            : policy.metaColorSource === 'accent'
              ? indicatorColor
              : null;

    return {
        backgroundColor,
        metaVariant: policy.metaMode,
        metaAccentColor: indicatorColor,
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
