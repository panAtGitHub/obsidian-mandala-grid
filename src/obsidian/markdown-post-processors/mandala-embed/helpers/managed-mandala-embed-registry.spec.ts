import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    clearManagedMandalaEmbedRegistry,
    refreshManagedMandalaEmbedControllersByTargetPaths,
    registerManagedMandalaEmbedController,
    unregisterManagedMandalaEmbedController,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/managed-mandala-embed-registry';

const createController = () => ({
    isConnected: vi.fn(() => true),
    refreshManagedModel: vi.fn(() => Promise.resolve(undefined)),
});

afterEach(() => {
    clearManagedMandalaEmbedRegistry();
});

describe('managedMandalaEmbedRegistry', () => {
    it('refreshes only controllers registered for the changed target paths', async () => {
        const a = createController();
        const b = createController();

        registerManagedMandalaEmbedController(a, 'target-a.md');
        registerManagedMandalaEmbedController(b, 'target-b.md');

        await refreshManagedMandalaEmbedControllersByTargetPaths([
            'target-a.md',
        ]);

        expect(a.refreshManagedModel).toHaveBeenCalledTimes(1);
        expect(b.refreshManagedModel).not.toHaveBeenCalled();
    });

    it('unregisters disconnected controllers during refresh', async () => {
        const controller = createController();
        controller.isConnected.mockReturnValue(false);

        registerManagedMandalaEmbedController(controller, 'target-a.md');
        await refreshManagedMandalaEmbedControllersByTargetPaths([
            'target-a.md',
        ]);

        expect(controller.refreshManagedModel).not.toHaveBeenCalled();
    });

    it('removes controllers when explicitly unregistered', async () => {
        const controller = createController();

        registerManagedMandalaEmbedController(controller, 'target-a.md');
        unregisterManagedMandalaEmbedController(controller);
        await refreshManagedMandalaEmbedControllersByTargetPaths([
            'target-a.md',
        ]);

        expect(controller.refreshManagedModel).not.toHaveBeenCalled();
    });
});
