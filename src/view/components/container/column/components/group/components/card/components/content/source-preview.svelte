<script lang="ts">
    import { getView } from 'src/view/components/container/context';
    import { onDestroy } from 'svelte';
    import { contentStore } from 'src/stores/document/derived/content-store';

    export let nodeId: string;

    const view = getView();

    let content = '';
    let unsubscribe: () => void = () => {};
    let currentNodeId = '';

    const subscribeToNode = (nextNodeId: string) => {
        if (currentNodeId === nextNodeId) return;
        unsubscribe();
        currentNodeId = nextNodeId;
        const store = contentStore(view, nextNodeId);
        unsubscribe = store.subscribe((value) => {
            content = value;
        });
    };

    $: if (nodeId) {
        subscribeToNode(nodeId);
    }

    onDestroy(() => {
        unsubscribe();
    });
</script>

<pre class="source-preview">{content}</pre>

<style>
    .source-preview {
        margin: 0;
        width: 100%;
        min-height: var(--min-node-height);
        font-size: var(--font-text-size);
        padding: 6px 6px 10px 12px;
        white-space: pre-wrap;
        word-break: break-word;
        color: var(--text-normal);
        font-family: var(--font-monospace);
        line-height: 1.5;
    }
</style>
