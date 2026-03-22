import {
    MandalaSectionId,
    MANDALA_SECTION_ID_RE,
} from 'src/mandala-document/engine/types';
import {
    MandalaGridDocument,
    Sections,
} from 'src/mandala-document/state/document-state-type';
import { compareSectionIds } from 'src/mandala-document/engine/section-utils';

export { compareSectionIds } from 'src/mandala-document/engine/section-utils';

const normalizeSectionContent = (value: string) => value;

export const serializeSections = (
    sections: {
        sectionId: MandalaSectionId;
        content: string;
    }[],
) => {
    const sorted = [...sections]
        .filter((entry) => MANDALA_SECTION_ID_RE.test(entry.sectionId))
        .sort((a, b) => compareSectionIds(a.sectionId, b.sectionId));

    let text = '';
    for (let i = 0; i < sorted.length; i += 1) {
        const entry = sorted[i];
        if (i > 0) {
            text += '\n';
        }
        text += `<!--section: ${entry.sectionId}-->`;
        const content = normalizeSectionContent(entry.content);
        if (content.length > 0) {
            text += `\n${content}`;
        }
    }

    return text;
};

export const serializeSectionsFromDocument = (
    document: Pick<MandalaGridDocument, 'content'>,
    sections: Sections,
) => {
    const sectionIds = Object.keys(sections.section_id).sort(compareSectionIds);

    const items = sectionIds.map((sectionId) => {
        const nodeId = sections.section_id[sectionId];
        const content = document.content[nodeId]?.content ?? '';
        return {
            sectionId,
            content,
        };
    });

    return serializeSections(items);
};
