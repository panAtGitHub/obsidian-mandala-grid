import {
    getReadableTextTone,
    type TextTone,
    type ThemeTone,
} from 'src/view/helpers/mandala/contrast-text-tone';

export type SectionIndicatorVariant =
    | 'plain'
    | 'section-capsule'
    | 'table-lite';

type BuildMandalaCardMetaStateOptions = {
    variant: SectionIndicatorVariant;
    sectionColor: string | null;
    pinned: boolean;
    active: boolean;
    themeTone: ThemeTone;
    themeUnderlayColor?: string;
};

export type MandalaCardMetaBackgroundStyle = 'none' | 'section' | 'neutral';

type MandalaCardMetaState = {
    showBackground: boolean;
    showPin: boolean;
    tone: TextTone | null;
    backgroundStyle: MandalaCardMetaBackgroundStyle;
};

export const buildMandalaCardMetaState = ({
    variant,
    sectionColor,
    pinned,
    active,
    themeTone,
    themeUnderlayColor,
}: BuildMandalaCardMetaStateOptions): MandalaCardMetaState => {
    if (variant === 'section-capsule') {
        const showBackground = Boolean(sectionColor);
        return {
            showBackground,
            showPin: pinned,
            tone: showBackground
                ? getReadableTextTone(
                      sectionColor,
                      themeTone,
                      themeUnderlayColor,
                  )
                : null,
            backgroundStyle: showBackground ? 'section' : 'none',
        };
    }

    if (variant === 'table-lite') {
        return {
            showBackground: active,
            showPin: pinned,
            tone: null,
            backgroundStyle: active ? 'neutral' : 'none',
        };
    }

    return {
        showBackground: false,
        showPin: false,
        tone: null,
        backgroundStyle: 'none',
    };
};
