import { MandalaView } from 'src/view/view';
import { DEFAULT_H1_FONT_SIZE_EM } from 'src/stores/settings/default-settings';
import { roundUp } from 'src/helpers/round-up';

const variables = [
    '--h2-size',
    '--h3-size',
    '--h4-size',
    '--h5-size',
    '--h6-size',
];

const BASE_MULTIPLIER = 1.125;
const MIN_HEADING_SIZE = 1.0;

const adjustMultiplier = (h1_em: number) => {
    const subtracted = (DEFAULT_H1_FONT_SIZE_EM - h1_em) * 0.2;
    return h1_em < DEFAULT_H1_FONT_SIZE_EM
        ? BASE_MULTIPLIER - Math.min(subtracted, 0.125)
        : BASE_MULTIPLIER;
};

const calculateFontSize = (
    h1_em: number,
    multiplier: number,
    level: number,
) => {
    return Math.max(
        roundUp(h1_em * Math.pow(1 / multiplier, level), 3),
        MIN_HEADING_SIZE,
    );
};

export const applyHeadingsFontSize = (view: MandalaView, h1_em: number) => {
    const el = view.containerEl;

    if (h1_em === DEFAULT_H1_FONT_SIZE_EM) {
        el.style.removeProperty('--h1-size');
        el.style.removeProperty('--mandala-h1-size');
        for (const key of variables) {
            el.style.removeProperty(key);
        }
    } else {
        el.style.setProperty('--h1-size', `${h1_em}em`);
        el.style.setProperty('--mandala-h1-size', `${h1_em}em`);
        const adjustedMultiplier = adjustMultiplier(h1_em);
        for (let i = 0; i < variables.length; i++) {
            const key = variables[i];
            const value = calculateFontSize(h1_em, adjustedMultiplier, i + 1);
            el.style.setProperty(key, `${value}em`);
        }
    }
};
