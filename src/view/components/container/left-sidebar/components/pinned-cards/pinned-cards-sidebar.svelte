<script lang="ts">
    import { derived } from 'svelte/store';
    import { PinnedNodesStore } from 'src/stores/document/derived/document-derived-stores';
    import { getView } from '../../../context';
    import { ActivePinnedCardStore } from '../../../../../../stores/view/derived/pinned-cards-sidebar';
    import NoItems from '../no-items/no-items.svelte';
    import { scrollActivePinnedNode } from 'src/view/components/container/left-sidebar/components/pinned-cards/actions/scroll-active-pinned-node';
    import { navigateToSearchResult } from 'src/view/helpers/mandala/search-utils';
    import { setActiveSidebarNode } from 'src/stores/view/subscriptions/actions/set-active-sidebar-node';
    import { CurrentFileSectionColorMapStore } from 'src/stores/document/derived/section-colors-store';
    import {
        createSectionColorIndex,
        applyOpacityToHex,
        SECTION_COLOR_PALETTE,
        SECTION_COLOR_KEYS,
    } from 'src/view/helpers/mandala/section-colors';
    import {
        MandalaBackgroundModeStore,
        MandalaSectionColorOpacityStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import { Palette, Pin } from 'lucide-svelte';
    import {
        getReadableTextTone,
        type ThemeTone,
    } from 'src/view/helpers/mandala/contrast-text-tone';

    const view = getView();
    const pinnedNodesArray = PinnedNodesStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);
    const sectionColorMapStore = CurrentFileSectionColorMapStore(view);
    const sectionColors = derived(sectionColorMapStore, (colorMap) => {
        const index = createSectionColorIndex(colorMap);
        const result: Record<string, string> = {};
        for (const [section, key] of Object.entries(index)) {
            result[section] = SECTION_COLOR_PALETTE[key];
        }
        return result;
    });

    const activePinnedCard = ActivePinnedCardStore(view);

    type PinnedItem = {
        nodeId: string;
        section: string;
        title: string;
        body: string;
        colorKey: string | null;
    };

    const parsePinnedContent = (content: string) => {
        const lines = content.split('\n');
        const titleLine = lines.find((line) => line.trim().length > 0) || '';
        const title = titleLine.replace(/^#+\s*/, '').trim();
        const titleIndex = lines.indexOf(titleLine);
        const bodyLine =
            lines
                .slice(titleIndex + 1)
                .find((line) => line.trim().length > 0) || '';
        return { title, body: bodyLine.trimEnd() };
    };

    const pinnedState = derived(
        [pinnedNodesArray, view.documentStore, sectionColorMapStore],
        ([pinnedNodeIds, documentState, colorMap]) => {
            const orderMap = new Map<string, number>();
            pinnedNodeIds.forEach((nodeId, index) => {
                const section = documentState.sections.id_section[nodeId];
                if (section) {
                    orderMap.set(section, index);
                }
            });
            const colorIndex = createSectionColorIndex(colorMap);
            const colorOrderMap = new Map<string, number>();
            for (const key of SECTION_COLOR_KEYS) {
                const sections = colorMap[key] || [];
                sections.forEach((section, idx) => {
                    colorOrderMap.set(section, idx);
                });
            }
            const previewCache = new Map<
                string,
                { title: string; body: string }
            >();
            const getPreview = (nodeId: string) => {
                const cached = previewCache.get(nodeId);
                if (cached) return cached;
                const content =
                    documentState.document.content[nodeId]?.content || '';
                const preview = parsePinnedContent(content);
                previewCache.set(nodeId, preview);
                return preview;
            };
            const mappedItems: Array<PinnedItem | null> = pinnedNodeIds.map(
                (nodeId): PinnedItem | null => {
                    const section = documentState.sections.id_section[nodeId];
                    if (!section) return null;
                    const preview = getPreview(nodeId);
                    return {
                        nodeId,
                        section,
                        title: preview.title,
                        body: preview.body,
                        colorKey: colorIndex[section] || null,
                    };
                },
            );
            const items = mappedItems.filter((item): item is PinnedItem =>
                Boolean(item),
            );
            const coloredItems: PinnedItem[] = [];
            for (const key of SECTION_COLOR_KEYS) {
                const sections = colorMap[key] || [];
                for (const section of sections) {
                    const nodeId = documentState.sections.section_id[section];
                    if (!nodeId) continue;
                    const preview = getPreview(nodeId);
                    coloredItems.push({
                        nodeId,
                        section,
                        title: preview.title,
                        body: preview.body,
                        colorKey: key,
                    });
                }
            }
            return { items, orderMap, colorOrderMap, coloredItems };
        },
    );

    let sortMode: 'section' | 'color' | 'colored' = 'section';

    $: hasPinnedItems = $pinnedState.items.length > 0;
    $: hasColoredItems = $pinnedState.coloredItems.length > 0;

    $: {
        if (!hasColoredItems && sortMode === 'colored') {
            sortMode = hasPinnedItems ? 'section' : 'color';
        }
        if (!hasPinnedItems && hasColoredItems && sortMode !== 'colored') {
            sortMode = 'colored';
        }
    }

    const getColorRank = (colorKey: string | null) => {
        if (!colorKey) return Number.POSITIVE_INFINITY;
        const index = SECTION_COLOR_KEYS.indexOf(
            colorKey as (typeof SECTION_COLOR_KEYS)[number],
        );
        return index === -1 ? Number.POSITIVE_INFINITY : index;
    };

    const getPinnedOrder = (orderMap: Map<string, number>, section: string) =>
        orderMap.get(section) ?? Number.POSITIVE_INFINITY;

    const getColorOrder = (orderMap: Map<string, number>, section: string) =>
        orderMap.get(section) ?? Number.POSITIVE_INFINITY;

    const sortByColor = (a: PinnedItem, b: PinnedItem) => {
        const aRank = getColorRank(a.colorKey);
        const bRank = getColorRank(b.colorKey);
        if (aRank !== bRank) return aRank - bRank;
        if (!a.colorKey || !b.colorKey) {
            return (
                getPinnedOrder($pinnedState.orderMap, a.section) -
                getPinnedOrder($pinnedState.orderMap, b.section)
            );
        }
        return (
            getColorOrder($pinnedState.colorOrderMap, a.section) -
            getColorOrder($pinnedState.colorOrderMap, b.section)
        );
    };

    $: pinnedItems =
        sortMode === 'color'
            ? [...$pinnedState.items].sort(sortByColor)
            : sortMode === 'colored'
              ? $pinnedState.coloredItems
              : [...$pinnedState.items].sort(
                    (a, b) =>
                        getPinnedOrder($pinnedState.orderMap, a.section) -
                        getPinnedOrder($pinnedState.orderMap, b.section),
                );

    const handleClick = (item: PinnedItem) => {
        setActiveSidebarNode(view, item.nodeId);
        navigateToSearchResult(item.section, view);
    };

    const handleKeydown = (event: KeyboardEvent, item: PinnedItem) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        handleClick(item);
    };

    const getThemeTone = (): ThemeTone =>
        document.body.classList.contains('theme-dark') ? 'dark' : 'light';

    const getThemeUnderlayColor = () =>
        window
            .getComputedStyle(document.body)
            .getPropertyValue('--background-primary')
            .trim();

    const getPinnedItemStyle = (section: string) => {
        if ($backgroundMode !== 'custom') return undefined;
        const sectionColor = $sectionColors[section];
        if (!sectionColor) return undefined;

        const background = applyOpacityToHex(
            sectionColor,
            $sectionColorOpacity / 100,
        );
        const textTone = getReadableTextTone(
            background,
            getThemeTone(),
            getThemeUnderlayColor(),
        );
        const textVars =
            textTone === 'dark'
                ? '--text-normal: #0f131a; --text-muted: #2f3a48; --text-faint: #4f5c6b;'
                : textTone === 'light'
                  ? '--text-normal: #f3f6fd; --text-muted: #d0d8e6; --text-faint: #b0bbce;'
                  : '';

        return `--pinned-item-bg: ${background}; ${textVars}`;
    };
