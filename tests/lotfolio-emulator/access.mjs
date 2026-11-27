import test, {before,after} from 'node:test';
import assert from 'node:assert/strict';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {createMockUserToken} from '@firebase/util';
import {createLotfolioStore} from '../../lotfolio/firebase-store.js';
import {fileMime,newId} from '../../lotfolio/attachments.mjs';
import {openFile} from '../../lotfolio/file-crypto.mjs';
import {buildFreezeChange} from '../../lotfolio/design-freeze.mjs';

const projectId='demo-lotfolio',bucket=projectId+'.firebasestorage.app',storageOrigin='http://127.0.0.1:9297';
const prefix='RULE'+Date.now(), code=prefix+'005', key='2601V_'+code+'_B_NMC';
const p={code,name:'선행 0 제품',brand:'',memo:'',created:1,revision:1};
const design={code,type:'B',month:'2601',reg:'NMC',author:'작성자',memo:'',
  created:1,designKey:key,revision:'initial',files:[]};
const lot={...design,seq:'03',lot:'2601V03_'+code+'_B_NMC'};
const pdf=new File(['%PDF-1.7\n테스트\n%%EOF'],'국문_시안.PDF',{type:'application/pdf'});
const image=new File([Uint8Array.from([137,80,78,71,13,10,26,10])],'대표.PNG',{type:'image/png'});
const image2=new File([Uint8Array.from([255,216,255,219])],'상세.jpeg',{type:'image/jpeg'});
const storedPaths=new Set();
let env;
const now=Math.floor(Date.now()/1000);
const uid = id=>prefix+'-'+id;
function member(name,authTime=now) {
  const id=uid(name);
  const db=env.authenticatedContext(id,{auth_time:authTime,email:'member@example.test'}).firestore();
  const token=createMockUserToken({sub:id,user_id:id,auth_time:authTime,email:'member@example.test'},projectId);
  return {db,app:{options:{projectId,storageBucket:bucket},firestore:()=>db,
    auth:()=>({currentUser:{uid:id,email:'member@example.test',getIdToken:async()=>token}})},token};
}
function storageUrl(path) {return storageOrigin+'/v0/b/'+bucket+'/o/'+encodeURIComponent(path);}
async function rawUpload(token,path,bytes,mime,original,kind,cipher='aes-256-gcm-v1') {
  storedPaths.add(path);
  const boundary='bound'+newId();
  const contentType = 'application/octet-stream';
  const meta=JSON.stringify({name:path,contentType,metadata:{originalName:original,kind,originalMime:mime,cipher}});
  const body=new Blob(['--'+boundary+'\r\nContent-Type: application/json; charset=utf-8\r\n\r\n',meta,
    '\r\n--'+boundary+'\r\nContent-Type: '+contentType+'\r\n\r\n',bytes,'\r\n--'+boundary+'--']);
  const headers={'Content-Type':'multipart/related; boundary='+boundary,'X-Goog-Upload-Protocol':'multipart'};
  if(token)headers.Authorization='Firebase '+token;
  return fetch(storageOrigin+'/v0/b/'+bucket+'/o?name='+encodeURIComponent(path),{method:'POST',headers,body});
}
async function rawRead(token,path) {
  return fetch(storageUrl(path)+'?alt=media',{headers:token?{Authorization:'Firebase '+token}:{}});
}
function allowed(response) { assert.ok(response.ok,'expected success, got HTTP '+response.status); }
function denied(response) { assert.ok([401,403].includes(response.status),'expected denial, got HTTP '+response.status); }
async function admin(change) {return env.withSecurityRulesDisabled(ctx=>change(ctx.firestore()));}
before(async()=>{
  env=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8787},
    storage:{host:'127.0.0.1',port:9297}});
  await admin(async db=>{
    for(const [name,tier,valid] of [['one',1,0],['two',2,now],['three',3,0],['revoked',2,now+1]])
      await db.doc('roles/'+uid(name)).set({tier,sessionValidAfter:valid});
    await db.doc('lotDesigns/'+key).set(design);
    await db.doc('lotProducts/'+code).set(p);
    await db.doc('lotRecords/'+lot.lot).set(lot);
  });
});
after(async()=>{
  if(!env)return;
  await admin(async db=>{
    for(const col of ['lotProducts','lotDesigns','lotRecords','roles']) {
      const docs=await db.collection(col).get();
      await Promise.all(docs.docs.filter(d=>d.id.includes(prefix)||d.data().code?.includes(prefix)).map(d=>d.ref.delete()));
    }
  });
  for(const path of storedPaths)await fetch(storageUrl(path),{method:'DELETE',headers:{Authorization:'Bearer owner'}});
  await env.cleanup();
});

