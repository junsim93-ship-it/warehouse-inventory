import {FieldValue} from 'firebase-admin/firestore';
import {model,mapping,canonical,revisionOf,nameKey,encodeLocation} from './ui-shared/model.mjs';
import {normalizeItems,validateOperation,groupKey} from './ui-shared/domain.mjs';
import {validateMutation} from './security.mjs';
import catalog from './catalog.json' with {type:'json'};

export class UiError extends Error {
  constructor(status,code,message){super(message);this.status=status;this.code=code;}
}
const fail=(status,code,message)=>{throw new UiError(status,code,message);};
const requireAdmin=tier=>{if(tier!==2)fail(403,'FORBIDDEN','운영 관리자 권한이 필요합니다.');};
const reasonOf=value=>{
  if(typeof value!=='string'||!value.trim()||value.length>500)fail(400,'INVALID_REASON','처리 사유를 1~500자로 입력하세요.');
  return value.trim();
};
const dataMap=snapshot=>Object.fromEntries(snapshot.docs.map(d=>[d.ref.path,d.data()]));
async function inventory(tx,db){
  const [shelves,pallets,products]=await Promise.all(['shelves','pallets','uiProducts'].map(c=>tx.get(db.collection(c))));
  return {docs:{...dataMap(shelves),...dataMap(pallets)},registered:products.docs.map(d=>d.data())};
}
function backup(tx,db,docs,reason,now,id=db.collection('uiBackups').doc().id){
  const ref=db.doc('uiBackups/'+id);
  tx.set(ref,{createdAt:new Date(now).toISOString(),reason,locationCount:30});
  for(const [path,value] of Object.entries(docs)) tx.set(ref.collection('documents').doc(path.replace('/','~')),{path,value});
  return id;
}
function writeChanges(tx,db,before,changes,entry,now){
  const log=db.collection('uiLedger').doc();
  const paths=Object.keys(changes);
  tx.create(log,{...entry,createdAt:new Date(now).toISOString(),undone:false,paths});
  for(const path of paths){
    const old=before[path]||null;
    const cols=catalog.shelves[path.split('/')[1]]||old?.cols||4;
    // Keep an empty revisioned document when restoring an originally absent location.
    // Otherwise both clients could accept an obsolete revision 0 or keep a stale visible cell.
    const next=changes[path]??(path.startsWith('shelves/')?{cols,cells:Array(2*cols).fill(null)}:{items:[]});
    // Keep revisions monotonic, including undo/restore, for the original application's conflict checks.
    const value={...next,_revision:(old?._revision||0)+1,updatedAt:Math.max(now,(Number(old?.updatedAt)||0)+1)};
    tx.set(db.doc(path),value);
    tx.create(log.collection('before').doc(path.replace('/','~')),{path,value:old});
    tx.create(log.collection('after').doc(path.replace('/','~')),{path,value});
    const audit=db.collection('auditLog').doc();
    tx.create(audit,{by:entry.user.name,uid:entry.user.id,ts:FieldValue.serverTimestamp(),collection:path.split('/')[0],docId:path.split('/')[1],location:path,action:entry.type,before:'변경 전 재고',after:entry.reason,revision:value?._revision||0});
    tx.create(db.doc('auditVersions/'+audit.id+'/data/before'),{value:old});
    tx.create(db.doc('auditVersions/'+audit.id+'/data/after'),{value});
    before[path]=value;
  }
  return log.id;
}
export async function dailyBackup(db,now=Date.now()){
  const id='daily-'+new Date(now+9*3600_000).toISOString().slice(0,10);
  return db.runTransaction(async tx=>{
    if((await tx.get(db.doc('uiBackups/'+id))).exists)return;
    const {docs}=await inventory(tx,db);
    backup(tx,db,docs,'자동 백업',now,id);
  });
}
export async function manageUsers(db,adminAuth,auth,{path,method='GET',body={}},now=Date.now()){
  if(!auth?.uid||!Number.isFinite(auth.token?.auth_time)||now/1000-auth.token.auth_time>=8*3600)fail(401,'UNAUTHENTICATED','다시 로그인해 주세요.');
  const authorize=async()=>db.runTransaction(async tx=>{
    const role=(await tx.get(db.doc('roles/'+auth.uid))).data();
    requireAdmin(role?.tier);
    if(role?.sessionValidAfter>auth.token.auth_time)fail(401,'UNAUTHENTICATED','다시 로그인해 주세요.');
    const ref=db.doc('_uiAccountLimits/'+auth.uid),old=(await tx.get(ref)).data(),same=old&&now-old.start<60000;
    if(same&&old.count>=20)fail(429,'RATE_LIMIT','잠시 후 다시 시도하세요.');
    tx.set(ref,{start:same?old.start:now,count:same?old.count+1:1});
  });
  await authorize();
  if(path==='/api/users'&&method==='GET'){
    const roles=await db.collection('roles').get(),users=[];
    for(let i=0;i<roles.docs.length;i+=100){
      const result=await adminAuth.getUsers(roles.docs.slice(i,i+100).map(d=>({uid:d.id})));
      users.push(...result.users.map(u=>({id:u.uid,email:u.email||'',name:u.displayName||u.email||u.uid,role:u.disabled?0:roles.docs.find(d=>d.id===u.uid).data().tier||0})));
    }
    return {users};
  }
  if(!body||typeof body.name!=='string'||!body.name.trim()||body.name.length>80||![0,1,2].includes(body.role))fail(400,'INVALID_ACCOUNT','계정 이름과 권한을 확인하세요.');
  if(body.password!==undefined&&(typeof body.password!=='string'||body.password.length<12||body.password.length>256))fail(400,'INVALID_PASSWORD','비밀번호는 12~256자로 입력하세요.');
  if(path==='/api/users'&&method==='POST'){
    if(![1,2].includes(body.role)||!body.password||typeof body.email!=='string'||body.email.length>254)fail(400,'INVALID_ACCOUNT','이메일과 초기 비밀번호를 확인하세요.');
    const user=await adminAuth.createUser({email:body.email,displayName:body.name.trim(),password:body.password,disabled:true});
    try{
      await db.runTransaction(async tx=>{requireAdmin((await tx.get(db.doc('roles/'+auth.uid))).data()?.tier);tx.create(db.doc('roles/'+user.uid),{tier:body.role});});
      await adminAuth.updateUser(user.uid,{disabled:false});return {id:user.uid};
    }catch(e){await db.doc('roles/'+user.uid).delete();await adminAuth.deleteUser(user.uid);throw e;}
  }
  const match=path.match(/^\/api\/users\/([^/]{1,128})$/);
  if(match&&method==='PUT'){
    const uid=decodeURIComponent(match[1]);
    if(uid.includes('/'))fail(400,'INVALID_ACCOUNT','계정을 확인하세요.');
    if(uid===auth.uid&&body.role!==2)fail(400,'SELF_DEMOTION','본인 권한은 낮출 수 없습니다.');
    // Serialize changes to one account; Firebase Auth updates cannot join a Firestore transaction.
    const lock=db.doc('_uiAccountLocks/'+uid);
    await db.runTransaction(async tx=>{
      const [caller,target,held]=await tx.getAll(db.doc('roles/'+auth.uid),db.doc('roles/'+uid),lock);
      requireAdmin(caller.data()?.tier);if(!target.exists)fail(404,'NOT_FOUND','승인된 계정을 찾을 수 없습니다.');
      if(held.exists&&now-held.data().at<60000)fail(409,'BUSY','다른 계정 변경이 진행 중입니다.');
      tx.set(lock,{at:now});
    });
    try{
      await adminAuth.revokeRefreshTokens(uid);
      await adminAuth.updateUser(uid,{displayName:body.name.trim(),...(body.password?{password:body.password}:{})});
      await db.runTransaction(async tx=>{
        requireAdmin((await tx.get(db.doc('roles/'+auth.uid))).data()?.tier);
        const admins=await tx.get(db.collection('roles').where('tier','==',2));
        if(body.role!==2&&admins.docs.some(d=>d.id===uid)&&admins.size<=1)fail(409,'LAST_ADMIN','마지막 운영 관리자는 중지할 수 없습니다.');
        tx.update(db.doc('roles/'+uid),{tier:body.role,sessionValidAfter:Math.floor(now/1000)+1});
      });
      await adminAuth.updateUser(uid,{disabled:body.role===0});
      return {};
    }finally{await lock.delete();}
  }
  fail(404,'NOT_FOUND','계정 요청을 확인하세요.');
}
export async function uiApi(db,auth,request,now=Date.now()){
  if(!auth?.uid||!Number.isFinite(auth.token?.auth_time)||now/1000-auth.token.auth_time>=8*3600)fail(401,'UNAUTHENTICATED','다시 로그인해 주세요.');
  if(!request||typeof request.path!=='string'||request.path.length>400||Buffer.byteLength(JSON.stringify(request))>1_000_000)fail(400,'INVALID_REQUEST','요청 형식을 확인하세요.');
  const {path,method='GET',body={}}=request;
  if(!['GET','POST','PUT'].includes(method)||!body||typeof body!=='object'||Array.isArray(body))fail(400,'INVALID_REQUEST','요청 형식을 확인하세요.');
  const limitRef=db.doc('_uiLimits/'+auth.uid);
  await db.runTransaction(async tx=>{
    const old=(await tx.get(limitRef)).data(),same=old&&now-old.start<60000;
    if(same&&old.count>=90)fail(429,'RATE_LIMIT','요청이 많습니다. 잠시 후 다시 시도하세요.');
    tx.set(limitRef,{start:same?old.start:now,count:same?old.count+1:1});
  });
  return db.runTransaction(async tx=>{
    const role=(await tx.get(db.doc('roles/'+auth.uid))).data(),tier=role?.tier;
    if(role?.sessionValidAfter>auth.token.auth_time)fail(401,'UNAUTHENTICATED','계정 설정이 변경되었습니다. 다시 로그인해 주세요.');
    if(![1,2].includes(tier))fail(403,'FORBIDDEN','승인된 관리자 계정이 필요합니다.');
    const user={id:auth.uid,name:auth.token.name||auth.token.email||auth.uid};
    if(path.startsWith('/api/backups')||path.startsWith('/api/users')||path==='/api/audit'||(method!=='GET'&&path==='/api/products')||path.endsWith('/structure')||path.endsWith('/undo'))requireAdmin(tier);
    if(path==='/api/audit'&&method==='GET'){
      const rows=await tx.get(db.collection('auditLog').orderBy('ts','desc').limit(150));
      return {entries:rows.docs.map(d=>{const x=d.data();return {id:d.id,user:x.by,createdAt:x.ts?.toDate().toISOString()||new Date(now).toISOString(),locationId:Object.keys(mapping).find(k=>mapping[k].path===x.location)||x.location,action:x.action,before:x.before,after:x.after};})};
    }
    if(path.startsWith('/api/ledger')&&method==='GET'){
      const url=new URL(path,'https://local'),cursor=url.searchParams.get('before');
      let query=db.collection('uiLedger').orderBy('createdAt','desc').orderBy('__name__','desc');
      if(cursor){let value;try{value=JSON.parse(cursor);}catch{fail(400,'INVALID_CURSOR','이전 기록 위치가 올바르지 않습니다.');}if(!Array.isArray(value)||value.length!==2||value.some(v=>typeof v!=='string'))fail(400,'INVALID_CURSOR','이전 기록 위치가 올바르지 않습니다.');query=query.startAfter(...value);}
      const rows=await tx.get(query.limit(51)),page=rows.docs.slice(0,50),last=page.at(-1);
      return {entries:page.map(d=>({id:d.id,...d.data()})),nextCursor:rows.size>50?JSON.stringify([last.data().createdAt,last.id]):null};
    }
    if(path==='/api/backups'&&method==='GET'){
      const rows=await tx.get(db.collection('uiBackups').orderBy('createdAt','desc').limit(100));
      return {backups:rows.docs.map(d=>({id:d.id,...d.data()})),lastSuccess:rows.docs[0]?.data().createdAt||null,backupError:null};
    }
    const {docs,registered}=await inventory(tx,db);
    const current=await model(docs,registered);
    if(path==='/api/locations'&&method==='GET')return {locations:current.locations};
    if(path==='/api/revision'&&method==='GET')return {revision:await revisionOf(docs)};
    if(path==='/api/products'){
      if(method==='GET')return {products:current.products};
      if(method==='POST'){
        const {code,name}=body;
        if(typeof code!=='string'||!(/^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/).test(code)||typeof name!=='string'||!name.trim()||name.length>120)fail(400,'INVALID_PRODUCT','제품코드와 이름을 확인하세요.');
        if(current.products.some(p=>p.code===code||nameKey(p.name)===nameKey(name)))fail(409,'DUPLICATE_PRODUCT','같은 코드 또는 이름의 제품이 이미 있습니다.');
        tx.create(db.doc('uiProducts/'+code),{code,name:name.trim().normalize('NFC')});return {product:{code,name:name.trim()}};
      }
    }
    const locationMatch=path.match(/^\/api\/locations\/(S\d{2}|P\d{2})\/(cell|structure)$/);
    if(locationMatch&&method==='PUT'){
      const location=current.locations.find(l=>l.id===locationMatch[1]);
      if(!location)fail(404,'NOT_FOUND','위치가 없습니다.');
      const before=structuredClone(location),changes={};
      let type='structure',reason='선반 구조 변경',oldItems=[],newItems=[];
      if(locationMatch[2]==='structure'){
        if(location.kind!=='shelf'||body.rows!==2||!Number.isInteger(body.cols)||body.cols<1||body.cols>20)fail(400,'INVALID_STRUCTURE','선반은 2단, 가로 1~20칸으로 설정하세요.');
        if(body.version!==location.version)fail(409,'VERSION_CONFLICT','다른 사용자가 수정했습니다. 최신 내용을 불러오세요.');
        if(Object.entries(location.cells).some(([key,items])=>Number(key.split('-')[1])>body.cols&&items.length))fail(409,'OCCUPIED_CELL','재고가 있는 칸은 제거할 수 없습니다.');
        location.cols=body.cols;
      }else{
        if(!Object.hasOwn(location.cells,body.cellKey))fail(409,'CELL_REMOVED','해당 칸이 제거되었습니다.');
        oldItems=location.cells[body.cellKey];
        if(canonical(oldItems)!==canonical(body.baseItems))fail(409,'CELL_CONFLICT','이 칸의 재고가 변경되었습니다. 최신 내용을 확인하세요.');
        try{if(!Array.isArray(body.items)||body.items.length>100)throw new Error('한 칸에 최대 100개까지 등록할 수 있습니다.');newItems=normalizeItems(body.items,current.products);reason=validateOperation(body.type,body.reason,oldItems,newItems);}catch(e){fail(400,'INVALID_ITEMS',e.message);}
        type=body.type;location.cells[body.cellKey]=newItems;
        const thresholds=new Map(newItems.map(i=>[groupKey(i),i.threshold]));
        for(const other of current.locations){
          let changed=false;
          for(const items of Object.values(other.cells))for(const item of items)if(thresholds.has(groupKey(item))&&item.threshold!==thresholds.get(groupKey(item))){
            if(body.syncThresholds!==true)fail(409,'THRESHOLD_CONFLICT','같은 제품·로트의 기준수량이 다릅니다. 함께 변경할까요?');
            item.threshold=thresholds.get(groupKey(item));changed=true;
          }
          if(changed)changes[mapping[other.id].path]=encodeLocation(other);
        }
      }
      changes[mapping[location.id].path]=encodeLocation(location);
      // Clear legacy group aliases when a canonical pallet is changed, so an emptied group stays empty in both UIs.
      for(const other of current.locations)if(Object.hasOwn(changes,mapping[other.id].path))for(const alias of mapping[other.id].aliases)if(docs[alias])changes[alias]={items:[]};
      for(const [target,data] of Object.entries(changes))try{validateMutation({path:target,expectedRevision:docs[target]?._revision||0,data},tier,docs[target]);}catch(e){fail(400,'INVALID_ITEMS',e.message);}
      for(const item of [...new Map([...oldItems,...newItems].map(i=>[i.code,i])).values()])if(!registered.some(p=>p.code===item.code))tx.set(db.doc('uiProducts/'+item.code),{code:item.code,name:item.name});
      writeChanges(tx,db,docs,changes,{user,locationId:location.id,cellKey:body.cellKey||'',type,reason,before:oldItems,after:newItems,structureBefore:{rows:before.rows,cols:before.cols},structureAfter:{rows:location.rows,cols:location.cols}},now);
      return {locations:(await model(docs,registered)).locations};
    }
    const undo=path.match(/^\/api\/ledger\/([A-Za-z0-9_-]+)\/undo$/);
    if(undo&&method==='POST'){
      const reason=reasonOf(body.reason),ref=db.doc('uiLedger/'+undo[1]),entry=(await tx.get(ref)).data();
      if(!entry||entry.undone||!['receipt','issue','discard','adjustment'].includes(entry.type))fail(409,'UNDO_UNAVAILABLE','되돌릴 수 없는 기록입니다.');
      const [before,after]=await Promise.all([tx.get(ref.collection('before')),tx.get(ref.collection('after'))]);
      for(const snap of after.docs){const {path,value}=snap.data();if(canonical(docs[path]||null)!==canonical(value))fail(409,'UNDO_CONFLICT','이후 변경된 재고가 있어 되돌릴 수 없습니다.');}
      const changes=Object.fromEntries(before.docs.map(s=>[s.data().path,s.data().value]));
      writeChanges(tx,db,docs,changes,{user,type:'undo',reason,locationId:entry.locationId,cellKey:entry.cellKey,before:entry.after,after:entry.before},now);
      tx.update(ref,{undone:true});return {locations:(await model(docs,registered)).locations};
    }
    if(path==='/api/backups'&&method==='POST'){return {id:backup(tx,db,docs,'수동 백업',now)};}
    const backupMatch=path.match(/^\/api\/backups\/([A-Za-z0-9_-]+)\/(download|restore)$/);
    if(backupMatch){
      const ref=db.doc('uiBackups/'+backupMatch[1]),meta=(await tx.get(ref)).data();
      if(!meta)fail(404,'NOT_FOUND','백업을 찾을 수 없습니다.');
      const snapshot=await tx.get(ref.collection('documents'));
      const saved=Object.fromEntries(snapshot.docs.map(s=>[s.data().path,s.data().value]));
      if(backupMatch[2]==='download'&&method==='GET')return {...meta,documents:saved};
      if(backupMatch[2]==='restore'&&method==='POST'){
        const reason=reasonOf(body.reason);
        if(body.revision!==await revisionOf(docs))fail(409,'VERSION_CONFLICT','재고가 변경되었습니다. 새로고침 후 복원하세요.');
        backup(tx,db,docs,'복원 직전 자동 백업',now);
        const changes=Object.fromEntries([...new Set([...Object.keys(docs),...Object.keys(saved)])].map(p=>[p,saved[p]||null]));
        writeChanges(tx,db,docs,changes,{user,type:'restore',reason,locationId:'',cellKey:'',before:[],after:[]},now);
        return {locations:(await model(docs,registered)).locations};
      }
    }
    fail(404,'NOT_FOUND','요청한 기능을 찾을 수 없습니다.');
  });
}
