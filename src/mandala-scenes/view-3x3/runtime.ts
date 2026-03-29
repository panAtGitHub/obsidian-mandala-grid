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
import {
    createBoundedCache,
    createObjectIdentityKeyResolver,
} from 'src/shared/helpers/bounded-cache';

type ThreeByThreeRuntimeArgs = Assemble3x3CellViewModelsArgs;

type ThreeByThreeStaticCacheEntry = {
    descriptors: SceneCardCellDescriptorList<ThreeByThreeCardCellDescriptorExtra>;
};

type InteractionStampCarrier = {
    selectedStamp?: string;
    pinnedStamp?: string;
};

export const createThreeByThreeRuntime = () => {
    const STATIC_CACHE_LIMIT = 12;
    const CELLS_CACHE_LIMIT = 24;
    const staticCache = createBoundedCache<ThreeByThreeStaticCacheEntry>({
        capacity: STATIC_CACHE_LIMIT,
    });
    const cellsCache = createBoundedCache<ThreeByThreeCellViewModel[]>({
        capacity: CELLS_CACHE_LIMIT,
    });
    const resolveObjectKey = createObjectIdentityKeyResolver();

    const resolveStaticKey = ({
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
    >) =>
        [
            theme,
            selectedLayoutId ?? 'default',
            resolveObjectKey(customLayouts),
            resolveObjectKey(topology),
            gridStyle.cacheKey,
            resolveObjectKey(displaySnapshot),
        ].join('|');

    const resolveInteractionKey = (interaction: SceneCardInteractionDescriptor) => {
        const stamps = interaction as SceneCardInteractionDescriptor &
            InteractionStampCarrier;
        const selectedKey =
            stamps.selectedStamp ?? resolveObjectKey(interaction.selectedNodes);
        const pinnedKey =
            stamps.pinnedStamp ?? resolveObjectKey(interaction.pinnedSections);

        return [
            interaction.activeNodeId ?? '',
            interaction.editingState.activeNodeId ?? '',
            interaction.editingState.isInSidebar ? 'sidebar' : 'main',
            selectedKey,
            pinnedKey,
            interaction.showDetailSidebar ? 'detail' : 'inline',
        ].join('|');
    };

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
        const key = resolveStaticKey({
            theme,
            selectedLayoutId,
            customLayouts,
            topology,
            gridStyle,
            displaySnapshot,
        });
        const cached = staticCache.get(key);
        if (cached) {
            return {
                key,
                descriptors: cached.descriptors,
            };
        }

        const layout = getMandalaLayoutById(selectedLayoutId, customLayouts);
        const descriptors = build3x3CardCellDescriptors({
            theme,
            layout,
            topology,
            displaySnapshot,
            displayPolicy: gridStyle.cellDisplayPolicy,
        });
        staticCache.set(key, {
            descriptors,
        });
        return {
            key,
            descriptors,
        };
    };

    const resolveCells = (args: ThreeByThreeRuntimeArgs) => {
        const { key: staticKey, descriptors } = resolveStaticDescriptors(args);
        const cellsKey = [staticKey, resolveInteractionKey(args.interaction)].join(
            '|',
        );
        const cached = cellsCache.get(cellsKey);
        if (cached) {
            return cached;
        }

        const value = buildSceneCardCellList({
            descriptors,
            interaction: args.interaction,
        });
        return cellsCache.set(cellsKey, value);
    };

    return {
        resolveCells,
    };
};
