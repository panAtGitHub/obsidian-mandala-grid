import type { ThemeTone } from 'src/mandala-display/contrast/readable-text-tone';
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
}) =>
    resolveSectionSurfaceVisual({
        section,
        colorContext: {
            // Sidebar color assignments remain visible in every grid background mode.
            backgroundMode: 'custom',
            sectionColorsBySection,
            sectionColorOpacity: colorIndicatorOpacity,
        },
        themeTone,
        themeUnderlayColor,
        backgroundCssProperty: '--pinned-item-bg',
    }).style ?? undefined;
