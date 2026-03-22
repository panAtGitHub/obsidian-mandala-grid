import {
    getReadableTextTone,
    type TextTone,
    type ThemeTone,
} from 'src/helpers/views/mandala/contrast-text-tone';
import type { CellSectionIndicatorVariant } from 'src/mandala-cell/model/card-types';

export type SectionIndicatorVariant = CellSectionIndicatorVariant;

type BuildMandalaCardMetaStateOptions = {
    variant: SectionIndicatorVariant;
    sectionColor: string | null;
    pinned: boolean;
    themeTone: ThemeTone;
    themeUnderlayColor?: string;
};

type MandalaCardMetaState = {
    showBackground: boolean;
    showPin: boolean;
    showColorDot: boolean;
    textTone: TextTone | null;
};

export const buildMandalaCardMetaState = ({
    variant,
    sectionColor,
    pinned,
    themeTone,
    themeUnderlayColor,
}: BuildMandalaCardMetaStateOptions): MandalaCardMetaState => {
    const interactiveMeta = variant === 'section-capsule';
    const plainWithPin = variant === 'plain-with-pin';
    const showBackground = interactiveMeta && Boolean(sectionColor);

    return {
        showBackground,
        showPin: (interactiveMeta || plainWithPin) && pinned,
        showColorDot: plainWithPin && Boolean(sectionColor),
        textTone: showBackground
            ? getReadableTextTone(sectionColor, themeTone, themeUnderlayColor)
            : null,
    };
};
