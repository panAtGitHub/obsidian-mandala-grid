import type { ThemeTone } from 'src/mandala-display/contrast/readable-text-tone';
import { resolveSectionSurfaceVisual } from 'src/mandala-display/contrast/section-surface-visual';

export const resolvePinnedItemColorStyle = ({
    section,
    backgroundMode,
    sectionColorsBySection,
    sectionColorOpacity,
    themeTone,
    themeUnderlayColor,
}: {
    section: string;
    backgroundMode: string;
    sectionColorsBySection: Record<string, string>;
    sectionColorOpacity: number;
    themeTone: ThemeTone;
    themeUnderlayColor: string;
}) =>
    resolveSectionSurfaceVisual({
        section,
        colorContext: {
            backgroundMode,
            sectionColorsBySection,
            sectionColorOpacity,
        },
        themeTone,
        themeUnderlayColor,
        backgroundCssProperty: '--pinned-item-bg',
    }).style ?? undefined;
