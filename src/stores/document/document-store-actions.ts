import { NodePosition } from 'src/lib/tree-utils/find/find-node-position';
import { LoadDocumentAction } from 'src/stores/document/reducers/load-document-from-file/load-document-from-file';
import {
    SetMultipleNodeContentAction,
    SetNodeContentAction,
} from 'src/stores/document/reducers/content/set-node-content';
import { FormatHeadingsAction } from 'src/stores/document/reducers/content/format-content/format-headings';
import { PinNodeAction } from 'src/stores/document/reducers/pinned-nodes/pin-node';
import { UnpinNodeAction } from 'src/stores/document/reducers/pinned-nodes/unpin-node';
import { RemoveStalePinnedNodesAction } from 'src/stores/document/reducers/pinned-nodes/remove-stale-pinned-nodes';
import { LoadPinnedNodesAction } from 'src/stores/document/reducers/pinned-nodes/load-pinned-nodes';
import { RefreshGroupParentIdsAction } from 'src/stores/document/reducers/meta/refresh-group-parent-ids';
import {
    MandalaClearEmptySubgridsAction,
    MandalaEnsureChildrenAction,
    MandalaEnsureCoreThemeAction,
    MandalaSwapAction,
} from 'src/stores/document/reducers/mandala/swap-mandala-nodes';

export type VerticalDirection = 'up' | 'down';
export type Direction = VerticalDirection | 'right';
export type AllDirections = Direction | 'left';
export type SavedDocument = {
    data: string;
    position: NodePosition | null;
    frontmatter: string;
};

export type DocumentStoreAction = DocumentAction;

export type DocumentAction =
    | LoadDocumentAction
    | SetNodeContentAction
    | SetMultipleNodeContentAction
    | MandalaSwapAction
    | MandalaEnsureChildrenAction
    | MandalaEnsureCoreThemeAction
    | MandalaClearEmptySubgridsAction
    | FormatHeadingsAction
    | {
          type: 'document/file/update-frontmatter';
          payload: {
              frontmatter: string;
          };
      }
    | PinnedNodesActions
    | MetaActions;

export type UndoableAction =
    | SetNodeContentAction
    | SetMultipleNodeContentAction
    | MandalaSwapAction
    | MandalaEnsureChildrenAction
    | MandalaEnsureCoreThemeAction
    | MandalaClearEmptySubgridsAction
    | LoadDocumentAction
    | FormatHeadingsAction;

export type PinnedNodesActions =
    | PinNodeAction
    | UnpinNodeAction
    | RemoveStalePinnedNodesAction
    | LoadPinnedNodesAction;

export type MetaActions = RefreshGroupParentIdsAction;
