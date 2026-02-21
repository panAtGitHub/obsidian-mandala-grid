import { MandalaViewDocumentPreferences } from 'src/stores/settings/settings-type';

const hasOwn = (value: object, key: string) =>
    Boolean(Object.prototype.hasOwnProperty.call(value, key));

export const hasPersistedPinnedSections = (
    mandalaView: MandalaViewDocumentPreferences | null | undefined,
) =>
    Boolean(
        mandalaView &&
            mandalaView.migrated === true &&
            hasOwn(mandalaView, 'pinnedSections'),
    );

export const hasPersistedSectionColors = (
    mandalaView: MandalaViewDocumentPreferences | null | undefined,
) =>
    Boolean(
        mandalaView &&
            mandalaView.migrated === true &&
            hasOwn(mandalaView, 'sectionColors'),
    );
