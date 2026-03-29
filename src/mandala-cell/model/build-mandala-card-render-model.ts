import { buildMandalaCardStyle } from 'src/mandala-cell/model/mandala-card-style';
import type { MandalaCardRenderModel } from 'src/mandala-cell/model/card-render-model';
import type {
    MandalaCardUiState,
    MandalaCardViewModel,
} from 'src/mandala-cell/model/card-view-model';
import { resolveCellSectionColorVisual } from 'src/mandala-cell/visual/section-color-visual';
import { isPreviewDialogEditingNode } from 'src/mandala-interaction/helpers/is-preview-dialog-editing-node';
import type { ThemeTone } from 'src/mandala-display/contrast/readable-text-tone';

// 阅读顺序建议：
// 1. 先看 card-view-model.ts，了解场景层已经决定好的输入
// 2. 再看 mandala-card-style.ts 和 mandala-card-meta.ts，了解背景和 meta 如何派生
// 3. 最后看本文件，理解这些输入如何合并成 view 真正消费的 render model
type BuildMandalaCardRenderModelOptions = {
    viewModel: MandalaCardViewModel;
    uiState: MandalaCardUiState;
    fallbackSection?: string;
    previewDialogOpen: boolean;
    previewDialogNodeId: string | null;
    showDetailSidebar: boolean;
    isMobile: boolean;
    themeTone: ThemeTone;
    themeUnderlayColor?: string;
};

export const buildMandalaCardRenderModel = ({
    viewModel,
    uiState,
    fallbackSection,
    previewDialogOpen,
    previewDialogNodeId,
    showDetailSidebar,
    isMobile,
    themeTone,
    themeUnderlayColor,
}: BuildMandalaCardRenderModelOptions): MandalaCardRenderModel => {
    const {
        nodeId,
        section,
        contentEnabled,
        style,
        sectionColorContext,
        displayPolicy,
    } = viewModel;
    const { active, editing, pinned } = uiState;
    const displaySection = section || fallbackSection || '';
    const sectionColorVisual = resolveCellSectionColorVisual({
        section: displaySection,
        colorContext: sectionColorContext,
        indicatorVariant: displayPolicy.sectionIndicatorVariant,
        pinned,
        themeTone,
        themeUnderlayColor,
    });
    const {
        cardStyle,
        surfaceStyle,
        bodyStyle,
        shouldHideBackgroundStyle,
    } = buildMandalaCardStyle({
        active,
        backgroundColor: sectionColorVisual.backgroundColor,
        preserveActiveBackground: displayPolicy.preserveActiveBackground,
        style,
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
        surfaceStyle,
        bodyStyle,
        showInlineEditor,
        showContent: contentEnabled && !showInlineEditor,
        hideBuiltInHiddenInfo: displayPolicy.hideBuiltInHiddenInfo,
        style,
        displaySection,
        shouldHideBackgroundStyle,
        sectionIndicatorVariant: displayPolicy.sectionIndicatorVariant,
        sectionMetaVariant: sectionColorVisual.metaVariant,
        showSectionPin: sectionColorVisual.showPin,
        sectionMetaTextTone: sectionColorVisual.metaTextTone,
        metaStyle:
            sectionColorVisual.metaAccentColor ||
            sectionColorVisual.metaBackgroundColor
            ? [
                  sectionColorVisual.metaAccentColor
                      ? `--mandala-card-meta-accent: ${sectionColorVisual.metaAccentColor}`
                      : null,
                  sectionColorVisual.metaBackgroundColor
                      ? `--mandala-card-meta-bg: ${sectionColorVisual.metaBackgroundColor}`
                      : null,
              ]
                  .filter(Boolean)
                  .join('; ')
            : undefined,
        isFloatingMobile: isMobile && editing && !showDetailSidebar,
    };
};
