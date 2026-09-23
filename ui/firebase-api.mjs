import {initializeApp} from 'firebase/app';
import {getAuth,setPersistence,browserSessionPersistence,signInWithEmailAndPassword,signOut,onAuthStateChanged} from 'firebase/auth';
import {getFirestore,doc,getDoc,collection,onSnapshot} from 'firebase/firestore';
import {getFunctions,httpsCallable} from 'firebase/functions';
import {model,revisionOf} from '../functions/ui-shared/model.mjs';

const app=initializeApp({apiKey:'AIzaSyDHSvdVLhkOHWs1whqkJ4pyol69S6P5C4M',authDomain:'warehouse-inventory-84fef.firebaseapp.com',projectId:'warehouse-inventory-84fef',appId:'1:148799748197:web:01f8b6022b7e471e306e8c'});
const auth=getAuth(app),db=getFirestore(app),call=httpsCallable(getFunctions(app,'asia-northeast3'),'warehouseUiApi');
const initialized=setPersistence(auth,browserSessionPersistence).then(()=>auth.authStateReady());
let uid=null,stops=[],pending=null,cache={},products=[],dataError=null,role=null,authTime=0;
function stop(){stops.forEach(s=>s());stops=[];uid=null;pending=null;cache={};products=[];dataError=null;role=null;}
onAuthStateChanged(auth,user=>{if(user?.uid!==uid)stop();});
const denied=(status,message)=>Object.assign(new Error(message),{status});
async function identity(){
  await initialized;
  const user=auth.currentUser;
  if(!user)throw denied(401,'로그인이 필요합니다.');
  const token=await user.getIdTokenResult();authTime=Date.parse(token.authTime);
  const last=Number(sessionStorage.getItem('warehouse:lastActivity'))||authTime;
  if(Date.now()-authTime>=8*3600_000||Date.now()-last>=1800_000){await signOut(auth);throw denied(401,'세션이 만료되었습니다. 다시 로그인해 주세요.');}
  if(uid!==user.uid){
    stop();uid=user.uid;
    const snapshot=await getDoc(doc(db,'roles',user.uid));role=snapshot.data();
    if(![1,2].includes(role?.tier)){stop();throw denied(403,'승인된 관리자 계정이 필요합니다.');}
    const generation=uid;
    pending=Promise.all(['shelves','pallets','uiProducts'].map(name=>new Promise((resolve,reject)=>{
      stops.push(onSnapshot(collection(db,name),snapshot=>{
        if(uid!==generation)return;
        if(name==='uiProducts')products=snapshot.docs.map(d=>d.data());
        else{for(const key of Object.keys(cache))if(key.startsWith(name+'/'))delete cache[key];for(const d of snapshot.docs)cache[name+'/'+d.id]=d.data();}
        resolve();
      },error=>{dataError=error;reject(error);}));
    })));
    pending.catch(()=>{});
    stops.push(onSnapshot(doc(db,'roles',user.uid),snapshot=>{if(uid===generation)role=snapshot.data();},error=>{dataError=error;role=null;}));
  }
  if(![1,2].includes(role?.tier)||role?.sessionValidAfter>authTime/1000)throw denied(403,'계정 설정이 변경되었습니다. 다시 로그인해 주세요.');
  return {user:{id:user.uid,email:user.email,name:user.displayName||user.email,role:role.tier},idleTimeoutMs:1800_000,absoluteTimeoutMs:8*3600_000,idleExpiresAt:last+1800_000,expiresAt:authTime+8*3600_000};
}
export async function firebaseFetch(path,options={}){
  try{
    await initialized;
    const method=options.method||'GET',body=typeof options.body==='string'?JSON.parse(options.body):options.body||{};
    let result;
    if(path==='/api/login'){
      await signInWithEmailAndPassword(auth,body.email,body.password);
      sessionStorage.setItem('warehouse:lastActivity',String(Date.now()));result=await identity();
    }else if(path==='/api/logout'){
      await signOut(auth);stop();sessionStorage.removeItem('warehouse:lastActivity');result={};
    }else{
      const session=await identity();
      if(path==='/api/session')result=session;
      else if(path==='/api/activity'){
        sessionStorage.setItem('warehouse:lastActivity',String(Date.now()));result={idleExpiresAt:Date.now()+1800_000,expiresAt:session.expiresAt};
      }else if(method==='GET'&&['/api/locations','/api/revision','/api/products'].includes(path)){
        await pending;if(dataError)throw dataError;
        if(path==='/api/revision')result={revision:await revisionOf(cache)};
        else{const current=await model(cache,products);result=path==='/api/locations'?{locations:current.locations}:{products:current.products};}
      }else{
        const response=(await call({path,method,body})).data;
        return new Response(JSON.stringify(response.body),{status:response.status});
      }
    }
    return new Response(JSON.stringify(result),{status:200});
  }catch(error){
    const status=error.status||(['auth/invalid-credential','auth/user-disabled','auth/invalid-login-credentials','auth/invalid-email'].includes(error.code)?401:error.code==='permission-denied'?403:503);
    return new Response(JSON.stringify({error:error.status?error.message:status===401?'이메일 또는 비밀번호를 확인하세요.':status===403?'접근 권한을 확인해 주세요.':'Firebase에 연결하지 못했습니다. 잠시 후 다시 시도하세요.',code:error.code||'FIREBASE_ERROR'}),{status});
  }
}
