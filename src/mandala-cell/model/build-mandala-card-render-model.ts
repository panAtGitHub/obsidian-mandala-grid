import {
    buildMandalaCardMetaState,
} from 'src/mandala-cell/model/mandala-card-meta';
import { buildMandalaCardStyle } from 'src/mandala-cell/model/mandala-card-style';
import type { MandalaCardRenderModel } from 'src/mandala-cell/model/card-render-model';
import type { CellStyle } from 'src/mandala-cell/model/card-types';
import type { CellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';
import { isPreviewDialogEditingNode } from 'src/mandala-interaction/helpers/is-preview-dialog-editing-node';
import type { ThemeTone } from 'src/mandala-interaction/helpers/contrast-text-tone';

// 阅读顺序建议：
// 1. 先看 card-view-model.ts，了解场景层已经决定好的输入
// 2. 再看 mandala-card-style.ts 和 mandala-card-meta.ts，了解背景和 meta 如何派生
// 3. 最后看本文件，理解这些输入如何合并成 view 真正消费的 render model
type BuildMandalaCardRenderModelOptions = {
    nodeId: string;
    section: string;
    fallbackSection?: string;
    active: boolean;
    editing: boolean;
    pinned: boolean;
    style: CellStyle;
    sectionColor: string | null;
    metaAccentColor: string | null;
    displayPolicy: CellDisplayPolicy;
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
    metaAccentColor,
    displayPolicy,
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
        preserveActiveBackground: displayPolicy.preserveActiveBackground,
        style,
        themeTone,
        themeUnderlayColor,
    });
    const {
        showBackground: showSectionBackground,
        showPin: showSectionPin,
        showColorDot: showSectionColorDot,
        textTone: capsuleTextTone,
    } = buildMandalaCardMetaState({
        variant: displayPolicy.sectionIndicatorVariant,
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
        hideBuiltInHiddenInfo: displayPolicy.hideBuiltInHiddenInfo,
        style,
        displaySection,
        shouldHideBackgroundStyle,
        sectionIndicatorVariant: displayPolicy.sectionIndicatorVariant,
        showSectionBackground,
        showSectionPin,
        showSectionColorDot,
        capsuleTextTone,
        metaAccentColor: metaAccentColor ?? sectionColor,
        metaStyle: sectionColor
            ? [
                  `--mandala-card-meta-accent: ${metaAccentColor ?? sectionColor}`,
                  showSectionBackground
                      ? `--mandala-card-meta-bg: ${sectionColor}`
                      : null,
              ]
                  .filter(Boolean)
                  .join('; ')
            : undefined,
        isFloatingMobile: isMobile && editing && !showDetailSidebar,
    };
};
