export class App {}
export class Plugin {}
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
}
export class TFolder extends TAbstractFile {
    path = '';
}
export class Editor {}
export class TextFileView {}
export class FuzzySuggestModal<T> {
    getItems(): T[] {
        return [];
    }
}
export class MarkdownRenderer {}

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

export const Platform = {
    isMobile: false,
    isDesktop: true,
};

export const debounce = <T extends (...args: never[]) => void>(fn: T) => fn;
export const addIcon = () => {};
export const parseYaml = (_input: string): unknown => ({});
export const stringifyYaml = (_input: unknown): string => '';
export const resolveSubpath = () => null;
export const stripHeading = (value: string) => value;
