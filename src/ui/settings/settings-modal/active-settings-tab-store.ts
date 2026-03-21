import { writable } from 'svelte/store';
import { SettingsTab } from 'src/ui/settings/renderers/render-settings';

export const ActiveSettingsTabStore = writable<SettingsTab>('General');
