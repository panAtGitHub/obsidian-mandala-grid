import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    clearLivePreviewMandalaWidgetRegistry,
    refreshLivePreviewMandalaWidgetsByTargetPaths,
    registerLivePreviewMandalaWidget,
    unregisterLivePreviewMandalaWidget,
    type LivePreviewMandalaWidgetController,
} from 'src/obsidian/editor-extensions/mandala-source-embed/helpers/live-preview-mandala-widget-registry';

const createWidget = (
    connected = true,
): LivePreviewMandalaWidgetController & {
    refreshManaged: ReturnType<typeof vi.fn>;
} => ({
    isConnected: () => connected,
    refreshManaged: vi.fn(() => Promise.resolve(undefined)),
});

afterEach(() => {
    clearLivePreviewMandalaWidgetRegistry();
});

describe('livePreviewMandalaWidgetRegistry', () => {
    it('refreshes all connected widgets for matching targets', async () => {
        const first = createWidget();
        const second = createWidget();
        const other = createWidget();

        registerLivePreviewMandalaWidget(first, 'target-a.md');
        registerLivePreviewMandalaWidget(second, 'target-a.md');
        registerLivePreviewMandalaWidget(other, 'target-b.md');

        await refreshLivePreviewMandalaWidgetsByTargetPaths(['target-a.md']);

        expect(first.refreshManaged).toHaveBeenCalledTimes(1);
        expect(second.refreshManaged).toHaveBeenCalledTimes(1);
        expect(other.refreshManaged).not.toHaveBeenCalled();
    });

    it('unregisters widgets when asked explicitly', async () => {
        const widget = createWidget();
        registerLivePreviewMandalaWidget(widget, 'target-a.md');
        unregisterLivePreviewMandalaWidget(widget);

        await refreshLivePreviewMandalaWidgetsByTargetPaths(['target-a.md']);

        expect(widget.refreshManaged).not.toHaveBeenCalled();
    });

    it('skips disconnected widgets and cleans them up lazily', async () => {
        const disconnected = createWidget(false);

        registerLivePreviewMandalaWidget(disconnected, 'target-a.md');
        await refreshLivePreviewMandalaWidgetsByTargetPaths(['target-a.md']);
        await refreshLivePreviewMandalaWidgetsByTargetPaths(['target-a.md']);

        expect(disconnected.refreshManaged).not.toHaveBeenCalled();
    });
});
