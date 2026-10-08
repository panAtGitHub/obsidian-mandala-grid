import {
    resolveOpaqueFillColor,
    type ThemeTone,
} from 'src/mandala-display/contrast/readable-text-tone';
import { applyOpacityToHex } from 'src/mandala-display/palette/section-colors';
import { resolveSectionSurfaceVisual } from 'src/mandala-display/contrast/section-surface-visual';

export const resolvePinnedItemColorStyle = ({
    section,
    sectionColorsBySection,
    colorIndicatorOpacity,
    themeTone,
    themeUnderlayColor,
}: {
    section: string;
    sectionColorsBySection: Record<string, string>;
    colorIndicatorOpacity: number;
    themeTone: ThemeTone;
    themeUnderlayColor: string;
}) => {
    const assignedColor = sectionColorsBySection[section];
    const color = assignedColor
        ? resolveOpaqueFillColor(
              applyOpacityToHex(assignedColor, colorIndicatorOpacity / 100),
              themeTone,
              themeUnderlayColor,
          )
        : null;
    return (
        resolveSectionSurfaceVisual({
            section,
            colorContext: {
                // Sidebar color assignments remain visible in every grid background mode.
                backgroundMode: 'custom',
                sectionColorsBySection: color ? { [section]: color } : {},
                sectionColorOpacity: 100,
            },
            themeTone,
            themeUnderlayColor,
            backgroundCssProperty: '--pinned-item-bg',
        }).style ?? undefined
    );
};
