<script lang="ts">
    import { onDestroy, onMount } from 'svelte';

    export let target: HTMLElement | null | undefined =
        activeDocument?.body;
    export let enable = true;

    let ref: HTMLElement;

    onMount(() => {
        if (enable && target) {
            target.appendChild(ref);
        }
    });

    onDestroy(() => {
        if (enable) {
            window.setTimeout(() => {
                if (ref?.parentNode) {
                    ref.parentNode?.removeChild(ref);
                }
            });
        }
    });
</script>

{#if enable}
    <div bind:this={ref}>
        <slot />
    </div>
{:else}
    <slot />
{/if}
