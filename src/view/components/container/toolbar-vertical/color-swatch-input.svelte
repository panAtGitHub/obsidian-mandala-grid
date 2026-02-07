<script lang="ts">
    export let value: string;
    export let onInput: (event: Event) => void;
    export let ariaLabel: string;

    let inputRef: HTMLInputElement | null = null;

    const openPicker = () => {
        inputRef?.click();
    };
</script>

<div class="color-swatch-input">
    <button
        type="button"
        class="color-swatch-input__swatch"
        style={`background-color: ${value};`}
        aria-label={ariaLabel}
        on:click|stopPropagation={openPicker}
    />
    <input
        bind:this={inputRef}
        class="color-swatch-input__native"
        type="color"
        value={value}
        aria-label={ariaLabel}
        on:input={onInput}
    />
</div>

<style>
    .color-swatch-input {
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .color-swatch-input__swatch {
        width: 28px;
        height: 20px;
        padding: 0;
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        background: var(--background-primary);
        cursor: pointer;
    }

    :global(.is-mobile) .color-swatch-input__swatch {
        width: 28px;
        height: 28px;
        border-radius: 8px;
    }

    .color-swatch-input__native {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
    }
</style>

