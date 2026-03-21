<script lang="ts">
    import { NodeStyle } from 'src/stores/settings/types/style-rules-types';

    export let style: NodeStyle;
</script>

<div
    style={`background-color: ${style.color}`}
    class={style.styleVariant === 'background-color'
        ? 'card-background-style'
        : 'card-left-border-style'}
/>

<style>

</style>
