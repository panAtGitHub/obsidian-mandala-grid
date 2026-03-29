import type { ResolvedGridStyle } from 'src/mandala-scenes/shared/grid-style';
import type {
    SceneCardInteractionSnapshot,
    SceneDisplaySnapshot,
} from 'src/mandala-scenes/shared/scene-projection';
import type { WeekPlanContext } from 'src/mandala-display/logic/week-plan-context';
import {
    buildNx9WeekCellDescriptors,
    buildNx9WeekCellsFromDescriptors,
    type Nx9WeekCellDescriptorList,
    type Nx9WeekCellViewModel,
} from 'src/mandala-scenes/view-nx9-week-7x9/assemble-cell-view-model';
import {
    createBoundedCache,
    createObjectIdentityKeyResolver,
} from 'src/shared/helpers/bounded-cache';

type WeekActiveCell = { row: number; col: number; page?: number } | null;

type Nx9WeekInteractionSnapshot = {
    activeNodeId: string | null;
    activeCellKey: string | null;
    editingNodeId: string | null;
    editingInSidebar: boolean;
    selectedStamp: string;
    pinnedStamp: string;
    showDetailSidebar: boolean;
};

type WeekStaticCacheEntry = {
    key: string;
    descriptors: Nx9WeekCellDescriptorList;
    indexByCellKey: Map<string, number>;
    indexByNodeId: Map<string, number[]>;
};

type WeekRuntimeCacheEntry = {
    key: string;
    interaction: Nx9WeekInteractionSnapshot;
    value: Nx9WeekCellViewModel[];
};

const normalizeActiveCellKey = (activeCell: WeekActiveCell) =>
    activeCell && (activeCell.page ?? 0) === 0
        ? `${activeCell.row}:${activeCell.col}`
        : null;

const buildInteractionSnapshot = ({
    interactionSnapshot,
    activeCell,
}: {
    interactionSnapshot: SceneCardInteractionSnapshot;
    activeCell: WeekActiveCell;
}): Nx9WeekInteractionSnapshot => ({
    activeNodeId: interactionSnapshot.activeNodeId,
    activeCellKey: normalizeActiveCellKey(activeCell),
    editingNodeId: interactionSnapshot.editingState.activeNodeId,
    editingInSidebar: interactionSnapshot.editingState.isInSidebar,
    selectedStamp: interactionSnapshot.selectedStamp,
    pinnedStamp: interactionSnapshot.pinnedStamp,
    showDetailSidebar: interactionSnapshot.showDetailSidebar,
});

const canPatchActiveInteractionState = (
    previous: Nx9WeekInteractionSnapshot,
    next: Nx9WeekInteractionSnapshot,
) =>
    previous.editingNodeId === next.editingNodeId &&
    previous.editingInSidebar === next.editingInSidebar &&
    previous.selectedStamp === next.selectedStamp &&
    previous.pinnedStamp === next.pinnedStamp &&
    previous.showDetailSidebar === next.showDetailSidebar &&
    (previous.activeNodeId !== next.activeNodeId ||
        previous.activeCellKey !== next.activeCellKey);

const buildIndexes = (descriptors: Nx9WeekCellDescriptorList) => {
    const indexByCellKey = new Map<string, number>();
    const indexByNodeId = new Map<string, number[]>();

    descriptors.forEach(({ seed, extra }, index) => {
        indexByCellKey.set(`${extra.row}:${extra.col}`, index);
        if (!seed.frame.nodeId) {
            return;
        }
        const existing = indexByNodeId.get(seed.frame.nodeId) ?? [];
        existing.push(index);
        indexByNodeId.set(seed.frame.nodeId, existing);
    });

    return {
        indexByCellKey,
        indexByNodeId,
    };
};

const collectAffectedIndexes = ({
    previous,
    next,
    indexByCellKey,
    indexByNodeId,
}: {
    previous: Nx9WeekInteractionSnapshot;
    next: Nx9WeekInteractionSnapshot;
    indexByCellKey: Map<string, number>;
    indexByNodeId: Map<string, number[]>;
}) => {
    const affected = new Set<number>();

    for (const key of [previous.activeCellKey, next.activeCellKey]) {
        if (!key) continue;
        const index = indexByCellKey.get(key);
        if (index !== undefined) {
            affected.add(index);
        }
    }

    for (const nodeId of [previous.activeNodeId, next.activeNodeId]) {
        if (!nodeId) continue;
        for (const index of indexByNodeId.get(nodeId) ?? []) {
            affected.add(index);
        }
    }

    return affected;
};

const patchActiveInteractionState = ({
    cells,
    previous,
    next,
    indexByCellKey,
    indexByNodeId,
}: {
    cells: Nx9WeekCellViewModel[];
    previous: Nx9WeekInteractionSnapshot;
    next: Nx9WeekInteractionSnapshot;
    indexByCellKey: Map<string, number>;
    indexByNodeId: Map<string, number[]>;
}) => {
    const affected = collectAffectedIndexes({
        previous,
        next,
        indexByCellKey,
        indexByNodeId,
    });
    if (affected.size === 0) {
        return cells;
    }

    const patched = cells.slice();
    for (const index of affected) {
        const cell = cells[index];
        if (!cell) continue;
        const cellKey = `${cell.row}:${cell.col}`;
        const isActiveCell = next.activeCellKey === cellKey;
        const isActiveNode =
            !next.activeCellKey &&
            !!cell.nodeId &&
            cell.nodeId === next.activeNodeId;
        patched[index] = {
            ...cell,
            isActiveCell,
            isActiveNode,
            cardUiState: {
                ...cell.cardUiState,
                active: !!cell.nodeId && cell.nodeId === next.activeNodeId,
            },
        };
    }
    return patched;
};

