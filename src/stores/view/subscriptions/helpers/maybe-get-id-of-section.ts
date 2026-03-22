import { Sections } from 'src/mandala-document/state/document-state-type';

export const maybeGetIdOfSection = (sections: Sections, section: string) => {
    return sections.section_id[section] || null;
};