test('Firestore permits tiers 1 and 2 and denies anonymous, invalid, old and revoked sessions',async()=>{
  const paths=['lotProducts/'+code,'lotDesigns/'+key,'lotRecords/'+lot.lot];
  const unauth=env.unauthenticatedContext().firestore();
  for(const db of [unauth,member('unassigned').db,member('three').db,member('revoked').db,member('one',now-8*3600).db]){
    for (const path of paths) {await assertFails(db.doc(path).get());await assertFails(db.doc(path).delete());}
  }
  for(const role of ['one','two']){
    const {db}=member(role);
    for(const path of paths)await assertSucceeds(db.doc(path).get());
    await assertSucceeds(db.collection('lotDesigns').get());
    await assertSucceeds(db.doc('lotProducts/'+code).set(p));
    await assertFails(db.doc('roles/'+uid(role)).set({tier:2}));
    await assertFails(db.doc('stock/'+prefix).set({fileName:'example.xlsx'}));
  }
});
test('Firestore enforces canonical key, product identity and immutable history',async()=>{
  const {db}=member('two');
  await assertFails(db.doc('lotProducts/'+code).set({...p,code:'OTHER'}));
  await assertFails(db.doc('lotDesigns/'+key+'other').set(design));
  await assertFails(db.doc('lotDesigns/'+key).set({...design,reg:'CMN'}));
  await assertFails(db.doc('lotRecords/'+prefix+'bad').set({...lot,seq:'00'}));
  await assertFails(db.doc('lotRecords/'+lot.lot).update({memo:'replaced'}));
});
test('only a current tier 2 session can append freeze transitions; normal tier 1 edits preserve history',async()=>{
  const freezeCode=prefix+'FREEZE', freezeKey='2601V_'+freezeCode+'_B_NMC';
  const path='lotDesigns/'+freezeKey;
  const original={...design,code:freezeCode,designKey:freezeKey};
  const one=member('one'),two=member('two');
  const tierOne=one.db.doc(path),tierTwo=two.db.doc(path);
  const input={reason:'quality',memo:'검사 대기',until:'2027-01-01'};
  const set=buildFreezeChange({},'freeze',input,two.app.auth().currentUser.email);
  await assertFails(tierOne.set({...original,...set}));
  await assertFails(tierOne.set({...original,freeze:null,freezeHistory:set.freezeHistory}));
  await assertSucceeds(tierOne.set({...original,freeze:null,freezeHistory:[]}));
  await assertFails(tierOne.update({...set,revision:newId()}));
  await assertFails(tierOne.update({freezeHistory:set.freezeHistory}));
  await assertFails(member('two',now-8*3600).db.doc(path).update({...set,revision:newId()}));
  const forged=buildFreezeChange({},'freeze',input,'a-different-admin@example.test');
  await assertFails(tierTwo.update({...forged,revision:newId()}));
  await assertFails(tierTwo.update({freeze:set.freeze,revision:newId()}));
  const oldDesign={id:freezeKey,...(await tierTwo.get()).data()};
  const store=createLotfolioStore(two.app);
  try {
    await assertSucceeds(store.setDesignFreeze(oldDesign,'freeze',input));
    const active={id:freezeKey,...(await tierTwo.get()).data()};
    assert.deepEqual(active.freeze,{...set.freeze,at:active.freeze.at});
    assert.equal((await tierOne.get()).data().freeze.reason,'quality');
    await assertFails(tierOne.update({freeze:null}));
    await assertFails(tierOne.update({freezeHistory:[]}));
    await assertFails(tierOne.set({...original,revision:newId()}));
    await assertFails(tierOne.delete());
    await assertFails(tierTwo.delete());
    const editor=createLotfolioStore(one.app);
    try {
      await assertSucceeds(editor.saveDesign({...active,original:active,memo:'원본 정보 수정'}));
    } finally {editor.dispose();}
    const edited={id:freezeKey,...(await tierTwo.get()).data()};
    assert.deepEqual(edited.freeze,active.freeze);
    assert.deepEqual(edited.freezeHistory,active.freezeHistory);
    await assert.rejects(store.setDesignFreeze(active,'unfreeze',{}),/다른 사용자/);
    await assertSucceeds(store.setDesignFreeze(edited,'unfreeze',{memo:'검사 완료'}));
    const released={id:freezeKey,...(await tierTwo.get()).data()};
    assert.equal(released.freeze,null);
    assert.equal(released.freezeHistory[0].action,'unfreeze');
    assert.equal(released.freezeHistory[0].memo,'검사 완료');
    assert.deepEqual(released.freezeHistory[1],active.freezeHistory[0]);
    await assertFails(tierOne.delete());
    const movedCode=freezeCode+'-MOVED';
    const movedKey='2601V_'+movedCode+'_B_NMC';
    await assertFails(two.db.doc('lotDesigns/'+movedKey).set({...released,code:movedCode,
      designKey:movedKey,freezeHistoryFrom:freezeKey}));
    const moved=await store.saveDesign({...released,original:released,code:movedCode});
    assert.equal(moved.id,movedKey);
    assert.deepEqual((await two.db.doc('lotDesigns/'+movedKey).get()).data().freezeHistory,released.freezeHistory);
    assert.equal((await tierTwo.get()).exists,false);
  } finally {store.dispose();}
});
test('the freeze history rule only drops the oldest entry at the twenty-event limit',async()=>{
  const cappedCode=prefix+'CAP', cappedKey='2601V_'+cappedCode+'_B_NMC';
  const path='lotDesigns/'+cappedKey;
  const {db,app}=member('two');
  const actor=app.auth().currentUser.email;
  const input={reason:'reserved',memo:'예약'};
  let current={...design,code:cappedCode,designKey:cappedKey};
  for (let i=0; i<20; i++) {
    const action=i % 2 === 0 ? 'freeze' : 'unfreeze';
    current={...current,...buildFreezeChange(current,action,input,actor,Date.now()-20000+i*1000)};
  }
  await admin(owner=>owner.doc(path).set(current));
  const next=buildFreezeChange(current,'freeze',input,actor);
  await assertFails(db.doc(path).update({...next,freezeHistory:[next.freezeHistory[0],...current.freezeHistory],revision:newId()}));
  await assertFails(db.doc(path).update({...next,freezeHistory:next.freezeHistory.slice(0,19),revision:newId()}));
  await assertSucceeds(db.doc(path).update({...next,revision:newId()}));
  assert.deepEqual((await db.doc(path).get()).data().freezeHistory,next.freezeHistory);
});
test('Storage authorizes reads, creates and removals through Firestore roles and session age',async()=>{
  const path='lotDesigns/'+key+'/'+newId()+'.pdf', approved=member('one').token;
  allowed(await rawUpload(approved,path,pdf,pdf.type,pdf.name,'pdf'));
  allowed(await rawRead(member('two').token,path));
  const deniedTokens=[null,member('unassigned').token,member('three').token,member('revoked').token,member('one',now-8*3600).token];
  for(const token of deniedTokens){
    denied(await rawRead(token,path));
    denied(await rawUpload(token,'lotDesigns/'+key+'/'+newId()+'.pdf',pdf,pdf.type,pdf.name,'pdf'));
    denied(await fetch(storageUrl(path),{method:'DELETE',headers:token?{Authorization:'Firebase '+token}:{}}));
  }
  denied(await rawUpload(approved,path,pdf,pdf.type,pdf.name,'pdf'));
  allowed(await fetch(storageUrl(path),{method:'DELETE',headers:{Authorization:'Firebase '+approved}}));
});
test('Storage binds path, original filename, type and length to image/PDF policy',async()=>{
  const token=member('one').token;
  denied(await rawUpload(token,'lotDesigns/'+key+'/'+newId()+'.pdf',pdf,pdf.type,pdf.name,'pdf',''));
  for (const [blob,ext,kind] of [[image,'png','image'],[image2,'jpeg','image'],[pdf,'pdf','pdf']])
    allowed(await rawUpload(token,'lotDesigns/'+key+'/'+newId()+'.'+ext,blob,blob.type,blob.name,kind));
  for (const [base,ext,original,mime,length,kind] of [
    [key,'pdf','원본.ai','application/pdf',10,'pdf'],[key,'pdf','../원본.pdf','application/pdf',10,'pdf'],
    [key,'pdf','원본.pdf','image/png',10,'pdf'],[key,'png','원본.png','image/png',0,'image'],
    [key,'ai','원본.ai','application/postscript',100,'pdf'],[key,'jpg','원본.jpg','image/jpeg',30*1024*1024+1,'image'],
    [key,'pdf','원본.pdf','application/pdf',100*1024*1024+1,'pdf'],['bad','png','원본.png','image/png',4,'image']]){
    denied(await rawUpload(token,'lotDesigns/'+base+'/'+newId()+'.'+ext,new Uint8Array(length),mime,original,kind));
  }
  assert.equal(fileMime('image','원본.jpg',30*1024*1024),'image/jpeg');
  assert.equal(fileMime('pdf','원본.pdf',100*1024*1024),'application/pdf');
});
test('adapter atomically publishes full designs, detects conflicting edits and cleans old Storage paths',async()=>{
  const {app}=member('one'),store=createLotfolioStore(app,{storageOrigin});
  const originalForm={code:prefix+'006',month:'2601',type:'B',reg:'NMC',author:'이름',memo:'메모'};
  const created=await store.saveDesign({...originalForm,files:[],uploads:[
    {kind:'pdf',file:pdf},{kind:'image',file:image},{kind:'image',file:image2,primary:true}]});
  const db=app.firestore(), original=(await db.doc('lotDesigns/'+created.id).get()).data();
  assert.equal(original.files.length,3);
  assert.equal(original.files.find(f=>f.primary).name,image2.name);
  for(const f of original.files){
    storedPaths.add(f.path);
    const source = [pdf,image,image2].find(blob=>blob.name===f.name);
    const raw = await rawRead(member('one').token,f.path);
    allowed(raw);
    const ciphertext = new Uint8Array(await raw.arrayBuffer());
    const expected = new Uint8Array(await source.arrayBuffer());
    assert.equal(ciphertext.length,expected.length);
    assert.ok(!Buffer.from(ciphertext).equals(expected),'stored bytes must be encrypted');
    ciphertext[0] ^= 1;
    await assert.rejects(openFile(f,new Blob([ciphertext]),f.protection),/원본/);
    const restored = await store.getFileBlob({...f,design:created.id});
    assert.equal(restored.type, source.type);
    assert.deepEqual(new Uint8Array(await restored.arrayBuffer()),expected);
    const metadata=await (await fetch(storageUrl(f.path),{headers:{Authorization:'Firebase '+member('one').token}})).json();
    assert.deepEqual(Object.keys(metadata.metadata).sort(),['cipher','kind','originalMime','originalName']);
    await assert.rejects(store.getFileBlob({...f,design:created.id,protection:null}),/원본/);
    const tag = new Uint8Array(Buffer.from(f.protection.tag,'base64'));
    tag[0] ^= 1;
    await assert.rejects(store.getFileBlob({...f,design:created.id,
      protection:{...f.protection,tag:Buffer.from(tag).toString('base64')}}),/원본/);
  }
  await assert.rejects(store.saveDesign(originalForm),{status:409,existingId:created.id});
  const invalid = new File(['invalid'],'bad.pdf',{type:'application/pdf'});
  const brokenKey = '2601V_'+prefix+'007_B_NMC';
  await assert.rejects(store.saveDesign({...originalForm,code:prefix+'007',uploads:[
    {kind:'image',file:image}, {kind:'pdf',file:invalid}]}));
  assert.equal((await db.doc('lotDesigns/'+brokenKey).get()).exists,false);
  const inventoryUrl=storageOrigin+'/v0/b/'+bucket+'/o?prefix='+encodeURIComponent('lotDesigns/'+brokenKey+'/');
  const listing=await fetch(inventoryUrl,{headers:{Authorization:'Bearer owner'}});
  allowed(listing);
  assert.equal(((await listing.json()).items||[]).length,0);
  const raceForm={...originalForm,code:prefix+'008'};
  const competing=await Promise.allSettled([store.saveDesign(raceForm),store.saveDesign(raceForm)]);
  assert.equal(competing.filter(result=>result.status==='fulfilled').length,1);
  assert.equal(competing.find(result=>result.status==='rejected').reason.status,409);
  const changes=await Promise.allSettled(['first','second'].map(memo=>store.saveDesign({...originalForm,id:created.id,original,memo,files:original.files})));
  assert.equal(changes.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(changes.find(r=>r.status==='rejected').reason.status,409);
  const current=(await db.doc('lotDesigns/'+created.id).get()).data();
  const savedLot=await store.saveLot({...originalForm,seq:'03'});
  assert.equal((await db.doc('lotRecords/'+savedLot.id).get()).data().author,'이름');
  const renamed=await store.saveDesign({...originalForm,id:created.id,original:current,month:'2602',files:current.files.slice(0,2)});
  assert.equal(renamed.pendingCleanup,0);
  assert.equal((await db.doc('lotDesigns/'+created.id).get()).exists,false);
  const next=(await db.doc('lotDesigns/'+renamed.id).get()).data();
  assert.equal(next.files.length,2);assert.equal(next.files.filter(f=>f.primary).length,1);
  assert.equal((await db.doc('lotRecords/'+savedLot.id).get()).data().designKey,created.id);
  for(const f of current.files)assert.equal((await rawRead(member('one').token,f.path)).status,404);
  for(const f of next.files) {
    storedPaths.add(f.path);
    const prior = current.files.find(row=>row.name === f.name);
    assert.ok(prior.protection.key !== f.protection.key,'renames use a fresh key');
    const source = [pdf,image,image2].find(blob=>blob.name===f.name);
    assert.deepEqual(new Uint8Array(await (await store.getFileBlob({...f,design:renamed.id})).arrayBuffer()),
      new Uint8Array(await source.arrayBuffer()));
  }
  await assert.rejects(store.saveLot({...originalForm,seq:'03'}),{status:409});
  await store.saveLot({...originalForm,seq:'03',confirmDuplicate:true});
  assert.equal((await store.deleteDesign({...next,id:renamed.id})).pendingCleanup,0);
  for(const f of next.files)assert.equal((await rawRead(member('one').token,f.path)).status,404);
  store.dispose();
  await assert.rejects(store.getFileBlob({...next.files[0],design:renamed.id}),/세션/);
});
test('master imports preserve codes, apply duplicate mode, and clear a realtime snapshot on logout',async()=>{
  const {app}=member('two'),store=createLotfolioStore(app,{storageOrigin});
  const row={code:'005-'+prefix,name:'원래',brand:'브랜드',memo:''},renamed={...row,name:'변경'};
  const seen = new Promise((resolve,reject)=>{
    store.subscribe(state=>{if(state.products.some(p=>p.code===row.code))resolve(state);},reject);
  });
  await store.saveProduct(row,{create:true});
  const state=await seen;
  assert.equal(state.products.find(p=>p.code===row.code).name,'원래');
  await assert.rejects(store.saveProduct(row,{create:true}),{status:409});
  assert.equal((await store.importProducts([renamed],'skip')).count,0);
  assert.equal((await store.importProducts([row,renamed],'overwrite')).count,1);
  assert.equal((await app.firestore().doc('lotProducts/'+row.code).get()).data().name,'변경');
  let last;
  store.subscribe(value=>{last=value;});
  store.dispose();
  assert.deepEqual(last,{products:[],designs:[],lots:[],files:[]});
  await assert.rejects(store.saveProduct(row,{create:true}),/세션/);
});
