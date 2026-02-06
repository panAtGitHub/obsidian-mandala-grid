import { writable } from 'svelte/store';
import { Platform } from 'obsidian';

const FONT_SIZE_KEY = 'mandala-device-local-font-size';

// 初始值检测：手机 12px，其他 16px
const getInitialValue = () => {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    if (saved) return parseInt(saved);
    return Platform.isPhone ? 12 : 16;
};

const createLocalFontStore = () => {
    const { subscribe, set } = writable(getInitialValue());

    return {
        subscribe,
        setFontSize: (size: number) => {
            const clampedSize = Math.min(Math.max(size, 6), 36);
            localStorage.setItem(FONT_SIZE_KEY, clampedSize.toString());
            set(clampedSize);
        }
    };
};

export const localFontStore = createLocalFontStore();
