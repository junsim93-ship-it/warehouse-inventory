import { plan } from './plan.mjs';

export const groupKey = ({ code, name = '', lot = '' }) => JSON.stringify([code ? 'code' : 'name', (code || name).trim().normalize('NFC'), lot.trim().normalize('NFC')]);
export const itemsAt = location => Object.values(location.cells || {}).flat();

export function aggregate(locations) {
  const groups = new Map();
  for (const item of locations.flatMap(itemsAt)) {
    const key = groupKey(item);
    const group = groups.get(key) || { key, ...(item.code ? { code: item.code } : {}), name: item.name.trim().normalize('NFC'), lot: item.lot.trim().normalize('NFC'), qty: 0, threshold: item.threshold };
    group.qty += item.qty;
    group.threshold = Math.max(group.threshold, item.threshold);
    groups.set(key, group);
  }
  return [...groups.values()].map(group => ({ ...group, low: group.qty <= group.threshold }));
}

const dayMillis = 86400000;
export function expiryStatus(expiry, today) {
  if (!expiry) return 'none';
  if (!today) {
    const now = new Date();
    today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  const days = (Date.parse(`${expiry}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / dayMillis;
  return days < 0 ? 'expired' : days <= 30 ? 'soon' : 'normal';
}

export function matchesItem(item, query, lowKeys) {
  const search = query.trim().normalize('NFC').toLocaleLowerCase('ko');
  return (!search || `${item.code || ''}\n${item.name}\n${item.lot}`.normalize('NFC').toLocaleLowerCase('ko').includes(search)) && (!lowKeys || lowKeys.has(groupKey(item)));
}

export function filterLocations(locations, { query = '', showEmpty = true, lowOnly = false } = {}) {
  const lowKeys = lowOnly ? new Set(aggregate(locations).filter(group => group.low).map(group => group.key)) : null;
  return locations.filter(location => {
    const items = itemsAt(location);
    return items.length ? items.some(item => matchesItem(item, query, lowKeys)) : showEmpty && !query.trim() && !lowOnly;
  }).sort((a, b) => Number(b.kind === 'shelf') - Number(a.kind === 'shelf') || (a.id || '').localeCompare(b.id || '', 'en', { numeric: true }));
}

export function normalizeItems(rows, products = []) {
  const items = [];
  for (const [index, row] of rows.entries()) {
    const code = String(row.code || '').trim();
    const lot = String(row.lot || '').trim().normalize('NFC');
    const expiry = String(row.expiry || '').trim();
    const emptyNumber = value => value === '' || value === 0 || value === '0';
    if (!code && !row.name && !lot && !expiry && emptyNumber(row.qty) && emptyNumber(row.threshold)) continue;
    const product = products.find(item => item.code === code);
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/.test(code) || !product) throw new Error(`${index + 1}번째 행에서 등록된 품목을 선택하세요.`);
    const name = product.name.trim().normalize('NFC');
    if (!name || name.length > 120 || lot.length > 80) throw new Error(`${index + 1}번째 제품의 이름(1~120자)과 로트번호(최대 80자)를 확인하세요.`);
    for (const field of ['qty', 'threshold']) {
      if (String(row[field]).trim() === '' || !Number.isInteger(Number(row[field])) || Number(row[field]) < 0 || Number(row[field]) > 1000000000) throw new Error(`${index + 1}번째 제품의 수량과 기준수량은 0~1,000,000,000의 정수여야 합니다.`);
    }
    if (expiry && (!/^\d{4}-\d{2}-\d{2}$/.test(expiry) || Number.isNaN(Date.parse(`${expiry}T00:00:00Z`)) || new Date(`${expiry}T00:00:00Z`).toISOString().slice(0, 10) !== expiry)) throw new Error(`${index + 1}번째 제품의 유통기한이 올바르지 않습니다.`);
    items.push({ code, name, lot, expiry, qty: Number(row.qty), threshold: Number(row.threshold) });
  }
  if (items.length > 100) throw new Error('한 칸에는 제품을 최대 100개까지 등록할 수 있습니다.');
  const thresholds = new Map();
  for (const item of items) {
    const key = groupKey(item);
    if (thresholds.has(key) && thresholds.get(key) !== item.threshold) throw new Error('같은 제품·로트의 기준수량을 동일하게 입력하세요.');
    thresholds.set(key, item.threshold);
  }
  return items;
}

export function stockChanges(before, after) {
  const groups = new Map();
  for (const [side, items] of [['before', before], ['after', after]]) {
    for (const item of items) {
      const key = JSON.stringify([groupKey(item), item.expiry || '']);
      const group = groups.get(key) || { key, code: item.code || '', name: item.name, lot: item.lot, expiry: item.expiry || '', before: 0, after: 0 };
      group[side] += Number(item.qty);
      groups.set(key, group);
    }
  }
  return [...groups.values()].map(group => ({ ...group, delta: group.after - group.before }));
}

export function validateOperation(type, reason, before, after) {
  reason = String(reason || '').trim().normalize('NFC');
  if (!reason || reason.length > 500) throw new Error('작업 사유를 1~500자로 입력하세요.');
  if (!['receipt', 'issue', 'discard', 'adjustment'].includes(type)) throw new Error('작업 유형을 선택하세요.');
  const changes = stockChanges(before, after);
  if (type === 'receipt' && (!changes.some(change => change.delta > 0) || changes.some(change => change.delta < 0))) throw new Error('입고는 수량 증가만 가능합니다. 감소나 정보 수정은 해당 작업 유형을 선택하세요.');
  if (['issue', 'discard'].includes(type) && (!changes.some(change => change.delta < 0) || changes.some(change => change.delta > 0))) throw new Error('출고·폐기는 수량 감소만 가능합니다. 다른 변경은 재고정정을 선택하세요.');
  return reason;
}

export function parseDraft(serialized, userId, now = Date.now()) {
  try {
    const draft = JSON.parse(serialized);
    if (!draft || draft.userId !== userId || !Number.isFinite(draft.savedAt) || now - draft.savedAt >= 8 * 60 * 60 * 1000 || draft.savedAt > now + 60000) return null;
    if (typeof draft.locationId !== 'string' || !/^\d+-\d+$/.test(draft.cellKey) || typeof draft.structure !== 'boolean' || !Number.isInteger(draft.baseVersion)) return null;
    if (!Array.isArray(draft.rows) || draft.rows.length > 100 || !Array.isArray(draft.baseItems) || draft.baseItems.length > 100) return null;
    const validRow = row => row && ['code', 'name', 'lot', 'expiry'].every(key => typeof row[key] === 'string' && row[key].length <= 500) && ['qty', 'threshold'].every(key => ['number', 'string'].includes(typeof row[key]) && String(row[key]).length <= 100);
    if (!draft.rows.every(validRow) || !draft.baseItems.every(validRow)) return null;
    if (!draft.dimensions || !['rows', 'cols'].every(key => ['number', 'string'].includes(typeof draft.dimensions[key]))) return null;
    if (!['receipt', 'issue', 'discard', 'adjustment'].includes(draft.type) || typeof draft.reason !== 'string' || draft.reason.length > 500) return null;
    return draft;
  } catch { return null; }
}

export function sampleLocations() {
  return plan.locations.map(shape => {
    const rows = shape.kind === 'shelf' ? 2 : 1;
    return { ...shape, rows, version: 1, updatedAt: '', cells: Object.fromEntries(Array.from({ length: rows * shape.cols }, (_, i) => [`${Math.floor(i / shape.cols) + 1}-${i % shape.cols + 1}`, []])) };
  });
}
