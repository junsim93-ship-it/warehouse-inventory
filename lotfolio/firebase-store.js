import {buildLot, productCode} from './lot-engine.mjs';
import {fileMime, newId} from './attachments.mjs';
import {fileCipher, openFile, sealFile} from './file-crypto.mjs';
import {buildFreezeChange} from './design-freeze.mjs';

const empty = () => ({products:[], designs:[], lots:[], files:[]});
const clean = value => String(value ?? '').trim();
const conflict = (message, extra = {}) => Object.assign(Error(message), {status:409, ...extra});
const missing = () => Error('다른 사용자가 항목을 삭제했거나 변경했습니다. 목록을 다시 확인해 주세요.');
const changed = () => conflict('다른 사용자가 먼저 수정했습니다. 다시 열어 최신 내용을 확인해 주세요.');
const uuid = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/;
const keyPattern = /^\d{2}(0[1-9]|1[0-2])V_[A-Z0-9-]+_[ABC]_(KR|N|M|C|NM|NC|MC|NMC)$/;
const byCreated = (a,b) => b.created-a.created;
const trimProduct = row => {
  const name = clean(row.name);
  if (!name) throw Error('제품명을 입력해 주세요.');
  return {code:productCode(row.code),name,brand:clean(row.brand),memo:clean(row.memo)};
};
function attachment(file, design) {
  if (!keyPattern.test(design) || !uuid.test(file.id) || typeof file.name !== 'string'
      || /[\/\\\u0000-\u001f\u007f]/.test(file.name)) throw Error('첨부파일 이름 또는 경로를 확인해 주세요.');
  const mime = fileMime(file.kind,file.name,file.size);
  const ext = file.name.split('.').at(-1).toLowerCase();
  return {id:file.id,kind:file.kind,name:file.name,size:file.size,mime,
    primary:file.kind === 'image' && !!file.primary, path:'lotDesigns/'+design+'/'+file.id+'.'+ext};
}
async function verifyBytes(blob, mime) {
  if (!(blob instanceof Blob) || (blob.type && blob.type !== mime && blob.type !== 'application/octet-stream'))
    throw Error('첨부파일 형식과 확장자가 일치하지 않습니다.');
  const head = new Uint8Array(await blob.slice(0,12).arrayBuffer());
  const ascii = String.fromCharCode(...head);
  const valid = {'image/png': [137,80,78,71,13,10,26,10].every((v,i)=>head[i]===v),
    'image/jpeg':head[0]===255 && head[1]===216 && head[2]===255,
    'image/webp':ascii.startsWith('RIFF') && ascii.slice(8) === 'WEBP',
    'application/pdf':ascii.startsWith('%PDF-')};
  if (!valid[mime]) throw Error('첨부파일 내용과 확장자가 일치하지 않습니다.');
}
function designRow(snapshot) {
  const {files = [], ...data} = snapshot.data();
  return {...data,id:snapshot.id,key:data.designKey,files};
}

