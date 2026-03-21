<script lang="ts">
    import { setIcon } from 'obsidian';
    import type { ComponentType } from 'svelte';
    import type { CustomIcon } from 'src/helpers/load-custom-icons';

    export let icon: CustomIcon | ComponentType;
    export let className = 'svg-icon';

    let iconEl: HTMLSpanElement;

    const isCustomIcon = (
        value: CustomIcon | ComponentType,
    ): value is CustomIcon => {
        return (
            typeof value === 'object' &&
            value !== null &&
            'svg' in value &&
            'mode' in value &&
            'name' in value
        );
    };

    const applyObsidianIcon = (name: string) => {
        if (iconEl) {
            setIcon(iconEl, name);
        }
    };

    $: if (isCustomIcon(icon)) {
        applyObsidianIcon(icon.name);
    }
</script>

{#if isCustomIcon(icon)}
    <span bind:this={iconEl} class={className} aria-hidden="true"></span>
{:else}
    <svelte:component this={icon} class={className} />
{/if}
