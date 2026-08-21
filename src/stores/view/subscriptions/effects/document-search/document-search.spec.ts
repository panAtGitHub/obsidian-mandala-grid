import { describe, expect, it, vi } from 'vitest';
import { MandalaSourceRuntime } from 'src/mandala-document/runtime/source-document-runtime';
import { DocumentSearch } from 'src/stores/view/subscriptions/effects/document-search/document-search';

describe('DocumentSearch', () => {
    it('reads all source sections without hydrating the reactive document', () => {
        const runtime = new MandalaSourceRuntime(
            [
                '<!--section: 1-->visible',
                '<!--section: 2-->searchable source content',
            ].join('\n'),
        );
        const ensureFullHydrated = vi.fn();
        const view = {
            documentStore: {
                getValue: () => ({
                    sections: {
                        section_id: {
                            '1': runtime.getNodeId('1'),
                        },
                    },
                    document: {
                        content: {
                            [runtime.getNodeId('1') ?? '']: {
                                content: 'visible',
                            },
                        },
                    },
                }),
            },
            viewStore: {
                getValue: () => ({ search: { fuzzySearch: false } }),
            },
            getSectionLookup: () => runtime.lookup,
            getSourceSectionIds: () => runtime.index.canonicalOrderedIds,
            ensureFullHydrated,
        };

        const search = new DocumentSearch(view as never);
        const results = search.search('searchable');

        expect(results.get('2')?.item.content).toBe(
            'searchable source content',
        );
        expect(ensureFullHydrated).not.toHaveBeenCalled();
    });
});
