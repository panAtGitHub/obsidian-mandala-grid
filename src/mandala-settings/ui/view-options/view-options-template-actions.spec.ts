import { describe, expect, it, vi } from 'vitest';
import { defaultDocumentState } from 'src/mandala-document/state/default-document-state';
import { documentReducer } from 'src/mandala-document/state/document-reducer';
import type { DocumentStoreAction } from 'src/mandala-document/state/document-store-actions';
import type { MandalaView } from 'src/view/view';
import {
    applyTemplateToCurrentThemeAction,
    insertBuiltinTemplateAction,
} from './view-options-template-actions';
import { openMandalaTemplateSelectModal } from 'src/obsidian/modals/mandala-templates-modal';
import { TFile } from 'obsidian';

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
            app: {
                vault: { getAbstractFileByPath: () => file, read },
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
        setMode: (mode: string) => {
            viewFixture.mandalaMode = mode;
        },
    };
};

describe('builtin template insertion', () => {
    it('creates missing cells, assigns titles by section number and retains content', async () => {
        const fixture = createFixture();
        await insertBuiltinTemplateAction(fixture.view, fixture.closeMenu);
        const titles = [
            '健康',
            '工作',
            '财务',
            '家庭',
            '社群',
            '内在',
            '学习',
            '休闲',
        ];
        titles.forEach((title, index) => {
            expect(fixture.content(`1.${index + 1}`)?.split('\n')[0]).toBe(
                `### ${title}`,
            );
        });
        expect(fixture.content('1.1')).toBe('### 健康\nKeep this body');
        expect(fixture.content('1')).toBe('Center');
        expect(fixture.content('2')).toBe('Other center');
        expect(fixture.read).not.toHaveBeenCalled();
        expect(fixture.closeMenu).toHaveBeenCalledOnce();

        await insertBuiltinTemplateAction(fixture.view, fixture.closeMenu);
        expect(fixture.content('1.1')).toBe('### 健康\nKeep this body');
        expect(
            Object.keys(fixture.state.sections.section_id).filter((section) =>
                /^1\.\d+$/.test(section),
            ),
        ).toHaveLength(8);
    });

    it('leaves unsupported views and non-mandala documents unchanged', async () => {
        const fixture = createFixture();
        fixture.setMode('9x9');
        await insertBuiltinTemplateAction(fixture.view, fixture.closeMenu);
        fixture.setMode('3x3');
        fixture.state.meta.isMandala = false;
        await insertBuiltinTemplateAction(fixture.view, fixture.closeMenu);
        expect(fixture.dispatch).not.toHaveBeenCalled();
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
