import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

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
