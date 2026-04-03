type CreateSettingsFoldCardOptions = {
    parentEl: HTMLElement;
    title: string;
    opened?: boolean;
    onToggle?: (opened: boolean) => void;
};

export type SettingsFoldCard = {
    cardEl: HTMLDivElement;
    headerEl: HTMLButtonElement;
    contentEl: HTMLDivElement;
    setOpen: (opened: boolean) => void;
};

export const createSettingsFoldCard = ({
    parentEl,
    title,
    opened = false,
    onToggle,
}: CreateSettingsFoldCardOptions): SettingsFoldCard => {
    const cardEl = parentEl.createDiv({ cls: 'mandala-settings-card' });
    const headerEl = cardEl.createEl('button', {
        cls: 'mandala-settings-card__header',
        attr: {
            type: 'button',
        },
    });
    headerEl.createSpan({
        cls: 'mandala-settings-card__title',
        text: title,
    });
    headerEl.createSpan({
        cls: 'mandala-settings-card__chevron',
        text: '⌄',
    });

    const contentEl = cardEl.createDiv({
        cls: 'mandala-settings-card__content',
    });

    const setOpen = (nextOpen: boolean) => {
        cardEl.classList.toggle('is-open', nextOpen);
        contentEl.classList.toggle('is-open', nextOpen);
        headerEl.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
    };

    headerEl.addEventListener('click', () => {
        const nextOpen = !cardEl.classList.contains('is-open');
        setOpen(nextOpen);
        onToggle?.(nextOpen);
    });

    setOpen(opened);

    return {
        cardEl,
        headerEl,
        contentEl,
        setOpen,
    };
};
