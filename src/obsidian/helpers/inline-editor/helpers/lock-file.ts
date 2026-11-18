import type { MandalaView } from 'src/view/view';
import { MarkdownView } from 'obsidian';

const locks = new WeakMap<
    MarkdownView,
    { count: number; restore: () => void }
>();

export const lockFile = (view: MandalaView) => {
    const releases: (() => void)[] = [];
    view.plugin.app.workspace.iterateAllLeaves(({ view: leaf }) => {
        if (!(leaf instanceof MarkdownView) || leaf.file !== view.file) return;
        let lock = locks.get(leaf);
        if (!lock) {
            const original = leaf.setViewData.bind(leaf);
            const blocked: MarkdownView['setViewData'] = () => {};
            leaf.setViewData = blocked;
            lock = {
                count: 0,
                restore: () => {
                    if (leaf.setViewData === blocked)
                        leaf.setViewData = original;
                    locks.delete(leaf);
                },
            };
            locks.set(leaf, lock);
        }
        const entry = lock;
        entry.count += 1;
        releases.push(() => {
            if (--entry.count === 0) entry.restore();
        });
    });
    return () => {
        for (const release of releases.splice(0)) release();
    };
};
