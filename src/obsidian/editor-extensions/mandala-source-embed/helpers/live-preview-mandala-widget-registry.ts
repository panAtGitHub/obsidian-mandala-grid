export type LivePreviewMandalaWidgetController = {
    isConnected(): boolean;
    refreshManaged(): Promise<void>;
};

const targetPathByWidget = new WeakMap<LivePreviewMandalaWidgetController, string>();
const widgetsByTargetPath = new Map<
    string,
    Set<LivePreviewMandalaWidgetController>
>();

export const registerLivePreviewMandalaWidget = (
    widget: LivePreviewMandalaWidgetController,
    targetPath: string,
) => {
    const previousTargetPath = targetPathByWidget.get(widget);
    if (previousTargetPath === targetPath) return;

    unregisterLivePreviewMandalaWidget(widget);
    targetPathByWidget.set(widget, targetPath);

    const widgets = widgetsByTargetPath.get(targetPath) ?? new Set();
    widgets.add(widget);
    widgetsByTargetPath.set(targetPath, widgets);
};

export const unregisterLivePreviewMandalaWidget = (
    widget: LivePreviewMandalaWidgetController,
) => {
    const previousTargetPath = targetPathByWidget.get(widget);
    if (!previousTargetPath) return;

    targetPathByWidget.delete(widget);
    const widgets = widgetsByTargetPath.get(previousTargetPath);
    if (!widgets) return;

    widgets.delete(widget);
    if (widgets.size === 0) {
        widgetsByTargetPath.delete(previousTargetPath);
    }
};

export const refreshLivePreviewMandalaWidgetsByTargetPaths = async (
    targetPaths: Iterable<string>,
) => {
    const tasks: Promise<void>[] = [];

    for (const targetPath of targetPaths) {
        const widgets = widgetsByTargetPath.get(targetPath);
        if (!widgets) continue;

        for (const widget of Array.from(widgets)) {
            if (!widget.isConnected()) {
                unregisterLivePreviewMandalaWidget(widget);
                continue;
            }

            tasks.push(widget.refreshManaged());
        }
    }

    await Promise.allSettled(tasks);
};

export const clearLivePreviewMandalaWidgetRegistry = () => {
    widgetsByTargetPath.clear();
};
