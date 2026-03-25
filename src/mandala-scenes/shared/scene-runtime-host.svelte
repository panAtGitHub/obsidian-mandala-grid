<script lang="ts">
    import { afterUpdate, tick, onDestroy } from 'svelte';
    import Mandala3x3Layout from 'src/mandala-scenes/view-3x3/layout.svelte';
    import NineByNineLayout from 'src/mandala-scenes/view-9x9/layout.svelte';
    import Nx9Layout from 'src/mandala-scenes/view-nx9/layout.svelte';
    import WeekPlanLayout from 'src/mandala-scenes/view-7x9/layout.svelte';
    import type { MandalaCardMobileDoubleClickHandler } from 'src/mandala-cell/viewmodel/controller/mandala-card-controller';
    import type { ThreeByThreeCellViewModel } from 'src/mandala-scenes/view-3x3/assemble-cell-view-model';
    import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';

    export let sceneKey: MandalaSceneKey = {
        viewKind: '3x3',
        variant: 'default',
    };

    export let cells: ThreeByThreeCellViewModel[] = [];
    export let theme = '1';
    export let animateSwap = false;
    export let show3x3SubgridNavButtons = false;
    export let hasOpenOverlayModal = false;
    export let dayPlanEnabled = false;
    export let showDayPlanTodayButton = false;
    export let dayPlanTodayTargetSection: string | null = null;
    export let activeCoreSection: string | null = null;
    export let todayButtonLabel = '';
    export let enterSubgridFromButton: (event: MouseEvent, nodeId: string) => void;
    export let exitSubgridFromButton: (event: MouseEvent) => void;
    export let focusDayPlanTodayFromButton: (event: MouseEvent) => void;
    export let getUpButtonLabel: (theme: string) => string;
    export let getDownButtonLabel: (theme: string) => string;
    export let onMobileCardDoubleClick: MandalaCardMobileDoubleClickHandler | null =
        null;

    let renderedSceneKey = sceneKey;
    let pendingSceneKey = sceneKey;
    let isSwitchingScene = false;
    let isDestroyed = false;

    const sceneKeyEquals = (
        a: MandalaSceneKey,
        b: MandalaSceneKey,
    ) => a.viewKind === b.viewKind && a.variant === b.variant;

    const waitForNextPaint = () =>
        new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve());
        });

    const commitSceneKey = async () => {
        if (isDestroyed || isSwitchingScene) return;
        if (sceneKeyEquals(renderedSceneKey, pendingSceneKey)) return;
        isSwitchingScene = true;
        await tick();
        await waitForNextPaint();
        if (isDestroyed) return;
        renderedSceneKey = pendingSceneKey;
        isSwitchingScene = false;
    };

    onDestroy(() => {
        isDestroyed = true;
    });

    afterUpdate(() => {
        pendingSceneKey = sceneKey;
        void commitSceneKey();
    });
</script>

{#key `${renderedSceneKey.viewKind}:${renderedSceneKey.variant}`}
    {#if renderedSceneKey.viewKind === '3x3'}
        <Mandala3x3Layout
            cells={cells}
            theme={theme}
            animateSwap={animateSwap}
            show3x3SubgridNavButtons={show3x3SubgridNavButtons}
            hasOpenOverlayModal={hasOpenOverlayModal}
            dayPlanEnabled={dayPlanEnabled}
            showDayPlanTodayButton={showDayPlanTodayButton}
            {dayPlanTodayTargetSection}
            {activeCoreSection}
            todayButtonLabel={todayButtonLabel}
            enterSubgridFromButton={enterSubgridFromButton}
            exitSubgridFromButton={exitSubgridFromButton}
            focusDayPlanTodayFromButton={focusDayPlanTodayFromButton}
            onMobileCardDoubleClick={onMobileCardDoubleClick}
            getUpButtonLabel={getUpButtonLabel}
            getDownButtonLabel={getDownButtonLabel}
        />
    {:else if renderedSceneKey.viewKind === '9x9'}
        <NineByNineLayout />
    {:else if renderedSceneKey.variant === 'week-7x9'}
        <WeekPlanLayout />
    {:else}
        <Nx9Layout />
    {/if}
{/key}
