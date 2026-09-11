import catalog from './catalog.json' with {type:'json'};

export class ValidationError extends Error {}
const fail = message => { throw new ValidationError(message); };
const object = (v, keys) => {
  if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).some(k=>!keys.includes(k))) fail('허용되지 않은 데이터 형식입니다.');
};
const text = (v, max=300, required=false) => {
  if(typeof v !== 'string' || v.length>max || (required && !v.trim())) fail('문자열 길이 또는 형식을 확인하세요.');
};
const number = (v,min,max,integer=false) => {
  if(typeof v !== 'number' || !Number.isFinite(v) || v<min || v>max || (integer && !Number.isInteger(v))) fail('숫자 범위를 확인하세요.');
};
const list = (v,max) => { if(!Array.isArray(v)||v.length>max) fail('목록 크기를 확인하세요.'); };

export function authorize(tier,path) {
  if(tier !== 1 && tier !== 2) fail('승인된 관리자 권한이 필요합니다.');
  const [collection,id,...rest]=String(path).split('/');
  const allowed = !rest.length && (
    (collection==='shelves' && Object.hasOwn(catalog.shelves,id)) ||
    (collection==='pallets' && catalog.pallets.includes(id)) ||
    (collection==='stock' && ['p3l','ecount','carton'].includes(id)) ||
    (collection==='settings' && id==='app') || (collection==='boms' && id==='list' && tier===2));
  if(!allowed) fail('이 데이터에 대한 수정 권한이 없습니다.');
}

function item(v) {
  object(v,['name','qty','threshold','expiry','lot']);
  for(const k of ['name','lot']) text(v[k]??'',300);
  text(v.expiry??'',30);
  for(const k of ['qty','threshold']) {
    const q=v[k]??'';
    if(q==='') continue;
    if(typeof q==='string' && !/^\d{1,10}$/.test(q)) fail('수량은 0 이상의 정수여야 합니다.');
    number(typeof q==='string'?Number(q):q,0,1e9,true);
  }
}
function lot(v) {
  object(v,['c','n','w','l','e','q']);
  text(v.c,200,true);
  for(const k of ['n','w','l','e']) text(v[k]??'',500);
  // ERP adjustments can legitimately be negative or fractional.
  number(v.q,-1e12,1e12);
}
function bom(v) {
  object(v,['id','name','components','kernelCode']);
  text(v.id,100,true); text(v.name,300,true); text(v.kernelCode??'',200);
  list(v.components,200);
  if(!v.components.length) fail('BOM 구성품이 필요합니다.');
  const codes=new Set();
  for(const c of v.components){
    object(c,['code','name','qty']); text(c.code,200,true); text(c.name??'',300); number(c.qty,0.000001,1e9);
    if(codes.has(c.code)) fail('BOM 구성품 코드가 중복되었습니다.');
    codes.add(c.code);
  }
}
export function validateMutation(m,tier,before) {
  object(m,['path','expectedRevision','data','restore','backupRevision']);
  authorize(tier,m.path);
  number(m.expectedRevision,0,Number.MAX_SAFE_INTEGER,true);
  const [collection,id]=m.path.split('/');
  if(m.restore===true) {
    if(collection!=='stock'||m.data!==undefined) fail('잘못된 복원 요청입니다.');
    number(m.backupRevision,0,Number.MAX_SAFE_INTEGER,true);
    return;
  }
  if(m.restore!==undefined||m.backupRevision!==undefined) fail('잘못된 요청입니다.');
  const d=m.data;
  if(collection==='shelves') {
    object(d,['cols','cells','updatedAt']); number(d.cols,1,20,true); list(d.cells,40);
    const existingCols=before?.cols??catalog.shelves[id];
    if(tier===1 && d.cols!==existingCols) fail('선반 칸 수 변경은 2단계 권한이 필요합니다.');
    if(d.cells.length!==2*d.cols) fail('선반 칸 수와 데이터가 일치하지 않습니다.');
    for(const cell of d.cells) {
      if(cell===null) continue;
      if(Object.hasOwn(cell,'list')) {object(cell,['list']);list(cell.list,100);cell.list.forEach(item);}
      else item(cell);
    }
  } else if(collection==='pallets') {
    object(d,['items','updatedAt']);list(d.items,500);d.items.forEach(item);
  } else if(collection==='stock') {
    object(d,['fileName','date','lots','meta']);text(d.fileName,255);text(d.date,100);list(d.lots,10000);d.lots.forEach(lot);
    if(d.meta!==undefined) {
      object(d.meta,['qtyCol','codeCol','lotCol','expCol','whCol','dataRows','parsedRows','skippedSubtotal','skippedZero','badQty','warnings']);
      for(const [k,v] of Object.entries(d.meta)) {
        if(k==='warnings'){list(v,30);v.forEach(x=>text(x,500));}
        else if(k.endsWith('Col')) { if(v!==null) text(v,300); }
        else number(v,0,1000000,true);
      }
    }
  } else if(collection==='boms') {
    object(d,['boms']);list(d.boms,1000);d.boms.forEach(bom);
    if(new Set(d.boms.map(x=>x.id)).size!==d.boms.length) fail('BOM ID가 중복되었습니다.');
  } else if(collection==='settings') {
    object(d,['basis','dedup']);
    if(!['p3l','ecount','sum'].includes(d.basis)||typeof d.dedup!=='boolean') fail('잘못된 계산 설정입니다.');
  }
  if(d.updatedAt!==undefined) number(d.updatedAt,0,Number.MAX_SAFE_INTEGER,true);
  if(Buffer.byteLength(JSON.stringify(d),'utf8')>800000) fail('저장 데이터가 너무 큽니다.');
}
export const revisionMatches=(expected,data)=>expected===(data?._revision??0);
export function withoutRevision(data) {
  if(data==null) return null;
  const {_revision,...rest}=data;
  return rest;
}
