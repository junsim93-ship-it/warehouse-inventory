import {plan} from './plan.mjs';
import mapping from './mapping.json' with {type:'json'};
import catalog from '../catalog.json' with {type:'json'};
export {mapping};
export const nameKey = name => String(name||'').trim().normalize('NFC').replace(/\s/g,'').toLocaleLowerCase('ko');
export function canonical(value) {
  return JSON.stringify(value, function(key, item) {
    return item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.keys(item).sort().map(k=>[k,item[k]])) : item;
  });
}
export async function digest(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
}
export const revisionOf = docs => digest(canonical(docs));
const unpack = cell => !cell ? [] : Array.isArray(cell) ? cell : cell.list || [cell];
const filled = item => item && (item.name || item.qty || item.threshold || item.expiry || item.lot);
export async function model(docs, registered=[]) {
  const products = new Map(registered.map(p=>[nameKey(p.name),{code:p.code,name:p.name}]));
  const names = Object.values(docs).flatMap(d => d.cells?.length ? d.cells.flatMap(unpack) : d.items || []).filter(filled);
  for(const item of names) if(!products.has(nameKey(item.name))) {
    const name = String(item.name||'').trim().normalize('NFC');
    products.set(nameKey(name),{code:'P-'+(await digest(nameKey(name))).slice(0,20),name});
  }
  const normalize = items => items.filter(filled).map(i=>({
    ...products.get(nameKey(i.name)),qty:Number(i.qty||0),threshold:Number(i.threshold||0),lot:String(i.lot||''),expiry:String(i.expiry||'')
  }));
  const locations = plan.locations.map(shape=>{
    const {path,aliases}=mapping[shape.id], data=docs[path]||{};
    const rows=shape.kind==='shelf'?2:1;
    const legacy=(data.items||[]).filter(filled);
    const cols=rows===2 ? (data.cells?.length ? data.cols || Math.ceil(data.cells.length/2) : Math.max(catalog.shelves[path.split('/')[1]]||shape.cols,Math.ceil(legacy.length/2))) : 1;
    const cells={};
    if(rows===2) for(let i=0;i<2*cols;i++) cells[`${Math.floor(i/cols)+1}-${i%cols+1}`]=normalize(data.cells?.length?unpack(data.cells[i]):unpack(legacy[i]));
    else cells['1-1']=normalize(data.items?.length?data.items:aliases.flatMap(p=>docs[p]?.items||[]));
    const version=Math.max(0,...[path,...aliases].map(p=>Number(docs[p]?.updatedAt)||Number(docs[p]?._revision)||0));
    return {...shape,rows,cols,cells,version,updatedAt:version?new Date(version).toISOString():''};
  });
  return {locations,products:[...products.values()].sort((a,b)=>a.name.localeCompare(b.name,'ko'))};
}
export function encodeLocation(location) {
  const legacy = items => items.map(({name,qty,threshold,lot,expiry})=>({name,qty,threshold,lot,expiry}));
  return location.kind==='shelf'
    ? {cols:location.cols,cells:Array.from({length:location.rows*location.cols},(_,i)=>({list:legacy(location.cells[`${Math.floor(i/location.cols)+1}-${i%location.cols+1}`]||[])}))}
    : {items:legacy(location.cells['1-1']||[])};
}
