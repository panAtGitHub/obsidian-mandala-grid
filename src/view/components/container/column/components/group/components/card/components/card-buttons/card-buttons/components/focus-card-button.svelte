<script lang="ts">
    import { getView } from '../../../../../../../../../context';
    import FloatingButton from '../../shared/floating-button.svelte';
    import { Focus } from 'lucide-svelte';
    import {
        focusContainer
    } from '../../../../../../../../../../../../stores/view/subscriptions/effects/focus-container';
    import { lang } from '../../../../../../../../../../../../lang/lang';

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
