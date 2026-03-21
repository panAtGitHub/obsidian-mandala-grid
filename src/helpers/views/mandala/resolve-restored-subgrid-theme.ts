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
}: {
    existingSections: Set<string>;
    persistedSubgridTheme: string | null;
    lastActiveSection: string | null;
}) => {
    if (isExistingSection(existingSections, persistedSubgridTheme)) {
        return persistedSubgridTheme ?? '1';
    }

    const derivedTheme = deriveSubgridThemeFromSection(lastActiveSection);
    if (isExistingSection(existingSections, derivedTheme)) {
        return derivedTheme;
    }

    return '1';
};
