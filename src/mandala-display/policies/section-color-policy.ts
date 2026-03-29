export type SectionColorIndicatorVariant =
    | 'plain'
    | 'plain-with-pin'
    | 'section-capsule';

export type SectionColorMetaMode = 'plain' | 'capsule' | 'background';
export type SectionColorMetaSource = 'none' | 'accent' | 'surface';

export type ResolvedSectionColorPolicy = {
    metaMode: SectionColorMetaMode;
    metaColorSource: SectionColorMetaSource;
    showPin: boolean;
};

export const resolveSectionColorPolicy = ({
    indicatorVariant,
    hasBackgroundColor,
    pinned,
}: {
    indicatorVariant: SectionColorIndicatorVariant;
    hasBackgroundColor: boolean;
    pinned: boolean;
}): ResolvedSectionColorPolicy => {
    if (indicatorVariant === 'section-capsule') {
        return hasBackgroundColor
            ? {
                  metaMode: 'background',
                  metaColorSource: 'surface',
                  showPin: pinned,
              }
            : {
                  metaMode: 'plain',
                  metaColorSource: 'none',
                  showPin: pinned,
              };
    }

    if (indicatorVariant === 'plain-with-pin') {
        return hasBackgroundColor
            ? {
                  metaMode: 'capsule',
                  metaColorSource: 'accent',
                  showPin: pinned,
              }
            : {
                  metaMode: 'plain',
                  metaColorSource: 'none',
                  showPin: pinned,
              };
    }

    return {
        metaMode: 'plain',
        metaColorSource: 'none',
        showPin: false,
    };
};
