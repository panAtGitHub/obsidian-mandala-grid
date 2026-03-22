import { writable } from 'svelte/store';

export const createMobileEditorViewportController = () => {
    const height = writable(0);
    const offsetTop = writable(0);
    const bottomInset = writable(0);
    const keyboardFallback = writable(0);

    let editorBodyEl: HTMLDivElement | null = null;
    let isEditing = false;
    let isFocused = false;
    let cursorGuardCleanup: (() => void) | null = null;

    const updateVisualViewport = () => {
        const vv = window.visualViewport;
        if (!vv) {
            height.set(window.innerHeight);
            offsetTop.set(0);
            bottomInset.set(0);
            keyboardFallback.set(isFocused ? 280 : 0);
            return;
        }

        const nextBottomInset = Math.max(
            0,
            window.innerHeight - vv.height - vv.offsetTop,
        );
        const viewportReportedKeyboard =
            nextBottomInset > 40 || window.innerHeight - vv.height > 100;

        height.set(vv.height);
        offsetTop.set(vv.offsetTop);
        bottomInset.set(nextBottomInset);
        keyboardFallback.set(
            isFocused && !viewportReportedKeyboard ? 280 : 0,
        );
    };

    const getActiveCursorRect = (): DOMRect | null => {
        if (!editorBodyEl) return null;
        const cursor = editorBodyEl.querySelector<HTMLElement>(
            '.cm-cursorLayer .cm-cursor',
        );
        if (cursor) return cursor.getBoundingClientRect();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;
        return selection.getRangeAt(0).getBoundingClientRect();
    };

    const hasActiveRangeSelection = () => {
        if (!editorBodyEl) return false;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            return false;
        }
        const anchorNode = selection.anchorNode;
        const focusNode = selection.focusNode;
        return Boolean(
            anchorNode &&
                focusNode &&
                editorBodyEl.contains(anchorNode) &&
                editorBodyEl.contains(focusNode),
        );
    };

    const ensureCursorVisible = () => {
        if (!isEditing || !editorBodyEl) return;
        if (hasActiveRangeSelection()) return;
        const scroller = editorBodyEl.querySelector<HTMLElement>(
            '.cm-editor .cm-scroller',
        );
        if (!scroller) return;
        const cursorRect = getActiveCursorRect();
        if (!cursorRect) return;
        const vv = window.visualViewport;
        const visibleTop = vv ? vv.offsetTop : 0;
        const visibleBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
        const topLimit = visibleTop + 8;
        const bottomLimit = visibleBottom - 12;
        if (cursorRect.bottom > bottomLimit) {
            scroller.scrollTop += cursorRect.bottom - bottomLimit;
        } else if (cursorRect.top < topLimit) {
            scroller.scrollTop -= topLimit - cursorRect.top;
        }
    };

    const scheduleEnsureCursorVisible = () => {
        window.requestAnimationFrame(() => {
            ensureCursorVisible();
            window.setTimeout(() => {
                ensureCursorVisible();
            }, 24);
        });
    };

    const setupCursorGuard = () => {
        if (!editorBodyEl) return () => {};
        const onEditorActivity = () => {
            updateVisualViewport();
            scheduleEnsureCursorVisible();
        };
        editorBodyEl.addEventListener('input', onEditorActivity);
        editorBodyEl.addEventListener('keyup', onEditorActivity);
        editorBodyEl.addEventListener('compositionend', onEditorActivity);
        editorBodyEl.addEventListener('touchend', onEditorActivity);
        editorBodyEl.addEventListener('click', onEditorActivity);
        document.addEventListener('selectionchange', onEditorActivity);
        window.visualViewport?.addEventListener('resize', onEditorActivity);
        window.visualViewport?.addEventListener('scroll', onEditorActivity);
        scheduleEnsureCursorVisible();
        return () => {
            editorBodyEl?.removeEventListener('input', onEditorActivity);
            editorBodyEl?.removeEventListener('keyup', onEditorActivity);
            editorBodyEl?.removeEventListener(
                'compositionend',
                onEditorActivity,
            );
            editorBodyEl?.removeEventListener('touchend', onEditorActivity);
            editorBodyEl?.removeEventListener('click', onEditorActivity);
            document.removeEventListener('selectionchange', onEditorActivity);
            window.visualViewport?.removeEventListener(
                'resize',
                onEditorActivity,
            );
            window.visualViewport?.removeEventListener(
                'scroll',
                onEditorActivity,
            );
        };
    };

    const clearCursorGuard = () => {
        cursorGuardCleanup?.();
        cursorGuardCleanup = null;
    };

    return {
        height,
        offsetTop,
        bottomInset,
        keyboardFallback,
        mount() {
            updateVisualViewport();
            window.visualViewport?.addEventListener(
                'resize',
                updateVisualViewport,
            );
            window.visualViewport?.addEventListener(
                'scroll',
                updateVisualViewport,
            );
            window.addEventListener('orientationchange', updateVisualViewport);
        },
        destroy() {
            clearCursorGuard();
            window.visualViewport?.removeEventListener(
                'resize',
                updateVisualViewport,
            );
            window.visualViewport?.removeEventListener(
                'scroll',
                updateVisualViewport,
            );
            window.removeEventListener('orientationchange', updateVisualViewport);
        },
        sync(nextIsEditing: boolean, nextEditorBodyEl: HTMLDivElement | null) {
            isEditing = nextIsEditing;
            editorBodyEl = nextEditorBodyEl;
            if (!isEditing || !editorBodyEl) {
                clearCursorGuard();
                return;
            }
            if (!cursorGuardCleanup) {
                cursorGuardCleanup = setupCursorGuard();
            }
        },
        handleFocusIn() {
            isFocused = true;
            updateVisualViewport();
        },
        handleFocusOut() {
            window.setTimeout(() => {
                isFocused = Boolean(editorBodyEl?.contains(document.activeElement));
                updateVisualViewport();
            }, 0);
        },
    };
};
