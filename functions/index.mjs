import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { commitMutations, MutationError } from './mutations.mjs';
import {getAuth} from 'firebase-admin/auth';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {uiApi,manageUsers,dailyBackup,UiError} from './ui-api.mjs';

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

export const warehouseUiApi=onCall({region:'asia-northeast3',maxInstances:3,timeoutSeconds:60,memory:'256MiB'},async request=>{
  try{
    const header=request.rawRequest.headers.authorization||'';
    if(!header.startsWith('Bearer '))throw new UiError(401,'UNAUTHENTICATED','다시 로그인해 주세요.');
    const token=await getAuth().verifyIdToken(header.slice(7),true);
    const auth={uid:token.uid,token};
    const data=request.data;
    if(!data||typeof data.path!=='string'||Buffer.byteLength(JSON.stringify(data))>1_000_000)throw new UiError(400,'INVALID_REQUEST','요청 형식을 확인하세요.');
    const body=data.path.startsWith('/api/users')?await manageUsers(getFirestore(),getAuth(),auth,data):await uiApi(getFirestore(),auth,data);
    return {status:200,body};
  }catch(e){
    if(e instanceof UiError)return {status:e.status,body:{error:e.message,code:e.code}};
    if(String(e.code).startsWith('auth/'))return {status:['auth/id-token-revoked','auth/id-token-expired','auth/user-disabled'].includes(e.code)?401:e.code==='auth/email-already-exists'?409:400,body:{error:e.code==='auth/email-already-exists'?'이미 등록된 이메일입니다.':'계정 또는 로그인 정보를 확인하세요.',code:'AUTH_ERROR'}};
    console.error('warehouse_ui_failed',{code:String(e.code||'internal')});
    return {status:500,body:{error:'요청을 처리하지 못했습니다. 최신 데이터를 확인해 주세요.',code:'INTERNAL'}};
  }
});
export const warehouseDailyBackup=onSchedule({schedule:'0 3 * * *',timeZone:'Asia/Seoul',region:'asia-northeast3',maxInstances:1,timeoutSeconds:120},()=>dailyBackup(getFirestore()));
