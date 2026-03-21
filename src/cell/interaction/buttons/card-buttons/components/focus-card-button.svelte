<script lang="ts">
    import { Focus } from 'lucide-svelte';
    import { lang } from 'src/lang/lang';
    import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
    import { getView } from 'src/view/components/container/context';
    import FloatingButton from '../../shared/floating-button.svelte';

    export let nodeId: string;
    const view = getView();

    const focusCard = () => {
        view.viewStore.dispatch({
            type: 'view/set-active-node/mouse',
            payload: { id: nodeId },
        });
        focusContainer(view);
    };
</script>

<FloatingButton
    label={lang.card_btn_scroll_to_reveal}
    on:click={focusCard}
    position="up-right"
>
    <Focus class="svg-icon" />
</FloatingButton>
