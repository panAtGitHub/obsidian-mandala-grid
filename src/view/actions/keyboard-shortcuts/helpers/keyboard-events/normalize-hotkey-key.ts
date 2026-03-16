export const normalizeHotkeyKey = (key: string) => {
    if (key === ' ') return 'Space';
    return key;
};
