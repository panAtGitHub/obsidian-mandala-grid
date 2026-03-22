import { getTheme } from 'src/obsidian/helpers/get-theme';
import { Theme } from 'src/mandala-settings/state/settings-type';

type DefaultTheme = Pick<
    Theme,
    'activeBranchBg' | 'containerBg' | 'activeBranchColor'
>;

export const getDefaultTheme = () => {
    const textNormal = getComputedStyle(activeDocument.body).getPropertyValue(
        '--text-normal',
    );
    const darkTheme = {
        containerBg: '#373d4c',
        activeBranchBg: '#5b637a',
        activeBranchColor: textNormal,
    } satisfies DefaultTheme;
    const lightTheme = {
        containerBg: '#899cb3',
        activeBranchBg: '#cedbeb',
        activeBranchColor: textNormal,
    } satisfies DefaultTheme;
    const theme = getTheme();
    return theme === 'light' ? lightTheme : darkTheme;
};
