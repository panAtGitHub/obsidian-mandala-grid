import { describe, expect, it } from 'vitest';
import { NavigationHistory } from 'src/stores/document/document-state-type';
import { addNavigationHistoryItem } from 'src/stores/view/reducers/ui/helpers/add-navigation-history-item';

describe('add navigation history item', () => {
    it('does not mutate history when navigation history is disabled', () => {
        const input: NavigationHistory = {
            state: {
                activeIndex: 3,
                canGoForward: false,
                canGoBack: true,
            },
            items: ['1', '2', '3', '4'],
            context: undefined,
        };

        const output: NavigationHistory = {
            state: {
                activeIndex: 3,
                canGoForward: false,
                canGoBack: true,
            },
            items: ['1', '2', '3', '4'],
            context: undefined,
        };

        addNavigationHistoryItem({ navigationHistory: input }, '4');
        expect(input).toEqual(output);
    });
    it('keeps existing stale history untouched', () => {
        const input: NavigationHistory = {
            state: {
                activeIndex: 2,
                canGoForward: false,
                canGoBack: true,
            },
            items: ['1', '4', '3', '4'],
            context: undefined,
        };

        const output: NavigationHistory = {
            state: {
                activeIndex: 2,
                canGoForward: false,
                canGoBack: true,
            },
            items: ['1', '4', '3', '4'],
            context: undefined,
        };

        addNavigationHistoryItem({ navigationHistory: input }, '3');
        expect(input).toEqual(output);
    });
});
