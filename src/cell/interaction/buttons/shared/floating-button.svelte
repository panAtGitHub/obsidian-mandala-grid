<script lang="ts">
    import classNames from 'classnames';

    export let classes = '';
    export let position: keyof typeof positionClasses;
    export let label: string
    const positionClasses = {
        up: 'position-top',
        right: 'position-right',
        down: 'position-bottom',
        'down-right': 'position-bottom-right',
        'up-right': 'position-top-right',
        collapse:'collapse-button'
    };
</script>

<button
    aria-label={label}
    class={classNames(
        classes,
        positionClasses[position],
        'mandala-floating-button',
    )}
    on:click
>
    <slot />
</button>

