<script lang="ts">
    import { activeNodeStore } from '../../../../../stores/view/derived/active-node-store';
    import { getView } from '../../context';
    import { derived } from 'svelte/store';
    import { cpx_to_dpx, LINE_HEIGHT_DPX } from '../event-handlers/on-canvas-click';
    import { searchStore } from 'src/stores/view/derived/search-store';
    import { MinimapRangesStore } from 'src/stores/minimap/derived/minimap-ranges';

    const view = getView();
    const activeCard = activeNodeStore(view);
    const searchResults = searchStore(view);
    const ranges = MinimapRangesStore(view);

    const activeCardRange = derived(
        [activeCard, ranges],
        ([activeCard, ranges]) => {
            if (activeCard) {
                const range = ranges?.[activeCard];
                if (range) {
                    const y_start = cpx_to_dpx(range.y_start);
                    const y_end = cpx_to_dpx(range.y_end);
                    return {
                        y_start: y_start + 2 - LINE_HEIGHT_DPX,
                        height: LINE_HEIGHT_DPX + (y_end - y_start) - 1,
                    };
                }
            }
            return { y_start: 0, height: 0 };
        },
    );

    const searchResultsRanges = derived(
        [searchResults, ranges],
        ([searchResults, ranges]) => {
            if (searchResults) {
                const searchResultsRanges = Array.from(searchResults.results.keys())
                    .map((searchResult) => {
                        const range = ranges?.[searchResult];
                        if (range) {
                            const y_start = cpx_to_dpx(range.y_start);
                            const y_end = cpx_to_dpx(range.y_end);
                            return {
                                y_start: y_start + 2 - LINE_HEIGHT_DPX,
                                height: LINE_HEIGHT_DPX + (y_end - y_start) - 1,
                            };
                        }
                    })
                    .filter((x) => x);
                return searchResultsRanges as {
                    y_start: number;
                    height: number;
                }[];
            }
            return [];
        },
    );
</script>

<div id="indicators-container">
    <div
        class="active-card-indicator"
        style={`top:${$activeCardRange.y_start}px; height:${$activeCardRange.height}px`}
    ></div>

    {#each $searchResultsRanges as searchResultRange}
        <div
            class="search-result-indicator"
            style={`top:${searchResultRange.y_start}px; height:${searchResultRange.height}px`}
        ></div>
    {/each}
</div>

<style>
    .active-card-indicator {
        left: -3px;
        width: 180px;
        position: absolute;
        background-color: var(--color-base-70);
        opacity: 0.3;
        mix-blend-mode: lighten;
    }
    .search-result-indicator {
        left: -3px;
        width: 180px;
        position: absolute;
        background-color: var(--color-yellow);
        opacity: 0.3;
    }
</style>
