import {
    getReadableTextTone,
    type TextTone,
    type ThemeTone,
} from 'src/view/helpers/mandala/contrast-text-tone';

export type SectionIndicatorVariant = 'plain' | 'section-capsule';

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
    const showBackground = interactiveMeta && Boolean(sectionColor);

    return {
        showBackground,
        showPin: interactiveMeta && pinned,
        textTone: showBackground
            ? getReadableTextTone(sectionColor, themeTone, themeUnderlayColor)
            : null,
    };
};
