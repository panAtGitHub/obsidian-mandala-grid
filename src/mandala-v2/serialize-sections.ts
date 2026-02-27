import {
    MandalaSectionId,
    MANDALA_SECTION_ID_RE,
} from 'src/mandala-v2/types';
import {
    MandalaGridDocument,
    Sections,
} from 'src/stores/document/document-state-type';

const parseSectionParts = (sectionId: string) => sectionId.split('.').map(Number);

export const compareSectionIds = (a: string, b: string) => {
    const aParts = parseSectionParts(a);
    const bParts = parseSectionParts(b);
    const max = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < max; i += 1) {
        const av = aParts[i];
        const bv = bParts[i];
        if (av === undefined) return -1;
        if (bv === undefined) return 1;
        if (av !== bv) return av - bv;
    }
    return 0;
};

const normalizeSectionContent = (value: string) => value.trim();

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
