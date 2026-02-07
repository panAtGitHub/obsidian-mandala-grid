<script lang="ts">
    import { Platform } from 'obsidian';
    import { lang } from '../../../../lang/lang';
    import { MoreVertical, Wrench } from 'lucide-svelte';
    import { getView } from '../context';
    import { derived, writable } from 'svelte/store';
    import { uiControlsStore } from '../../../../stores/view/derived/ui-controls-store';
    import Button from '../shared/button.svelte';
    import {
        ScrollSettingsStore,
        showMinimapStore,
    } from '../../../../stores/settings/derived/scrolling-store';
    import {
        ApplyGapBetweenCardsStore,
        MandalaModeStore,
        OutlineModeStore,
        ShowHiddenCardInfoStore,
        ShowMandalaDetailSidebarStore,
    } from '../../../../stores/settings/derived/view-settings-store';
    import { VerticalToolbarButtonsList } from './vertical-toolbar-buttons-list';
    import { ToolbarButton } from 'src/view/modals/vertical-toolbar-buttons/vertical-toolbar-buttons';
    import ViewOptionsMenu from './view-options-menu.svelte';

    const view = getView();

    const showControls = writable(false);
    const toggleShowControls = () => {
        showControls.update((v) => !v);
    };

    const closeMobileControls = () => {
        if (Platform.isMobile) {
            showControls.set(false);
        }
    };

    const showOptionsMenu = writable(false);
    const toggleOptionsMenu = () => {
        showOptionsMenu.update((v) => !v);
    };

    const controls = uiControlsStore(view);
    const showMinimap = showMinimapStore(view);
    const scrollSettingsStore = ScrollSettingsStore(view);
    const applyGapBetweenCards = ApplyGapBetweenCardsStore(view);
    const outlineMode = OutlineModeStore(view);
    const mandalaMode = MandalaModeStore(view);
    const showHiddenCardInfo = ShowHiddenCardInfoStore(view);
    const showMandalaDetailSidebar = ShowMandalaDetailSidebarStore(view);


    const buttons = VerticalToolbarButtonsList(view);
    const activeStates = derived(
        [
            showMinimap,
            controls,
            scrollSettingsStore,
            outlineMode,
            mandalaMode,
            applyGapBetweenCards,
            showHiddenCardInfo,
            showMandalaDetailSidebar,
        ],
        ([
            showMinimap,
            controls,
            scrollSettingsStore,
            outlineMode,
            mandalaMode,
            applyGapBetweenCards,
            showHiddenCardInfo,
            showMandalaDetailSidebar,
        ]) => {
            return {
                minimap: showMinimap,
                settings: controls.showSettingsSidebar,
                'style-rules': controls.showStyleRulesModal,
                'center-active-node-h': scrollSettingsStore.centerActiveNodeH,
                'center-active-node-v': scrollSettingsStore.centerActiveNodeV,
                'outline-mode': outlineMode,
                'mandala-mode': mandalaMode === '9x9',
                'mandala-detail-sidebar': showMandalaDetailSidebar,
                'space-between-cards': applyGapBetweenCards,
                'hidden-card-info': showHiddenCardInfo,
            } as Partial<Record<ToolbarButton, boolean>>;
        },
    );

    $: flattenedButtons = $buttons.flatMap((g) => g.buttons);
    $: mobileSidebarButton = flattenedButtons.find(
        (b) => (b.id as unknown as string) === 'mandala-detail-sidebar',
    );
    $: mobileOtherButtons = flattenedButtons.filter(
        (b) =>
            b !== mobileSidebarButton &&
            b.id !== ('jump-core-prev' as ToolbarButton) &&
            b.id !== ('jump-core-next' as ToolbarButton),
    );
    $: orderedButtons = Platform.isMobile
        ? $buttons
        : [...$buttons].sort((a, b) => {
              const desktopOrder = ['mandala', 'settings'];
              const indexA = desktopOrder.indexOf(a.id);
              const indexB = desktopOrder.indexOf(b.id);
              if (indexA === -1 && indexB === -1) return 0;
              if (indexA === -1) return 1;
              if (indexB === -1) return -1;
              return indexA - indexB;
          });
