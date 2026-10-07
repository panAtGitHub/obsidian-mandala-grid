<script lang="ts">
    import type { NodeStyle } from 'src/mandala-settings/state/types/style-rules-types';

    export let style: NodeStyle;
</script>

<div
    style={`background-color: ${style.color}`}
    class={style.styleVariant === 'background-color'
        ? 'card-background-style'
        : 'card-left-border-style'}
></div>

<style>
</style>
