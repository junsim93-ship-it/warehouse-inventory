import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parseLot} from '../lotfolio/lot-engine.mjs';
import {formatQuantity, lookupInventory, stockBySource} from '../lotfolio/inventory-lookup.mjs';

test('stock totals preserve small decimal quantities and keep inventory sources separate', () => {
  const groups = stockBySource([
    {source:'3PL', quantity:0.000001}, {source:'3PL', quantity:0.0000002},
    {source:'이카운트', quantity:0.0005},
  ]);
  assert.deepEqual(groups.map(g=>[g.source, formatQuantity(g.total)]),
    [['3PL','0.0000012'], ['이카운트','0.0005']]);
  assert.equal(formatQuantity(0.0000001),'0.0000001');
  const adjustments = [0.1,0.2,-0.3].map(quantity=>({source:'이카운트',quantity}));
  assert.equal(stockBySource(adjustments)[0].total,0);
});

const target = '2601V03_005_B_NMC', other = '2601V02_005_B_NMC';
const key = '2601V_005_B_NMC';
function fixture(data) {
  const paths = [];
  async function read(path, options) {
    paths.push(path);
    assert.equal(options.source,'server');
    if (data[path] instanceof Error) throw data[path];
    return data[path];
  }
  return {
    paths,
    doc: path => ({async get(options) { const value = await read(path,options); return {data:() => value}; }}),
    collection: path => ({async get(options) {
      const value = await read(path,options) || {};
      return {docs:Object.entries(value).map(([id,data]) => ({id,data:() => data}))};
    }})
  };
}
test('stock includes all matching design revisions by source; locations only include the requested lot', async () => {
  const db = fixture({
    'stock/p3l':{lots:[{l:target,q:0.1},{l:target,q:0.2},{l:other,q:8},{l:'OTHER',q:20}]},
    'stock/carton':{lots:[{l:target,q:12}]}, 'stock/ecount':{lots:[{l:target,q:400}]},
    'stock/ecountCurrent':{mode:'ecount-authoritative',current:{records:[{lot:target,quantity:10},{lot:target,quantity:-2}]}},
    shelves:{'shelf-15':{cols:2,cells:[null,{list:[{lot:target,qty:5},{lot:target,qty:'1'}]},[{lot:other,qty:2}]]}},
    pallets:{'pgroup-pallet-5':{items:[{lot:target,qty:2}]},'pallet-5':{items:[{lot:target,qty:200}]}}
  });
  const result = await lookupInventory(db,target);
  assert.deepEqual(result.errors,[]);
  assert.equal(result.stock.length,4);
  const quantity = (src, lot = target) => result.stock.find(row => row.source === src && row.lotCode === lot).quantity;
  assert.equal(quantity('3PL'),0.3);
  assert.equal(quantity('3PL',other),8);
  assert.equal(quantity('이카운트'),8);
  assert.equal(quantity('카톤박스'),12);
  assert.ok(!db.paths.includes('stock/ecount'));
  assert.deepEqual(result.locations,[
    {location:'부자재 선반1 · 1단 2칸',lotCode:target,quantity:6},
    {location:'팔레트 03',lotCode:target,quantity:2}
  ]);
  const family = await lookupInventory(db,key);
  assert.ok(family.locations.some(row => row.lotCode === other && row.location === '부자재 선반1 · 2단 1칸'));
});

test('legacy shelf items and pallet aliases match the floor plan, including zero stock and unsequenced design keys',async () => {
  const result = await lookupInventory(fixture({
    'stock/ecount':{lots:[{l:target,q:-0.0000005},{l:target,q:0.0000004}]},
    shelves:{'shelf-5':{items:[{}, {lot:other,qty:0}, {lot:target,qty:2}]}},
    pallets:{'pgroup-pallet-5':{items:[]}, 'pallet-4':{items:[{lot:target,qty:2}]},
      'pgroup-pallet-4':{items:[{lot:target,qty:1}]}, 'pallet-5':{items:[{lot:key,qty:7}]}}
  }),key);
  assert.deepEqual(result.stock,[{source:'이카운트',lotCode:target,quantity:-0.0000001}]);
  assert.equal(result.locations.length,3);
  assert.ok(result.locations.some(row => row.location === '제품선반1 · 1단 2칸' && row.quantity === 2));
  assert.ok(result.locations.some(row => row.location === '팔레트 03' && row.lotCode === target && row.quantity === 3));
  assert.ok(result.locations.some(row => row.lotCode === key && row.quantity === 7));
});

test('an unavailable source reports partial results and cannot substitute an old ECOUNT upload',async () => {
  const db = fixture({'stock/ecountCurrent':new Error(), 'stock/p3l':{lots:[{l:target,q:3}]}, pallets:new Error()});
  const result = await lookupInventory(db,target);
  assert.equal(result.errors.length,2);
  assert.deepEqual(result.stock,[{source:'3PL',lotCode:target,quantity:3}]);
  assert.ok(!db.paths.includes('stock/ecount'));
});

test('the frame validates reply origin, sender, request ID and lot, handles cancellation and relays search',() => {
  const origin = 'https://workspace.example', messages = [], listeners = {}, events = {}, written = [];
  const parent = {postMessage:(data,target) => { assert.equal(target,origin); messages.push(data); }};
  let counter = 0;
  const frame = {parent,LotfolioEngine:{parseLot,randomId:() => 'id' + ++counter},
    addEventListener:(name,handler) => {listeners[name] = handler;}};
  const document = {documentElement:{setAttribute(){}},addEventListener:(name,handler) => {events[name] = handler;}};
  vm.runInNewContext(fs.readFileSync('hosting/unified/assets/lotfolio-frame.js','utf8'),
    {window:frame,document,location:{origin}});
  const bridge = frame.LotfolioFrame;
  const row = {code:'005',name:'품목',lot:''};
  assert.equal(bridge.parse('FINISHED-LOT'), null);
  const receive = (requestId,lotCode,options = {}) => listeners.message({
    origin,source:parent,data:{type:'lotfolio:generated',requestId,lotCode},...options
  });
  bridge.generate(row,lot => written.push(['first',lot]));
  const first = messages.at(-1).requestId;
  bridge.generate(row,lot => written.push(['second',lot]));
  const second = messages.at(-1).requestId;
  assert.equal(messages[1].type,'lotfolio:cancel');
  assert.equal(messages[1].requestId,first);
  receive(first,target);
  receive(second,target,{source:{}});
  receive(second,target,{origin:'https://other.example'});
  receive(second,'finished-good');
  assert.deepEqual(written,[]);
  receive(second,'2601V3_005_B_CMN');
  receive(second,target);
  assert.deepEqual(written,[['second',target]]);
  bridge.generate(row,lot => written.push(lot));
  listeners.message({origin,source:parent,data:{type:'lotfolio:cancel',requestId:messages.at(-1).requestId}});
  receive(messages.at(-1).requestId,target);
  assert.equal(written.length,1);
  bridge.generate(row,lot => written.push(lot));
  listeners.pagehide();
  assert.equal(messages.at(-1).type,'lotfolio:cancel');
  receive(messages.at(-1).requestId,target);
  assert.equal(written.length,1);
  let prevented = false;
  events.keydown({key:'K',ctrlKey:true,preventDefault:() => {prevented = true;}});
  assert.ok(prevented); assert.equal(messages.at(-1).type,'lotfolio:search');
});
