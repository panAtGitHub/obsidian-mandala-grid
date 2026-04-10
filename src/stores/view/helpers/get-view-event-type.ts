import { ViewStoreAction } from 'src/stores/view/view-store-actions';

export type ViewEventType = {
    activeNodeHistory?: boolean;
    activeNode?: boolean;
    search?: boolean;
    mainEditor?: boolean;
    sidebarEditor?: boolean;
};

type ActionType = ViewStoreAction['type'];

const eventTypesDictionary: Partial<Record<ActionType, ViewEventType>> = {
    'view/set-active-node/sequential/select-next': {
        activeNodeHistory: true,
    },
    'view/search/set-query': { search: true },
    'view/search/set-results': { search: true },
    'view/search/toggle-input': { search: true },
    'view/search/toggle-section-sort-order': { search: true },
    'view/set-active-node/document': { activeNode: true },
    'view/set-active-node/mouse': { activeNode: true },
    'view/set-active-node/mouse-silent': { activeNode: true },
    'view/set-active-node/search': { activeNode: true },
    'view/set-active-node/keyboard': { activeNode: true },
    'view/set-active-node/keyboard-jump': { activeNode: true },
    'view/set-active-node/core-jump': { activeNode: true },
    'view/set-active-node/9x9-nav': { activeNode: true },
    'view/set-active-node/nx9-nav': { activeNode: true },
    'view/set-active-node/focus-section': { activeNode: true },
    'view/selection/select-all': { activeNode: true },
    'view/editor/enable-main-editor': { mainEditor: true },
    'view/editor/disable-main-editor': { mainEditor: true },
    'view/editor/enable-sidebar-editor': { sidebarEditor: true },
    'view/editor/disable-sidebar-editor': { sidebarEditor: true },
} as const;

const viewEventTypes = new Map(Object.entries(eventTypesDictionary)) as Map<
    ActionType,
    ViewEventType
>;

const none = {};

export const getViewEventType = (type: ActionType): ViewEventType => {
    return viewEventTypes.get(type) || none;
};
