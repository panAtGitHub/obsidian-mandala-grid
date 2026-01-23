import { navigateCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/navigate-commands';
import { editCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/edit-commands';
import { createCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/create-commands';
import { moveCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/move-commands';
import { mergeCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/merge-commands';
import { historyCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/history-commands';
import { clipboardCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/clipboard-commands';
import { selectionCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/selection-commands';
import { scrollCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/scroll-commands';
import { deleteNode } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/delete-node';
import { moveNode } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/move-node';
import { MandalaView } from 'src/view/view';
import { Hotkey, Notice } from 'obsidian';
import { CommandName, GroupName } from 'src/lang/hotkey-groups';
import {
    enterSubgridForNode,
    exitCurrentSubgrid
} from 'src/view/helpers/mandala/mobile-navigation';
import { get } from 'svelte/store';
import { singleColumnStore } from 'src/stores/document/derived/columns-store';
import { findChildGroup } from 'src/lib/tree-utils/find/find-child-group';
import { getMandalaLayout } from 'src/view/helpers/mandala/mandala-grid';
import { toggleMobileInteractionMode } from 'src/stores/view/mobile-interaction-store';

export type HotkeyEditorState = 'editor-on' | 'editor-off' | 'both';
export type HotkeyPreferences = {
    editorState: HotkeyEditorState;
};
export type ViewHotkey = Hotkey & HotkeyPreferences;
export type PersistedViewHotkey =
    | Hotkey
    | HotkeyPreferences
    | (Hotkey & HotkeyPreferences);
export type DefaultViewCommand = {
    callback: (view: MandalaView, event: KeyboardEvent) => void;
    hotkeys: ViewHotkey[];
    name: CommandName;
};
export type StatefulViewHotkey = ViewHotkey & {
    string_representation: string;
    obsidianConflict?: string;
    pluginConflict?: string;
    isCustom?: boolean;
};
export type StatefulViewCommand = DefaultViewCommand & {
    hotkeys: StatefulViewHotkey[];
    group: GroupName;
};

type SwapDirection = 'up' | 'down' | 'left' | 'right';
const swapDeltas: Record<SwapDirection, { dr: number; dc: number }> = {
    up: { dr: -1, dc: 0 },
    down: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 },
};

const swapMandalaCell = (view: MandalaView, direction: SwapDirection) => {
    if (view.mandalaMode !== '3x3') return;

    const viewState = view.viewStore.getValue();
    if (viewState.document.editing.activeNodeId) return;

    const docState = view.documentStore.getValue();
    if (!docState.meta.isMandala) return;

    const activeNodeId = viewState.document.activeNode;
    const activeSectionRaw = docState.sections.id_section[activeNodeId];
    if (!activeSectionRaw) return;

    const subgridTheme = viewState.ui.mandala.subgridTheme;
    const gridOrientation =
        view.plugin.settings.getValue().view.mandalaGridOrientation ??
        'left-to-right';
    const { slotPositions, themeGrid } = getMandalaLayout(gridOrientation);
    const theme = subgridTheme ?? '1';

    const pos = (() => {
        if (activeSectionRaw === theme) return { row: 1, col: 1 };
        if (activeSectionRaw.startsWith(`${theme}.`)) {
            const suffix = activeSectionRaw.slice(theme.length + 1);
            if (suffix.includes('.')) return null;
            return slotPositions[suffix] ?? null;
        }
        return null;
    })();
    if (!pos) return;

    const { dr, dc } = swapDeltas[direction];
    const nextRow = pos.row + dr;
    const nextCol = pos.col + dc;

    const targetSection = (() => {
        if (nextRow === 1 && nextCol === 1) return theme;
        const slot = themeGrid[nextRow]?.[nextCol] ?? null;
        return slot ? `${theme}.${slot}` : null;
    })();
    if (!targetSection) return;

    const targetNodeId = docState.sections.section_id[targetSection];
    if (!targetNodeId) return;

    view.documentStore.dispatch({
        type: 'document/mandala/swap',
        payload: {
            sourceNodeId: activeNodeId,
            targetNodeId,
        },
    });

    view.viewStore.dispatch({
        type: 'view/set-active-node/mouse-silent',
        payload: { id: targetNodeId },
    });
};

type CoreJumpDirection = 'up' | 'down';
const jumpCoreTheme = (view: MandalaView, direction: CoreJumpDirection) => {
    if (!view.mandalaMode) return;

    const docState = view.documentStore.getValue();
    if (!docState.meta.isMandala) return;

    const activeNodeId = view.viewStore.getValue().document.activeNode;
    const activeSection = docState.sections.id_section[activeNodeId];
    if (!activeSection) return;

    const core = activeSection.split('.')[0];
    const coreNumber = Number(core);
    if (!core || Number.isNaN(coreNumber)) return;

    if (direction === 'down') {
        const coreNodeId = docState.sections.section_id[core];
        if (!coreNodeId) return;

        const content = docState.document.content[coreNodeId]?.content ?? '';
        if (!content.trim()) {
            new Notice('请先填写核心格内容，再进入下一核心九宫');
            return;
        }

        const nextCore = String(coreNumber + 1);
        view.documentStore.dispatch({
            type: 'document/mandala/ensure-core-theme',
            payload: { theme: nextCore },
        });
        const nextNodeId =
            view.documentStore.getValue().sections.section_id[nextCore];
        if (!nextNodeId) return;

        view.viewStore.dispatch({
            type: 'view/mandala/subgrid/enter',
            payload: { theme: nextCore },
        });
        view.viewStore.dispatch({
            type: 'view/set-active-node/mouse-silent',
            payload: { id: nextNodeId },
        });
        return;
    }

    if (coreNumber <= 1) return;

    const prevCore = String(coreNumber - 1);
    const prevNodeId = docState.sections.section_id[prevCore];
    if (!prevNodeId) return;

    view.viewStore.dispatch({
        type: 'view/mandala/subgrid/enter',
        payload: { theme: prevCore },
    });
    view.viewStore.dispatch({
        type: 'view/set-active-node/mouse-silent',
        payload: { id: prevNodeId },
    });
};

export const defaultViewHotkeys = (): DefaultViewCommand[] => [
    ...navigateCommands(),
    ...editCommands(),
    // ...createCommands(),
    // ...moveCommands(),
    // ...mergeCommands(),
    // ...clipboardCommands(),
    ...historyCommands(),
    // ...selectionCommands(),
    // ...scrollCommands(),
    /* {
        name: 'move_node_up',
        callback: (view) => {
            if (view.mandalaMode === '3x3') swapMandalaCell(view, 'up');
            else moveNode(view, 'up');
        },
        hotkeys: [
            { key: 'K', modifiers: ['Alt', 'Shift'], editorState: 'both' },
            {
                key: 'ArrowUp',
                modifiers: ['Alt', 'Shift'],
                editorState: 'both',
            },
        ],
    },
    {
        name: 'move_node_down',
        callback: (view) => {
            if (view.mandalaMode === '3x3') swapMandalaCell(view, 'down');
            else moveNode(view, 'down');
        },
        hotkeys: [
            { key: 'J', modifiers: ['Alt', 'Shift'], editorState: 'both' },
            {
                key: 'ArrowDown',
                modifiers: ['Alt', 'Shift'],
                editorState: 'both',
            },
        ],
    },
    {
        name: 'move_node_right',
        callback: (view) => {
            if (view.mandalaMode === '3x3') swapMandalaCell(view, 'right');
            else moveNode(view, 'right');
        },
        hotkeys: [
            { key: 'L', modifiers: ['Alt', 'Shift'], editorState: 'both' },
            {
                key: 'ArrowRight',
                modifiers: ['Alt', 'Shift'],
                editorState: 'both',
            },
        ],
    },
    {
        name: 'move_node_left',
        callback: (view) => {
            if (view.mandalaMode === '3x3') swapMandalaCell(view, 'left');
            else moveNode(view, 'left');
        },
        hotkeys: [
            { key: 'H', modifiers: ['Alt', 'Shift'], editorState: 'both' },
            {
                key: 'ArrowLeft',
                modifiers: ['Alt', 'Shift'],
                editorState: 'both',
            },
        ],
    }, */
    /* {
        name: 'delete_card',
        callback: (view, e) => {
            const document = view.viewStore.getValue().document;

            e.preventDefault();
            e.stopPropagation();
            deleteNode(view, document.activeNode, true);
        },
        hotkeys: [
            { key: 'Backspace', modifiers: ['Mod'], editorState: 'editor-off' },
        ],
    }, */
    {
        name: 'toggle_search_input',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            view.viewStore.dispatch({ type: 'view/search/toggle-input' });
        },
        hotkeys: [
            { key: '/', modifiers: [], editorState: 'editor-off' },
            { key: 'f', modifiers: ['Alt'], editorState: 'both' },
        ],
    },
    /* {
        name: 'zoom_in',
        callback: (view, e) => {
            e.preventDefault();
            view.plugin.settings.dispatch({
                type: 'settings/view/set-zoom-level',
                payload: { direction: 'in' },
            });
        },
        hotkeys: [{ key: '=', modifiers: ['Mod'], editorState: 'both' }],
    },
    {
        name: 'zoom_out',
        callback: (view, e) => {
            e.preventDefault();
            view.plugin.settings.dispatch({
                type: 'settings/view/set-zoom-level',
                payload: { direction: 'out' },
            });
        },
        hotkeys: [{ key: '-', modifiers: ['Mod'], editorState: 'both' }],
    },
    {
        name: 'zoom_reset',
        callback: (view, e) => {
            e.preventDefault();
            view.plugin.settings.dispatch({
                type: 'settings/view/set-zoom-level',
                payload: { value: 1 },
            });
        },
        hotkeys: [{ key: '0', modifiers: ['Mod'], editorState: 'both' }],
    }, */
    /*{
        name: 'toggle_outline_mode',
        callback: (view) => {
            view!.plugin.settings.dispatch({
                type: 'settings/view/modes/toggle-outline-mode',
            });
        },
        hotkeys: [{ key: 'o', modifiers: ['Alt'], editorState: 'both' }],
    },*/
    /* {
        name: 'toggle_mandala_mode',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            view.plugin.settings.dispatch({
                type: 'settings/view/mandala/toggle-mode',
            });
        },
        hotkeys: [],
    }, */
    {
        name: 'toggle_lock_mode',
        callback: (view, e) => {
            if (view.mandalaMode === null) return;
            e.preventDefault();
            e.stopPropagation();
            toggleMobileInteractionMode();
        },
        hotkeys: [],
    },
    {
        name: 'enter_subgrid',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();

            const state = view.viewStore.getValue();
            const activeNodeId = state.document.activeNode;
            enterSubgridForNode(view, activeNodeId);
        },
        hotkeys: [],
    },
    {
        name: 'jump_core_next',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            jumpCoreTheme(view, 'down');
        },
        hotkeys: [
            {
                key: 'ArrowDown',
                modifiers: ['Mod', 'Shift'],
                editorState: 'editor-off',
            },
        ],
    },
    {
        name: 'jump_core_prev',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            jumpCoreTheme(view, 'up');
        },
        hotkeys: [
            {
                key: 'ArrowUp',
                modifiers: ['Mod', 'Shift'],
                editorState: 'editor-off',
            },
        ],
    },
    {
        name: 'exit_subgrid',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            exitCurrentSubgrid(view);
        },
        hotkeys: [],
    },
    /* {
        name: 'swap_cell_up',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            swapMandalaCell(view, 'up');
        },
        hotkeys: [],
    },
    {
        name: 'swap_cell_down',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            swapMandalaCell(view, 'down');
        },
        hotkeys: [],
    },
    {
        name: 'swap_cell_left',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            swapMandalaCell(view, 'left');
        },
        hotkeys: [],
    },
    {
        name: 'swap_cell_right',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            swapMandalaCell(view, 'right');
        },
        hotkeys: [],
    }, */
    /* {
        name: 'toggle_collapse',
        callback: (view, e) => {
            e.preventDefault();
            if (!get(singleColumnStore(view))) return;
            view.viewStore.dispatch({
                type: 'view/outline/toggle-collapse-node',
                payload: {
                    id: view.viewStore.getValue().document.activeNode,
                },
            });
        },
        hotkeys: [{ key: '=', modifiers: ['Alt'], editorState: 'both' }],
    },
    {
        name: 'toggle_collapse_all',
        callback: (view, e) => {
            e.preventDefault();
            if (!get(singleColumnStore(view))) return;
            view.viewStore.dispatch({
                type: 'view/outline/toggle-collapse-all',
            });
        },
        hotkeys: [{ key: '=', modifiers: ['Alt', 'Mod'], editorState: 'both' }],
    }, */
];
