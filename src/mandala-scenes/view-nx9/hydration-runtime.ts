import { collectNx9HydratableNodeIds, type Nx9PageFrameRowViewModel } from 'src/mandala-scenes/view-nx9/assemble-cell-view-model';

type PerfLogger = (
    eventName: string,
    payload: Record<string, unknown>,
) => void;

type FrameScheduler = (callback: () => void) => void;

type HydrationChangeHandler = () => void;

type Nx9PageHydrationState = {
    marker: string;
    nodeIds: string[];
    hydratedNodeIds: Set<string>;
    hot: boolean;
};

export type Nx9HydrationSnapshot = {
    hydratedNodeIdsByPage: Map<number, Set<string>>;
    hotPages: Set<number>;
};

const buildHydrationMarker = ({
    revision,
    page,
    rowCount,
    nodeIds,
}: {
    revision: number;
    page: number;
    rowCount: number;
    nodeIds: string[];
}) => [revision, page, rowCount, nodeIds.join('|')].join('|');

export const resolveNx9FutureScale = (rowCount: number) =>
    rowCount <= 5 ? 1 : Math.max(0.58, Math.min(1, 5 / rowCount));

export const createNx9HydrationRuntime = ({
    recordPerfEvent,
    scheduleFrame = (callback) => requestAnimationFrame(() => callback()),
    onHydrationChange,
}: {
    recordPerfEvent?: PerfLogger;
    scheduleFrame?: FrameScheduler;
    onHydrationChange?: HydrationChangeHandler;
} = {}) => {
    let hydrationStates = new Map<number, Nx9PageHydrationState>();
    let pendingPages: number[] = [];
    let scheduledPage: number | null = null;
    let hydrationRequestId = 0;

    const enqueuePendingPages = (pages: number[]) => {
        const nextQueue: number[] = [];
        for (const page of pages) {
            if (page === scheduledPage || nextQueue.includes(page)) continue;
            nextQueue.push(page);
        }
        for (const page of pendingPages) {
            if (page === scheduledPage || nextQueue.includes(page)) continue;
            nextQueue.push(page);
        }
        pendingPages = nextQueue;
    };

    const scheduleNextPendingPage = () => {
        if (scheduledPage !== null) return;
        const nextPage = pendingPages.shift();
        if (nextPage === undefined) return;
        const state = hydrationStates.get(nextPage);
        if (!state || state.hot || state.nodeIds.length === 0) {
            scheduleNextPendingPage();
            return;
        }

        scheduledPage = nextPage;
        const requestId = ++hydrationRequestId;
        const startedAt = performance.now();
        const expectedMarker = state.marker;

        scheduleFrame(() => {
            scheduleFrame(() => {
                const latest = hydrationStates.get(nextPage);
                scheduledPage = null;
                if (
                    requestId !== hydrationRequestId ||
                    !latest ||
                    latest.marker !== expectedMarker ||
                    latest.hot
                ) {
                    scheduleNextPendingPage();
                    return;
                }

                latest.hydratedNodeIds = new Set(latest.nodeIds);
                latest.hot = true;
                recordPerfEvent?.('trace.nx9.hydrate-page', {
                    total_ms: Number(
                        (performance.now() - startedAt).toFixed(2),
                    ),
                    page: nextPage,
                    node_count: latest.nodeIds.length,
                });
                onHydrationChange?.();
                scheduleNextPendingPage();
            });
        });
    };

    const sync = ({
        revision,
        currentPage,
        rowCount,
        hotPages,
        pageFramesByPage,
    }: {
        revision: number;
        currentPage: number;
        rowCount: number;
        hotPages: number[];
        pageFramesByPage: Map<number, Nx9PageFrameRowViewModel[]>;
    }): Nx9HydrationSnapshot => {
        const nextHotPages = new Set(hotPages);

        for (const page of Array.from(hydrationStates.keys())) {
            if (nextHotPages.has(page)) continue;
            hydrationStates.delete(page);
        }

        const priorityPages = [
            currentPage,
            ...hotPages.filter((page) => page !== currentPage),
        ];
        const pagesNeedingHydration: number[] = [];

        for (const page of priorityPages) {
            const pageFrame = pageFramesByPage.get(page);
            if (!pageFrame) continue;
            const nodeIds = collectNx9HydratableNodeIds(pageFrame);
            const marker = buildHydrationMarker({
                revision,
                page,
                rowCount,
                nodeIds,
            });
            const previous = hydrationStates.get(page);
            if (previous?.marker === marker) {
                if (!previous.hot && previous.nodeIds.length > 0) {
                    pagesNeedingHydration.push(page);
                }
                continue;
            }
            const hot = nodeIds.length === 0;
            hydrationStates.set(page, {
                marker,
                nodeIds,
                hydratedNodeIds: hot ? new Set(nodeIds) : new Set(),
                hot,
            });
            if (!hot) {
                pagesNeedingHydration.push(page);
            }
        }

        enqueuePendingPages(pagesNeedingHydration);
        scheduleNextPendingPage();

        return {
            hydratedNodeIdsByPage: new Map(
                Array.from(hydrationStates.entries()).map(([page, state]) => [
                    page,
                    state.hydratedNodeIds,
                ]),
            ),
            hotPages: new Set(
                Array.from(hydrationStates.entries())
                    .filter(([, state]) => state.hot)
                    .map(([page]) => page),
            ),
        };
    };

    const dispose = () => {
        hydrationRequestId += 1;
        pendingPages = [];
        hydrationStates = new Map();
        scheduledPage = null;
    };

    return {
        sync,
        dispose,
    };
};
