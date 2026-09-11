import test,{before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,getDoc,setDoc,collection,getDocs} from 'firebase/firestore';
import {initializeApp,deleteApp} from '../../functions/node_modules/firebase-admin/lib/esm/app/index.js';
import {getFirestore} from '../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js';
import {commitMutations} from '../../functions/mutations.mjs';

const projectId='demo-warehouse-security';
let env,app,db;
const auth=uid=>({uid,token:{email:uid+'@example.test',auth_time:Math.floor(Date.now()/1000)}});
const stock={fileName:'synthetic.xlsx',date:'2026-09-10',lots:[{c:'TEST',n:'Synthetic',w:'W',l:'L',e:'',q:10}]};
const mutation=(data=stock,expectedRevision=0)=>({path:'stock/p3l',expectedRevision,data});
before(async()=>{
  env=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8087,rules:fs.readFileSync('firestore.rules','utf8')}});
  process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8087';
  app=initializeApp({projectId},'tests');db=getFirestore(app);
});
beforeEach(async()=>{
  await env.clearFirestore();
  await Promise.all([db.doc('roles/one').set({tier:1}),db.doc('roles/two').set({tier:2}),db.doc('stock/p3l').set(stock)]);
});
after(async()=>{await env?.cleanup();if(app)await deleteApp(app);});

test('anonymous and unassigned accounts cannot read private collections',async()=>{
  for(const context of [env.unauthenticatedContext(),env.authenticatedContext('unassigned')])
    for(const name of ['shelves','pallets','stock','stockPrev','boms','settings','auditLog'])
      await assertFails(getDocs(collection(context.firestore(),name)));
});
test('approved readers can read stock; all browser writes and role escalation are denied',async()=>{
  for(const uid of ['one','two']){
    const client=env.authenticatedContext(uid).firestore();
    await assertSucceeds(getDoc(doc(client,'stock/p3l')));
    await assertFails(setDoc(doc(client,'stock/p3l'),stock));
    await assertFails(setDoc(doc(client,'roles/'+uid),{tier:2}));
    await assertFails(setDoc(doc(client,'auditLog/fake'),{by:uid}));
  }
  await assertFails(getDocs(collection(env.authenticatedContext('one').firestore(),'auditLog')));
  await assertSucceeds(getDocs(collection(env.authenticatedContext('two').firestore(),'auditLog')));
});
test('server denies missing auth, missing role, expired login and tier-one BOM edits',async()=>{
  await assert.rejects(commitMutations(db,null,[mutation()]));
  await assert.rejects(commitMutations(db,auth('unassigned'),[mutation()]));
  await assert.rejects(commitMutations(db,{...auth('one'),token:{auth_time:0}},[mutation()]));
  await assert.rejects(commitMutations(db,auth('one'),[{path:'boms/list',expectedRevision:0,data:{boms:[]}}]));
  assert.equal((await db.collection('auditLog').get()).size,0);
});
test('one transaction stores stock, full audit and backup using server identity',async()=>{
  const next={...stock,lots:[{...stock.lots[0],q:20}]};
  const result=await commitMutations(db,auth('one'),[mutation(next)]);
  assert.equal(result.revisions['stock/p3l'],1);
  assert.equal((await db.doc('stock/p3l').get()).data().lots[0].q,20);
  assert.equal((await db.doc('stockPrev/p3l').get()).data().lots[0].q,10);
  const logs=await db.collection('auditLog').get();assert.equal(logs.size,1);
  assert.equal(logs.docs[0].data().uid,'one');
  assert.ok(logs.docs[0].data().ts.toMillis()>0);
  assert.equal((await db.doc('auditVersions/'+logs.docs[0].id+'/data/before').get()).data().value.lots[0].q,10);
  assert.equal((await db.doc('auditVersions/'+logs.docs[0].id+'/data/after').get()).data().value.lots[0].q,20);
});
test('stale concurrent writes cannot replace the winner or append phantom logs',async()=>{
  const results=await Promise.allSettled([commitMutations(db,auth('one'),[mutation()]),commitMutations(db,auth('two'),[mutation()])]);
  assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
  assert.equal((await db.collection('auditLog').get()).size,1);
});
test('an invalid member rejects the entire batch without partial writes or logs',async()=>{
  await assert.rejects(commitMutations(db,auth('two'),[mutation(),{path:'boms/list',expectedRevision:0,data:{boms:[{name:'malformed'}]}}]));
  assert.equal((await db.doc('stock/p3l').get()).data()._revision,undefined);
  assert.equal((await db.collection('auditLog').get()).size,0);
});
test('restore swaps backup and current atomically; stale backup is rejected',async()=>{
  await commitMutations(db,auth('one'),[mutation({...stock,lots:[{...stock.lots[0],q:20}]})]);
  await assert.rejects(commitMutations(db,auth('one'),[{path:'stock/p3l',expectedRevision:1,restore:true,backupRevision:0}]));
  await commitMutations(db,auth('one'),[{path:'stock/p3l',expectedRevision:1,restore:true,backupRevision:1}]);
  assert.equal((await db.doc('stock/p3l').get()).data().lots[0].q,10);
  assert.equal((await db.doc('stockPrev/p3l').get()).data().lots[0].q,20);
  assert.equal((await db.collection('auditLog').get()).size,2);
});
test('tier-one shelf creation cannot resize and tier two can resize',async()=>{
  const m={path:'shelves/shelf-18',expectedRevision:0,data:{cols:5,cells:Array(10).fill(null),updatedAt:1}};
  await assert.rejects(commitMutations(db,auth('one'),[m]));
  await commitMutations(db,auth('two'),[m]);
  assert.equal((await db.doc(m.path).get()).data().cols,5);
});
