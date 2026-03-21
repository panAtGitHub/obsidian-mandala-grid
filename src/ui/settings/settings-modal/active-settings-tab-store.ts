import { writable } from 'svelte/store';
import { SettingsTab } from 'src/view/actions/settings/render-settings';

export const ActiveSettingsTabStore = writable<SettingsTab>('General');
