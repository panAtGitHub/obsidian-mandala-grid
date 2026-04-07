import type { SectionRangeLimit } from 'src/mandala-settings/state/settings-type';
import {
    canUseThreeByThreeThemeAsCenterForMaxDepth,
    resolveNearestThreeByThreeCenterThemeForMaxDepth,
    resolveThreeByThreeMaxDepthValue,
} from 'src/mandala-scenes/view-3x3/subgrid-depth';

const isExistingSection = (
    existingSections: Set<string>,
    section: string | null,
) => {
    if (!section) return false;
    if (section === '1') return true;
    if (existingSections.size === 0) return true;
    return existingSections.has(section);
};

export const deriveSubgridThemeFromSection = (section: string | null) => {
    if (!section) return '1';
    const lastDot = section.lastIndexOf('.');
    if (lastDot === -1) return section;
    return section.slice(0, lastDot);
};

export const resolveRestoredSubgridTheme = ({
    existingSections,
    persistedSubgridTheme,
    lastActiveSection,
    subgridMaxDepth,
}: {
    existingSections: Set<string>;
    persistedSubgridTheme: string | null;
    lastActiveSection: string | null;
    subgridMaxDepth: SectionRangeLimit;
}) => {
    const maxDepth = resolveThreeByThreeMaxDepthValue(subgridMaxDepth);

    if (isExistingSection(existingSections, persistedSubgridTheme)) {
        if (
            canUseThreeByThreeThemeAsCenterForMaxDepth(
                persistedSubgridTheme ?? '1',
                maxDepth,
            )
        ) {
            return persistedSubgridTheme ?? '1';
        }
        return '1';
    }

    const derivedTheme = resolveNearestThreeByThreeCenterThemeForMaxDepth(
        lastActiveSection,
        maxDepth,
    );
    if (isExistingSection(existingSections, derivedTheme)) {
        return derivedTheme;
    }

    return '1';
};
