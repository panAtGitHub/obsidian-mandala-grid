import type { MandalaView } from 'src/view/view';
import { resolveDraftExit } from 'src/view/edit-session/resolve-draft-exit';

export const cancelChanges = (view: MandalaView) => {
    void resolveDraftExit(view);
};
