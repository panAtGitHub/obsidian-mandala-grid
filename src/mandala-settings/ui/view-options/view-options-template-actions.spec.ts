import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';
import { resolveEffectiveMandalaSettings } from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';
import { parseYaml } from 'obsidian';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { defaultDocumentState } from 'src/mandala-document/state/default-document-state';
import { documentReducer } from 'src/mandala-document/state/document-reducer';
import type { DocumentStoreAction } from 'src/mandala-document/state/document-store-actions';
import type { MandalaView } from 'src/view/view';
import {
    applyTemplateToCurrentThemeAction,
    insertBuiltinTemplateAction,
} from './view-options-template-actions';
import {
    openMandalaTemplateSelectModal,
    openMandalaTemplatesFileModal,
} from 'src/obsidian/modals/mandala-templates-modal';
import { Notice, TFile } from 'obsidian';

vi.mock('obsidian', async (importOriginal) => {
    const original = await importOriginal<typeof import('obsidian')>();
    return {
        ...original,
        Notice: vi.fn(function () {
            return { hide: vi.fn() };
        }),
    };
});

vi.mock('src/obsidian/events/workspace/effects/open-file', () => ({
    openFile: vi.fn(),
}));
vi.mock('src/obsidian/modals/mandala-templates-modal', () => ({
    openMandalaTemplateNameModal: vi.fn(),
    openMandalaTemplateSelectModal: vi.fn(),
    openMandalaTemplatesFileModal: vi.fn(),
}));

const createFixture = () => {
    const state = defaultDocumentState();
    documentReducer(state, {
        type: 'document/file/load-from-disk',
        payload: {
            activeSection: '1',
            document: {
                data: '<!--section: 1-->\nCenter\n<!--section: 1.1-->\n### Old title\nKeep this body\n<!--section: 2-->\nOther center',
                frontmatter: '---\nmandala: true\n---\n',
                position: null,
            },
        },
    });
    state.meta.isMandala = true;
    const dispatch = vi.fn((action: DocumentStoreAction) =>
        documentReducer(state, action),
    );
    const file = new TFile();
    file.path = 'templates.md';
    const lookup = vi.fn((): TFile | null => file);
    let markdown =
        '---\naliases: [Templates]\n---\nNotes\n\n## 模板：Custom\n1: Replacement\n';
    const process = vi.fn(
        async (_file: TFile, update: (raw: string) => string) => {
            markdown = update(markdown);
            return markdown;
        },
    );
    const settingsDispatch = vi.fn();
    const read = vi.fn().mockResolvedValue('## 模板：Custom\n1: Replacement');
    const viewFixture = {
        mandalaMode: '3x3',
        file: null,
        ensureFullHydrated: vi.fn(),
        documentStore: { getValue: () => state, dispatch },
        viewStore: {
            getValue: () => ({ ui: { mandala: { subgridTheme: '1' } } }),
        },
        plugin: {
            settings: { dispatch: settingsDispatch },
            app: {
                vault: { getAbstractFileByPath: lookup, read, process },
            },
        },
    };
    const view = viewFixture as unknown as MandalaView;
    const content = (section: string) =>
        state.document.content[state.sections.section_id[section]]?.content;
    return {
        view,
        state,
        dispatch,
        content,
        read,
        closeMenu: vi.fn(),
        file,
        lookup,
        process,
        settingsDispatch,
        markdown: () => markdown,
        setMode: (mode: string) => {
            viewFixture.mandalaMode = mode;
        },
    };
};