export function createLotfolioStore(app, options={}) {
  const db = app.firestore(), auth = app.auth(), uid = auth.currentUser?.uid;
  if (!uid) throw Error('먼저 로그인해 주세요.');
  const scope = new AbortController(), stops = new Set();
  const origin = options.storageOrigin || 'https://firebasestorage.googleapis.com';
  if (options.storageOrigin && !(app.options.projectId.startsWith('demo-') &&
      /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))) throw Error('에뮬레이터 주소를 확인해 주세요.');
  const bucketUrl = origin + '/v0/b/' + encodeURIComponent(app.options.storageBucket) + '/o';
  function active() {
    if (scope.signal.aborted || auth.currentUser?.uid !== uid) throw Error('세션이 종료되었습니다. 다시 로그인해 주세요.');
  }
  function subscribe(onState, onError=()=>{}) {
    active();
    let live = true;
    const rows = empty(), seen = new Set(), unsubs = [];
    const stop = () => {
      if (!live) return;
      live = false;
      unsubs.forEach(fn=>fn());
      stops.delete(stop);
      onState(empty());
    };
    stops.add(stop);
    for (const [prop, collection] of [['products','lotProducts'],['designs','lotDesigns'],['lots','lotRecords']]) {
      unsubs.push(db.collection(collection).onSnapshot({includeMetadataChanges:true}, snapshot=>{
        if (!live || scope.signal.aborted || auth.currentUser?.uid !== uid) return;
        // Only a server-authorized result can establish a new session's first snapshot.
        if (!seen.has(prop) && snapshot.metadata.fromCache) return;
        if (prop === 'designs') {
          rows.designs = snapshot.docs.map(designRow).sort(byCreated);
          rows.files = rows.designs.flatMap(d => d.files.map(f=>({...f,design:d.id})))
            .sort((a,b)=>Number(b.primary)-Number(a.primary));
        } else {
          rows[prop] = snapshot.docs.map(doc => ({...doc.data(),id:doc.id,key:doc.data().designKey})).sort(byCreated);
        }
        seen.add(prop);
        if (seen.size === 3) onState({...rows});
      }, error=>{ if(live) { stop(); onError(error); } }));
    }
    return stop;
  }
  async function fetchStorage(url, options={}) {
    active();
    const token = await auth.currentUser.getIdToken();
    active();
    const response = await fetch(url,{...options,cache:'no-store',credentials:'omit',signal:scope.signal,
      headers:{...options.headers, Authorization:'Firebase '+token}});
    if (!response.ok && !(response.status===404 && options.method==='DELETE'))
      throw Object.assign(Error('첨부파일 요청에 실패했습니다. 권한과 연결 상태를 확인해 주세요. ('+response.status+')'),{status:response.status});
    return response;
  }
  function assertPath(file, key) {
    const expected = attachment(file,key);
    if (file.path !== expected.path) throw Error('첨부파일 저장 경로가 디자인과 일치하지 않습니다.');
    return expected;
  }
  async function getFileBlob(file) {
    const valid = assertPath(file,file.design);
    const response = await fetchStorage(bucketUrl+'/'+encodeURIComponent(valid.path)+'?alt=media');
    const blob = await response.blob();
    active();
    const original = await openFile(valid,blob,file.protection);
    active();
    return original;
  }
  async function put(file, blob) {
    const {ciphertext, protection} = await sealFile(file,blob);
    const boundary = 'lotfolio-'+newId();
    const metadata = {name:file.path, contentType:ciphertext.type, cacheControl:'private, no-store',
      metadata:{originalName:file.name,originalMime:file.mime,kind:file.kind,cipher:fileCipher}};
    const body = new Blob(['--'+boundary+'\r\nContent-Type: application/json; charset=utf-8\r\n\r\n',
      JSON.stringify(metadata),'\r\n--'+boundary+'\r\nContent-Type: '+ciphertext.type+'\r\n\r\n',ciphertext,'\r\n--'+boundary+'--']);
    await fetchStorage(bucketUrl+'?name='+encodeURIComponent(file.path), {method:'POST',body,
      headers:{'Content-Type':'multipart/related; boundary='+boundary,'X-Goog-Upload-Protocol':'multipart'}});
    return {...file,protection};
  }
  async function removeFiles(files,key) {
    const failures = await Promise.allSettled(files.map(async f=>{
      const valid = assertPath(f,key);
      await fetchStorage(bucketUrl+'/'+encodeURIComponent(valid.path),{method:'DELETE'});
    }));
    return failures.filter(r=>r.status==='rejected').length;
  }
  function transaction(body) {
    active();
    return db.runTransaction(async tx=>{ active(); return body(tx); });
  }
  async function saveDesign(form) {
    active();
    const parsed = buildLot({...form,seq:''});
    const key = parsed.key, oldKey = form.id || form.previousKey || null;
    const target = db.collection('lotDesigns').doc(key);
    const source = oldKey && db.collection('lotDesigns').doc(oldKey);
    let oldData, previousFiles = [];
    if (source) {
      const snap = await source.get({source:'server'});
      if (!snap.exists) throw missing();
      oldData = snap.data();
      if (form.original && form.original.revision !== oldData.revision) throw changed();
      if (oldKey !== key && oldData.freeze?.active)
        throw Error('동결을 해제한 뒤 디자인 키를 변경해 주세요.');
      previousFiles = oldData.files;
    }
    if ((!oldKey || oldKey !== key) && (await target.get({source:'server'})).exists)
      throw conflict('같은 디자인 키가 이미 등록되어 있습니다.',{existingId:key});
    const retained = [], staged = [];
    const keep = form.files ?? previousFiles;
    for (const requested of keep) {
      const existing = previousFiles.find(f=>f.id===requested.id);
      if (!existing || retained.some(f=>f.id===requested.id)) throw changed();
      retained.push({...assertPath(existing,oldKey),protection:existing.protection,primary:!!requested.primary});
    }
    const nextFiles = [];
    const revision = newId();
    let commitAttempted = false;
    try {
      for (const file of retained) {
        if (oldKey === key) { nextFiles.push(file); continue; }
        // A new object identity isolates competing renames and stale cleanup attempts.
        const copy = attachment({...file,id:newId()},key);
        const blob = await getFileBlob({...file,design:oldKey});
        const saved = await put(copy,blob); staged.push(saved); nextFiles.push(saved);
      }
      for (const item of (form.uploads || [])) {
        const blob = item.file;
        const file = attachment({id:newId(),kind:item.kind,name:blob.name,size:blob.size,primary:item.primary},key);
        await verifyBytes(blob,file.mime);
        const saved = await put(file,blob); staged.push(saved); nextFiles.push(saved);
      }
      const images = nextFiles.filter(f=>f.kind==='image');
      const primary = images.find(f=>f.primary) || images[0];
      for (const file of nextFiles) file.primary = file === primary;
      const payload = {designKey:key,month:parsed.month,code:parsed.code,type:parsed.type,reg:parsed.reg,
        author:clean(form.author),memo:clean(form.memo),created:oldData?.created ?? Date.now(),revision,files:nextFiles};
      if (oldKey !== key && oldData?.freezeHistory?.length) {
        payload.freeze = null;
        payload.freezeHistory = oldData.freezeHistory;
        payload.freezeHistoryFrom = oldKey;
      }
      commitAttempted = true;
      await transaction(async tx=>{
        const old = source && await tx.get(source);
        if (source && (!old.exists || old.data().revision !== oldData.revision)) throw changed();
        if ((!source || oldKey !== key) && (await tx.get(target)).exists)
          throw conflict('같은 디자인 키가 이미 등록되어 있습니다.',{existingId:key});
        if (source && oldKey!==key) tx.delete(source);
        active();
        if (oldKey === key) tx.update(target,payload);
        else tx.set(target,payload);
      });
    } catch(error) {
      // An ambiguous transport failure must never delete blobs of a committed snapshot.
      let canClean = !commitAttempted || error.status===409 || ['permission-denied','aborted','failed-precondition'].includes(error.code);
      if (!canClean) {
        try {
          const published = await target.get({source:'server'});
          canClean = !published.exists || !published.data().files.some(f=>staged.some(s=>s.path===f.path));
        } catch { /* Offline: keep the uniquely named objects for reconciliation. */ }
      }
      if (canClean) await removeFiles(staged,key);
      throw error;
    }
    const retired = previousFiles.filter(f=>!nextFiles.some(n=>n.path===f.path));
    const pendingCleanup = await removeFiles(retired,oldKey);
    return {id:key,pendingCleanup};
  }
  async function deleteDesign(design) {
    const ref = db.collection('lotDesigns').doc(design.id);
    const files = await transaction(async tx=>{
      const doc = await tx.get(ref);
      if (!doc.exists) throw missing();
      if (doc.data().revision !== design.revision) throw changed();
      if (doc.data().freeze?.active) throw Error('동결을 해제한 뒤 디자인을 삭제해 주세요.');
      active(); tx.delete(ref); return doc.data().files;
    });
    return {pendingCleanup:await removeFiles(files,design.id)};
  }
  async function setDesignFreeze(design, action, input) {
    const user = auth.currentUser;
    if (!user?.email) throw Error('관리자 이메일을 확인할 수 없습니다.');
    const ref = db.collection('lotDesigns').doc(design.id);
    await transaction(async tx => {
      const doc = await tx.get(ref);
      if (!doc.exists) throw missing();
      if (doc.data().revision !== design.revision) throw changed();
      const change = buildFreezeChange(doc.data(), action, input, user.email);
      active();
      tx.update(ref, {...change, revision:newId()});
    });
  }
  async function saveProduct(input, {create=false,original}={}) {
    const row = trimProduct(input), ref = db.collection('lotProducts').doc(row.code);
    return transaction(async tx=>{
      const snap = await tx.get(ref), data = snap.data();
      if (create && snap.exists) throw conflict('이미 등록된 제품번호입니다.');
      if (!create && !snap.exists) throw missing();
      if (original && original.revision !== data?.revision) throw changed();
      active(); tx.set(ref,{...row,created:data?.created ?? Date.now(),revision:(data?.revision||0)+1});
      return {code:row.code};
    });
  }
  async function deleteProduct(code,original) {
    const ref = db.collection('lotProducts').doc(productCode(code));
    return transaction(async tx=>{
      const snap = await tx.get(ref);
      if (!snap.exists) throw missing();
      if (original && original.revision !== snap.data().revision) throw changed();
      active(); tx.delete(ref);
    });
  }
  async function importProducts(rows, mode) {
    if (!['skip','overwrite'].includes(mode)) throw Error('중복 제품 처리 방법을 선택해 주세요.');
    const distinct = new Map();
    for (const input of rows) {
      const row = trimProduct(input);
      if (mode==='overwrite' || !distinct.has(row.code)) distinct.set(row.code,row);
    }
    const items = [...distinct.values()];
    let count = 0;
    // Transaction reads precede every write. Keep chunks well below the Firestore write limit.
    for (let i=0;i<items.length;i+=200) {
      const chunk = items.slice(i,i+200);
      try {
        count += await transaction(async tx=>{
          const refs = chunk.map(item=>db.collection('lotProducts').doc(item.code));
          const current = await Promise.all(refs.map(ref=>tx.get(ref)));
          let changed = 0;
          active();
          chunk.forEach((row,j)=>{
            const doc = current[j], data = doc.data();
            if (doc.exists && mode==='skip') return;
            tx.set(refs[j],{...row,created:data?.created ?? Date.now(),revision:(data?.revision||0)+1}); changed++;
          });
          return changed;
        });
      } catch(e) {
        if (count) throw Error(count+'개 제품을 반영한 뒤 중단되었습니다. 목록을 확인하고 나머지 행을 다시 등록해 주세요. '+e.message);
        throw e;
      }
    }
    return {count};
  }
  async function saveLot(input) {
    active();
    const p = buildLot(input), records = db.collection('lotRecords');
    const first = records.doc(p.lot), repeat = records.doc();
    if (!input.confirmDuplicate && !(await records.where('lot','==',p.lot).limit(1).get({source:'server'})).empty)
      throw conflict('같은 로트 코드가 발주 이력에 있습니다.');
    return transaction(async tx=>{
      const exists = (await tx.get(first)).exists;
      if (exists && !input.confirmDuplicate) throw conflict('같은 로트 코드가 발주 이력에 있습니다.');
      const ref = exists ? repeat : first;
      active(); tx.set(ref,{designKey:p.key,lot:p.lot,month:p.month,seq:p.seq,code:p.code,type:p.type,reg:p.reg,
        created:Date.now(),memo:clean(input.memo),author:clean(input.author) || auth.currentUser.email || ''});
      return {id:ref.id};
    });
  }
  async function deleteLot(id) {
    active(); return db.collection('lotRecords').doc(id).delete();
  }
  function dispose() {
    scope.abort();
    for (const stop of stops) stop();
  }
  return {subscribe,saveDesign,deleteDesign,setDesignFreeze,getFileBlob,saveProduct,deleteProduct,importProducts,saveLot,deleteLot,dispose};
}
