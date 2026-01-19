<script lang="ts">
    import { derived } from 'svelte/store';
    import { PinnedNodesStore } from '../../../../../../stores/document/derived/pinned-nodes-store';
    import { getView } from '../../../context';
    import { ActivePinnedCardStore } from '../../../../../../stores/view/derived/pinned-cards-sidebar';
    import NoItems from '../no-items/no-items.svelte';
    import {
        scrollActivePinnedNode
    } from 'src/view/components/container/left-sidebar/components/pinned-cards/actions/scroll-active-pinned-node';
    import {
        navigateToSearchResult
    } from 'src/view/helpers/mandala/search-utils';
    import {
        setActiveSidebarNode
    } from 'src/stores/view/subscriptions/actions/set-active-sidebar-node';
    import { SectionColorBySectionStore } from 'src/stores/document/derived/section-colors-store';
    import {
        createSectionColorIndex,
        applyOpacityToHex,
        parseSectionColorsFromFrontmatter,
        SECTION_COLOR_KEYS,
    } from 'src/view/helpers/mandala/section-colors';
    import {
        MandalaBackgroundModeStore,
        MandalaSectionColorOpacityStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import { Palette, Pin } from 'lucide-svelte';

    const view = getView();
    const pinnedNodesArray = PinnedNodesStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);
    const sectionColors = SectionColorBySectionStore(view);

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
            lines.slice(titleIndex + 1).find((line) => line.trim().length > 0) ||
            '';
        return { title, body: bodyLine.trimEnd() };
    };

    const pinnedState = derived(
        [pinnedNodesArray, view.documentStore],
        ([$pinnedNodesArray, $doc]) => {
            const orderMap = new Map<string, number>();
            $pinnedNodesArray.forEach((nodeId, index) => {
                const section = $doc.sections.id_section[nodeId];
                if (section) {
                    orderMap.set(section, index);
                }
            });
            const colorMap = parseSectionColorsFromFrontmatter(
                $doc.file.frontmatter,
            );
            const colorIndex = createSectionColorIndex(colorMap);
            const colorOrderMap = new Map<string, number>();
            for (const key of SECTION_COLOR_KEYS) {
                const sections = colorMap[key] || [];
                sections.forEach((section, idx) => {
                    colorOrderMap.set(section, idx);
                });
            }
            const items = $pinnedNodesArray
                .map((nodeId) => {
                    const section = $doc.sections.id_section[nodeId];
                    if (!section) return null;
                    const content =
                        $doc.document.content[nodeId]?.content || '';
                    const preview = parsePinnedContent(content);
                    return {
                        nodeId,
                        section,
                        title: preview.title,
                        body: preview.body,
                        colorKey: colorIndex[section] || null,
                    };
                })
                .filter((item): item is PinnedItem => Boolean(item));
            const coloredItems: PinnedItem[] = [];
            for (const key of SECTION_COLOR_KEYS) {
                const sections = colorMap[key] || [];
                for (const section of sections) {
                    const nodeId = $doc.sections.section_id[section];
                    if (!nodeId) continue;
                    const content =
                        $doc.document.content[nodeId]?.content || '';
                    const preview = parsePinnedContent(content);
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

    const getColorRank = (colorKey: string | null) => {
        if (!colorKey) return Number.POSITIVE_INFINITY;
        const index = SECTION_COLOR_KEYS.indexOf(
            colorKey as (typeof SECTION_COLOR_KEYS)[number],
        );
        return index === -1 ? Number.POSITIVE_INFINITY : index;
    };

    const getPinnedOrder = (
        orderMap: Map<string, number>,
        section: string,
    ) => orderMap.get(section) ?? Number.POSITIVE_INFINITY;

    const getColorOrder = (
        orderMap: Map<string, number>,
        section: string,
    ) => orderMap.get(section) ?? Number.POSITIVE_INFINITY;

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
</script>

<div class="pinned-cards-container" use:scrollActivePinnedNode>
    {#if $pinnedState.items.length > 0}
        <div class="pinned-sort-toggle">
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
            <button
                class:active={sortMode === 'colored'}
                on:click={() => (sortMode = 'colored')}
                type="button"
            >
                <Palette class="svg-icon" size="12" />
                色块
            </button>
        </div>
        <div class="pinned-list">
            {#each pinnedItems as item (item.nodeId)}
                <div
                    class="pinned-list-item"
                    class:selected={$activePinnedCard === item.nodeId}
                    class:has-color={
                        $backgroundMode === 'custom' &&
                        Boolean($sectionColors[item.section])
                    }
                    style={item.section && $backgroundMode === 'custom' && $sectionColors[item.section]
                        ? `--pinned-item-bg: ${applyOpacityToHex(
                              $sectionColors[item.section],
                              $sectionColorOpacity / 100,
                          )};`
                        : undefined}
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
        <NoItems variant="pinned" />
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
        background: var(--pinned-item-bg, #fff);
        transition: background-color 0.1s ease, border-color 0.1s ease;
    }

    .pinned-list-item:hover {
        background: var(--pinned-item-bg, #f5f5f5);
    }

    .pinned-list-item:active {
        background: var(--pinned-item-bg, var(--background-modifier-active-hover));
    }

    .pinned-list-item.selected {
        background: var(--pinned-item-bg, #fff);
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
