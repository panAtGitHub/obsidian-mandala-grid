export const getTheme = () => {
    if (activeDocument.body.hasClass('theme-light')) return 'light';
    else if (activeDocument.body.hasClass('theme-dark')) return 'dark';
    throw new Error('could not detect theme');
};
