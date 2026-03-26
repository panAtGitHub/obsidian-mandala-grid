import { collectNx9HydratableNodeIds, type Nx9PageFrameRowViewModel } from 'src/mandala-scenes/view-nx9/assemble-cell-view-model';

type PerfLogger = (
    eventName: string,
    payload: Record<string, unknown>,
) => void;

type FrameScheduler = (callback: () => void) => void;

export const resolveNx9FutureScale = (rowCount: number) =>
    rowCount <= 5 ? 1 : Math.max(0.58, Math.min(1, 5 / rowCount));

export const createNx9HydrationRuntime = ({
    recordPerfEvent,
    scheduleFrame = (callback) => requestAnimationFrame(() => callback()),
}: {
    recordPerfEvent?: PerfLogger;
    scheduleFrame?: FrameScheduler;
} = {}) => {
    let hydratedNodeIds = new Set<string>();
    let hydrationMarker = '';
    let hydrationRequestId = 0;

    const schedulePageHydration = (
        marker: string,
        page: number,
        nodeIds: string[],
    ) => {
        if (nodeIds.length <= hydratedNodeIds.size) return;
        const requestId = ++hydrationRequestId;
        const startedAt = performance.now();
        scheduleFrame(() => {
            scheduleFrame(() => {
                if (
                    requestId !== hydrationRequestId ||
                    hydrationMarker !== marker
                ) {
                    return;
                }
                hydratedNodeIds = new Set(nodeIds);
                recordPerfEvent?.('trace.nx9.hydrate-page', {
                    total_ms: Number(
                        (performance.now() - startedAt).toFixed(2),
                    ),
                    page,
                    node_count: nodeIds.length,
                });
            });
        });
    };

    const sync = ({
        revision,
        currentPage,
        rowCount,
        pageFrame,
        activeNodeId,
    }: {
        revision: number;
        currentPage: number;
        rowCount: number;
        pageFrame: Nx9PageFrameRowViewModel[];
        activeNodeId: string | null;
    }) => {
        const nodeIds = collectNx9HydratableNodeIds(pageFrame);
        const pageSignature = nodeIds.join('|');
        const marker = [revision, currentPage, rowCount, pageSignature].join(
            '|',
        );

        if (hydrationMarker !== marker) {
            hydrationMarker = marker;
            const initialNodeId =
                nodeIds.find((nodeId) => nodeId === activeNodeId) ??
                nodeIds[0] ??
                null;
            hydratedNodeIds = initialNodeId
                ? new Set([initialNodeId])
                : new Set();
            schedulePageHydration(marker, currentPage, nodeIds);
            return hydratedNodeIds;
        }

        if (
            activeNodeId &&
            nodeIds.includes(activeNodeId) &&
            !hydratedNodeIds.has(activeNodeId)
        ) {
            hydratedNodeIds = new Set(hydratedNodeIds).add(activeNodeId);
        }

        return hydratedNodeIds;
    };

    const dispose = () => {
        hydrationRequestId += 1;
    };

    return {
        sync,
        dispose,
    };
};
