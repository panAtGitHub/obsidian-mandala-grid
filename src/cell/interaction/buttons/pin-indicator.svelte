<script lang="ts">
    import { Pin } from 'lucide-svelte';
</script>

<span class="pin-indicator">
    <Pin class="svg-icon" size="10" />
</span>

<style>
    .pin-indicator {
        position: absolute;
        left: -20px;
        top: 0px;
        cursor: default;


       & svg {
            fill: var(--text-muted);
            color: var(--text-muted);
           width:16px !important;
           height:16px !important;

        }
    }
</style>
