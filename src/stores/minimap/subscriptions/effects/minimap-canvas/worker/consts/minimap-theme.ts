import { getTheme } from 'src/obsidian/helpers/get-theme';
import { ElementName } from 'src/stores/minimap/subscriptions/effects/minimap-canvas/worker/shapes/helpers/calculate-chunk-positions';

export type MinimapTheme = {
    isLightTheme: boolean;
    wordBlock: string;
    indentLine: string;
    card_active: string;
    card_searchResult: string;
    chars: {
        [ElementName.heading]: string;
        [ElementName.period]: string;
        [ElementName.bullet]: string;
        [ElementName.highlight]: string;
        [ElementName.bold_italic]: string;
        [ElementName.wikilink]: string;
        [ElementName.tag]: string;
        [ElementName.strikethrough]: string;
        [ElementName.task]: string;
        [ElementName.comma]: string;
    };
};

const themes = {
    dark: {
        isLightTheme: false,
        card_active: '#a9a9a9a',
        card_searchResult: '#e0de7177',
        wordBlock: '#99999966',
        indentLine: '#ffffff55',
        chars: {
            [ElementName.highlight]: '#e0de7177', // brighter yellow
            [ElementName.wikilink]: '#027aff77', // brighter blue
            [ElementName.bold_italic]: '#fb464c66', // brighter red
            [ElementName.heading]: '#44cf6e77', // brighter green
            [ElementName.bullet]: '#E3BFD466', // brighter pink
            [ElementName.tag]: '#e9973f77', // brighter orange
            [ElementName.period]: '#ffffff88', // white
            [ElementName.strikethrough]: '#a882ff66', // brighter purple
            [ElementName.task]: '#17e7e077', // brighter cyan
            [ElementName.comma]: '#17e7e088', // white
        },
    },
    light: {
        isLightTheme: true,
        wordBlock: '#70707088',
        card_active: '#aaaaaa',
        card_searchResult: '#e0ac0077',
        indentLine: '#777777aa',
        chars: {
            [ElementName.highlight]: '#e0ac0077', // brighter yellow
            [ElementName.wikilink]: '#086ddd77', // brighter blue
            [ElementName.bold_italic]: '#e9314777', // brighter red
            [ElementName.heading]: '#08b94e77', // brighter green
            [ElementName.bullet]: '#E77EB277', // brighter pink
            [ElementName.tag]: '#ec750077', // brighter orange
            [ElementName.period]: '#777777ee', // original gray
            [ElementName.strikethrough]: '#7852ee77', // brighter purple
            [ElementName.task]: '#17e7e077', // brighter cyan
            [ElementName.comma]: '#11b3b3', //  brighter cyan
        },
    },
};

export const minimapTheme = {
    current: themes.dark,
};

export const refreshMinimapTheme = () => {
    minimapTheme.current = themes[getTheme()];
};
