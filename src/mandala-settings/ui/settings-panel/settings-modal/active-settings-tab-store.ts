import { writable } from 'svelte/store';
import { SettingsTab } from 'src/mandala-settings/ui/settings-panel/renderers/render-settings';

export const ActiveSettingsTabStore = writable<SettingsTab>('General');
