export type RefreshableMandalaEmbedController = {
    isConnected(): boolean;
    refreshManagedModel(): Promise<void>;
};

const targetPathByController = new WeakMap<
    RefreshableMandalaEmbedController,
    string
>();
const controllersByTargetPath = new Map<
    string,
    Set<RefreshableMandalaEmbedController>
>();

export const registerManagedMandalaEmbedController = (
    controller: RefreshableMandalaEmbedController,
    targetPath: string,
) => {
    const previousTargetPath = targetPathByController.get(controller);
    if (previousTargetPath === targetPath) return;

    unregisterManagedMandalaEmbedController(controller);
    targetPathByController.set(controller, targetPath);

    const controllers = controllersByTargetPath.get(targetPath) ?? new Set();
    controllers.add(controller);
    controllersByTargetPath.set(targetPath, controllers);
};

export const unregisterManagedMandalaEmbedController = (
    controller: RefreshableMandalaEmbedController,
) => {
    const previousTargetPath = targetPathByController.get(controller);
    if (!previousTargetPath) return;

    targetPathByController.delete(controller);
    const controllers = controllersByTargetPath.get(previousTargetPath);
    if (!controllers) return;

    controllers.delete(controller);
    if (controllers.size === 0) {
        controllersByTargetPath.delete(previousTargetPath);
    }
};

export const refreshManagedMandalaEmbedControllersByTargetPaths = async (
    targetPaths: Iterable<string>,
) => {
    const tasks: Promise<void>[] = [];

    for (const targetPath of targetPaths) {
        const controllers = controllersByTargetPath.get(targetPath);
        if (!controllers) continue;

        for (const controller of Array.from(controllers)) {
            if (!controller.isConnected()) {
                unregisterManagedMandalaEmbedController(controller);
                continue;
            }

            tasks.push(controller.refreshManagedModel());
        }
    }

    await Promise.allSettled(tasks);
};

export const clearManagedMandalaEmbedRegistry = () => {
    controllersByTargetPath.clear();
};
