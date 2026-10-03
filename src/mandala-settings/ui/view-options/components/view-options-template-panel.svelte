<script lang="ts">
    import { tx } from 'src/lang/translate';
    import { Frame } from 'lucide-svelte';

    export let show = false;
    export let templatesFilePath: string | null = null;

    export let toggle: () => void;
    export let pickTemplatesFile: () => Promise<void>;
    export let openTemplatesFileFromPath: () => Promise<void>;
    export let saveCurrentThemeAsTemplate: () => Promise<void>;
    export let applyTemplateToCurrentTheme: () => Promise<void>;
</script>

<button class="view-options-menu__item" on:click={toggle}>
    <div class="view-options-menu__icon">
        <Frame class="view-options-menu__icon-svg" size={18} />
    </div>
    <div class="view-options-menu__content">
        <div class="view-options-menu__label">{tx('九宫格模板')}</div>
        <div class="view-options-menu__desc">{tx('保存与应用周边八格')}</div>
    </div>
</button>

{#if show}
    <div class="view-options-menu__submenu">
        <div class="view-options-menu__subsection">
            <button
                class="view-options-menu__subitem"
                on:click={pickTemplatesFile}
            >
                {tx('指定模板文件')}
            </button>
            <button
                class="view-options-menu__path"
                on:click={openTemplatesFileFromPath}
                disabled={!templatesFilePath}
                title={templatesFilePath ?? tx('未指定')}
            >
                {tx('模板文件：')}{templatesFilePath ?? tx('未指定')}
            </button>
        </div>
        <div class="view-options-menu__row view-options-menu__row--inline">
            <button
                class="view-options-menu__subitem"
                on:click={saveCurrentThemeAsTemplate}
            >
                {tx('保存当前九宫格为模板')}
            </button>
            <button
                class="view-options-menu__subitem"
                on:click={applyTemplateToCurrentTheme}
            >
                {tx('将模板应用到当前九宫格')}
            </button>
        </div>
    </div>
{/if}
