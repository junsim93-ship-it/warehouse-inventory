import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {loadSpreadsheet} from '../lotfolio/spreadsheet.mjs';

const config = JSON.parse(fs.readFileSync('firebase.unified.json','utf8'));
const site = config.hosting.public;

test('all four unified entry points load the exact self-hosted scripts allowed by their HTML', () => {
  for (const page of ['index.html','calculator.html','warehouse-frame.html','calculator-frame.html']) {
    const html = fs.readFileSync(path.join(site,page),'utf8');
    const tags = [...html.matchAll(/<script\b[^>]*>/g)];
    assert.ok(tags.length > 0,page);
    for (const [tag] of tags) {
      const src = /\bsrc="([^"]+)"/.exec(tag)?.[1];
      assert.match(src,/^\/?(assets|vendor)\/[\w.-]+$/);
      const bytes = fs.readFileSync(path.join(site,src));
      const hash = 'sha384-'+createHash('sha384').update(bytes).digest('base64');
      assert.ok(tag.includes('integrity="'+hash+'"'),page+': '+src);
    }
  }
  assert.ok(fs.readFileSync(path.join(site,'index.html')).equals(fs.readFileSync(path.join(site,'calculator.html'))));
});

test('the unified release config publishes only Hosting and includes the local PDF renderer and fonts', () => {
  assert.deepEqual(Object.keys(config),['hosting']);
  assert.equal(config.hosting.site,'warehouse-unified-84fef');
  for(const file of ['vendor/pdfjs/pdf.mjs','vendor/pdfjs/pdf.worker.min.mjs','vendor/lotfolio-fonts/pretendard.woff2','assets/lot-products-template.xlsx']) {
    assert.ok(fs.statSync(path.join(site,file)).size>0,file);
  }
  const policy=config.hosting.headers[0].headers.find(h=>h.key==='Content-Security-Policy').value;
  assert.match(policy,/frame-ancestors 'self'/);
  assert.match(policy,/connect-src[^;]*https:\/\/firebasestorage\.googleapis\.com/);
  assert.doesNotMatch(policy,/'unsafe-eval'/);
});

test('the calculator reuses the shell SDK and defers the spreadsheet download', () => {
  const shell = fs.readFileSync(path.join(site,'index.html'),'utf8');
  const frame = fs.readFileSync(path.join(site,'calculator-frame.html'),'utf8');
  const sdk = shell.match(/src="(\/assets\/firebase-sdk-[a-f0-9]{16}\.js)"/)[1];
  const runtime = shell.match(/name="calculator-runtime" content="([^"]+)"/)[1];
  for (const asset of [sdk,runtime]) {
    assert.ok(frame.includes('src="'+asset+'"'));
    const cache = config.hosting.headers.filter(rule => rule.regex && new RegExp(rule.regex).test(asset))
      .flatMap(rule => rule.headers).filter(h => h.key === 'Cache-Control').at(-1);
    assert.match(cache.value,/immutable/);
  }
  assert.doesNotMatch(shell+frame,/src="[^"]*xlsx/);
  assert.equal([...frame.matchAll(/<script\b/g)].length,3);
});

test('spreadsheet requests share a verified script and can retry after a network failure', async t => {
  const scripts = [];
  globalThis.window = {};
  globalThis.document = {
    createElement: () => ({remove() {}}),
    head: {append: element => scripts.push(element)}
  };
  t.after(() => { delete globalThis.window; delete globalThis.document; });
  const first = loadSpreadsheet();
  assert.equal(loadSpreadsheet(), first);
  assert.equal(scripts.length, 1);
  const hash = createHash('sha384').update(fs.readFileSync(path.join(site,scripts[0].src))).digest('base64');
  assert.equal(scripts[0].integrity, 'sha384-'+hash);
  scripts[0].onerror();
  await assert.rejects(first, /엑셀/);
  const retry = loadSpreadsheet();
  assert.equal(scripts.length, 2);
  window.XLSX = {utils:{}};
  scripts[1].onload();
  assert.equal(await retry, window.XLSX);
  assert.equal(await loadSpreadsheet(), window.XLSX);
  assert.equal(scripts.length, 2);
});
