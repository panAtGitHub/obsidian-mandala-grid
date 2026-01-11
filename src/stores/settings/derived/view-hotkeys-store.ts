import { LineageView } from 'src/view/view';
import { derived } from 'svelte/store';
import {
    defaultViewHotkeys,
    StatefulViewCommand,
    StatefulViewHotkey,
} from 'src/view/actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';
import { GroupName, hotkeysGroups } from 'src/lang/hotkey-groups';
import { hotkeyToString } from 'src/view/actions/keyboard-shortcuts/helpers/keyboard-events/hotkey-to-string';
import {
    ConflictingHotkeys,
    HotkeysSearchTerm,
} from 'src/stores/view/derived/hotkeys-store';
import { groupArrayByProperty } from 'src/helpers/array-helpers/group-array-by-property';
import { lang } from 'src/lang/lang';
import Lineage from 'src/main';
import { OutlineModeStore } from 'src/stores/settings/derived/view-settings-store';
import { getDynamicLabel } from 'src/view/components/container/modals/hotkeys/components/helpers/get-dynamic-label';

export const CustomHotkeysStore = (plugin: Lineage) =>
    derived(plugin.settings, (state) => state.hotkeys.customHotkeys);

export const ViewHotkeysStore = (plugin: Lineage) =>
    derived([CustomHotkeysStore(plugin)], ([customHotkeys]) => {
        const viewHotkeys: StatefulViewCommand[] = [];
        for (const defaultViewHotkey of defaultViewHotkeys()) {
            const customHotkey = customHotkeys[defaultViewHotkey.name];

            const baseHotkeys = [...defaultViewHotkey.hotkeys];
            while (baseHotkeys.length < 2) {
                baseHotkeys.push({
                    key: '',
                    modifiers: [],
                    editorState: 'both',
                });
            }

            const hotkeys: StatefulViewHotkey[] = baseHotkeys.map(
                (hotkey, i) => {
                    let isCustom = false;
                    const persistedHotkey =
                        i === 0 && customHotkey?.primary
                            ? customHotkey.primary
                            : i === 1 && customHotkey?.secondary
                              ? customHotkey?.secondary
                              : null;

                    if (persistedHotkey) {
                        if ('key' in persistedHotkey) {
                            isCustom =
                                persistedHotkey.key.length > 0 &&
                                (hotkey.key !== persistedHotkey.key ||
                                    hotkey.modifiers.join('') !==
                                        persistedHotkey.modifiers.join(''));
                            hotkey.key = persistedHotkey.key;
                            hotkey.modifiers = persistedHotkey.modifiers;
                        }
                        if ('editorState' in persistedHotkey) {
                            isCustom =
                                persistedHotkey.editorState !==
                                hotkey.editorState;
                            hotkey.editorState = persistedHotkey.editorState;
                        }
                    }

                    return {
                        ...hotkey,
                        string_representation: hotkeyToString(hotkey),
                        isCustom,
                    };
                },
            );
            viewHotkeys.push({
                ...defaultViewHotkey,
                hotkeys,
                group: hotkeysGroups[defaultViewHotkey.name],
            });
        }

        return viewHotkeys;
    });

export const ConflictLabeledHotkeysStore = (view: LineageView) =>
    derived(
        [ViewHotkeysStore(view.plugin), ConflictingHotkeys(view)],
        ([hotkeys, conflicts]) => {
            let numberOfConflictingHotkeys = 0;
            const groupedByHotkey = new Map<string, Set<StatefulViewCommand>>();
            for (const viewHotkey of hotkeys) {
                for (const hotkey of viewHotkey.hotkeys) {
                    delete hotkey.obsidianConflict;
                    delete hotkey.pluginConflict;

                    if (!hotkey.key) continue;

                    const conflict = conflicts.get(
                        hotkey.string_representation,
                    );
                    if (conflict) {
                        hotkey.obsidianConflict = conflict;
                        numberOfConflictingHotkeys++;
                    } else {
                        let set = groupedByHotkey.get(
                            hotkey.string_representation,
                        );
                        if (!set) {
                            set = new Set();
                            groupedByHotkey.set(
                                hotkey.string_representation,
                                set,
                            );
                        }
                        set.add(viewHotkey);
                    }
                }
            }
            const conflicting = [...groupedByHotkey.entries()].filter(
                (v) => v[1].size > 1,
            );
            for (const [string_representation, hotkeys] of conflicting) {
                const conflicting = Array.from(hotkeys)
                    .map((h) => h.name)
                    .join(', ');
                for (const pluginHotkey of hotkeys) {
                    for (const hotkey of pluginHotkey.hotkeys) {
                        if (!hotkey.key) continue;
                        if (
                            hotkey.string_representation ===
                            string_representation
                        ) {
                            hotkey.pluginConflict = conflicting;
                            numberOfConflictingHotkeys++;
                        }
                    }
                }
            }
            return {
                hotkeys: [...hotkeys],
                numberOfConflictingHotkeys,
            };
        },
    );

type GroupedHotkeys = Record<GroupName, StatefulViewCommand[]>;
export const FilteredHotkeysStore = (view: LineageView) =>
    derived(
        [
            ConflictLabeledHotkeysStore(view),
            HotkeysSearchTerm(view),
            OutlineModeStore(view),
        ],
        ([hotkeys, searchTerm, outlineMode]) => {
            let array: StatefulViewCommand[] = [];
            if (searchTerm) {
                array = hotkeys.hotkeys.filter((c) => {
                    const fullName = getDynamicLabel(
                        c.name,
                        outlineMode,
                    ).toLowerCase();
                    return (
                        fullName.includes(searchTerm) ||
                        c.group.toLowerCase().includes(searchTerm)
                    );
                });
            } else array = hotkeys.hotkeys;
            return {
                hotkeys: groupArrayByProperty(array, 'group', {
                    [lang.hkg_create_nodes]: [],
                    [lang.hkg_edit_nodes]: [],
                    [lang.hkg_move_nodes]: [],
                    [lang.hkg_merge_nodes]: [],
                    [lang.hkg_delete_nodes]: [],
                    [lang.hkg_clipboard]: [],
                    [lang.hkg_navigation]: [],
                    [lang.hkg_selection]: [],
                    [lang.hkg_scrolling]: [],
                    [lang.hkg_history]: [],
                    [lang.hkg_search]: [],
                    [lang.hkg_zoom]: [],
                    [lang.hkg_outline]: [],
                    [lang.hkg_mandala]: [],
                } satisfies GroupedHotkeys),
                numberOfConflictingHotkeys: hotkeys.numberOfConflictingHotkeys,
            };
        },
    );
