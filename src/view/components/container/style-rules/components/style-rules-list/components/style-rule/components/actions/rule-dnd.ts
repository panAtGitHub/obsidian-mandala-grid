import { StyleRule } from 'src/stores/settings/types/style-rules-types';
import { MandalaView } from 'src/view/view';
import { get } from 'svelte/store';
import { DocumentStyleRulesStore } from 'src/stores/settings/derived/style-rules';

export const ruleDndAction = (
    element: HTMLElement,
    {
        setDraggedRule,
        setDropTarget,
        resetDragState,
        rule,
        view,
    }: {
        setDraggedRule: (rule: StyleRule) => void;
        rule: StyleRule;
        setDropTarget: (rule: StyleRule, position: 'before' | 'after') => void;
        resetDragState: () => void;
        view: MandalaView;
    },
) => {
    const handleDragStart = (e: DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        const dragHandleRect = target
            .querySelector('.drag-handle')
            ?.getBoundingClientRect();

        const isWithinDragHandle =
            dragHandleRect &&
            e.clientX >= dragHandleRect.left &&
            e.clientX <= dragHandleRect.right &&
            e.clientY >= dragHandleRect.top &&
            e.clientY <= dragHandleRect.bottom;
        if (!isWithinDragHandle) {
            e.preventDefault();
            return;
        }
        const rules = get(DocumentStyleRulesStore(view));
        if (rules.length === 1) {
            e.preventDefault();
            return;
        }

        if (!e.dataTransfer) return;
        e.dataTransfer.effectAllowed = 'move';
        const data = { id: rule.id };
        e.dataTransfer.setData('text/plain', JSON.stringify(data));
        setTimeout(() => {
            setDraggedRule(rule);
        });
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const isAbove = y < rect.height / 2;
        setDropTarget(rule, isAbove ? 'before' : 'after');
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        const parsed = JSON.parse(e.dataTransfer?.getData('text/plain') || '{}') as
            | { id?: string }
            | null;
        if (!parsed?.id) return;
        const rect = target.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const isAbove = y < rect.height / 2;
        view.plugin.settings.dispatch({
            type: 'settings/style-rules/move',
            payload: {
                documentPath: view.file?.path as string,
                droppedId: parsed.id,
                targetId: rule.id,
                position: isAbove ? 'before' : 'after',
            },
        });
        setTimeout(() => {
            resetDragState();
        });
    };

    const handleDragEnd = (e: DragEvent) => {
        e.preventDefault();
        resetDragState();
    };

    element.addEventListener('dragstart', handleDragStart);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);
    element.addEventListener('dragend', handleDragEnd);
    return {
        destroy: () => {
            element.removeEventListener('dragstart', handleDragStart);
            element.removeEventListener('dragover', handleDragOver);
            element.removeEventListener('drop', handleDrop);
            element.removeEventListener('dragend', handleDragEnd);
        },
    };
};
