<script lang="ts">
    import { onMount } from 'svelte';
    import Check from 'lucide-svelte/icons/check';
    import Button from '../ui/button.svelte';

    export let clicked: () => void;
    export let mounted: () => void;
    export let destroyed: () => void;
    let disabled = false;

    export function setDisabled(value: boolean) {
        disabled = value;
    }

    onMount(() => {
        mounted();
        return destroyed;
    });
</script>

<Button
    label="Runtime check"
    tooltipPosition="top"
    {disabled}
    on:click={clicked}
>
    <Check />
</Button>
