import { MarkdownView, TFile } from 'obsidian';
import { expect, it, vi } from 'vitest';
import { lockFile } from './lock-file';

it('restores native Markdown updates after two inline editors release their locks', () => {
    const original = vi.fn();
    const file = new TFile();
    const native = Object.create(MarkdownView.prototype) as MarkdownView;
    Object.assign(native, { file, setViewData: original });
    const view = {
        file,
        plugin: {
            app: {
                workspace: {
                    iterateAllLeaves: (
                        each: (entry: { view: unknown }) => void,
                    ) => each({ view: native }),
                },
            },
        },
    };
    const releaseFirst = lockFile(view as never);
    const releaseSecond = lockFile(view as never);
    releaseFirst();
    native.setViewData('still locked', false);
    expect(original).not.toHaveBeenCalled();
    releaseSecond();
    native.setViewData('unlocked', false);
    expect(original).toHaveBeenCalledWith('unlocked', false);
});
