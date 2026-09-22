import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const context={window:{}};vm.runInNewContext(fs.readFileSync('src/product-picker.js','utf8'),context);
const {catalog,filter}=context.window.WarehouseProducts;
test('product picker merges stock names with ERP codes and searches Korean/code without changing saved names',()=>{
 const products=catalog([{name:' 볼트 ',code:'PART-1'},{name:'볼트',code:'PART-2'},{name:'포장재'}, {name:''}]);
 assert.equal(products.length,2);
 assert.equal(filter(products,'part-2')[0].name,'볼트');
 assert.equal(filter(products,'포장')[0].name,'포장재');
 assert.equal(filter(products,'없는품목').length,0);
 assert.equal(filter(products,'  ').length,2);
});
test('separate hosting build keeps existing Firebase project, locations and security boundary',()=>{
 const original=fs.readFileSync('src/pages/index.html','utf8'),next=fs.readFileSync('dist-next/index.html','utf8');
 const plan=html=>html.match(/<script[^>]*id="planData"[^>]*>([\s\S]*?)<\/script>/)[1];
 assert.deepEqual(JSON.parse(plan(next)),JSON.parse(plan(original)));
 for(const [,file,hash] of next.matchAll(/<script src="([^"]+)" integrity="sha384-([^"]+)"/g)) assert.equal(crypto.createHash('sha384').update(fs.readFileSync('dist-next/'+file)).digest('base64'),hash);
 assert.doesNotMatch(next,/fonts.googleapis.com|창고 현황을 한눈에|목록 보기/);
 const config=JSON.parse(fs.readFileSync('firebase.next.json','utf8'));
 assert.equal(config.hosting.site,'warehouse-inventory-v2-84fef');assert.equal(config.hosting.public,'dist-next');assert.equal(config.firestore,undefined);assert.equal(config.functions,undefined);
 const code=fs.readFileSync('src/warehouse-next.js','utf8');
 assert.match(code,/InventorySecurity.save\(batch\)/);assert.match(code,/projectId: "warehouse-inventory-84fef"/);
 assert.match(code,/repeat\(2, auto\)/);assert.match(code,/minmax\(220px, 1fr\)/);
});