</script>

<div class="controls-container">
    <div class="buttons-group topbar-buttons-group controls-toggle">
        <Button
            active={$showControls}
            classes="topbar-button"
            label={lang.controls_toggle_bar}
            on:click={toggleShowControls}
            tooltipPosition="bottom"
        >
            <MoreVertical class="svg-icon" />
        </Button>
    </div>

    {#if Platform.isMobile}
        <div
            class="buttons-group"
            class:topbar-mobile-popover={Platform.isMobile}
            data-visible={$showControls}
        >
            <Button
                active={$showOptionsMenu}
                classes="control-item js-view-options-trigger topbar-button"
                label="视图选项"
                on:click={() => {
                    toggleOptionsMenu();
                    closeMobileControls();
                }}
                tooltipPosition="bottom"
            >
                <Wrench class="svg-icon" />
            </Button>

            {#if mobileSidebarButton}
                <Button
                    active={$activeStates[mobileSidebarButton.id]}
                    classes="control-item topbar-button"
                    label={mobileSidebarButton.label}
                    on:click={(e) => {
                        mobileSidebarButton.onClick(e);
                        closeMobileControls();
                    }}
                    tooltipPosition="bottom"
                >
                    {#if 'svg' in mobileSidebarButton.icon}
                        {@html mobileSidebarButton.icon.svg}
                    {:else}
                        <svelte:component
                            this={mobileSidebarButton.icon}
                            class="svg-icon"
                        />
                    {/if}
                </Button>
            {/if}

            {#each mobileOtherButtons as button (button.label)}
                <Button
                    active={$activeStates[button.id]}
                    classes="control-item topbar-button"
                    label={button.label}
                    on:click={(e) => {
                        button.onClick(e);
                        closeMobileControls();
                    }}
                    tooltipPosition="bottom"
                >
                    {#if 'svg' in button.icon}
                        {@html button.icon.svg}
                    {:else}
                        <svelte:component this={button.icon} class="svg-icon" />
                    {/if}
                </Button>
            {/each}
        </div>
    {:else}
        {#each orderedButtons as group (group.id)}
            {#each group.buttons as button (button.label)}
                <div class="topbar-buttons-group">
                    <Button
                        active={$activeStates[button.id]}
                        classes="control-item topbar-button"
                        label={button.label}
                        on:click={button.onClick}
                        tooltipPosition="bottom"
                    >
                        {#if 'svg' in button.icon}
                            {@html button.icon.svg}
                        {:else}
                            <svelte:component this={button.icon} class="svg-icon" />
                        {/if}
                    </Button>
                </div>
            {/each}

            <!-- 在侧边栏按钮组后添加快捷菜单按钮 -->
            {#if group.id === 'mandala'}
                <div class="topbar-buttons-group">
                    <Button
                        active={$showOptionsMenu}
                        classes="control-item js-view-options-trigger topbar-button"
                        label="视图选项"
                        on:click={toggleOptionsMenu}
                        tooltipPosition="bottom"
                    >
                        <Wrench class="svg-icon" />
                    </Button>
                </div>
            {/if}
        {/each}
    {/if}
</div>

<!-- 视图选项菜单 -->
<ViewOptionsMenu 
    show={$showOptionsMenu} 
    on:close={() => showOptionsMenu.set(false)} 
/>

<style>
    .controls-container {
        gap: var(--size-4-2);
        display: flex;
        flex-direction: row;
        align-items: center;
        position: relative;
    }

    .buttons-group {
        display: flex;
        flex-direction: row;
        gap: var(--size-4-2);
    }

    .controls-toggle {
        display: none;
    }
    :global(.is-mobile) {
        & .controls-container {
            flex-direction: row;
        }
        & .controls-toggle {
            display: block;
            z-index: 1002;
        }
        & .buttons-group[data-visible='true'] {
            top: 45px;
            right: var(--size-4-2);
            flex-direction: column !important;
        }
        & .buttons-group[data-visible='false'] {
            display: none;
        }
    }
</style>
