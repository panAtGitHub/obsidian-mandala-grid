import {
    buildMandalaCardMetaState,
    type SectionIndicatorVariant,
} from 'src/cell/display/meta/mandala-card-meta';
import { buildMandalaCardStyle } from 'src/cell/display/style/mandala-card-style';
import type { MandalaCardRenderModel } from 'src/cell/model/card-render-model';
import type { CellStyle } from 'src/cell/model/card-types';
import { isPreviewDialogEditingNode } from 'src/helpers/views/mandala/is-preview-dialog-editing-node';
import type { ThemeTone } from 'src/view/helpers/mandala/contrast-text-tone';

type BuildMandalaCardRenderModelOptions = {
    nodeId: string;
    section: string;
    fallbackSection?: string;
    active: boolean;
    editing: boolean;
    pinned: boolean;
    style: CellStyle;
    sectionColor: string | null;
    preserveActiveBackground?: boolean;
    sectionIndicatorVariant: SectionIndicatorVariant;
    previewDialogOpen: boolean;
    previewDialogNodeId: string | null;
    showDetailSidebar: boolean;
    isMobile: boolean;
    themeTone: ThemeTone;
    themeUnderlayColor?: string;
};

export const buildMandalaCardRenderModel = ({
    nodeId,
    section,
    fallbackSection,
    active,
    editing,
    pinned,
    style,
    sectionColor,
    preserveActiveBackground = false,
    sectionIndicatorVariant,
    previewDialogOpen,
    previewDialogNodeId,
    showDetailSidebar,
    isMobile,
    themeTone,
    themeUnderlayColor,
}: BuildMandalaCardRenderModelOptions): MandalaCardRenderModel => {
    const displaySection = section || fallbackSection || '';
    const { cardStyle, shouldHideBackgroundStyle } = buildMandalaCardStyle({
        active,
        sectionColor,
        preserveActiveBackground,
        style,
        themeTone,
        themeUnderlayColor,
    });
    const {
        showBackground: showSectionBackground,
        showPin: showSectionPin,
        textTone: capsuleTextTone,
    } = buildMandalaCardMetaState({
        variant: sectionIndicatorVariant,
        sectionColor,
        pinned,
        themeTone,
        themeUnderlayColor,
    });
    const previewOwnsInlineEditor = isPreviewDialogEditingNode({
        previewDialogOpen,
        previewDialogNodeId,
        editingActiveNodeId: editing ? nodeId : null,
        editingIsInSidebar: false,
        nodeId,
    });
    const showInlineEditor =
        active && editing && !showDetailSidebar && !previewOwnsInlineEditor;

    return {
        cardStyle,
        showInlineEditor,
        showContent: !showInlineEditor,
        style,
        displaySection,
        shouldHideBackgroundStyle,
        sectionIndicatorVariant,
        showSectionBackground,
        showSectionPin,
        capsuleTextTone,
        metaStyle:
            showSectionBackground && sectionColor
                ? `--mandala-card-meta-bg: ${sectionColor}`
                : undefined,
        isFloatingMobile: isMobile && editing && !showDetailSidebar,
    };
};
