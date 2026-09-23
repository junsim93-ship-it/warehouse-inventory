import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {model,mapping,encodeLocation,revisionOf} from '../functions/ui-shared/model.mjs';
test('shared inventory mapping preserves cells, two rows, aliases and product identity',async()=>{
  const item={name:'볼트',qty:'12',threshold:'3',lot:'L1',expiry:''};
  const docs={'shelves/shelf-5':{cols:9,cells:[{list:[item]}],_revision:2},'pallets/pallet-4':{items:[item]}};
  const {locations,products}=await model(docs);
  assert.equal(locations.length,30);assert.equal(Object.keys(mapping).length,30);
  const shelf=locations.find(l=>l.id==='S01'),pallet=locations.find(l=>l.id==='P03');
  assert.equal(shelf.rows,2);assert.equal(Object.keys(shelf.cells).length,18);
  assert.equal(shelf.cells['1-1'][0].qty,12);assert.equal(pallet.cells['1-1'][0].code,products[0].code);
  assert.equal(encodeLocation(shelf).cells.length,18);
  assert.equal(encodeLocation(shelf).cells[0].list[0].name,item.name);
  const canonical={...docs,'pallets/pgroup-pallet-5':{items:[{...item,qty:7}]}};
  assert.equal((await model(canonical)).locations.find(l=>l.id==='P03').cells['1-1'][0].qty,7);
  assert.notEqual(await revisionOf(docs),await revisionOf(canonical));
  assert.equal(await revisionOf(docs),await revisionOf(Object.fromEntries(Object.entries(docs).reverse())));
  const legacy=await model({'shelves/shelf-5':{items:Array.from({length:30},()=>item)}});
  assert.equal(legacy.locations[0].cols,15);assert.equal(Object.values(legacy.locations[0].cells).flat().length,30);
  const unnamed=await model({'shelves/shelf-5':{items:[{qty:3}]}});
  assert.equal(unnamed.locations[0].cells['1-1'][0].qty,3);
});
test('separate build loads React without changing the original hosting target',()=>{
  const html=fs.readFileSync('dist-next/index.html','utf8');
  assert.match(html,/<div id="root"><\/div>/);assert.match(html,/type="module"/);
  const config=JSON.parse(fs.readFileSync('firebase.next.json'));
  assert.equal(config.hosting.site,'warehouse-inventory-v2-84fef');
  assert.equal(config.hosting.public,'dist-next');
  assert.equal(config.functions,undefined);assert.equal(config.firestore,undefined);
  const css=fs.readFileSync('ui/styles.css','utf8');assert.match(css,/prefers-reduced-motion/);
});

test('rotated mirrored machine-room door stays hinged on the right wall',()=>{
  const source=fs.readFileSync('ui/FloorPlan.jsx','utf8');
  const template=source.match(/transform=\{`([^`]+scale[^`]+)`\}/)[1];
  const s={x:1992,y:1400,w:220/3,h:220/3,rot:90,flip:true};
  const rotation=s=>'rotate('+s.rot+' '+(s.x+s.w/2)+' '+(s.y+s.h/2)+')';
  const transform=new Function('s','rotation','return `'+template+'`')(s,rotation);
  let x=s.x,y=s.y+s.h;
  for(const [,op,args] of [...transform.matchAll(/(translate|scale|rotate)\(([^)]+)\)/g)].reverse()){
    const [a,b,c]=args.trim().split(/\s+/).map(Number);
    if(op==='translate'){x+=a;y+=b;}
    if(op==='scale'){x*=a;y*=b;}
    if(op==='rotate'){const dx=x-b,dy=y-c,r=a*Math.PI/180;x=b+dx*Math.cos(r)-dy*Math.sin(r);y=c+dx*Math.sin(r)+dy*Math.cos(r);}
  }
  assert.ok(Math.abs(x-2065.333333333333)<0.001,'hinge must meet the right room wall');
  assert.ok(Math.abs(y-1400)<0.001,'hinge must remain at the top of the doorway');
});

test('floor plan preserves accessible locations and renders only selected inventory in a nonmodal panel',async()=>{
  const {build}=await import('esbuild');
  const {createRequire}=await import('node:module');
  const result=await build({stdin:{contents:`
    import React from 'react';
    import {renderToStaticMarkup} from 'react-dom/server';
    import FloorPlan from './ui/FloorPlan.jsx';
    import {sampleLocations} from './ui/domain.mjs';
    const locations=sampleLocations();
    locations[0].cells['1-1']=[{code:'TEST',name:'Selected item',qty:12,lot:'L1',expiry:''}];
    locations[1].cells['1-1']=[{code:'OTHER',name:'Other location item',qty:9,lot:'',expiry:''}];
    export const html=renderToStaticMarkup(<FloorPlan locations={locations} selectedId="S01" onSelect={()=>{}} onInventory={()=>{}}/>);
    export const empty=renderToStaticMarkup(<FloorPlan locations={locations} selectedId="S02" onSelect={()=>{}} onInventory={()=>{}}/>);
  `,resolveDir:process.cwd(),loader:'jsx'},bundle:true,platform:'node',format:'cjs',write:false});
  const module={exports:{}};
  new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
  const {html,empty}=module.exports;
  assert.equal((html.match(/data-location-id=/g)||[]).length,30);
  assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
  assert.match(html,/<aside[^>]+aria-labelledby="map-details-title"/);
  assert.doesNotMatch(html,/aria-modal/);
  const panel=html.split('<aside')[1];
  assert.match(panel,/Selected item/);assert.doesNotMatch(panel,/Other location item/);
  assert.match(empty.split('<aside')[1],/Other location item/);
  assert.match(html,/팔레트 · 선택 가능/);assert.match(html,/기둥 · 고정 구조물/);
  assert.match(html,/>부<\/tspan><tspan[^>]*>자<\/tspan>/);
  assert.match(html,/>제품선반1<\/tspan>/);
  assert.doesNotMatch(html,/map-zoom|pallet-hatch|도면 확대|도면 축소/);
});

test('shelf renaming keeps stored inventory attached to the same stable locations',async()=>{
  const docs=Object.fromEntries(['S14','S15','S16','S17'].map((id,i)=>[mapping[id].path,{cols:1,cells:[{list:[{name:id,qty:i+1}]}]}]));
  const {locations}=await model(docs);
  for(const [id,label,qty] of [['S14','미품 선반',1],['S15','샘플 선반1',2],['S16','샘플 선반2',3],['S17','미지정 선반',4]]){
    const location=locations.find(l=>l.id===id);
    assert.equal(location.label,label);
    assert.equal(location.cells['1-1'][0].name,id);
    assert.equal(location.cells['1-1'][0].qty,qty);
  }
  assert.equal(locations.find(l=>l.id==='S17').mapLabel,'');
});

test('lower shelves meet their wall boundary and the pillar clears both adjacent shelves',async()=>{
  const {plan}=await import('../functions/ui-shared/plan.mjs');
  const get=id=>plan.locations.find(l=>l.id===id);
  const pillar=plan.fixtures.find(f=>f.role==='pillar'&&f.y===1196);
  assert.ok(pillar.x>get('S07').x+get('S07').w);
  assert.ok(pillar.x+pillar.w<get('S14').x);
  for(const id of ['S14','S15','S16'])assert.equal(get(id).y+get(id).h,1586);
  assert.equal(get('S08').y+get('S08').h,1744);
});
