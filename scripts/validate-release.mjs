import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve('.');
const rootPath = (relativePath) => resolve(repoRoot, relativePath);

const REQUIRED_MANIFEST_KEYS = [
    'id',
    'name',
    'description',
    'author',
    'version',
    'minAppVersion',
    'isDesktopOnly',
];

const ALLOWED_MANIFEST_KEYS = [
    ...REQUIRED_MANIFEST_KEYS,
    'authorUrl',
    'fundingUrl',
    'helpUrl',
];

const RELEASE_ASSET_PATHS = [
    'manifest.json',
    'temp/vault/.obsidian/plugins/mandala-grid-dev/main.js',
    'temp/vault/.obsidian/plugins/mandala-grid-dev/styles.css',
];

const BUILD_MANIFEST_PATH = 'temp/vault/.obsidian/plugins/mandala-grid-dev/manifest.json';

const errors = [];
const warnings = [];

const addError = (message) => errors.push(message);
const addWarning = (message) => warnings.push(message);

const readJson = (relativePath) => {
    const absolutePath = rootPath(relativePath);

    try {
        return JSON.parse(readFileSync(absolutePath, 'utf8'));
    } catch (error) {
        addError(`Unable to parse ${relativePath}: ${error.message}`);
        return null;
    }
};

const assertFileExists = (relativePath, label = relativePath) => {
    if (!existsSync(rootPath(relativePath))) {
        addError(`Missing ${label}.`);
        return false;
    }

    return true;
};

const assertNonEmptyFile = (relativePath) => {
    if (!assertFileExists(relativePath)) return;

    const stats = statSync(rootPath(relativePath));
    if (stats.size <= 0) {
        addError(`${relativePath} is empty.`);
    }
};

const packageJson = readJson('package.json');
const manifest = readJson('manifest.json');
const versions = readJson('versions.json');
const buildManifest = existsSync(rootPath(BUILD_MANIFEST_PATH))
    ? readJson(BUILD_MANIFEST_PATH)
    : null;

if (manifest) {
    for (const key of REQUIRED_MANIFEST_KEYS) {
        if (!Object.prototype.hasOwnProperty.call(manifest, key)) {
            addError(`manifest.json is missing required key '${key}'.`);
        }
    }

    for (const key of Object.keys(manifest)) {
        if (!ALLOWED_MANIFEST_KEYS.includes(key)) {
            addError(`manifest.json has unsupported key '${key}'.`);
        }
    }

    const id = String(manifest.id ?? '');
    const idLower = id.toLowerCase();
    if (idLower.includes('obsidian')) {
        addError("manifest.json id should not include 'obsidian'.");
    }
    if (idLower.endsWith('plugin')) {
        addError("manifest.json id should not end with 'plugin'.");
    }
    if (id && !/^[a-z0-9-_]+$/.test(id)) {
        addError('manifest.json id is invalid. Use lowercase letters, numbers, dashes, or underscores only.');
    }

    const name = String(manifest.name ?? '');
    const nameLower = name.toLowerCase();
    if (nameLower.includes('obsidian')) {
        addError("manifest.json name should not include 'Obsidian'.");
    }
    if (nameLower.endsWith('plugin')) {
        addError("manifest.json name should not end with 'Plugin'.");
    }
    if (nameLower.startsWith('obsi') || nameLower.endsWith('dian')) {
        addError("manifest.json name should not use fragments of 'Obsidian'.");
    }

    const description = String(manifest.description ?? '');
    const descriptionLower = description.toLowerCase();
    if (descriptionLower.includes('obsidian')) {
        addError("manifest.json description should not include 'Obsidian'.");
    }
    if (
        descriptionLower.includes('this plugin') ||
        descriptionLower.includes('this is a plugin') ||
        descriptionLower.includes('this plugin allows')
    ) {
        addWarning('Prefer a direct description over phrases like "This plugin ...".');
    }
    if (
        description &&
        !description.endsWith('.') &&
        !description.endsWith('?') &&
        !description.endsWith('!') &&
        !description.endsWith(')')
    ) {
        addError('manifest.json description must end with one of . ? ! ).');
    }
    if (description.length > 250) {
        addError('manifest.json description is too long. Keep it at or below 250 characters.');
    }

    if (!/^[0-9.]+$/.test(String(manifest.version ?? ''))) {
        addError('manifest.json version is invalid. Only numbers and dots are allowed.');
    }

    if (typeof manifest.isDesktopOnly !== 'boolean') {
        addError('manifest.json isDesktopOnly must be a boolean.');
    }

    if (manifest.authorUrl === 'https://obsidian.md') {
        addError('manifest.json authorUrl should not point to https://obsidian.md.');
    }

    if (
        typeof manifest.authorUrl === 'string' &&
        typeof packageJson?.repository === 'string' &&
        manifest.authorUrl.toLowerCase().includes(packageJson.repository.toLowerCase())
    ) {
        addError('manifest.json authorUrl should not point to the plugin repository URL.');
    }

    if (manifest.fundingUrl === 'https://obsidian.md/pricing') {
        addError('manifest.json fundingUrl should not point to https://obsidian.md/pricing.');
    }

    if (manifest.fundingUrl === '') {
        addError('Remove fundingUrl instead of leaving it empty.');
    }
}

