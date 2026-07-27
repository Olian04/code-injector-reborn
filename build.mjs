import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');

const IMPORT_RE = /^[ \t]*\/\/[ \t]*@import[ \t]+["']([^"']+)["'];?[ \t]*$/gm;

/**
 * Read a script and recursively inline `// @import "..."` directives.
 * Paths are resolved relative to the file that declares the import.
 */
async function inlineImports(filePath, seen = new Set()) {
    const absolute = path.resolve(filePath);
    if (seen.has(absolute)) return '';
    seen.add(absolute);

    const source = await fs.readFile(absolute, 'utf8');
    const dir = path.dirname(absolute);

    const replacements = [];
    for (const match of source.matchAll(IMPORT_RE)) {
        const target = path.resolve(dir, match[1]);
        replacements.push({
            token: match[0],
            content: await inlineImports(target, seen),
        });
    }

    let result = source;
    for (const { token, content } of replacements) {
        result = result.replace(token, content);
    }
    return result;
}

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

async function writeFile(relPath, content) {
    const dest = path.join(dist, relPath);
    await ensureDir(path.dirname(dest));
    await fs.writeFile(dest, content);
    console.log('  build', relPath);
}

async function copy(from, to) {
    const dest = path.join(dist, to);
    await ensureDir(path.dirname(dest));
    await fs.cp(from, dest, { recursive: true });
    console.log('  copy ', to);
}

async function compileScss(entry, outRel) {
    const sass = require('sass');
    const result = sass.compile(path.join(root, entry), {
        style: 'compressed',
        loadPaths: [path.join(root, 'style')],
    });
    await writeFile(outRel, result.css);
}

async function build() {
    console.log('Cleaning dist/');
    await fs.rm(dist, { recursive: true, force: true });
    await ensureDir(dist);

    const polyfill = await fs.readFile(
        require.resolve('webextension-polyfill/dist/browser-polyfill.min.js'),
        'utf8'
    );

    // Service worker: bundle polyfill + (background with utils inlined) into a
    // single classic worker file (service workers cannot load <script> tags).
    console.log('Bundling scripts');
    const background = await inlineImports('script/main/background.js');
    await writeFile(
        'script/background.js',
        `${polyfill}\n;\n${background}\n`
    );

    // Extension pages load the polyfill via their own <script> tag, so the page
    // bundles only need utils inlined.
    await writeFile(
        'script/browser-action.js',
        await inlineImports('script/main/browser-action.js')
    );
    await writeFile(
        'script/options-ui.js',
        await inlineImports('script/main/options-ui.js')
    );

    // Content script injected via chrome.scripting.executeScript.
    await writeFile(
        'script/inject.js',
        await inlineImports('script/main/inject.js')
    );

    // Standalone polyfill for the popup/options HTML pages.
    await writeFile('script/browser-polyfill.min.js', polyfill);

    console.log('Compiling styles');
    await compileScss('style/browser-action.scss', 'style/browser-action.min.css');
    await compileScss('style/options-ui.scss', 'style/options-ui.min.css');
    await copy(path.join(root, 'style/material-icons.css'), 'style/material-icons.css');
    await copy(path.join(root, 'style/fonts'), 'style/fonts');
    await copy(path.join(root, 'style/images'), 'style/images');

    console.log('Vendoring Monaco editor');
    const monacoVs = path.join(
        path.dirname(require.resolve('monaco-editor/package.json')),
        'min/vs'
    );
    await copy(monacoVs, 'script/vs');

    console.log('Copying static assets');
    await copy(path.join(root, 'html'), 'html');
    await copy(path.join(root, 'manifest.json'), 'manifest.json');

    console.log('Build complete -> dist/');
}

async function zip() {
    const archiverModule = await import('archiver');
    const archiver = archiverModule.default || archiverModule;
    const outPath = path.join(root, 'code-injector.zip');
    await fs.rm(outPath, { force: true });

    await new Promise((resolve, reject) => {
        const output = createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);
        archive.directory(dist, false);
        archive.finalize();
    });
    console.log(`Zipped -> ${path.relative(root, outPath)}`);
}

await build();
if (process.argv.includes('--zip')) {
    await zip();
}
