import {
    FileEdit,
    FileUp,
    Heading1,
} from 'lucide-svelte';
import { UndoableAction } from 'src/stores/document/document-store-actions';
import { Snapshot } from 'src/stores/document/document-state-type';
import { CustomIcon, customIcons } from 'src/helpers/load-custom-icons';
import { lang } from './lang';

type Key = UndoableAction['type'];

export const snapshotActionLang: Partial<
    Record<
        Key,
        (snapshot: Snapshot) => {
            label: string;
            icon: typeof FileEdit | CustomIcon;
        }
    >
> = {
    'document/update-node-content': (snapshot) => ({
        label:
            lang.modals_snapshots_updated_node +
            snapshot.context.affectedSection,
        icon: FileEdit,
    }),
    'document/file/load-from-disk': () => ({
        label: lang.modals_snapshots_document_loaded,
        icon: FileUp,
    }),
    'document/format-headings': () => ({
        label: lang.modals_snapshots_formatted_headings,
        icon: Heading1,
    }),
    'document/mandala/swap': () => ({
        label: lang.modals_snapshots_updated_node,
        icon: customIcons.cards,
    }),
};
