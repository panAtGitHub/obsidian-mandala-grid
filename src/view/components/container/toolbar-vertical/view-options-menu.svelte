<script lang="ts">
    import { getView } from 'src/view/components/container/context';
    import { Square, Palette, Printer, X } from 'lucide-svelte';
    import { Notice, Platform } from 'obsidian';
    import { createEventDispatcher } from 'svelte';
    import { toPng } from 'html-to-image';

    const dispatch = createEventDispatcher();
    const view = getView();

    export let show = false;

    const toggleSquareLayout = () => {
        view.plugin.settings.dispatch({
            type: 'settings/view/toggle-square-layout',
        });
        closeMenu();
    };

    const toggleWhiteTheme = () => {
        view.plugin.settings.dispatch({
            type: 'settings/view/toggle-white-theme',
        });
        closeMenu();
    };

    const exportToPNG = async () => {
        const loadingNotice = new Notice('正在导出 PNG...', 0);
        const target = view.contentEl.querySelector(
            '.mandala-content-wrapper',
        ) as HTMLElement | null;
        if (!target) {
            loadingNotice.hide();
            new Notice('未找到可导出的视图区域。');
            return;
        }

        const backgroundColor = getComputedStyle(
            document.documentElement,
        ).getPropertyValue('--background-primary');
        const safeBackground =
            backgroundColor && backgroundColor.trim().length > 0
                ? backgroundColor.trim()
                : '#ffffff';
        let dataUrl = '';
        try {
            dataUrl = await toPng(target, {
                pixelRatio: 2,
                backgroundColor: safeBackground,
            });
        } catch {
            loadingNotice.hide();
            new Notice('导出失败，请稍后再试。');
            closeMenu();
            return;
        }

        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, '-');
        const defaultName = `mandala-${timestamp}.png`;

        const electronRequire = (
            window as unknown as { require?: (module: string) => unknown }
        ).require;
        const electron = electronRequire?.('electron') as
            | {
                  dialog?: {
                      showSaveDialog: (options: {
                          title: string;
                          defaultPath: string;
                          filters: { name: string; extensions: string[] }[];
                      }) => Promise<{ canceled: boolean; filePath?: string }>;
                  };
                  remote?: {
                      dialog?: {
                          showSaveDialog: (options: {
                              title: string;
                              defaultPath: string;
                              filters: {
                                  name: string;
                                  extensions: string[];
                              }[];
                          }) => Promise<{
                              canceled: boolean;
                              filePath?: string;
                          }>;
                      };
                  };
              }
            | undefined;
        const dialog = electron?.dialog ?? electron?.remote?.dialog;
        if (dialog) {
            const result = await dialog.showSaveDialog({
                title: '导出 PNG',
                defaultPath: defaultName,
                filters: [{ name: 'PNG', extensions: ['png'] }],
            });
            if (!result.canceled && result.filePath) {
                const fs = electronRequire?.('fs') as
                    | {
                          writeFile: (
                              path: string,
                              data: Uint8Array,
                              cb: (err?: Error) => void,
                          ) => void;
                      }
                    | undefined;
                if (!fs) {
                    loadingNotice.hide();
                    new Notice('导出失败，请稍后再试。');
                    closeMenu();
                    return;
                }
                const base64 = dataUrl.split(',')[1] ?? '';
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i += 1) {
                    bytes[i] = binary.charCodeAt(i);
                }
                fs?.writeFile(result.filePath, bytes, (err) => {
                    loadingNotice.hide();
                    if (err) {
                        new Notice('导出失败，请稍后再试。');
                    } else {
                        new Notice('PNG 导出完成。');
                    }
                });
                closeMenu();
                return;
            }
            loadingNotice.hide();
            closeMenu();
            return;
        }

        loadingNotice.hide();
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = defaultName;
        link.click();
        closeMenu();
    };

    const closeMenu = () => {
        dispatch('close');
    };

    // 点击外部关闭菜单 - 使用全局点击事件
    const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.view-options-menu') && !target.closest('[aria-label="视图选项"]')) {
            closeMenu();
        }
    };

    $: if (show) {
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);
    } else {
        document.removeEventListener('click', handleClickOutside);
    }
</script>

{#if show && !Platform.isMobile}
    <div class="view-options-menu">
        <div class="view-options-menu__header">
            <span class="view-options-menu__title">视图选项</span>
            <button
                class="view-options-menu__close"
                on:click={closeMenu}
                aria-label="关闭"
            >
                <X class="icon" size={16} />
            </button>
        </div>
        
        <div class="view-options-menu__items">
            <button class="view-options-menu__item" on:click={toggleSquareLayout}>
                <div class="view-options-menu__icon">
                    <Square class="view-options-menu__icon-svg" size={18} />
                </div>
                <div class="view-options-menu__content">
                    <div class="view-options-menu__label">正方形布局</div>
                    <div class="view-options-menu__desc">将格子规整为正方形</div>
                </div>
            </button>

            <button class="view-options-menu__item" on:click={toggleWhiteTheme}>
                <div class="view-options-menu__icon">
                    <Palette class="view-options-menu__icon-svg" size={18} />
                </div>
                <div class="view-options-menu__content">
                    <div class="view-options-menu__label">纯白背景</div>
                    <div class="view-options-menu__desc">切换为纯白主题</div>
                </div>
            </button>

            <button class="view-options-menu__item" on:click={exportToPNG}>
                <div class="view-options-menu__icon">
                    <Printer class="view-options-menu__icon-svg" size={18} />
                </div>
                <div class="view-options-menu__content">
                    <div class="view-options-menu__label">导出 PNG</div>
                    <div class="view-options-menu__desc">保存当前视图为 PNG</div>
                </div>
            </button>
        </div>
    </div>
{/if}

<style>
    .view-options-menu {
        position: absolute;
        top: 48px;
        right: 8px;
        min-width: 260px;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        overflow: hidden;
        z-index: 1000;
        /* 使用轻量级阴影提升可视性 */
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    .view-options-menu__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        border-bottom: 1px solid var(--background-modifier-border);
        background: var(--background-secondary);
    }

    .view-options-menu__title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-normal);
    }

    .view-options-menu__close {
        background: transparent;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
    }

    .view-options-menu__close:hover {
        background: var(--background-modifier-hover);
        color: var(--text-normal);
    }

    .view-options-menu__items {
        padding: 6px;
    }

    .view-options-menu__item {
        width: 100%;
        display: flex !important;
        align-items: flex-start;
        gap: 12px;
        padding: 10px 12px;
        min-height: 44px;
        height: auto !important;
        border: none !important;
        background: transparent !important;
        cursor: pointer;
        border-radius: 4px;
        text-align: left;
        box-sizing: border-box;
        overflow: hidden;
    }

    .view-options-menu__item:hover {
        background: var(--background-modifier-hover);
    }

    .view-options-menu__item:active {
        background: var(--background-modifier-active-hover);
    }

    .view-options-menu__item + .view-options-menu__item {
        margin-top: 4px;
    }

    .view-options-menu__icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .view-options-menu__icon-svg {
        color: var(--text-accent);
    }

    .view-options-menu__content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .view-options-menu__label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-normal);
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .view-options-menu__desc {
        font-size: 12px;
        color: var(--text-muted);
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
