import {
    ClipboardPaste,
    FileEdit,
    FileMinus,
    FileOutput,
    FilePlus,
    FileSymlink,
    FileUp,
    Heading1,
    Merge,
    Scissors,
    SortAsc,
    SortDesc,
    Split,
} from 'lucide-svelte';
import { UndoableAction } from 'src/stores/document/document-store-actions';
import { Snapshot } from 'src/stores/document/document-state-type';
import { customIcons } from 'src/helpers/load-custom-icons';
import { lang } from './lang';
import { SortChildNodesAction } from 'src/stores/document/reducers/sort/sort-direct-child-nodes';

type Key = UndoableAction['type'];

export const snapshotActionLang: Partial<
    Record<
        Key,
        (snapshot: Snapshot) => { label: string; icon: typeof FileEdit }
    >
> = {
    'DOCUMENT/SET_NODE_CONTENT': (snapshot) => ({
        label:
            lang.modals_snapshots_updated_card +
            snapshot.context.affectedSection,
        icon: FileEdit,
    }),
    'DOCUMENT/INSERT_NODE': (snapshot) => ({
        label:
            lang.modals_snapshots_created_card +
            snapshot.context.affectedSection,
        icon: FilePlus,
    }),
    'DOCUMENT/DROP_NODE': (snapshot) => ({
        label:
            lang.modals_snapshots_dropped_card +
            snapshot.context.affectedSection,
        icon: FileOutput,
    }),
    'DOCUMENT/LOAD_FILE': () => ({
        label: lang.modals_snapshots_document_loaded,
        icon: FileUp,
    }),
    'DOCUMENT/DELETE_NODE': (snapshot) => ({
        label:
            lang.modals_snapshots_deleted_card +
            snapshot.context.affectedSection,
        icon: FileMinus,
    }),
    'DOCUMENT/MOVE_NODE': (snapshot) => ({
        label:
            lang.modals_snapshots_moved_card + snapshot.context.affectedSection,
        icon: FileOutput,
    }),
    'DOCUMENT/MERGE_NODE': (snapshot) => ({
        label:
            lang.modals_snapshots_merged_card +
            snapshot.context.affectedSection,
        icon: Merge,
    }),
    'DOCUMENT/FORMAT_HEADINGS': () => ({
        label: lang.modals_snapshots_formatted_headings,
        icon: Heading1,
    }),
    'DOCUMENT/CUT_NODE': (snapshot) => ({
        label:
            lang.modals_snapshots_cut_card + snapshot.context.affectedSection,
        icon: Scissors,
    }),
    'DOCUMENT/PASTE_NODE': (snapshot) => ({
        label:
            lang.modals_snapshots_pasted_card +
            snapshot.context.affectedSection,
        icon: ClipboardPaste,
    }),
    'DOCUMENT/EXTRACT_BRANCH': (snapshot) => ({
        label:
            lang.modals_snapshots_extracted_card +
            snapshot.context.affectedSection,
        icon: FileSymlink,
        iconHtml: customIcons.cards.svg,
    }),
    'DOCUMENT/SPLIT_NODE': (snapshot) => ({
        label:
            lang.modals_snapshots_split_card + snapshot.context.affectedSection,
        icon: Split,
    }),
    'document/sort-direct-child-nodes': (snapshot) => {
        const action = snapshot.context.action as SortChildNodesAction;
        return {
            label:
                lang.modals_snapshots_sorted_child_cards +
                snapshot.context.affectedSection,
            icon: action.payload.order === 'descending' ? SortDesc : SortAsc,
        };
    },
};