if (packageJson && manifest) {
    if (packageJson.version !== manifest.version) {
        addError(
            `package.json version (${packageJson.version}) does not match manifest.json version (${manifest.version}).`,
        );
    }
}

if (versions && manifest) {
    if (!Object.prototype.hasOwnProperty.call(versions, manifest.version)) {
        addError(`versions.json is missing an entry for ${manifest.version}.`);
    } else if (versions[manifest.version] !== manifest.minAppVersion) {
        addError(
            `versions.json entry for ${manifest.version} (${versions[manifest.version]}) does not match manifest minAppVersion (${manifest.minAppVersion}).`,
        );
    }
}

if (!assertFileExists('README.md')) {
    // already recorded
}

if (!existsSync(rootPath('LICENSE')) && !existsSync(rootPath('LICENCE'))) {
    addError('Missing license file. Add LICENSE or LICENCE at the repository root.');
}

for (const assetPath of RELEASE_ASSET_PATHS) {
    assertNonEmptyFile(assetPath);
}

if (buildManifest && manifest) {
    const compareKeys = ['id', 'name', 'description', 'author', 'version', 'minAppVersion', 'isDesktopOnly'];
    for (const key of compareKeys) {
        if (buildManifest[key] !== manifest[key]) {
            addError(
                `Built manifest mismatch for '${key}': temp manifest has '${buildManifest[key]}' but root manifest has '${manifest[key]}'.`,
            );
        }
    }
}

if (!buildManifest) {
    addError(`Missing ${BUILD_MANIFEST_PATH}. Run npm run build before npm run validate:release.`);
}

const releaseWorkflowPath = '.github/workflows/release.yml';
if (assertFileExists(releaseWorkflowPath, releaseWorkflowPath)) {
    const workflowText = readFileSync(rootPath(releaseWorkflowPath), 'utf8');
    for (const assetPath of RELEASE_ASSET_PATHS) {
        if (!workflowText.includes(assetPath)) {
            addError(`release.yml does not reference expected asset path '${assetPath}'.`);
        }
    }
}

if (warnings.length > 0) {
    console.log('Release validation warnings:');
    for (const warning of warnings) {
        console.log(`- ${warning}`);
    }
    console.log('');
}

if (errors.length > 0) {
    console.error('Release validation failed:');
    for (const error of errors) {
        console.error(`- ${error}`);
    }
    process.exit(1);
}

console.log('Release validation passed.');
console.log('- manifest/package/versions consistency checked');
console.log('- official manifest field rules checked');
console.log('- build outputs and release workflow asset paths checked');