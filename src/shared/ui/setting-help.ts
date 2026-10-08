import { tx } from 'src/lang/translate';

let nextHelpId = 0;

// Shared by Svelte options and Obsidian Setting rows.
export const settingHelp = (node: HTMLElement, initialText: string) => {
    const doc = node.ownerDocument;
    const win = doc.defaultView;
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'mandala-setting-help';
    button.textContent = 'ⓘ';
    button.setAttribute('aria-label', tx('查看说明'));
    button.setAttribute('aria-expanded', 'false');
    const tooltip = doc.createElement('div');
    tooltip.className = 'mandala-setting-help-tooltip';
    tooltip.id = `mandala-setting-help-${++nextHelpId}`;
    tooltip.setAttribute('role', 'tooltip');
    button.setAttribute('aria-describedby', tooltip.id);
    node.appendChild(button);
    let text = initialText;
    let pinned = false;
    const hide = () => {
        pinned = false;
        tooltip.remove();
        button.setAttribute('aria-expanded', 'false');
    };
    const show = () => {
        tooltip.textContent = text;
        doc.body.appendChild(tooltip);
        const rect = button.getBoundingClientRect();
        const width = Math.min(
            300,
            Math.max(120, (win?.innerWidth ?? 320) - 24),
        );
        tooltip.style.width = `${width}px`;
        tooltip.style.left = `${Math.max(12, Math.min(rect.right - width, (win?.innerWidth ?? 320) - width - 12))}px`;
        const height = tooltip.getBoundingClientRect().height;
        const below = rect.bottom + 6;
        tooltip.style.top = `${below + height <= (win?.innerHeight ?? 800) - 12 ? below : Math.max(12, rect.top - height - 6)}px`;
        button.setAttribute('aria-expanded', 'true');
    };
    const leave = () => {
        if (!pinned) hide();
    };
    const click = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (pinned) hide();
        else {
            pinned = true;
            show();
        }
    };
    const outside = (event: Event) => {
        if (
            event.target instanceof doc.defaultView!.Node &&
            !button.contains(event.target) &&
            !tooltip.contains(event.target)
        )
            hide();
    };
    const keydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && tooltip.isConnected) {
            event.preventDefault();
            event.stopPropagation();
            hide();
        }
    };
    button.addEventListener('mouseenter', show);
    button.addEventListener('mouseleave', leave);
    button.addEventListener('focus', show);
    button.addEventListener('blur', leave);
    button.addEventListener('click', click);
    doc.addEventListener('pointerdown', outside);
    doc.addEventListener('keydown', keydown, true);
    win?.addEventListener('resize', hide);
    doc.addEventListener('scroll', hide, true);
    return {
        close: hide,
        update(value: string) {
            text = value;
            if (tooltip.isConnected) show();
        },
        destroy() {
            hide();
            button.remove();
            doc.removeEventListener('pointerdown', outside);
            doc.removeEventListener('keydown', keydown, true);
            win?.removeEventListener('resize', hide);
            doc.removeEventListener('scroll', hide, true);
        },
    };
};
