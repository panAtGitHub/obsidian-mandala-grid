import { type MarkdownPostProcessorContext, type TFile } from 'obsidian';
import { type MandalaEmbedGridModel } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/create-mandala-embed-grid-model';
import { type ParsedMandalaEmbedReference } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-reference';

export type MandalaEmbedTarget = {
    file: TFile;
    centerHeading: string | null;
};

export type MandalaEmbedManagedPayload = {
    renderKey: string;
    ctx: MarkdownPostProcessorContext;
    src: string | null;
    sourcePath: string;
    target: MandalaEmbedTarget;
    parsedReference: ParsedMandalaEmbedReference;
    model: MandalaEmbedGridModel;
};
