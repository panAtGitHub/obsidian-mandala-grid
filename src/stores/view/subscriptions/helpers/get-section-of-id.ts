import { Sections } from 'src/mandala-document/state/document-state-type';
import invariant from 'tiny-invariant';

export const getSectionOfId = (sections: Sections, nodeId: string) => {
    const section = sections.id_section[nodeId];
    invariant(section);
    return section;
};
