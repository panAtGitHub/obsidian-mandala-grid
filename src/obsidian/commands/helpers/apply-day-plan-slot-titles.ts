import {
    ensureSectionChildren,
    getSectionContent,
    replaceSectionContent,
} from 'src/mandala-display/logic/day-plan-sections';
import { upsertSlotHeading } from 'src/mandala-display/logic/day-plan';

export const applyDayPlanSlotTitles = (
    body: string,
    coreSections: string[],
    slots: string[],
) => {
    let nextBody = body;
    const uniqueCoreSections = Array.from(
        new Set(coreSections.filter((section) => section.trim().length > 0)),
    );

    for (const coreSection of uniqueCoreSections) {
        nextBody = ensureSectionChildren(nextBody, coreSection, 8);
        for (let i = 0; i < 8; i += 1) {
            const title = slots[i] ?? '';
            if (title.trim().length === 0) continue;
            const section = `${coreSection}.${i + 1}`;
            const currentContent = getSectionContent(nextBody, section) ?? '';
            nextBody = replaceSectionContent(
                nextBody,
                section,
                upsertSlotHeading(currentContent, title),
            );
        }
    }

    return nextBody;
};
