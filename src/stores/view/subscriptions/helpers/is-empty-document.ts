import { Content } from 'src/mandala-document/state/document-state-type';

export const isEmptyDocument = (content: Content) => {
    const values = Object.values(content);
    return values.length === 1 && values[0].content === '';
};
