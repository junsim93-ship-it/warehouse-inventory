import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
test('deployed pages contain no embedded business records or third-party executable URLs',()=>{
  for(const page of ['index.html','calculator.html']){
    const html=fs.readFileSync(page,'utf8');
    assert.doesNotMatch(html,/INIT_3PL|INIT_ECOUNT|inventory_16\.xlsx|<script[^>]*src="https?:/);
    assert.doesNotMatch(html,/text\/babel|unsafe-eval/);
    assert.match(html,/Content-Security-Policy/);
    for(const [,file,hash] of html.matchAll(/<script src="([^"]+)" integrity="sha384-([^"]+)"/g))
      assert.equal(crypto.createHash('sha384').update(fs.readFileSync(file)).digest('base64'),hash,file);
  }
  assert.match(fs.readFileSync('vendor/xlsx.full.min.js','utf8'),/0\.20\.3/);
});
test('hosting blocks framing and serves scripts without MIME sniffing',()=>{
  const headers=Object.fromEntries(JSON.parse(fs.readFileSync('firebase.json')).hosting.headers[0].headers.map(x=>[x.key,x.value]));
  assert.match(headers['Content-Security-Policy'],/frame-ancestors 'none'/);
  assert.equal(headers['X-Frame-Options'],'DENY');
  assert.equal(headers['X-Content-Type-Options'],'nosniff');
});
