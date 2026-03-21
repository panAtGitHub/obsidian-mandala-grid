import { MandalaView } from 'src/view/view';
import { selectCard } from 'src/cell/viewmodel/content-event-handlers/handle-links/helpers/select-card';

export const handleLocalBlockLink = (view: MandalaView, id: string) => {
    const element = view.container!.querySelector(
        `[data-block-id="^${id}"`,
    ) as HTMLElement;
    if (element) {
        const card = element.closest('.mandala-card');
        if (card && card.id) {
            void selectCard(view, card.id);
            return true;
        }
    }
};
