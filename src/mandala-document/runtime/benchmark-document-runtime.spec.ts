import { describe, expect, it } from 'vitest';
import { benchmarkDocumentRuntime } from 'src/mandala-document/runtime/benchmark-document-runtime';
import { SYNTHETIC_FIXTURES } from 'src/mandala-document/runtime/benchmark-fixtures';

describe('document runtime benchmark fixtures', () => {
    it('captures comparable baseline stages without private user content', () => {
        const metrics = benchmarkDocumentRuntime(SYNTHETIC_FIXTURES.small());

        expect(metrics.sourceBytes).toBeGreaterThan(0);
        expect(metrics.sectionsCount).toBe(18);
        expect(metrics.sectionScanMs).toBeGreaterThanOrEqual(0);
        expect(metrics.fullParseMs).toBeGreaterThanOrEqual(0);
        expect(metrics.fullBuildMs).toBeGreaterThanOrEqual(0);
        expect(metrics.topologyMs).toBeGreaterThanOrEqual(0);
        expect(metrics.workingSetMs).toBeGreaterThanOrEqual(0);
        expect(metrics.sourcePatchMs).toBeGreaterThanOrEqual(0);
        expect(metrics.fullSerializeMs).toBeGreaterThanOrEqual(0);
    });
});
