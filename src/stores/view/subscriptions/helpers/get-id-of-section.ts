import { Sections } from 'src/mandala-document/state/document-state-type';
import invariant from 'tiny-invariant';

export const getIdOfSection = (sections: Sections, section: string) => {
    const id = sections.section_id[section];
    invariant(id);
    return id;
};
