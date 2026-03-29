import { describe, expect, it, vi } from 'vitest';
import { createNx9ContextRuntime } from 'src/mandala-scenes/view-nx9/context-runtime';

describe('nx9-context-runtime', () => {
    const documentSnapshot = {
        revision: 1,
        contentRevision: 2,
        sectionIdMap: {
            '1': 'node-1',
            '1.1': 'node-1-1',
            '2': 'node-2',
        },
        documentContent: {
            'node-1': { content: 'root 1' },
            'node-1-1': { content: 'child 1.1' },
            'node-2': { content: 'root 2' },
        },
    };

    it('reuses the structure context while the structure key stays stable', () => {
        const recordPerfEvent = vi.fn();
        const runtime = createNx9ContextRuntime({ recordPerfEvent });

        const first = runtime.resolveStructureContext({
            documentSnapshot,
            rowsPerPage: 5,
            activeSection: '1',
        });
        const second = runtime.resolveStructureContext({
            documentSnapshot,
            rowsPerPage: 5,
            activeSection: '1.2',
        });

        expect(second).toBe(first);
        expect(recordPerfEvent).toHaveBeenCalledTimes(1);
    });

    it('invalidates the structure cache when content revision changes', () => {
        const runtime = createNx9ContextRuntime();
        const first = runtime.resolveStructureContext({
            documentSnapshot,
            rowsPerPage: 5,
            activeSection: '1',
        });
        const second = runtime.resolveStructureContext({
            documentSnapshot: {
                ...documentSnapshot,
                contentRevision: 3,
            },
            rowsPerPage: 5,
            activeSection: '1',
        });

        expect(second).not.toBe(first);
    });

    it('invalidates the page cache when the active cell changes within a page', () => {
        const runtime = createNx9ContextRuntime();
        const structureContext = runtime.resolveStructureContext({
            documentSnapshot,
            rowsPerPage: 5,
            activeSection: '1',
        });

        const first = runtime.resolvePageContext({
            structureContext,
            activeSection: '1',
            activeCell: { row: 0, col: 0, page: 0 },
        });
        const second = runtime.resolvePageContext({
            structureContext,
            activeSection: '1.1',
            activeCell: { row: 0, col: 1, page: 0 },
        });

        expect(second).not.toBe(first);
    });

    it('caches adjacent page contexts independently for the same structure context', () => {
        const runtime = createNx9ContextRuntime();
        const structureContext = runtime.resolveStructureContext({
            documentSnapshot,
            rowsPerPage: 1,
            activeSection: '1',
        });

        const firstPage0 = runtime.resolvePageContext({
            structureContext,
            activeSection: '1',
            activeCell: { row: 0, col: 0, page: 0 },
            requestedPage: 0,
        });
        const firstPage1 = runtime.resolvePageContext({
            structureContext,
            activeSection: '1',
            activeCell: { row: 0, col: 0, page: 0 },
            requestedPage: 1,
        });
        const secondPage1 = runtime.resolvePageContext({
            structureContext,
            activeSection: '1.1',
            activeCell: { row: 0, col: 1, page: 0 },
            requestedPage: 1,
        });

        expect(firstPage1).not.toBe(secondPage1);
        expect(firstPage0).not.toBe(firstPage1);
    });

    it('reuses the structure context when only the active cell changes', () => {
        const runtime = createNx9ContextRuntime();
        const first = runtime.resolveStructureContext({
            documentSnapshot,
            rowsPerPage: 5,
            activeSection: '1',
        });
        const second = runtime.resolveStructureContext({
            documentSnapshot,
            rowsPerPage: 5,
            activeSection: '1.7',
        });

        expect(second).toBe(first);
    });
});
