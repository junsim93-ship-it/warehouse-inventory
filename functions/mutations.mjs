import { FieldValue } from 'firebase-admin/firestore';
import { authorize, validateMutation, revisionMatches, withoutRevision, ValidationError } from './security.mjs';

export class MutationError extends Error {
  constructor(code,message){super(message);this.code=code;}
}
const reject=(code,message)=>{throw new MutationError(code,message);};
const summary=d=>d==null?'(없음)':d.lots?`재고 ${d.lots.length}개`:d.boms?`BOM ${d.boms.length}개`:d.cells?`선반 ${d.cols}칸`:d.items?`제품 ${d.items.length}개`:'계산 설정';

export async function commitMutations(db,auth,mutations,now=Date.now()) {
  if(!auth?.uid) reject('unauthenticated','로그인이 필요합니다.');
  // Commit the attempt separately so validation/authorization failures cannot roll it back.
  // This bounds authenticated attempts per UID, not unauthenticated traffic or total billing.
  const limitRef=db.doc('_writeLimits/'+auth.uid);
  await db.runTransaction(async tx=>{
    const limit=(await tx.get(limitRef)).data();
    const sameWindow=limit && now-limit.startedAt<60_000;
    if(sameWindow && limit.count>=30) reject('resource-exhausted','요청이 많습니다. 잠시 후 다시 시도하세요.');
    tx.set(limitRef,{startedAt:sameWindow?limit.startedAt:now,count:sameWindow?limit.count+1:1});
  });
  if(!Number.isFinite(auth.token?.auth_time)||now/1000-auth.token.auth_time>8*3600)
    reject('unauthenticated','로그인 시간이 만료되었습니다. 다시 로그인해 주세요.');
  if(!Array.isArray(mutations)||mutations.length<1||mutations.length>30||Buffer.byteLength(JSON.stringify(mutations))>3_000_000)
    reject('invalid-argument','저장 요청의 크기를 확인하세요.');
  if(new Set(mutations.map(m=>m?.path)).size!==mutations.length) reject('invalid-argument','중복 저장 대상입니다.');
  try { mutations.forEach(m=>authorize(2,m?.path)); }
  catch(e){ if(e instanceof ValidationError) reject('invalid-argument',e.message);throw e; }
  const refs=mutations.map(m=>db.doc(m.path));
  const logs=mutations.map(()=>db.collection('auditLog').doc());
  return db.runTransaction(async tx=>{
    const roleRef=db.doc('roles/'+auth.uid);
    const stockIds=mutations.filter(m=>m.path.startsWith('stock/')).map(m=>m.path.split('/')[1]);
    const backupRefs=stockIds.map(id=>db.doc('stockPrev/'+id));
    const snaps=await tx.getAll(roleRef,...refs,...backupRefs);
    const tier=snaps[0].data()?.tier;
    if(tier!==1 && tier!==2) reject('permission-denied','승인된 관리자 권한이 필요합니다.');
    const previous=snaps.slice(1,1+refs.length).map(s=>s.exists?s.data():null);
    const backups=new Map(stockIds.map((id,i)=>[id,snaps[1+refs.length+i].data()??null]));
    const values=mutations.map((m,i)=>{
      try {authorize(tier,m.path);validateMutation(m,tier,previous[i]);}
      catch(e){if(e instanceof ValidationError) reject('invalid-argument',e.message);throw e;}
      if(!revisionMatches(m.expectedRevision,previous[i])) reject('aborted','다른 사용자가 수정했습니다. 최신 내용을 확인한 뒤 다시 저장해 주세요.');
      let value=m.data;
      if(m.restore){
        const backup=backups.get(m.path.split('/')[1]);
        if(!backup||!revisionMatches(m.backupRevision,backup)) reject('aborted','복원할 이전 재고가 변경되었거나 없습니다.');
        value=withoutRevision(backup);
        try{validateMutation({path:m.path,expectedRevision:m.expectedRevision,data:value},tier,previous[i]);}
        catch(e){if(e instanceof ValidationError)reject('failed-precondition','이전 재고 형식을 확인해야 합니다.');throw e;}
      }
      const result={...value,_revision:(previous[i]?._revision??0)+1};
      if(m.path.startsWith('shelves/')||m.path.startsWith('pallets/'))result.updatedAt=now;
      return result;
    });
    mutations.forEach((m,i)=>{
      const before=previous[i],after=values[i],log=logs[i];
      if(m.path.startsWith('stock/')) {
        const id=m.path.split('/')[1],backupRef=db.doc('stockPrev/'+id);
        if(before) tx.set(backupRef,{...withoutRevision(before),_revision:(backups.get(id)?._revision??0)+1});
      }
      tx.set(refs[i],after);
      tx.create(log,{by:auth.token.email||auth.uid,uid:auth.uid,ts:FieldValue.serverTimestamp(),
        collection:m.path.split('/')[0],docId:m.path.split('/')[1],location:m.path,
        action:m.restore?'restore':'save',before:summary(before),after:summary(after),revision:after._revision});
      // Split full snapshots so each audit version remains under the document size limit.
      tx.create(db.doc('auditVersions/'+log.id+'/data/before'),{value:before});
      tx.create(db.doc('auditVersions/'+log.id+'/data/after'),{value:after});
    });
    return {revisions:Object.fromEntries(mutations.map((m,i)=>[m.path,values[i]._revision]))};
  });
}
