import {parseLot} from './lot-engine.mjs';

const quantityFormat = new Intl.NumberFormat('ko-KR', {maximumSignificantDigits: 16});
export const formatQuantity = value => quantityFormat.format(value);

// Align decimal places before addition. Stock adjustments can include negative amounts.
function addQuantity(sum, value) {
  const [mantissa, exponent = '0'] = String(value).toLowerCase().split('e');
  const fraction = (mantissa.split('.')[1] || '').length - Number(exponent);
  const scale = Math.max(sum.scale, fraction);
  sum.units = sum.units * 10n ** BigInt(scale - sum.scale)
    + BigInt(mantissa.replace('.', '')) * 10n ** BigInt(scale - fraction);
  sum.scale = scale;
}
const quantityValue = sum => Number(sum.units + 'e-' + sum.scale);

export function stockBySource(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.source)) groups.set(row.source, {source:row.source, sum:{units:0n,scale:0}, rows:[]});
    const group = groups.get(row.source);
    addQuantity(group.sum, row.quantity);
    group.rows.push(row);
  }
  return [...groups.values()].map(({source,sum,rows})=>({source,total:quantityValue(sum),rows}));
}

// Display labels, column counts, and pallet groups used by the deployed floor plan.
const shelfMap = [
  [5, '제품선반1', 9], [4, '제품선반2', 5], [3, '제품선반3', 5], [19, '제품선반4', 4],
  [15, '부자재 선반1', 3], [14, '부자재 선반2', 4], [11, '부자재 선반3', 5], [13, '부자재 선반4', 5],
  [2, '기계팀 선반1', 8], [1, '기계팀 선반2', 9], [23, '기계팀 선반3', 2], [22, '기계팀 선반4', 2],
  [21, '기계팀 선반5', 2], [10, '미품 선반', 3], [9, '샘플 선반1', 3], [8, '샘플 선반2', 3],
  [18, '미지정 선반', 4], [20, '견본', 4]
];
const palletGroups = [
  ['pgroup-pallet-22', [14,15,16,17,19,20,21,23,18,22]],
  ['pallet-28', [28]], ['pgroup-pallet-5', [4,5]], ['pallet-8', [8]],
  ['pgroup-pallet-26', [24,25,26,27]], ['pallet-3', [3]], ['pallet-0', [0]],
  ['pgroup-pallet-29', [29,30]], ['pallet-13', [13]], ['pgroup-pallet-11', [9,10,12,11]],
  ['pgroup-pallet-1', [1,2]], ['pgroup-pallet-6', [6,7]]
];

function shelfRows(shelf, label, defaultCols, visit) {
  const cells = Array.isArray(shelf.cells) && shelf.cells.length ? shelf.cells : null;
  const items = Array.isArray(shelf.items) ? shelf.items.filter(item =>
    item && (item.name || item.qty || item.threshold || item.expiry || item.lot)) : [];
  const cols = cells ? Number(shelf.cols) || Math.ceil(cells.length / 2)
                     : Math.max(defaultCols, Math.ceil(items.length / 2));
  (cells || items).forEach((cell, index) => {
    const rows = Array.isArray(cell) ? cell : cell?.list || [cell];
    const location = `${label} · ${Math.floor(index / cols) + 1}단 ${index % cols + 1}칸`;
    if (Array.isArray(rows)) rows.forEach(row => visit(location, row?.lot, row?.qty));
  });
}

function warehouseRows(shelves, pallets, visit) {
  const labels = new Map(shelfMap.map(([id, name, cols]) => ['shelf-' + id, {name, cols}]));
  for (const [id, shelf] of shelves) {
    const label = labels.get(id);
    shelfRows(shelf, label?.name || shelf.label || id, label?.cols || 1, visit);
  }
  const used = new Set();
  palletGroups.forEach(([primary, members], index) => {
    const ids = members.flatMap(id => ['pallet-' + id, 'pgroup-pallet-' + id]);
    ids.forEach(id => used.add(id));
    const canonical = pallets.get(primary)?.items;
    const items = Array.isArray(canonical) && canonical.length ? canonical
      : ids.filter(id => id !== primary).flatMap(id => pallets.get(id)?.items || []);
    const label = '팔레트 ' + String(index + 1).padStart(2, '0');
    for (const item of items) visit(label, item?.lot, item?.qty);
  });
  for (const [id, pallet] of pallets) {
    if (!used.has(id) && Array.isArray(pallet.items)) {
      for (const item of pallet.items) visit(pallet.label || id, item?.lot, item?.qty);
    }
  }
}

export async function lookupInventory(db, input) {
  const query = parseLot(typeof input === 'string' ? input : input.lot || input.lotCode);
  const errors = [];
  // Read current records on demand and let a failed source report its own status.
  async function readDoc(path, label) {
    try { return (await db.doc(path).get({source:'server'})).data() || null; }
    catch { errors.push(label + ' 재고를 불러오지 못했습니다.'); return undefined; }
  }
  async function readLocations(collection, label) {
    try {
      const snapshot = await db.collection(collection).get({source:'server'});
      return new Map(snapshot.docs.map(doc => [doc.id, doc.data()]));
    } catch { errors.push(label + ' 위치를 불러오지 못했습니다.'); return new Map(); }
  }
  const [p3l, current, carton, shelves, pallets] = await Promise.all([
    readDoc('stock/p3l','3PL'), readDoc('stock/ecountCurrent','이카운트'), readDoc('stock/carton','카톤박스'),
    readLocations('shelves','선반'), readLocations('pallets','팔레트')
  ]);

  function collector(field, exact) {
    const totals = new Map();
    function visit(label, raw, qty) {
      if (typeof raw !== 'string' || !raw.trim().toUpperCase().startsWith(query.month + 'V')) return;
      let parsed;
      try { parsed = parseLot(raw); } catch { return; }
      if (parsed.key !== query.key || exact && query.seq && parsed.lot !== query.lot) return;
      if ((typeof qty !== 'number' && typeof qty !== 'string') || String(qty).trim() === '') return;
      const n = Number(qty);
      if (!Number.isFinite(n) || field === 'location' && n <= 0) return;
      const key = JSON.stringify([label,parsed.lot]);
      const entry = totals.get(key) || {[field]:label, lotCode:parsed.lot, sum:{units:0n,scale:0}};
      addQuantity(entry.sum,n);
      totals.set(key,entry);
    }
    function rows() {
      const result = Array.from(totals.values(), ({sum, ...row}) => ({...row, quantity:quantityValue(sum)}));
      return result.sort((a,b) => a[field].localeCompare(b[field],'ko',{numeric:true})
        || Number(b.lotCode === query.lot) - Number(a.lotCode === query.lot)
        || a.lotCode.localeCompare(b.lotCode,'ko',{numeric:true}));
    }
    return {visit,rows};
  }
  const stock = collector('source', false);
  const uploaded = (label, data) => {
    if (Array.isArray(data?.lots)) data.lots.forEach(row => stock.visit(label, row?.l, row?.q));
  };
  uploaded('3PL',p3l);
  uploaded('카톤박스',carton);
  if (current?.mode === 'ecount-authoritative') {
    const records = current.current?.records;
    if (Array.isArray(records)) records.forEach(row => stock.visit('이카운트', row?.lot, row?.quantity));
    else errors.push('이카운트 원천 재고를 확인할 수 없습니다.');
  } else if (current !== undefined) {
    uploaded('이카운트', await readDoc('stock/ecount','이카운트'));
  }
  const locations = collector('location', true);
  warehouseRows(shelves,pallets,locations.visit);
  return {stock:stock.rows(), locations:locations.rows(), errors};
}
