import { MandalaView } from 'src/view/view';
import invariant from 'tiny-invariant';
import { updateCheckbox } from 'src/stores/view/subscriptions/effects/checkbox-listener/helpers/update-checkbox/update-checkbox';

const handleCheckboxChange = (event: Event, view: MandalaView) => {
    const checkbox = event.target as HTMLInputElement;
    if (!checkbox?.classList.contains('task-list-item-checkbox')) {
        return;
    }

    const listItem = checkbox.closest('.task-list-item');
    const card = checkbox.closest('.mandala-card');
    const detailSidebar = checkbox.closest('.mandala-detail-sidebar');
    const contentRoot = card ?? detailSidebar;
    if (!listItem || !contentRoot) {
        return;
    }

    const documentState = view.documentStore.getValue();
    const cardId = card?.id ?? view.viewStore.getValue().document.activeNode;
    const existingContent = documentState.document.content[cardId];
    if (!cardId || !existingContent) {
        return;
    }

    const allItems = Array.from(
        contentRoot.querySelectorAll('.lng-prev .task-list-item'),
    );
    const taskIndex = allItems.indexOf(listItem);
    if (taskIndex === -1) {
        return;
    }
    const content = updateCheckbox(
        taskIndex,
        existingContent.content,
        checkbox.checked,
    );
    if (content) {
        view.documentStore.dispatch({
            type: 'document/update-node-content',
            payload: { nodeId: cardId, content: content.content },
            context: {
                isInSidebar:
                    !!detailSidebar || (!!card && !!card.closest('.sidebar')),
            },
        });
    }
};

export const attachCheckboxListener = (view: MandalaView): (() => void) => {
    const container = view.contentEl;
    invariant(container);
    const listener = (event: Event) => {
        handleCheckboxChange(event, view);
    };
    container.addEventListener('change', listener);
    return () => {
        container.removeEventListener('change', listener);
    };
};
