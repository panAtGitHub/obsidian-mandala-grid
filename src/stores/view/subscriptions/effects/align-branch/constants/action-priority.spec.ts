import { describe, expect, it } from 'vitest';
import { actionPriority } from 'src/stores/view/subscriptions/effects/align-branch/constants/action-priority';

describe('actionPriority', () => {
    it('allows mandala swap to pass through the align pipeline safely', () => {
        expect(actionPriority.get('document/mandala/swap')).toBeTypeOf('number');
    });

    it('keeps batched content updates alignable', () => {
        expect(
            actionPriority.get('document/update-multiple-node-content'),
        ).toBeTypeOf('number');
    });
});
