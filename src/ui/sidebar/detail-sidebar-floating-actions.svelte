<script lang="ts">
    import { setIcon } from 'obsidian';
    import { lang } from 'src/lang/lang';

    export let isThreeByThreeMode = false;
    export let isNineByNineMode = false;
    export let show3x3SubgridNavButtons = false;
    export let show9x9ParallelNavButtons = false;
    export let dayPlanEnabled = false;
    export let showDayPlanTodayButton = false;
    export let showTodayButton = false;
    export let canExitSubgrid = false;
    export let canEnterSubgrid = false;
    export let canJumpPrevCore = false;

    export let onExitSubgrid: (event: MouseEvent) => void;
    export let onEnterSubgrid: (event: MouseEvent) => void;
    export let onJumpPrevCore: (event: MouseEvent) => void;
    export let onJumpNextCore: (event: MouseEvent) => void;
    export let onFocusToday: (event: MouseEvent) => void;

    const applyObsidianIcon = (node: HTMLElement, iconName: string) => {
        setIcon(node, iconName);
        return {
            update(nextIconName: string) {
                setIcon(node, nextIconName);
            },
        };
    };
</script>

{#if (isThreeByThreeMode && show3x3SubgridNavButtons) || (dayPlanEnabled && showDayPlanTodayButton && showTodayButton)}
    <div class="mobile-subgrid-floating-controls">
        {#if isThreeByThreeMode && show3x3SubgridNavButtons}
            <button
                class="mobile-subgrid-floating-btn"
                type="button"
                aria-label="退出上一层子九宫格"
                disabled={!canExitSubgrid}
                on:click={onExitSubgrid}
            >
                <span
                    class="mobile-subgrid-floating-btn__icon"
                    use:applyObsidianIcon={'chevron-up'}
                />
            </button>
            <button
                class="mobile-subgrid-floating-btn"
                type="button"
                aria-label="进入下一层子九宫格"
                disabled={!canEnterSubgrid}
                on:click={onEnterSubgrid}
            >
                <span
                    class="mobile-subgrid-floating-btn__icon"
                    use:applyObsidianIcon={'chevron-down'}
                />
            </button>
        {/if}
        {#if dayPlanEnabled && showDayPlanTodayButton && showTodayButton}
            <button
                class="mobile-subgrid-floating-btn mobile-day-plan-today-btn"
                type="button"
                aria-label={lang.day_plan_today_button_label}
                on:click={onFocusToday}
            >
                <span
                    class="mobile-subgrid-floating-btn__icon"
                    use:applyObsidianIcon={'calendar-days'}
                />
            </button>
        {/if}
    </div>
{:else if (isNineByNineMode && show9x9ParallelNavButtons) || (dayPlanEnabled && showDayPlanTodayButton && showTodayButton)}
    <div class="mobile-subgrid-floating-controls">
        {#if isNineByNineMode && show9x9ParallelNavButtons}
            <button
                class="mobile-subgrid-floating-btn"
                type="button"
                aria-label="进入上一层核心九宫格"
                disabled={!canJumpPrevCore}
                on:click={onJumpPrevCore}
            >
                <span
                    class="mobile-subgrid-floating-btn__icon"
                    use:applyObsidianIcon={'chevron-left'}
                />
            </button>
            <button
                class="mobile-subgrid-floating-btn"
                type="button"
                aria-label="进入下一层核心九宫格"
                on:click={onJumpNextCore}
            >
                <span
                    class="mobile-subgrid-floating-btn__icon"
                    use:applyObsidianIcon={'chevron-right'}
                />
            </button>
        {/if}
        {#if dayPlanEnabled && showDayPlanTodayButton && showTodayButton}
            <button
                class="mobile-subgrid-floating-btn mobile-day-plan-today-btn"
                type="button"
                aria-label={lang.day_plan_today_button_label}
                on:click={onFocusToday}
            >
                <span
                    class="mobile-subgrid-floating-btn__icon"
                    use:applyObsidianIcon={'calendar-days'}
                />
            </button>
        {/if}
    </div>
{/if}

<style>
    .mobile-subgrid-floating-controls {
        position: absolute;
        right: 12px;
        top: 18px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 12;
        pointer-events: auto;
    }

    .mobile-subgrid-floating-btn {
        width: 36px;
        height: 36px;
        border-radius: 999px;
        border: 1px solid var(--background-modifier-border);
        background: transparent;
        color: var(--text-normal);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-s);
    }

    .mobile-subgrid-floating-btn:disabled {
        opacity: 0.35;
    }

    .mobile-subgrid-floating-btn__icon {
        width: 18px;
        height: 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
</style>