describe('builtin template insertion', () => {
    let dom: JSDOM;
    beforeEach(() => {
        vi.clearAllMocks();
        dom = new JSDOM();
        vi.stubGlobal('activeDocument', dom.window.document);
    });
    afterEach(() => {
        dom.window.close();
        vi.unstubAllGlobals();
    });

    const getPromptButton = () => {
        const message = vi.mocked(Notice).mock.calls.at(-1)?.[0];
        if (!(message instanceof dom.window.DocumentFragment))
            throw new Error('Missing actionable notice');
        const button = message.querySelector('button');
        if (!button) throw new Error('Missing setup button');
        expect(button.textContent).toBe('指定或新建模板文件');
        return button;
    };

    it('appends the eight numbered titles to the template file and preserves existing content', async () => {
        const fixture = createFixture();
        fixture.setMode('9x9');
        fixture.state.meta.isMandala = false;
        await insertBuiltinTemplateAction(
            fixture.view,
            'templates.md',
            fixture.closeMenu,
        );
        expect(fixture.markdown()).toContain('aliases: [Templates]');
        expect(fixture.markdown()).toContain('Notes');
        expect(fixture.markdown()).toContain('## 模板：Custom\n1: Replacement');
        expect(fixture.markdown()).toContain(
            '## 模板：生活八领域\n1: ## 健康\n2: ## 工作\n3: ## 财务\n4: ## 家庭\n5: ## 社群\n6: ## 内在\n7: ## 学习\n8: ## 休闲',
        );
        expect(fixture.dispatch).not.toHaveBeenCalled();
        expect(fixture.content('1.1')).toBe('### Old title\nKeep this body');
        const firstInsert = fixture.markdown();
        await insertBuiltinTemplateAction(
            fixture.view,
            'templates.md',
            fixture.closeMenu,
        );
        expect(fixture.markdown()).toBe(firstInsert);
    });

    it('prompts when unconfigured and inserts after selecting or creating a file', async () => {
        const fixture = createFixture();
        vi.mocked(openMandalaTemplatesFileModal).mockResolvedValue(
            fixture.file,
        );
        await insertBuiltinTemplateAction(
            fixture.view,
            null,
            fixture.closeMenu,
        );
        expect(fixture.process).not.toHaveBeenCalled();
        expect(openMandalaTemplatesFileModal).not.toHaveBeenCalled();
        getPromptButton().click();
        await vi.waitFor(() => expect(fixture.process).toHaveBeenCalledOnce());
        expect(fixture.settingsDispatch).toHaveBeenCalledWith({
            type: 'settings/general/set-mandala-templates-file-path',
            payload: { path: 'templates.md' },
        });
        expect(fixture.markdown()).toContain('## 模板：生活八领域');
        expect(fixture.dispatch).not.toHaveBeenCalled();
    });

    it('offers file setup when the configured file is missing and allows cancellation', async () => {
        const fixture = createFixture();
        fixture.lookup.mockReturnValue(null);
        vi.mocked(openMandalaTemplatesFileModal).mockResolvedValue(null);
        await insertBuiltinTemplateAction(
            fixture.view,
            'deleted.md',
            fixture.closeMenu,
        );
        getPromptButton().click();
        await vi.waitFor(() =>
            expect(openMandalaTemplatesFileModal).toHaveBeenCalledOnce(),
        );
        expect(fixture.process).not.toHaveBeenCalled();
        expect(fixture.settingsDispatch).not.toHaveBeenCalled();
        expect(fixture.closeMenu).not.toHaveBeenCalled();
    });

    it('reports a write failure without closing the menu', async () => {
        const fixture = createFixture();
        fixture.process.mockRejectedValueOnce(new Error('Write failed'));
        await insertBuiltinTemplateAction(
            fixture.view,
            'templates.md',
            fixture.closeMenu,
        );
        expect(Notice).toHaveBeenCalledWith('写入模板文件失败。');
        expect(fixture.closeMenu).not.toHaveBeenCalled();
    });

    it('retains the existing custom template replacement behavior', async () => {
        const fixture = createFixture();
        vi.mocked(openMandalaTemplateSelectModal).mockResolvedValue({
            name: 'Custom',
            slots: ['Replacement'],
        });
        await applyTemplateToCurrentThemeAction(
            fixture.view,
            'templates.md',
            fixture.closeMenu,
        );
        expect(fixture.content('1.1')).toBe('Replacement');
        expect(fixture.content('1.2')).toBe('');
        expect(fixture.read).toHaveBeenCalledOnce();
        expect(fixture.closeMenu).toHaveBeenCalledOnce();
    });
});

it('updates the daily template without rewriting or materializing historical cells', async () => {
    const f = createFixture();
    f.view.file = f.file;
    f.state.file.frontmatter =
        '---\nmandala: true\nmandala_plan:\n  enabled: true\n  year: 2026\n  slots:\n    "1": Old\n---\n';
    const root: Record<string, unknown> = {
        mandala: true,
        id: 'user-id',
        mandala_plan: { enabled: true, year: 2026, slots: { '1': 'Old' } },
    };
    f.view.plugin.app.fileManager = {
        processFrontMatter: vi.fn(
            async (
                _file: TFile,
                update: (record: Record<string, unknown>) => void,
            ) => {
                update(root);
            },
        ),
    } as unknown as typeof f.view.plugin.app.fileManager;
    f.view.getEffectiveMandalaSettings = () =>
        resolveEffectiveMandalaSettings(
            DEFAULT_SETTINGS(),
            f.state.file.frontmatter,
        );
    vi.mocked(openMandalaTemplateSelectModal).mockResolvedValue({
        name: 'New',
        slots: ['## New title', '', '', '', '', '', '', ''],
    });
    await applyTemplateToCurrentThemeAction(
        f.view,
        'templates.md',
        f.closeMenu,
    );
    expect(root).toMatchObject({
        id: 'user-id',
        mandala_day_plan: { slots: { '1': 'New title' } },
    });
    expect(root).not.toHaveProperty('mandala_plan');
    expect(f.content('1.1')).toBe('### Old title\nKeep this body');
    expect(f.state.sections.section_id['2.1']).toBeUndefined();
    expect(
        f.dispatch.mock.calls.every(
            ([action]) => action.type === 'document/file/update-frontmatter',
        ),
    ).toBe(true);
    expect(
        parseYaml(
            f.state.file.frontmatter
                .replace(/^---\n/, '')
                .replace(/\n---\n?$/, ''),
        ),
    ).toHaveProperty('mandala_day_plan');
});
