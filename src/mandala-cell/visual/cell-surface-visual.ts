import type { SimpleSummaryCellModel } from 'src/mandala-cell/model/simple-summary-cell-model';
import type { ThemeTone } from 'src/mandala-display/contrast/readable-text-tone';
import {
    resolveSectionSurfaceVisual,
    type SectionSurfaceColorContext,
} from 'src/mandala-display/contrast/section-surface-visual';

export type CellSurfaceVisualContext = SectionSurfaceColorContext;

export const resolveCellSurfaceStyle = ({
    section,
    colorContext,
}: {
    section: string | null;
    colorContext: CellSurfaceVisualContext | null;
}) =>
    resolveSectionSurfaceVisual({
        section,
        colorContext,
    }).style ?? undefined;

export const decorateSimpleSummaryCellSurface = ({
    cell,
    backgroundMode,
    sectionColors,
    sectionColorOpacity,
    themeTone,
    themeUnderlayColor,
}: {
    cell: SimpleSummaryCellModel;
    backgroundMode: string;
    sectionColors: Record<string, string>;
    sectionColorOpacity: number;
    themeTone: ThemeTone;
    themeUnderlayColor: string;
}): SimpleSummaryCellModel => {
    const surfaceVisual = resolveSectionSurfaceVisual({
        section: cell.section,
        colorContext: {
            backgroundMode,
            sectionColorsBySection: sectionColors,
            sectionColorOpacity,
            showGrayBlockBackground: cell.isGrayBlock,
        },
        themeTone,
        themeUnderlayColor,
    });

    return {
        ...cell,
        background: surfaceVisual.backgroundColor,
        textTone: surfaceVisual.textTone,
        style: surfaceVisual.style,
    };
};
