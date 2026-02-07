import { MandalaView } from 'src/view/view';
import MandalaGrid from 'src/main';
import { statusBarWorker } from 'src/workers/worker-instances';

export class StatusBar {
    private container: HTMLElement;
    private elements: {
        numberOfCards: HTMLElement;
        documentProgress: HTMLElement;
        // numberOfChildren: HTMLElement;
    };

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
            }),
        );
    }

    private setVisibility(visible: boolean) {
        this.container.toggleClass('mandala__hidden-element', !visible);
    }

    updateAll = (view: MandalaView) => {
        this.updateCardsNumber(view);
        this.updateProgressIndicatorAndChildCount(view);
    };

    updateCardsNumber = (view: MandalaView) => {
        void view;
        this.elements.numberOfCards.setText('');
    };
    updateProgressIndicatorAndChildCount = async (view: MandalaView) => {
        const document = view.documentStore.getValue().document;
        const activeNode = view.viewStore.getValue().document.activeNode;
        const result = await statusBarWorker.run({
            document,
            activeNode,
        });
        this.elements.documentProgress.setText(
            `sections: ${result.nonEmptySections} | words: ${result.currentSectionChars} / ${result.totalChars}`,
        );
    };
}
