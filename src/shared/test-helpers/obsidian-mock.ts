import { StateField } from '@codemirror/state';

export class App {}
export class Plugin {
    registerEditorExtension(_extension: unknown) {}
}
export class Notice {
    constructor(_message?: string) {}
}
export class Menu {}
export class Modal {}
export class Setting {}
export class TextComponent {}
export class SliderComponent {}
export class ExtraButtonComponent {}
export class ColorComponent {}
export class MarkdownView {}
export class WorkspaceLeaf {}
export class TAbstractFile {}
export class TFile extends TAbstractFile {
    path = '';
    basename = '';
    extension = 'md';
    stat = {
        mtime: 0,
    };
}
export class TFolder extends TAbstractFile {
    path = '';
}
export class Editor {}
export class TextFileView {}
export class Component {
    private unloadCallbacks: Array<() => void> = [];

    load() {}

    unload() {
        for (const callback of this.unloadCallbacks.splice(0)) {
            callback();
        }
    }

    register(callback: () => void) {
        this.unloadCallbacks.push(callback);
    }

    registerDomEvent(
        el: HTMLElement,
        type: string,
        handler: EventListenerOrEventListenerObject,
        options?: AddEventListenerOptions | boolean,
    ) {
        el.addEventListener(type, handler, options);
        this.register(() => el.removeEventListener(type, handler, options));
    }

    addChild(_child: Component) {}
}
export class FuzzySuggestModal<T> {
    getItems(): T[] {
        return [];
    }
}
export class MarkdownRenderChild extends Component {
    constructor(_containerEl: HTMLElement) {
        super();
    }
}
export class MarkdownRenderer {
    static async render(
        _app: App,
        markdown: string,
        el: HTMLElement,
        _sourcePath: string,
        _component: Component,
    ) {
        el.textContent = markdown;
    }
}

export type IconName = string;
export type Modifier = string;
export type Hotkey = {
    modifiers: string[];
    key: string;
};
export type Command = {
    id: string;
    name: string;
    hotkeys?: Hotkey[];
};
export type ViewState = Record<string, unknown>;
export type LinkCache = Record<string, unknown>;
export type BlockSubpathResult = Record<string, unknown>;
export type HeadingSubpathResult = Record<string, unknown>;
export type EditorPosition = {
    line: number;
    ch: number;
};

export const editorInfoField = StateField.define<{
    file?: TFile | null;
}>({
    create: () => ({ file: null }),
    update: (value) => value,
});

export const editorLivePreviewField = StateField.define<boolean>({
    create: () => false,
    update: (value) => value,
});

export const Platform = {
    isMobile: false,
    isDesktop: true,
};

export const debounce = <T extends (...args: never[]) => void>(fn: T) => fn;
export const addIcon = () => {};
export const setIcon = (parent: HTMLElement, iconId: string) => {
    parent.dataset.icon = iconId;
};
export const parseYaml = (_input: string): unknown => ({});
export const stringifyYaml = (_input: unknown): string => '';
export const parseLinktext = (linktext: string) => {
    const hashIndex = linktext.indexOf('#');
    if (hashIndex < 0) {
        return {
            path: linktext,
            subpath: '',
        };
    }

    return {
        path: linktext.slice(0, hashIndex),
        subpath: linktext.slice(hashIndex + 1),
    };
};
export const resolveSubpath = () => null;
export const stripHeading = (value: string) => value;
