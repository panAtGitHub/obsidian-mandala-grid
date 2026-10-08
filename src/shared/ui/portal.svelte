<script lang="ts">
    import { onDestroy, onMount } from 'svelte';

    export let target: HTMLElement | null | undefined = activeDocument?.body;
    export let enable = true;

    let ref: HTMLElement;

    onMount(() => {
        if (enable && target) {
            target.appendChild(ref);
        }
    });

    onDestroy(() => {
        if (enable) {
            // Svelte clears bind:this during teardown, before this timer runs.
            const portalElement = ref;
            window.setTimeout(() => {
                portalElement?.remove();
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
