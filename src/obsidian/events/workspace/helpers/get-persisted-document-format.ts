import { MandalaView } from 'src/view/view';
import { MandalaGridDocumentFormat } from 'src/stores/settings/settings-type';

export const getPersistedDocumentFormat = (
    _view: MandalaView,
): MandalaGridDocumentFormat => 'sections';
