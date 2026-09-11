import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context=vm.createContext({ArrayBuffer,Uint8Array,TextEncoder,TextDecoder,console});
context.self=context;
vm.runInContext(fs.readFileSync('vendor/xlsx.full.min.js','utf8'),context);
const XLSX=context.XLSX;
function run(buffer){
  let result;
  const worker=vm.createContext({XLSX,ArrayBuffer,importScripts(){},self:{postMessage(v){result=v;}}});
  vm.runInContext(fs.readFileSync('src/workbook-worker.js','utf8'),worker);
  worker.self.onmessage({data:buffer});
  return result;
}
test('patched spreadsheet reader preserves ordinary stock cells',()=>{
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['품목코드','수량'],['TEST',12]]),'Stock');
  const bytes=XLSX.write(wb,{type:'array',bookType:'xlsx'});
  // Normalize across the test VM's ArrayBuffer realm.
  const input=Uint8Array.from(new Uint8Array(bytes)).buffer;
  const result=run(input);
  assert.equal(result.error,undefined);
  assert.equal(result.workbook.Sheets.Stock.B2.v,12);
});
test('oversized workbook data is rejected before parsing',()=>{
  assert.match(run(new ArrayBuffer(10*1024*1024+1)).error,/10MB/);
});
