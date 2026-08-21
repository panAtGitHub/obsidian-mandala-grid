import { buildMandalaDocumentV2 } from 'src/mandala-document/engine/build-state';
import { parseSections } from 'src/mandala-document/engine/parse-sections';
import { serializeSections } from 'src/mandala-document/engine/serialize-sections';
import { buildMandalaTopologyIndex } from 'src/mandala-display/logic/mandala-topology';
import { MandalaSourceRuntime } from 'src/mandala-document/runtime/source-document-runtime';

export type DocumentRuntimeBenchmark = {
    sourceBytes: number;
    sectionsCount: number;
    sectionScanMs: number;
    fullParseMs: number;
    fullBuildMs: number;
    topologyMs: number;
    workingSetMs: number;
    sourcePatchMs: number;
    fullSerializeMs: number;
};

const measure = <T>(run: () => T) => {
    const startedAt = performance.now();
    const value = run();
    return {
        value,
        elapsedMs: Number((performance.now() - startedAt).toFixed(2)),
    };
};

export const benchmarkDocumentRuntime = (
    source: string,
): DocumentRuntimeBenchmark => {
    const scan = measure(() => new MandalaSourceRuntime(source));
    const parsed = measure(() => parseSections(source));
    const built = measure(() =>
        buildMandalaDocumentV2({ sections: parsed.value.sections }),
    );
    const topology = measure(() =>
        buildMandalaTopologyIndex(built.value.sectionToNode),
    );
    const workingSet = measure(() => scan.value.materializeThreeByThree('1'));
    const patched = measure(() =>
        scan.value.replaceSectionContents([
            { sectionId: '1', content: 'benchmark' },
        ]),
    );
    const serialized = measure(() =>
        serializeSections(
            parsed.value.sections.map((section) => ({
                sectionId: section.id,
                content: section.content,
            })),
        ),
    );

    return {
        sourceBytes: scan.value.index.sourceBytes,
        sectionsCount: scan.value.index.canonicalOrderedIds.length,
        sectionScanMs: scan.elapsedMs,
        fullParseMs: parsed.elapsedMs,
        fullBuildMs: built.elapsedMs,
        topologyMs: topology.elapsedMs,
        workingSetMs: workingSet.elapsedMs,
        sourcePatchMs: patched.elapsedMs,
        fullSerializeMs: serialized.elapsedMs,
    };
};
