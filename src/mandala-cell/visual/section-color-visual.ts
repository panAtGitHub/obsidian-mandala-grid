import {
    getReadableTextTone,
    type TextTone,
    type ThemeTone,
} from 'src/mandala-display/contrast/readable-text-tone';
import {
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
}: {
    section: string;
    colorContext: CellSectionColorContext | null;
    indicatorVariant: CellSectionIndicatorVariant;
    pinned: boolean;
    themeTone: ThemeTone;
    themeUnderlayColor?: string;
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
