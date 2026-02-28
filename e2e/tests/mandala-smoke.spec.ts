import { expect, test } from '@playwright/test';
import {
    closeObsidian,
    launchObsidian,
    openMandalaFile,
    upsertMarkdownFile,
} from '../helpers/obsidian-app';

const sectionsFile = (title: string, childTitle: string) => `---
mandala: true
---
<!--section: 1-->
${title}
<!--section: 2-->
${childTitle}
<!--section: 3-->
`;

test.skip(!process.env.OBSIDIAN_EXECUTABLE_PATH, 'requires Obsidian app path');

test.afterAll(async () => {
    await closeObsidian();
});

test('opens a sections document in mandala view', async () => {
    const { page } = await launchObsidian();
    await upsertMarkdownFile(
        page,
        'e2e-smoke-a.md',
        sectionsFile('Alpha center', 'Beta side'),
    );

    await openMandalaFile(page, 'e2e-smoke-a.md');

    await expect(page.locator('.mandala-view')).toBeVisible();
    await expect(page.locator('.mandala-card')).toContainText('Alpha center');
    await expect(page.locator('.mandala-section-label')).toContainText('1');
});

test('switches between mandala files and keeps rendering stable', async () => {
    const { page } = await launchObsidian();
    await upsertMarkdownFile(
        page,
        'e2e-smoke-a.md',
        sectionsFile('Alpha center', 'Beta side'),
    );
    await upsertMarkdownFile(
        page,
        'e2e-smoke-b.md',
        sectionsFile('Gamma center', 'Delta side'),
    );

    await openMandalaFile(page, 'e2e-smoke-a.md');
    await expect(page.locator('.mandala-card')).toContainText('Alpha center');

    await openMandalaFile(page, 'e2e-smoke-b.md');
    await expect(page.locator('.mandala-card')).toContainText('Gamma center');

    await openMandalaFile(page, 'e2e-smoke-a.md');
    await expect(page.locator('.mandala-card')).toContainText('Alpha center');
});