</script>

<div class="pinned-cards-container" use:scrollActivePinnedNode>
    {#if hasPinnedItems || hasColoredItems}
        <div class="pinned-sort-toggle">
            {#if hasPinnedItems}
                <button
                    class:active={sortMode === 'section'}
                    on:click={() => (sortMode = 'section')}
                    type="button"
                >
                    <Pin class="svg-icon" size="12" />
                    列表
                </button>
                <button
                    class:active={sortMode === 'color'}
                    on:click={() => (sortMode = 'color')}
                    type="button"
                >
                    <Pin class="svg-icon" size="12" />
                    分类
                </button>
            {/if}
            {#if hasColoredItems}
                <button
                    class:active={sortMode === 'colored'}
                    on:click={() => (sortMode = 'colored')}
                    type="button"
                >
                    <Palette class="svg-icon" size="12" />
                    色块
                </button>
            {/if}
        </div>
        <div class="pinned-list">
            {#each pinnedItems as item (item.nodeId)}
                <div
                    class="pinned-list-item"
                    class:selected={$activePinnedCard === item.nodeId}
                    class:has-color={$backgroundMode === 'custom' &&
                        Boolean($sectionColors[item.section])}
                    style={getPinnedItemStyle(item.section)}
                    id={item.nodeId}
                    on:click={() => handleClick(item)}
                    on:keydown={(event) => handleKeydown(event, item)}
                    role="button"
                    tabindex="0"
                >
                    <div class="pinned-header">
                        <div class="section-path">{item.section}</div>
                        <div class="pinned-title">{item.title}</div>
                    </div>
                    {#if item.body}
                        <div class="content-preview">{item.body}</div>
                    {/if}
                </div>
            {/each}
        </div>
    {:else}
        <NoItems />
    {/if}
</div>

<style>
    .pinned-cards-container {
        height: 100%;
        width: 100%;

        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
        flex: 1 1 auto;
        padding: 8px 8px 10px;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }

    .pinned-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
    }

    .pinned-sort-toggle {
        display: flex;
        gap: 6px;
        padding: 0 8px;
    }

    .pinned-sort-toggle button {
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        color: var(--text-normal);
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    .pinned-sort-toggle button.active {
        border-color: var(--interactive-accent);
        color: var(--interactive-accent);
    }

    .pinned-list-item {
        padding: 8px 10px;
        cursor: pointer;
        border: 1px solid var(--background-modifier-border);
        border-radius: var(--radius-m);
        background: var(--pinned-item-bg, var(--background-primary-alt));
        color: var(--text-normal);
        transition:
            background-color 0.1s ease,
            border-color 0.1s ease;
    }

    .pinned-list-item:hover {
        background: var(--pinned-item-bg, var(--background-modifier-hover));
    }

    .pinned-list-item:active {
        background: var(
            --pinned-item-bg,
            var(--background-modifier-active-hover)
        );
    }

    .pinned-list-item.selected {
        background: var(--pinned-item-bg, var(--background-primary-alt));
        outline: 2px solid var(--interactive-accent);
        outline-offset: -2px;
    }

    .pinned-header {
        display: flex;
        align-items: baseline;
        gap: 8px;
        justify-content: space-between;
        margin-bottom: 4px;
    }

    .section-path {
        font-size: 12px;
        font-weight: 600;
        color: inherit;
        font-family: var(--font-monospace);
    }

    .pinned-title {
        font-size: 13px;
        font-weight: 600;
        color: inherit;
        text-align: right;
        margin-left: auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 70%;
    }

    .content-preview {
        font-size: 12px;
        color: inherit;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.4;
    }

    :global(.theme-light) .pinned-list-item.has-color {
        color: var(--text-normal);
    }

    :global(.is-mobile) .pinned-cards-container {
        padding-bottom: 24px;
    }
</style>
