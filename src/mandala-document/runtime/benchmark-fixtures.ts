export type SyntheticFixtureOptions = {
    rootCount: number;
    childRootCount?: number;
    childrenPerRoot?: number;
    contentSize?: number;
};

const createContent = (sectionId: string, contentSize: number) => {
    const prefix = `Section ${sectionId}\nTask ${sectionId}\n`;
    if (prefix.length >= contentSize) return prefix.slice(0, contentSize);
    return prefix + '.'.repeat(contentSize - prefix.length);
};

export const createSyntheticMandalaSource = ({
    rootCount,
    childRootCount = 0,
    childrenPerRoot = 0,
    contentSize = 24,
}: SyntheticFixtureOptions) => {
    const sections: string[] = [];
    for (let root = 1; root <= rootCount; root += 1) {
        const rootId = String(root);
        sections.push(
            `<!--section: ${rootId}-->\n${createContent(rootId, contentSize)}`,
        );
        if (root > childRootCount) continue;
        for (let slot = 1; slot <= childrenPerRoot; slot += 1) {
            const sectionId = `${rootId}.${slot}`;
            sections.push(
                `<!--section: ${sectionId}-->\n${createContent(sectionId, contentSize)}`,
            );
        }
    }
    return sections.join('\n');
};

export const SYNTHETIC_FIXTURES = {
    small: () =>
        createSyntheticMandalaSource({
            rootCount: 10,
            childRootCount: 1,
            childrenPerRoot: 8,
        }),
    medium: () =>
        createSyntheticMandalaSource({
            rootCount: 500,
        }),
    dayPlanShape: () =>
        createSyntheticMandalaSource({
            rootCount: 365,
            childRootCount: 235,
            childrenPerRoot: 8,
            contentSize: 60,
        }),
    halfMegabyte: () =>
        createSyntheticMandalaSource({
            rootCount: 500,
            childRootCount: 125,
            childrenPerRoot: 8,
            contentSize: 440,
        }),
    oneMegabyte: () =>
        createSyntheticMandalaSource({
            rootCount: 1000,
            childRootCount: 125,
            childrenPerRoot: 8,
            contentSize: 700,
        }),
    fiveThousandSections: () =>
        createSyntheticMandalaSource({
            rootCount: 5000,
            contentSize: 80,
        }),
};
