import { getMandalaLayoutById } from 'src/mandala-display/logic/mandala-grid';
import {
    buildSceneCardCellList,
    type SceneCardInteractionDescriptor,
    type SceneCardCellDescriptorList,
} from 'src/mandala-scenes/shared/card-scene-cell';
import {
    build3x3CardCellDescriptors,
    type Assemble3x3CellViewModelsArgs,
    type ThreeByThreeCellViewModel,
    type ThreeByThreeCardCellDescriptorExtra,
} from 'src/mandala-scenes/view-3x3/assemble-cell-view-model';

type ThreeByThreeRuntimeArgs = Assemble3x3CellViewModelsArgs;

type ThreeByThreeStaticCacheEntry = {
    theme: string;
    selectedLayoutId: string | null;
    customLayouts: ThreeByThreeRuntimeArgs['customLayouts'];
    topology: ThreeByThreeRuntimeArgs['topology'];
    gridStyleKey: string;
    displaySnapshot: ThreeByThreeRuntimeArgs['displaySnapshot'];
    descriptors: SceneCardCellDescriptorList<ThreeByThreeCardCellDescriptorExtra>;
};

type ThreeByThreeCellsCacheEntry = {
    descriptors: SceneCardCellDescriptorList<ThreeByThreeCardCellDescriptorExtra>;
    interaction: SceneCardInteractionDescriptor;
    value: ThreeByThreeCellViewModel[];
};

type InteractionStampCarrier = {
    selectedStamp?: string;
    pinnedStamp?: string;
};

const sameDisplaySnapshot = (
    a: ThreeByThreeRuntimeArgs['displaySnapshot'],
    b: ThreeByThreeRuntimeArgs['displaySnapshot'],
) =>
    a.backgroundMode === b.backgroundMode &&
    a.sectionColors === b.sectionColors &&
    a.sectionColorOpacity === b.sectionColorOpacity;

const sameEditingState = (
    a: SceneCardInteractionDescriptor['editingState'],
    b: SceneCardInteractionDescriptor['editingState'],
) => a.activeNodeId === b.activeNodeId && a.isInSidebar === b.isInSidebar;

const sameInteractionSnapshot = (
    a: SceneCardInteractionDescriptor,
    b: SceneCardInteractionDescriptor,
) => {
    const aStamps = a as SceneCardInteractionDescriptor & InteractionStampCarrier;
    const bStamps = b as SceneCardInteractionDescriptor & InteractionStampCarrier;
    const sameSelected =
        aStamps.selectedStamp !== undefined &&
        bStamps.selectedStamp !== undefined
            ? aStamps.selectedStamp === bStamps.selectedStamp
            : a.selectedNodes === b.selectedNodes;
    const samePinned =
        aStamps.pinnedStamp !== undefined && bStamps.pinnedStamp !== undefined
            ? aStamps.pinnedStamp === bStamps.pinnedStamp
            : a.pinnedSections === b.pinnedSections;

    return (
        a.activeNodeId === b.activeNodeId &&
        sameEditingState(a.editingState, b.editingState) &&
        sameSelected &&
        samePinned &&
        a.showDetailSidebar === b.showDetailSidebar
    );
};

export const createThreeByThreeRuntime = () => {
    const staticCache: ThreeByThreeStaticCacheEntry[] = [];
    const cellsCache: ThreeByThreeCellsCacheEntry[] = [];

    const resolveStaticDescriptors = ({
        theme,
        selectedLayoutId,
        customLayouts,
        topology,
        gridStyle,
        displaySnapshot,
    }: Pick<
        ThreeByThreeRuntimeArgs,
        | 'theme'
        | 'selectedLayoutId'
        | 'customLayouts'
        | 'topology'
        | 'gridStyle'
        | 'displaySnapshot'
    >) => {
        const cached = staticCache.find(
            (candidate) =>
                candidate.theme === theme &&
                candidate.selectedLayoutId === selectedLayoutId &&
                candidate.customLayouts === customLayouts &&
                candidate.topology === topology &&
                candidate.gridStyleKey === gridStyle.cacheKey &&
                sameDisplaySnapshot(candidate.displaySnapshot, displaySnapshot),
        );
        if (cached) {
            return cached.descriptors;
        }

        const layout = getMandalaLayoutById(selectedLayoutId, customLayouts);
        const descriptors = build3x3CardCellDescriptors({
            theme,
            layout,
            topology,
            displaySnapshot,
            displayPolicy: gridStyle.cellDisplayPolicy,
        });
        staticCache.push({
            theme,
            selectedLayoutId,
            customLayouts,
            topology,
            gridStyleKey: gridStyle.cacheKey,
            displaySnapshot,
            descriptors,
        });
        return descriptors;
    };

    const resolveCells = (args: ThreeByThreeRuntimeArgs) => {
        const descriptors = resolveStaticDescriptors(args);
        const cached = cellsCache.find(
            (candidate) =>
                candidate.descriptors === descriptors &&
                sameInteractionSnapshot(candidate.interaction, args.interaction),
        );
        if (cached) {
            return cached.value;
        }

        const value = buildSceneCardCellList({
            descriptors,
            interaction: args.interaction,
        });
        cellsCache.push({
            descriptors,
            interaction: args.interaction,
            value,
        });
        return value;
    };

    return {
        resolveCells,
    };
};
