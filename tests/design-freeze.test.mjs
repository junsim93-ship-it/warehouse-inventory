import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFreezeChange, freezeForLot, freezeMap } from '../lotfolio/design-freeze.mjs';
import { availableQuantity, frozenLotsById, planExclusions, simulatePlan } from '../lotfolio/calculator-plan.mjs';

const key = '2601V_138_B_NMC';
const by = 'admin@example.test';
const details = {reason:'quality', memo:'검사 대기', until:'2026-12-05'};
const frozen = buildFreezeChange({},'freeze',details,by,1000);
const freezes = freezeMap([{key,freeze:frozen.freeze},{key:'2601V_139_B_NMC',freeze:null}]);

test('a frozen design matches every order sequence and ignores unrelated or nonstandard lots', () => {
  for (const lot of ['2601V01_138_B_NMC','2601V03_138_B_NMC','2601V_138_B_NMC','2601V101_138_B_CNM']) {
    assert.equal(freezeForLot(freezes,lot),frozen.freeze);
  }
  for (const lot of ['2601V00_138_B_NMC','2601V02_139_B_NMC','2602V03_138_B_NMC','2601V01_138_A_NMC','FINISHED-01','bad_lot',null]) {
    assert.equal(freezeForLot(freezes,lot),null);
  }
});

test('freeze changes validate reason and date and retain the twenty latest transitions', () => {
  assert.throws(()=>buildFreezeChange({},'freeze',{},by),/동결 사유/);
  assert.throws(()=>buildFreezeChange({},'freeze',{...details,until:'2026-02-30'},by),/해제 예정일/);
  assert.throws(()=>buildFreezeChange(frozen,'freeze',details,by),/변경/);
  let state = frozen;
  for (let i=2; i<=22; i++) {
    state = i % 2 === 0
      ? buildFreezeChange(state,'unfreeze',{memo:'해제 완료'},by,i*1000)
      : buildFreezeChange(state,'freeze',details,by,i*1000);
  }
  assert.equal(state.freeze,null);
  assert.equal(state.freezeHistory.length,20);
  assert.equal(state.freezeHistory.at(-1).at,3000);
  assert.deepEqual(state.freezeHistory[0],{action:'unfreeze',...details,memo:'해제 완료',by,at:22000});
});

test('available stock, actual FEFO, shortage, and equivalent stock exclude frozen lots unless included', () => {
  const code = '138';
  const lots = [
    {id:'late',l:'FINISHED-77',e:'2027-03-01',q:5},
    {id:'old',l:'2601V01_138_B_NMC',e:'2027-01-01',q:8},
    {id:'mid',l:'2601V_139_B_NMC',e:'2027-02-01',q:2},
    {id:'manual',l:'STOCK-EXCLUDED',e:'2026-12-01',q:50},
  ];
  const frozenLots = frozenLotsById({carton:{[code]:{lots}}},freezes);
  const manual = new Set(['manual']);
  const bom = {id:'bom',components:[{code,qty:1}]};
  function run(includeFrozen) {
    const excluded = planExclusions(manual,frozenLots,includeFrozen);
    return simulatePlan({
      order:[{id:'a',bomId:'bom',qty:9}],boms:[bom],excluded,
      getStock:()=>({lots,used:availableQuantity(lots,excluded)}),
      manualAlloc:{},partMode:{},kernelByCode:{},
    });
  }
  const without = run(undefined);
  assert.equal(without.rows[0].stock,7);
  assert.equal(without.totalShort[0].short,2);
  assert.equal(without.perProduct[0].after,7);
  const used = result => Object.fromEntries(result.lineDetails[0].components[0].allocations.map(lot=>[lot.id,lot.use]));
  assert.deepEqual(used(without),{manual:null,old:null,mid:2,late:5});
  const withFrozen = run(true);
  assert.equal(withFrozen.rows[0].stock,15);
  assert.equal(withFrozen.totalShort.length,0);
  assert.equal(withFrozen.perProduct[0].after,15);
  assert.deepEqual(used(withFrozen),{manual:null,old:8,mid:1,late:0});
  assert.deepEqual([...manual],['manual']);
});

test('a frozen kernel expands to its components and a saved manual use cannot override the freeze', () => {
  const kernel = {id:'kernel',components:[{code:'component',qty:2}]};
  const bom = {id:'main',components:[{code:'kernel',qty:1}]};
  const kernelLots = [{id:'frozen',l:'2601V03_138_B_NMC',e:'',q:4}];
  const plain = [{id:'plain',l:'PLAIN',e:'',q:10}];
  const frozenLots = frozenLotsById({ecount:{kernel:{lots:kernelLots}}},freezes);
  for (const includeFrozen of [false,true]) {
    const excluded = planExclusions(new Set(),frozenLots,includeFrozen);
    const plan = simulatePlan({
      order:[{id:'a',bomId:'main',qty:4}],boms:[bom,kernel],excluded,
      getStock(code) {
        const lots = code === 'kernel' ? kernelLots : plain;
        return {lots,used:availableQuantity(lots,excluded)};
      },
      manualAlloc:{a:{kernel:{frozen:4}}},partMode:{},kernelByCode:{kernel},
    });
    assert.equal(plan.rows.find(row=>row.code==='component')?.required,includeFrozen ? undefined : 8);
    assert.equal(plan.lineDetails[0].components[0].allocations[0].use,includeFrozen ? 4 : null);
  }
});
