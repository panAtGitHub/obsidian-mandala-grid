import { ViewStoreAction } from 'src/stores/view/view-store-actions';

type ActionType = ViewStoreAction['type'];
const navigationEvents = new Set<ActionType>([
    'view/set-active-node/history/select-previous',
    'view/set-active-node/history/select-next',
    'view/set-active-node/sequential/select-next',
]);

const searchEvents = new Set<ActionType>([
    'view/search/set-query',
    'view/search/set-results',
    'view/search/toggle-input',
]);

const stateEvents = new Set<ActionType>([
    'view/set-active-node/document',
    'view/set-active-node/mouse',
    'view/set-active-node/mouse-silent',
    'view/set-active-node/search',
    'view/set-active-node/keyboard',
    'view/set-active-node/keyboard-jump',
    'view/selection/select-all',
]);

const editMainSplitEvents = new Set<ActionType>([
    'view/editor/enable-main-editor',
    'view/editor/disable-main-editor',
]);
const editSidebarEvents = new Set<ActionType>([
    'view/editor/enable-sidebar-editor',
    'view/editor/disable-sidebar-editor',
]);

export type ViewEventType = {
    activeNodeHistory?: boolean;
    activeNode?: boolean;
    search?: boolean;
    editMainSplit?: boolean;
    editSidebar?: boolean;
};
const cachedResults: { [key: string]: ViewEventType } = {};

export const getViewEventType = (type: ActionType): ViewEventType => {
    if (cachedResults[type]) {
        return cachedResults[type];
    }

    let result: ViewEventType | null = null;

    if (navigationEvents.has(type)) result = { activeNodeHistory: true };
    else if (stateEvents.has(type)) result = { activeNode: true };
    else if (searchEvents.has(type)) result = { search: true };
    else if (editMainSplitEvents.has(type)) result = { editMainSplit: true };
    else if (editSidebarEvents.has(type)) result = { editSidebar: true };
    if (!result) result = {};

    cachedResults[type] = result;

    return result;
};
