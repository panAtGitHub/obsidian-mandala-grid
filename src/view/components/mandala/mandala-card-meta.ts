import {
    getReadableTextTone,
    type TextTone,
    type ThemeTone,
} from 'src/view/helpers/mandala/contrast-text-tone';

export type SectionIndicatorVariant = 'plain' | 'section-capsule';

type BuildMandalaCardMetaStateOptions = {
    variant: SectionIndicatorVariant;
    sectionColor: string | null;
    themeTone: ThemeTone;
    themeUnderlayColor?: string;
};

type MandalaCardMetaState = {
    showCapsule: boolean;
    textTone: TextTone | null;
};

export const buildMandalaCardMetaState = ({
    variant,
    sectionColor,
    themeTone,
    themeUnderlayColor,
}: BuildMandalaCardMetaStateOptions): MandalaCardMetaState => {
    const showCapsule = variant === 'section-capsule' && Boolean(sectionColor);

    return {
        showCapsule,
        textTone: showCapsule
            ? getReadableTextTone(sectionColor, themeTone, themeUnderlayColor)
            : null,
    };
};
