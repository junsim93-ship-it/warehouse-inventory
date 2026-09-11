import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { commitMutations, MutationError } from './mutations.mjs';

initializeApp();
export const saveInventory=onCall({region:'asia-northeast3',maxInstances:3,timeoutSeconds:30,
  memory:'256MiB',enforceAppCheck:process.env.ENFORCE_APP_CHECK==='true'},async request=>{
  try{return await commitMutations(getFirestore(),request.auth,request.data?.mutations);}
  catch(e){
    if(e instanceof MutationError) throw new HttpsError(e.code,e.message);
    console.error('inventory_save_failed',{code:String(e.code||'internal')});
    throw new HttpsError('internal','저장하지 못했습니다. 최신 데이터를 확인해 주세요.');
  }
});
