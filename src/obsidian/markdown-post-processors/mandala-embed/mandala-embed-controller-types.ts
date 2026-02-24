import { type MarkdownPostProcessorContext, type TFile } from 'obsidian';
import { type MandalaEmbedGridModel } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/create-mandala-embed-grid-model';
import { type ParsedMandalaEmbedSrc } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-src';

export type MandalaEmbedTarget = {
    file: TFile;
    centerHeading: string | null;
};

export type MandalaEmbedManagedPayload = {
    ctx: MarkdownPostProcessorContext;
    src: string | null;
    sourcePath: string;
    target: MandalaEmbedTarget;
    parsedSrc: ParsedMandalaEmbedSrc;
    model: MandalaEmbedGridModel;
};
