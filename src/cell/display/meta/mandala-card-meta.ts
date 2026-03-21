import {
    getReadableTextTone,
    type TextTone,
    type ThemeTone,
} from 'src/view/helpers/mandala/contrast-text-tone';
import type { CellSectionIndicatorVariant } from 'src/cell/model/card-types';

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
        textTone: showBackground
            ? getReadableTextTone(sectionColor, themeTone, themeUnderlayColor)
            : null,
    };
};