export const createNx9WeekRuntime = () => {
    const STATIC_CACHE_LIMIT = 12;
    const RUNTIME_CACHE_LIMIT = 24;
    const staticCache = createBoundedCache<WeekStaticCacheEntry>({
        capacity: STATIC_CACHE_LIMIT,
    });
    const runtimeCache = createBoundedCache<WeekRuntimeCacheEntry>({
        capacity: RUNTIME_CACHE_LIMIT,
    });
    const latestRuntimeByDescriptorKey =
        createBoundedCache<WeekRuntimeCacheEntry>({
            capacity: RUNTIME_CACHE_LIMIT,
        });
    const resolveObjectKey = createObjectIdentityKeyResolver();

    const resolveStaticKey = ({
        weekContext,
        sectionIdMap,
        gridStyle,
        displaySnapshot,
    }: {
        weekContext: WeekPlanContext;
        sectionIdMap: Record<string, string | undefined>;
        gridStyle: ResolvedGridStyle;
        displaySnapshot: SceneDisplaySnapshot;
    }) =>
        [
            resolveObjectKey(weekContext.rows),
            resolveObjectKey(sectionIdMap),
            gridStyle.cacheKey,
            resolveObjectKey(displaySnapshot),
        ].join('|');

    const resolveInteractionKey = (interaction: Nx9WeekInteractionSnapshot) =>
        [
            interaction.activeNodeId ?? '',
            interaction.activeCellKey ?? '',
            interaction.editingNodeId ?? '',
            interaction.editingInSidebar ? 'sidebar' : 'main',
            interaction.selectedStamp,
            interaction.pinnedStamp,
            interaction.showDetailSidebar ? 'detail' : 'inline',
        ].join('|');

    const resolveStaticEntry = ({
        weekContext,
        sectionIdMap,
        gridStyle,
        displaySnapshot,
    }: {
        weekContext: WeekPlanContext;
        sectionIdMap: Record<string, string | undefined>;
        gridStyle: ResolvedGridStyle;
        displaySnapshot: SceneDisplaySnapshot;
    }) => {
        const key = resolveStaticKey({
            weekContext,
            sectionIdMap,
            gridStyle,
            displaySnapshot,
        });
        const cached = staticCache.get(key);
        if (cached) {
            return cached;
        }

        const descriptors = buildNx9WeekCellDescriptors({
            rows: weekContext.rows,
            sectionIdMap,
            gridStyle,
            sectionColors: displaySnapshot.sectionColors,
            sectionColorOpacity: displaySnapshot.sectionColorOpacity,
            backgroundMode: displaySnapshot.backgroundMode,
        });
        const indexes = buildIndexes(descriptors);
        const entry: WeekStaticCacheEntry = {
            key,
            descriptors,
            ...indexes,
        };
        return staticCache.set(key, entry);
    };

    const resolveCells = ({
        weekContext,
        sectionIdMap,
        gridStyle,
        displaySnapshot,
        interactionSnapshot,
        activeCell,
    }: {
        weekContext: WeekPlanContext;
        sectionIdMap: Record<string, string | undefined>;
        gridStyle: ResolvedGridStyle;
        displaySnapshot: SceneDisplaySnapshot;
        interactionSnapshot: SceneCardInteractionSnapshot;
        activeCell: WeekActiveCell;
    }) => {
        const staticEntry = resolveStaticEntry({
            weekContext,
            sectionIdMap,
            gridStyle,
            displaySnapshot,
        });
        const interaction = buildInteractionSnapshot({
            interactionSnapshot,
            activeCell,
        });
        const runtimeKey = [
            staticEntry.key,
            resolveInteractionKey(interaction),
        ].join('|');
        const exactCached = runtimeCache.get(runtimeKey);
        if (exactCached) {
            latestRuntimeByDescriptorKey.set(staticEntry.key, exactCached);
            return exactCached.value;
        }

        const cached = latestRuntimeByDescriptorKey.get(staticEntry.key);
        if (
            cached &&
            canPatchActiveInteractionState(cached.interaction, interaction)
        ) {
            const patched = patchActiveInteractionState({
                cells: cached.value,
                previous: cached.interaction,
                next: interaction,
                indexByCellKey: staticEntry.indexByCellKey,
                indexByNodeId: staticEntry.indexByNodeId,
            });
            const entry: WeekRuntimeCacheEntry = {
                key: runtimeKey,
                interaction,
                value: patched,
            };
            latestRuntimeByDescriptorKey.set(staticEntry.key, entry);
            runtimeCache.set(runtimeKey, entry);
            return patched;
        }

        const value = buildNx9WeekCellsFromDescriptors({
            descriptors: staticEntry.descriptors,
            interaction: interactionSnapshot,
            activeNodeId: interactionSnapshot.activeNodeId,
            activeCell,
        });
        const entry: WeekRuntimeCacheEntry = {
            key: runtimeKey,
            interaction,
            value,
        };
        latestRuntimeByDescriptorKey.set(staticEntry.key, entry);
        runtimeCache.set(runtimeKey, entry);
        return value;
    };

    return {
        resolveCells,
    };
};
