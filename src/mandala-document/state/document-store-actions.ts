import { NodePosition } from 'src/mandala-document/tree-utils/find/find-node-position';
import { LoadDocumentAction } from 'src/mandala-document/state/reducers/load-document-from-file/load-document-from-file';
import {
    SetMultipleNodeContentAction,
    SetNodeContentAction,
} from 'src/mandala-document/state/reducers/content/set-node-content';
import { FormatHeadingsAction } from 'src/mandala-document/state/reducers/content/format-content/format-headings';
import { PinNodeAction } from 'src/mandala-document/state/reducers/pinned-nodes/pin-node';
import { UnpinNodeAction } from 'src/mandala-document/state/reducers/pinned-nodes/unpin-node';
import { RemoveStalePinnedNodesAction } from 'src/mandala-document/state/reducers/pinned-nodes/remove-stale-pinned-nodes';
import { LoadPinnedNodesAction } from 'src/mandala-document/state/reducers/pinned-nodes/load-pinned-nodes';
import { RefreshGroupParentIdsAction } from 'src/mandala-document/state/reducers/meta/refresh-group-parent-ids';
import {
    MandalaClearEmptySubgridsAction,
    MandalaEnsureChildrenAction,
    MandalaEnsureCoreThemeAction,
    MandalaSwapAction,
} from 'src/mandala-document/state/reducers/mandala/swap-mandala-nodes';

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
