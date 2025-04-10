import { Settings } from 'src/stores/settings/settings-type';

const formatNumber = (num: number): number => parseFloat(num.toFixed(3));

const zoomStep = 0.1;
export const maxZoomLevel = 2;
export const minZoomLevel = 0.05;

export type ChangeZoomLevelAction = {
    type: 'settings/view/set-zoom-level';
    payload:
        | {
              direction: 'in' | 'out';
          }
        | {
              value: number;
          };
};

export const changeZoomLevel = (
    state: Settings,
    payload: ChangeZoomLevelAction['payload'],
) => {
    if ('value' in payload) {
        state.view.zoomLevel = payload.value;
    } else {
        state.view.zoomLevel =
            payload.direction === 'in'
                ? Math.min(state.view.zoomLevel + zoomStep, maxZoomLevel)
                : Math.max(state.view.zoomLevel - zoomStep, minZoomLevel);
    }
    state.view.zoomLevel = formatNumber(state.view.zoomLevel);
};
