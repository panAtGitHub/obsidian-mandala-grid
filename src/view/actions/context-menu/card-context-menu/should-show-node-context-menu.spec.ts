import { describe, expect, it } from 'vitest';
import { shouldShowNodeContextMenu } from 'src/view/actions/context-menu/card-context-menu/should-show-node-context-menu';

const createTarget = (matches: string[]) =>
    ({
        hasClass: (name: string) => matches.includes(`.${name}`),
        closest: (selector: string) =>
            matches.includes(selector) ? { selector } : null,
    }) as unknown as HTMLElement;

describe('shouldShowNodeContextMenu', () => {
    it('returns true for pinned list items in the left sidebar', () => {
        const target = createTarget(['.pinned-list-item']);

        expect(
            shouldShowNodeContextMenu({ target } as MouseEvent),
        ).toBe(true);
    });

    it('returns true for mandala cards and simple cells', () => {
        const cardTarget = createTarget(['.mandala-card']);
        const cellTarget = createTarget(['.simple-cell[data-node-id]']);

        expect(
            shouldShowNodeContextMenu({ target: cardTarget } as MouseEvent),
        ).toBe(true);
        expect(
            shouldShowNodeContextMenu({ target: cellTarget } as MouseEvent),
        ).toBe(true);
    });
});
