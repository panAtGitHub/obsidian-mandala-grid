<script lang="ts">
    import { getModalState } from 'src/view/modals/split-node-modal/helpers/get-modal-state';
    import { getModalProps } from 'src/view/modals/split-node-modal/helpers/get-modal-props';
    import { SplitNodeMode } from 'src/stores/document/reducers/split-node/split-node';

    const state = getModalState();
    const props = getModalProps();
    const onModeChange = (value: string) => {
        state.mode.set(value as SplitNodeMode);
    };
    const mode = state.mode;
    const disabledModes = state.disabledModes;

    const modes: SplitNodeMode[] = ['headings', 'outline', 'blocks'];
</script>

<div class="split-content-footer" tabindex="0" >
    <div class="modes-container" tabindex="0">
        {#each modes as _mode (_mode)}
            <label data-disabled={disabledModes.has(_mode)}>
                <input
                    checked={$mode === _mode}
                    disabled={disabledModes.has(_mode)}
                    name="mode"
                    on:change={(e) => onModeChange(e.currentTarget.value)}
                    type="radio"
                    value={_mode}
                    tabindex="0"
                />
                {_mode}
            </label>
        {/each}
    </div>

    <div class="buttons-container">
        <button
            class="mod-cta"
            disabled={!$mode}
            on:click={() => props.callbacks.accept()}
            >Split
        </button>
        <button on:click={() => props.callbacks.reject()}>Cancel</button>
    </div>
</div>

<style>
    .split-content-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .modes-container {
        height: 50px;
        display: flex;
        align-items: center;
    }
    .buttons-container {
        display: flex;
        gap: 5px;
        width: fit-content;
    }
    label {
        display: block;
        text-transform: capitalize;
    }
    label[data-disabled='true'] {
        opacity: 0.6;
    }
</style>
