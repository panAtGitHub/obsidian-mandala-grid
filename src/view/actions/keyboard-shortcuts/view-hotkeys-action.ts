import { MandalaView } from 'src/view/view';
import { eventToString } from 'src/view/actions/keyboard-shortcuts/helpers/keyboard-events/event-to-string';
import { viewHotkeys } from 'src/view/actions/keyboard-shortcuts/helpers/commands/update-view-hotkeys-dictionary';
import { handleEscapeKey } from 'src/view/actions/on-escape/helpers/handle-escape-key';
import { onPluginError } from 'src/shared/store/on-plugin-error';
import { isEditing } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/is-editing';
import { KeymapEventHandler } from 'obsidian';

export const viewHotkeysAction = (
    target: HTMLElement,
    {
        view,
    }: {
        view: MandalaView;
    },
) => {
    const state = {
        shift: false,
    };
    const isReadonlyPreviewDialogTarget = (target: HTMLElement | null) =>
        Boolean(target?.closest('[data-cell-preview-dialog="readonly"]'));
    const isAllowedPreviewDialogCommand = (name: string) =>
        name === 'toggle_cell_preview_dialog' ||
        name === 'enable_edit_mode' ||
        name === 'go_up' ||
        name === 'go_down' ||
        name === 'go_left' ||
        name === 'go_right';
    const tryRunHotkeyCommand = (event: KeyboardEvent) => {
        const command = viewHotkeys.current[eventToString(event)];
        if (command) {
            const allow =
                command.editorState === 'editor-on'
                    ? isEditing(view)
                    : command.editorState === 'editor-off'
                      ? !isEditing(view)
                      : true;

            if (allow) {
                try {
                    command.callback(view, event);
                    return true; // 如果执行了命令，直接返回
                } catch (error) {
                    onPluginError(error, 'command', command);
                }
            }
        }
        return false;
    };

    let scopeHandler: KeymapEventHandler | null = null;
    if (view.scope) {
        scopeHandler = view.scope.register(null, null, (event) => {
            if (tryRunHotkeyCommand(event)) {
                return false;
            }
        });
    }

    const keyboardEventHandler = (event: KeyboardEvent) => {
        if (!scopeHandler && tryRunHotkeyCommand(event)) {
            return;
        }

        // 如果没有匹配到命令，或者是 Escape 键
        if (event.key === 'Escape') {
            const contain = handleEscapeKey(view);
            if (contain) return;
        }

        const targetEl = event.target as HTMLElement;
        const readonlyPreviewDialog = isReadonlyPreviewDialogTarget(targetEl);
        if (readonlyPreviewDialog) {
            const command = viewHotkeys.current[eventToString(event)];
            if (command && isAllowedPreviewDialogCommand(command.name)) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        // 仅在没有匹配到命令时拦截输入控件
        if (
            targetEl.localName === 'input' ||
            targetEl.localName === 'textarea' ||
            targetEl.isContentEditable ||
            // 搜索结果列表（或其子元素）获得焦点时，跳过全局快捷键
            targetEl.closest('.mandala-search-results')
        )
            return;
        if (event.shiftKey !== state.shift) {
            state.shift = event.shiftKey;
            view.viewStore.dispatch({
                type: event.shiftKey
                    ? 'view/keyboard/shift/down'
                    : 'view/keyboard/shift/up',
            });
        }
    };

    const onKeyup = (event: KeyboardEvent) => {
        if (event.shiftKey !== state.shift) {
            state.shift = event.shiftKey;
            view.viewStore.dispatch({
                type: event.shiftKey
                    ? 'view/keyboard/shift/down'
                    : 'view/keyboard/shift/up',
            });
        }
    };
    target.addEventListener('keydown', keyboardEventHandler);
    target.addEventListener('keyup', onKeyup);

    return {
        destroy: () => {
            if (view.scope && scopeHandler) {
                view.scope.unregister(scopeHandler);
            }
            target.removeEventListener('keydown', keyboardEventHandler);
            target.removeEventListener('keyup', onKeyup);
        },
    };
};
