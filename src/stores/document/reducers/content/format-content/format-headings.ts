import { Content, Sections } from 'src/stores/document/document-state-type';
import { formatHeadings as _formatHeaders } from 'src/stores/document/reducers/content/format-content/helpers/format-headings';

export type FormatHeadingsAction = {
    type: 'document/format-headings';
};
export const formatHeadings = (content: Content, sections: Sections) => {
    _formatHeaders(content, sections.id_section);
};
