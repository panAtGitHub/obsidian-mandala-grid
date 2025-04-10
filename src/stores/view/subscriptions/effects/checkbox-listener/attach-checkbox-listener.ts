import { LineageView } from 'src/view/view';
import invariant from 'tiny-invariant';
import { updateCheckbox } from 'src/stores/view/subscriptions/effects/checkbox-listener/helpers/update-checkbox/update-checkbox';

const handleCheckboxChange = (event: Event, view: LineageView) => {
    const checkbox = event.target as HTMLInputElement;
    if (!checkbox?.classList.contains('task-list-item-checkbox')) {
        return;
    }

    const listItem = checkbox.closest('.task-list-item');
    const card = checkbox.closest('.lineage-card');
    if (!listItem || !card) {
        return;
    }

    const documentState = view.documentStore.getValue();
    const cardId = card.id;
    const existingContent = documentState.document.content[cardId];
    if (!cardId || !existingContent) {
        return;
    }

    const allItems = Array.from(
        card.querySelectorAll('.lng-prev .task-list-item'),
    );
    const taskIndex = allItems.indexOf(listItem);
    const content = updateCheckbox(
        taskIndex,
        existingContent.content,
        checkbox.checked,
    );
    if (content) {
        view.documentStore.dispatch({
            type: 'document/update-node-content',
            payload: { nodeId: cardId, content: content.content },
            context: { isInSidebar: !!card.closest('.sidebar') },
        });
    }
};

export const attachCheckboxListener = (view: LineageView): (() => void) => {
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
