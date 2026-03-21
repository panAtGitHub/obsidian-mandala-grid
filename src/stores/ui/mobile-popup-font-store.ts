import { writable } from 'svelte/store';

// 专门用于移动端全屏编辑器的临时字号存储
// 与全局字号设置隔离，提供更好的编辑体验
function createMobilePopupFontSizeStore() {
    const { subscribe, set } = writable(16);

    return {
        subscribe,
        setFontSize: (size: number) => set(Math.max(12, Math.min(30, size))),
        reset: () => set(16)
    };
}

export const mobilePopupFontSizeStore = createMobilePopupFontSizeStore();
