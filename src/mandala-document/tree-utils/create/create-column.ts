import { Column } from 'src/mandala-document/state/document-state-type';
import { id } from 'src/shared/helpers/id';

export const createColumn = (): Column => ({
    id: id.column(),
    groups: [],
});
