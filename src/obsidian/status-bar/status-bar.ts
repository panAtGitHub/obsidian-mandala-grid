import { MandalaView } from 'src/view/view';
import MandalaGrid from 'src/main';
import { statusBarWorker } from 'src/workers/worker-instances';
import { formatStatusBarText } from 'src/obsidian/status-bar/helpers/format-status-bar-text';
import {
    normalizeCharsCount,
    StatusSummary,
} from 'src/obsidian/status-bar/helpers/status-bar-summary';

const STATUS_BAR_UPDATE_DELAY_MS = 120;

export class StatusBar {
    private container: HTMLElement;
    private elements: {
        numberOfCards: HTMLElement;
        documentProgress: HTMLElement;
        // numberOfChildren: HTMLElement;
    };
    private summaryByPath = new Map<string, StatusSummary>();
    private refreshTimer: number | null = null;
    private refreshRequestId = 0;

    constructor(public plugin: MandalaGrid) {
        this.onload();
    }

    onload() {
        this.container = this.plugin.addStatusBarItem();
        this.elements = {
            numberOfCards: this.container.createDiv(),
            // numberOfChildren: this.container.createDiv(),
            documentProgress: this.container.createDiv(),
        };
        this.elements.numberOfCards.setCssProps({ 'margin-right': '5px' });
        // this.elements.numberOfChildren.style.marginRight = '5px';
        this.elements.documentProgress.ariaLabel =
            'Progress through the document';
        // this.elements.numberOfChildren.ariaLabel =
        //     'Total number of subsections';
        this.plugin.registerEvent(
            this.plugin.app.workspace.on('active-leaf-change', (x) => {
                const visible = Boolean(x && x.view instanceof MandalaView);
                this.setVisibility(visible);
                if (x?.view instanceof MandalaView) {
                    this.updateProgressIndicatorAndChildCount(x.view);
                }
            }),
        );
    }

    private setVisibility(visible: boolean) {
        this.container.toggleClass('mandala__hidden-element', !visible);
    }

    updateAll = (view: MandalaView) => {
        this.updateCardsNumber(view);
        this.scheduleSummaryRefresh(view);
    };

    updateCardsNumber = (view: MandalaView) => {
        void view;
        this.elements.numberOfCards.setText('');
    };

    updateProgressIndicatorAndChildCount = (view: MandalaView) => {
        const path = view.file?.path;
        if (!path) return;

        const cached = this.summaryByPath.get(path);
        if (!cached) {
            this.scheduleSummaryRefresh(view);
            return;
        }

        const activeNode = view.viewStore.getValue().document.activeNode;
        const activeText =
            view.documentStore.getValue().document.content[activeNode]?.content ?? '';
        const nextSummary: StatusSummary = {
            ...cached,
            currentSectionChars: normalizeCharsCount(activeText),
        };
        this.summaryByPath.set(path, nextSummary);
        this.elements.documentProgress.setText(formatStatusBarText(nextSummary));
    };

    scheduleSummaryRefresh = (view: MandalaView) => {
        const requestId = ++this.refreshRequestId;
        if (this.refreshTimer !== null) {
            window.clearTimeout(this.refreshTimer);
        }
        this.refreshTimer = window.setTimeout(() => {
            this.refreshTimer = null;
            void this.refreshSummary(view, requestId);
        }, STATUS_BAR_UPDATE_DELAY_MS);
    };

    clear() {
        if (this.refreshTimer !== null) {
            window.clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
        this.summaryByPath.clear();
    }

    private async refreshSummary(view: MandalaView, requestId: number) {
        const path = view.file?.path;
        if (!path || !view.isViewOfFile) return;

        const content = view.documentStore.getValue().document.content;
        const activeNode = view.viewStore.getValue().document.activeNode;
        const texts = Object.values(content).map((item) => item?.content ?? '');
        const activeText = content[activeNode]?.content ?? '';
        const result = await statusBarWorker.run({
            texts,
            activeText,
        });
        if (requestId !== this.refreshRequestId) return;
        this.summaryByPath.set(path, result);
        this.elements.documentProgress.setText(formatStatusBarText(result));
    };
}
