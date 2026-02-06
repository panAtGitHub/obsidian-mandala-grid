<script lang="ts">
    import { derived } from 'src/lib/store/derived';
    import { getView } from 'src/view/components/container/context';
    import { sectionAtCell9x9 } from 'src/view/helpers/mandala/mandala-grid';
    import MandalaCard from 'src/view/components/mandala/mandala-card.svelte';
    import { SectionColorBySectionStore } from 'src/stores/document/derived/section-colors-store';
    import {
        MandalaBackgroundModeStore,
        MandalaGridOrientationStore,
        MandalaSectionColorOpacityStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import { applyOpacityToHex } from 'src/view/helpers/mandala/section-colors';

    const view = getView();

    const sectionToNodeId = derived(
        view.documentStore,
        (state) => state.sections.section_id,
    );

    const pinnedNodes = derived(
        view.documentStore,
        (state) => new Set(state.pinnedNodes.Ids),
    );

    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );
    const idToSection = derived(
        view.documentStore,
        (state) => state.sections.id_section,
    );
    $: baseTheme = (() => {
        const section = $idToSection[$activeNodeId];
        const core = section?.split('.')[0];
        return core ?? '1';
    })();

    const editingState = derived(
        view.viewStore,
        (state) => state.document.editing,
    );

    const selectedNodes = derived(
        view.viewStore,
        (state) => state.document.selectedNodes,
    );

    const nodeStyles = derived(
        view.viewStore,
        (state) => state.styleRules.nodeStyles,
    );
    const sectionColors = SectionColorBySectionStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);
    const gridOrientation = MandalaGridOrientationStore(view);

    const getSectionColor = (section: string) => {
        if ($backgroundMode !== 'custom') return null;
        const color = $sectionColors[section];
        if (!color) return null;
        return applyOpacityToHex(color, $sectionColorOpacity / 100);
    };
</script>

<div class="mandala-9x9-grid">
    {#each Array(9) as _rowPlaceholder, row (row)}
        {#each Array(9) as _colPlaceholder, col (col)}
            {@const section = sectionAtCell9x9(
                row,
                col,
                $gridOrientation,
                baseTheme,
            )}
            {@const nodeId = section ? $sectionToNodeId[section] : null}

            {#if section && nodeId}
                {@const active = nodeId === $activeNodeId}
                {@const editing =
                    $editingState.activeNodeId === nodeId &&
                    !$editingState.isInSidebar}
                {@const sectionColor = getSectionColor(section)}
                <MandalaCard
                    {nodeId}
                    {section}
                    {active}
                    {editing}
                    selected={$selectedNodes.has(nodeId)}
                    pinned={$pinnedNodes.has(nodeId)}
                    style={$nodeStyles.get(nodeId)}
                    sectionColor={sectionColor}
                    draggable={section !== baseTheme}
                    gridCell={{ mode: '9x9', row, col }}
                />
            {:else if section}
                <div class="mandala-placeholder">
                    <div class="mandala-section-label">{section}</div>
                </div>
            {/if}
        {/each}
    {/each}
</div>

<style>
    .mandala-9x9-grid {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: repeat(9, minmax(0, 1fr));
        grid-template-rows: repeat(9, minmax(0, 1fr));
        gap: var(--mandala-gap);

        --mandala-card-width: 100%;
        --mandala-card-height: 100%;
        --mandala-card-min-height: 0;
    }

    .mandala-9x9-grid :global(.mandala-card) {
        border: 1px solid var(--background-modifier-border);
        border-radius: 8px;
        background: var(--background-primary);
        box-sizing: border-box;
    }

    .mandala-placeholder {
        position: relative;
        width: 100%;
        height: 100%;
        border: 1px dashed var(--background-modifier-border);
        border-radius: 8px;
        opacity: 0.25;
        pointer-events: none;
        box-sizing: border-box;
    }

    .mandala-section-label {
        position: absolute;
        top: 6px;
        right: 8px;
        font-size: 12px;
        opacity: 0.7;
        user-select: none;
        pointer-events: none;
    }
</style>
