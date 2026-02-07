<script lang="ts">
    export let direction: 'up' | 'down' | 'left' | 'right';
    export let size = 14;
    export let strokeWidth = 2.2;
</script>

<svg
    class="mandala-nav-icon"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width={strokeWidth}
    aria-hidden="true"
>
    {#if direction === 'up'}
        <polyline points="18 15 12 9 6 15" />
    {:else if direction === 'down'}
        <polyline points="6 9 12 15 18 9" />
    {:else if direction === 'left'}
        <polyline points="15 18 9 12 15 6" />
    {:else}
        <polyline points="9 18 15 12 9 6" />
    {/if}
</svg>

<style>
    .mandala-nav-icon {
        display: block;
        flex: 0 0 auto;
    }
</style>
