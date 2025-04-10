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
    'document/update-node-content': (snapshot) => ({
        label:
            lang.modals_snapshots_updated_node +
            snapshot.context.affectedSection,
        icon: FileEdit,
    }),
    'document/add-node': (snapshot) => ({
        label:
            lang.modals_snapshots_created_node +
            snapshot.context.affectedSection,
        icon: FilePlus,
    }),
    'document/drop-node': (snapshot) => ({
        label:
            lang.modals_snapshots_dropped_node +
            snapshot.context.affectedSection,
        icon: FileOutput,
    }),
    'document/file/load-from-disk': () => ({
        label: lang.modals_snapshots_document_loaded,
        icon: FileUp,
    }),
    'document/delete-node': (snapshot) => ({
        label:
            lang.modals_snapshots_deleted_section +
            snapshot.context.affectedSection,
        icon: FileMinus,
    }),
    'document/move-node': (snapshot) => ({
        label:
            lang.modals_snapshots_moved_node + snapshot.context.affectedSection,
        icon: FileOutput,
    }),
    'document/merge-node': (snapshot) => ({
        label:
            lang.modals_snapshots_merged_node +
            snapshot.context.affectedSection,
        icon: Merge,
    }),
    'document/format-headings': () => ({
        label: lang.modals_snapshots_formatted_headings,
        icon: Heading1,
    }),
    'document/cut-node': (snapshot) => ({
        label:
            lang.modals_snapshots_cut_section +
            snapshot.context.affectedSection,
        icon: Scissors,
    }),
    'document/paste-node': (snapshot) => ({
        label:
            lang.modals_snapshots_pasted_section +
            snapshot.context.affectedSection,
        icon: ClipboardPaste,
    }),
    'document/extract-node': (snapshot) => ({
        label:
            lang.modals_snapshots_extracted_node +
            snapshot.context.affectedSection,
        icon: FileSymlink,
        iconHtml: customIcons.cards.svg,
    }),
    'document/split-node': (snapshot) => ({
        label:
            lang.modals_snapshots_split_node + snapshot.context.affectedSection,
        icon: Split,
    }),
    'document/sort-direct-child-nodes': (snapshot) => {
        const action = snapshot.context.action as SortChildNodesAction;
        return {
            label:
                lang.modals_snapshots_sorted_child_nodes +
                snapshot.context.affectedSection,
            icon: action.payload.order === 'descending' ? SortDesc : SortAsc,
        };
    },
};
