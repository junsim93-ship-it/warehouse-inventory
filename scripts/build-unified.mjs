import { build } from 'esbuild';
import { readFile, writeFile, mkdir, copyFile, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const repo = fileURLToPath(new URL('../', import.meta.url));
process.chdir(repo);
const site = 'hosting/unified';
const assets = site + '/assets';
await mkdir(assets, { recursive: true });
const options = {
  absWorkingDir: repo,
  bundle: true,
  minify: true,
  target: 'es2022',
  legalComments: 'eof',
  define: { 'process.env.NODE_ENV': '"production"', LOTFOLIO_TEST_EMULATORS: 'null' },
};
await build({
  ...options,
  entryPoints: ['lotfolio/lot-engine.mjs'],
  format: 'iife',
  globalName: 'LotfolioEngine',
  outfile: assets + '/lot-engine.js',
});
if (!process.argv.includes('--engine-only')) {
  await build({
    ...options,
    entryPoints: ['lotfolio/app.jsx'],
    format: 'esm',
    outfile: assets + '/lotfolio.js',
    external: ['/vendor/*'],
  });
  const pdf = site + '/vendor/pdfjs';
  const fonts = site + '/vendor/lotfolio-fonts';
  const licenses = site + '/vendor/lotfolio-licenses';
  await Promise.all([pdf, fonts, licenses].map((dir) => mkdir(dir, { recursive: true })));
  await copyFile('node_modules/pdfjs-dist/build/pdf.min.mjs', pdf + '/pdf.mjs');
  await copyFile('node_modules/pdfjs-dist/build/pdf.worker.min.mjs', pdf + '/pdf.worker.min.mjs');
  for (const name of ['cmaps', 'standard_fonts'])
    await cp('node_modules/pdfjs-dist/' + name, pdf + '/' + name, { recursive: true });
  await copyFile(
    'node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
    fonts + '/pretendard.woff2',
  );
  for (const weight of [400, 500, 600])
    await copyFile(
      'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-' + weight + '-normal.woff2',
      fonts + '/plex-' + weight + '.woff2',
    );
  for (const [pkg, file = 'LICENSE'] of [
    ['react'],
    ['react-dom'],
    ['scheduler'],
    ['lucide-react'],
    ['pdfjs-dist'],
    ['pretendard', 'dist/LICENSE.txt'],
    ['@fontsource/ibm-plex-mono'],
  ]) {
    await copyFile(path.join('node_modules', pkg, file), path.join(licenses, pkg.replace('/', '-') + '.txt'));
  }
  const settings = JSON.parse(await readFile('firebase.unified.json', 'utf8'));
  const policy = settings.hosting.headers[0].headers.find((h) => h.key === 'Content-Security-Policy').value;
  const metaPolicy = policy
    .split('; ')
    .filter((d) => !d.startsWith('frame-ancestors '))
    .join('; ');
  const integrity = async (file) =>
    'sha384-' +
    createHash('sha384')
      .update(await readFile(site + '/' + file))
      .digest('base64');
  const scripts = [
    'vendor/firebase-app-compat.js',
    'vendor/firebase-auth-compat.js',
    'vendor/firebase-firestore-compat.js',
    'vendor/xlsx.full.min.js',
    'assets/unified-session.js',
    'assets/security-client.js',
    'assets/lotfolio.js',
  ];
  const tags = await Promise.all(
    scripts.map(
      async (file) =>
        '<script ' +
        (file === 'assets/lotfolio.js' ? 'type="module" ' : 'defer ') +
        'src="/' +
        file +
        '" integrity="' +
        (await integrity(file)) +
        '" crossorigin="anonymous"></script>',
    ),
  );
  const html = [
    '<!doctype html>',
    '<html lang="ko"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta http-equiv="Content-Security-Policy" content="' + metaPolicy + '">',
    '<title>Lotfolio | 패키징 · 창고 워크스페이스</title>',
    '<link rel="icon" type="image/png" href="/assets/lotfolio-icon.png">',
    '<link rel="stylesheet" href="/assets/lotfolio.css" integrity="' +
      (await integrity('assets/lotfolio.css')) +
      '" crossorigin="anonymous">',
    ...tags,
    '</head><body><div id="root"></div><noscript>워크스페이스를 열려면 JavaScript를 사용해 주세요.</noscript></body></html>',
    '',
  ].join('\n');
  for (const page of ['index.html', 'calculator.html']) await writeFile(site + '/' + page, html);
  // Refresh integrity hashes from the exact served bytes, including the calculator bridge.
  for (const page of ['calculator-frame.html', 'warehouse-frame.html']) {
    const file = site + '/' + page;
    let content = await readFile(file, 'utf8');
    for (const [tag, src] of [...content.matchAll(/<script\b[^>]*?\bsrc="\/?([^":]+)"[^>]*>/g)]) {
      const hash = await integrity(src);
      const cleaned = tag.replace(/\s+integrity="[^"]*"/g, '').replace(/\s+crossorigin="[^"]*"/g, '');
      content = content.replace(
        tag,
        cleaned.slice(0, -1) + ' integrity="' + hash + '" crossorigin="anonymous">',
      );
    }
    await writeFile(file, content);
  }
}
