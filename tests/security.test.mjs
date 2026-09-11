import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMutation, authorize, revisionMatches } from '../functions/security.mjs';

const item = {name:'Test', qty:'4', threshold:'2', expiry:'', lot:'L1'};
const shelf = {cols:4, cells:[{list:[item]},null,null,null,null,null,null,null], updatedAt:1};
const change = (data=shelf) => ({path:'shelves/shelf-18', expectedRevision:0, data});

test('anonymous, unassigned and unexpected roles cannot write', () => {
  for (const role of [undefined, null, 0, '1', 3]) assert.throws(()=>authorize(role,'shelves/shelf-18'));
  authorize(1,'shelves/shelf-18');
  assert.throws(()=>authorize(1,'boms/list'));
  assert.throws(()=>authorize(2,'roles/attacker'));
  assert.throws(()=>authorize(2,'auditLog/fake'));
});
test('normal shelf contents remain compatible; tier one cannot resize even at creation', () => {
  assert.doesNotThrow(()=>validateMutation(change(),1,null));
  assert.throws(()=>validateMutation(change({...shelf,cols:5,cells:Array(10).fill(null)}),1,null));
  assert.doesNotThrow(()=>validateMutation(change({...shelf,cols:5,cells:Array(10).fill(null)}),2,null));
});
test('invalid nested data cannot poison readers', () => {
  for(const data of [ {...shelf,cells:'broken'}, {...shelf,cells:[null]}, {...shelf,cols:100000},
    {...shelf,cells:[{list:[{...item,qty:'-1'}]},...Array(7).fill(null)]},
    {...shelf,cells:[{list:[{...item,extra:'not allowed'}]},...Array(7).fill(null)]} ]) {
    assert.throws(()=>validateMutation(change(data),2,shelf));
  }
});
test('spreadsheet stock accepts signed finite quantities, not malformed lots', () => {
  const data={fileName:'sample.xlsx',date:'2026-09-10',lots:[{c:'AB',n:'Test',w:'W',l:'L',e:'',q:-5}]};
  assert.doesNotThrow(()=>validateMutation({path:'stock/p3l',expectedRevision:0,data},1,null));
  for(const lots of ['bad',[{...data.lots[0],q:Infinity}],[{...data.lots[0],q:'5'}]])
    assert.throws(()=>validateMutation({path:'stock/p3l',expectedRevision:0,data:{...data,lots}},1,null));
});
test('unknown paths, injected fields and fake revisions are rejected', () => {
  for(const path of ['stock/other','stockPrev/p3l','shelves/unknown','roles/me','stock/p3l/extra'])
    assert.throws(()=>validateMutation({...change(),path},2,null));
  assert.throws(()=>validateMutation({...change(),data:{...shelf,_revision:500}},2,null));
  assert.throws(()=>validateMutation({...change(),expectedRevision:-1},2,null));
});
test('stale or absent versions cannot overwrite newer documents', () => {
  assert.equal(revisionMatches(0,null),true);
  assert.equal(revisionMatches(0,shelf),true);
  assert.equal(revisionMatches(0,{...shelf,_revision:1}),false);
  assert.equal(revisionMatches(1,{...shelf,_revision:1}),true);
});
