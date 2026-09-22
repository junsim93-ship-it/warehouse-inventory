import React, { useEffect, useMemo, useRef, useState } from 'react';
import { aggregate, expiryStatus, filterLocations, groupKey, itemsAt, matchesItem, normalizeItems, stockChanges, validateOperation, parseDraft } from './domain.mjs';

const zones = { product: '제품', material: '부자재', machine: '기계팀', sample: '샘플' };
const operations = { receipt: '입고', issue: '출고', discard: '폐기', adjustment: '재고정정' };
const blank = () => ({ code: '', name: '', qty: '0', threshold: '0', lot: '', expiry: '', rowId: crypto.randomUUID() });
const draftRows = items => items.length ? items.map(item => ({ ...item, rowId: crypto.randomUUID() })) : [blank()];
const draftKey = user => `warehouse:draft:${user.id}`;
function readStoredDraft(user) {
  try {
    const serialized = sessionStorage.getItem(draftKey(user));
    const draft = parseDraft(serialized, user.id);
    if (serialized && !draft) sessionStorage.removeItem(draftKey(user));
    return { draft, warning: serialized && !draft ? '만료되었거나 손상된 임시 입력을 삭제했습니다.' : '' };
  } catch { return { draft: null, warning: '이 브라우저에서는 임시 입력 복구를 사용할 수 없습니다.' }; }
}

function Confirmation({ message, onAnswer }) {
  const dialog = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    const element = dialog.current;
    element.showModal();
    return () => { element.close(); if (opener?.isConnected) opener.focus(); };
  }, []);
  return <dialog ref={dialog} className="editor-dialog confirmation-dialog" aria-labelledby="confirmation-title" aria-describedby="confirmation-message" onCancel={event => { event.preventDefault(); onAnswer(false); }}>
    <div className="dialog-heading"><h2 id="confirmation-title">변경 확인</h2></div>
    <div className="dialog-body"><p id="confirmation-message">{message}</p></div>
    <div className="dialog-footer"><button type="button" className="button" autoFocus onClick={() => onAnswer(false)}>취소</button><button type="button" className="button primary" onClick={() => onAnswer(true)}>확인</button></div>
  </dialog>;
}

function ItemDetails({ item, low }) {
  const expiry = expiryStatus(item.expiry);
  return <span className="item-chip">
    <span className="item-name">{item.name} <strong>{item.qty.toLocaleString('ko-KR')}</strong></span>
    {item.code && <span className="item-meta">품목코드 {item.code}</span>}
    <span className="item-meta">{item.lot || '로트 미지정'} · 기준 {item.threshold.toLocaleString('ko-KR')}</span>
    {item.expiry && <span className="item-meta">유통기한 {item.expiry}</span>}
    {low && <span className="status-badge low">재고 부족</span>}
    {expiry === 'expired' && <span className="status-badge expired">유통기한 만료</span>}
    {expiry === 'soon' && <span className="status-badge soon">30일 이내 만료</span>}
  </span>;
}

function ProductSelect({ row, index, products, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({});
  const trigger = useRef(null);
  const popup = useRef(null);
  const search = useRef(null);
  const id = `products-${row.rowId}`;
  const results = products.filter(product => matchesItem({ ...product, lot: '' }, query));
  const selected = products.find(product => product.code === row.code);
  function close() { popup.current.hidePopover(); trigger.current.focus(); }
  function choose(code) { onChange(code); close(); }
  function show() {
    const rect = trigger.current.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 360), window.innerWidth - 32);
    const below = window.innerHeight - rect.bottom - 16;
    const above = rect.top - 16;
    const upwards = below < 240 && above > below;
    setPosition({ left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)), width, maxHeight: Math.max(120, Math.min(340, upwards ? above - 6 : below - 6)), ...(upwards ? { bottom: window.innerHeight - rect.top + 6, top: 'auto' } : { top: rect.bottom + 6, bottom: 'auto' }) });
    setQuery(''); setActive(0);
  }
  useEffect(() => {
    if (open) search.current?.focus();
  }, [open]);
  useEffect(() => {
    if (open) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, id]);
  return <div className="field">
    <span id={`${id}-label`}>등록 품목</span>
    <button ref={trigger} type="button" className="product-trigger" aria-label={`제품 ${index + 1} 등록 품목`} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`} popoverTarget={id} onClick={show}>
      <span>{row.code ? `${row.code} · ${selected?.name || row.name}` : '품목 선택'}</span><span aria-hidden="true">⌄</span>
    </button>
    <div ref={popup} id={id} popover="auto" className="product-popup" style={position} onToggle={event => setOpen(event.newState === 'open')}>
      <input ref={search} role="combobox" aria-label={`제품 ${index + 1} 품목 검색`} aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-list`} aria-activedescendant={results[active] ? `${id}-${active}` : undefined} placeholder="품목코드 또는 제품명 검색" value={query} maxLength={100} onChange={event => { setQuery(event.target.value); setActive(0); }} onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setActive(current => Math.max(0, Math.min(results.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1)))); }
        if (event.key === 'Enter') { event.preventDefault(); if (results[active]) choose(results[active].code); }
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
        if (event.key === 'Tab') popup.current.hidePopover();
      }} />
      <div id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} className="product-options">
        {results.map((product, option) => <button type="button" role="option" id={`${id}-${option}`} aria-selected={row.code === product.code} tabIndex={-1} className={active === option ? 'active' : ''} key={product.code} onMouseEnter={() => setActive(option)} onClick={() => choose(product.code)}>{product.code} · {product.name}</button>)}
      </div>
      {!results.length && <p className="muted" role="status">검색 결과가 없습니다.</p>}
      {row.code && <button type="button" className="button subtle" onClick={() => choose('')}>선택 해제</button>}
    </div>
  </div>;
}

function Editor({ location, cellKey, structure, user, api, products, productsReady, productError, onRefreshProducts, recovered, onUpdate, onClose, onNotice, onLeaveGuardChange }) {
  const dialog = useRef(null);
  const busyRef = useRef(false);
  const [baseVersion, setBaseVersion] = useState(recovered?.baseVersion ?? location.version);
  const [baseItems, setBaseItems] = useState(recovered?.baseItems ?? location.cells[cellKey] ?? []);
  const [rows, setRows] = useState(() => recovered?.rows.map(row => ({ ...row, rowId: crypto.randomUUID() })) ?? draftRows(location.cells[cellKey] || []));
  const [dimensions, setDimensions] = useState(recovered?.dimensions ?? { rows: location.rows, cols: location.cols });
  const [type, setType] = useState(recovered?.type ?? (location.cells[cellKey]?.length ? 'adjustment' : 'receipt'));
  const [reason, setReason] = useState(recovered?.reason ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [draftError, setDraftError] = useState('');
  const dirty = useRef(Boolean(recovered));
  const label = structure ? `${location.label} 구조 변경` : `${location.label} · ${location.kind === 'pallet' ? '제품 목록' : cellKey.replace('-', '단 ') + '칸'}`;

  useEffect(() => {
    const opener = document.activeElement;
    const element = dialog.current;
    element.showModal();
    const beforeUnload = event => { if (dirty.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', beforeUnload);
    onLeaveGuardChange?.(async () => {
      if (busyRef.current) return false;
      if (dirty.current && !await ask('저장하지 않은 변경사항을 버리고 화면을 이동할까요?')) return false;
      clearDraft(); onClose(); return true;
    });
    return () => { window.removeEventListener('beforeunload', beforeUnload); onLeaveGuardChange?.(null); element.close(); if (opener?.isConnected) opener.focus(); };
  }, []);

  useEffect(() => {
    if (!dirty.current) return;
    try {
      sessionStorage.setItem(draftKey(user), JSON.stringify({ userId: user.id, savedAt: Date.now(), locationId: location.id, cellKey, structure, baseVersion, baseItems, rows, dimensions, type, reason }));
      setDraftError('');
    } catch { setDraftError('브라우저 임시저장을 사용할 수 없습니다. 화면을 닫기 전에 저장하세요.'); }
  }, [rows, dimensions, type, reason, baseItems, baseVersion]);

  const ask = message => new Promise(resolve => setConfirmation({ message, resolve }));

  function clearDraft() {
    dirty.current = false;
    try { sessionStorage.removeItem(draftKey(user)); } catch { /* The draft may be unavailable in private browsing. */ }
  }

  async function close() {
    if (busyRef.current) return;
    if (!dirty.current || await ask('저장하지 않은 변경사항과 임시 입력을 버리고 닫을까요?')) { clearDraft(); onClose(); }
  }

  function edit(index, field, value) {
    dirty.current = true;
    setRows(current => current.map((row, i) => i === index ? { ...row, [field]: value, ...(field === 'code' ? { name: products.find(product => product.code === value)?.name || '' } : {}) } : row));
    setError('');
  }

  async function remove(index) {
    const row = rows[index];
    if ((row.name || row.lot || row.expiry || Number(row.qty)) && !await ask(`“${row.name || '이 제품'}”을 목록에서 제거할까요? 저장하면 삭제됩니다.`)) return;
    dirty.current = true;
    setRows(current => current.filter((_, i) => i !== index));
  }

  async function reload() {
    if (!await ask('현재 입력을 버리고 서버의 최신 재고를 불러올까요?')) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      const result = await api('/api/locations');
      const latest = result.locations.find(item => item.id === location.id);
      if (!latest) throw new Error('이 위치를 찾을 수 없습니다. 닫고 목록을 새로고침하세요.');
      if (!structure && !Object.hasOwn(latest.cells, cellKey)) throw new Error('해당 칸의 구조가 변경되었습니다. 입력 내용은 유지됩니다. 닫고 새 칸을 선택하세요.');
      onUpdate(result.locations); setBaseVersion(latest.version); setBaseItems(latest.cells[cellKey] || []);
      setRows(draftRows(latest.cells[cellKey] || []));
      setDimensions({ rows: latest.rows, cols: latest.cols });
      setReason(''); clearDraft(); setConflict(false);
    } catch (e) { setError(e.message); }
    finally { busyRef.current = false; setBusy(false); }
  }

  async function save(event) {
    event.preventDefault();
    if (busyRef.current || conflict) return;
    setError('');
    let body;
    try {
      if (structure) {
        if (user.role !== 2) throw new Error('선반 구조는 2단계 관리자만 변경할 수 있습니다.');
        const next = { rows: Number(dimensions.rows), cols: Number(dimensions.cols) };
        if (next.rows !== 2 || !Number.isInteger(next.cols) || next.cols < 1 || next.cols > 20) throw new Error('선반은 2단, 칸은 1~20 사이의 정수로 입력하세요.');
        body = { version: baseVersion, ...next };
      } else {
        if (!productsReady) throw new Error('품목 목록을 불러온 후 저장하세요.');
        const items = normalizeItems(rows, products);
        body = { cellKey, baseItems, items, type, reason: validateOperation(type, reason, baseItems, items), syncThresholds: false };
      }
      const emptied = !structure && baseItems.length && !body.items.length;
      const details = structure ? '' : `\n작업: ${operations[type]}\n사유: ${body.reason}\n${stockChanges(baseItems, body.items).filter(change => change.delta !== 0).map(change => `${change.name} (${change.lot || '로트 없음'}${change.expiry ? ` · ${change.expiry}` : ''}): ${change.before} → ${change.after} (${change.delta > 0 ? '+' : ''}${change.delta})`).join('\n')}`;
      if (!await ask((emptied ? `${label}의 모든 재고를 삭제할까요?` : `${label}의 변경사항을 저장할까요?`) + details)) return;
      busyRef.current = true; setBusy(true);
      let result;
      const path = `/api/locations/${encodeURIComponent(location.id)}/${structure ? 'structure' : 'cell'}`;
      try { result = await api(path, { method: 'PUT', body }); }
      catch (e) {
        if (e.code !== 'THRESHOLD_CONFLICT' || structure) throw e;
        if (!await ask(`${e.message}\n\n동일 제품·로트의 모든 위치에 입력한 기준수량을 적용하고 저장할까요?`)) { setError('기준수량 동기화를 취소했습니다. 입력값을 확인하세요.'); return; }
        result = await api(path, { method: 'PUT', body: { ...body, syncThresholds: true } });
      }
      onUpdate(result.locations);
      onNotice?.(`${label} 저장 완료`);
      clearDraft(); onClose();
    } catch (e) {
      if (['VERSION_CONFLICT', 'CELL_CONFLICT', 'CELL_REMOVED'].includes(e.code)) {
        setConflict(true); setError(e.code === 'CELL_REMOVED' ? '편집 중인 칸이 제거되었습니다. 입력은 유지되며 저장은 차단되었습니다. 내용을 확인하고 다른 칸에 다시 등록하세요.' : '다른 사용자가 이 칸을 먼저 수정했습니다. 입력 내용은 유지되었습니다. 최신 내용을 불러와 비교 후 다시 입력하세요. 덮어쓰기는 차단되었습니다.');
      } else setError(e.message || '저장하지 못했습니다. 네트워크 연결을 확인한 후 다시 시도하세요.');
    } finally { busyRef.current = false; setBusy(false); }
  }

  return <><dialog ref={dialog} className="editor-dialog" aria-labelledby="editor-title" onCancel={e => { e.preventDefault(); close(); }}>
    <form onSubmit={save}>
      <div className="dialog-heading"><div><p className="eyebrow">{structure ? '선반 관리' : '재고 편집'}</p><h2 id="editor-title">{label}</h2></div><button className="button subtle" type="button" onClick={close} disabled={busy} aria-label="편집 창 닫기">닫기</button></div>
      <div className="dialog-body" aria-busy={busy}>
        {recovered && <p className="draft-banner" role="status">저장하지 않은 입력을 복구했습니다. 현재 재고와 충돌하는 변경은 저장 시 차단됩니다.</p>}
        {draftError && <p className="error-banner" role="alert">{draftError}</p>}
        {error && <div className="error-banner" role="alert">{error}</div>}
        {conflict && <button type="button" className="button" disabled={busy} onClick={reload}>입력을 버리고 최신 내용 불러오기</button>}
        <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}>
          {structure ? <div className="structure-form"><p>재고가 있는 칸을 제거하는 축소는 허용되지 않습니다.</p>{[['rows', '단 수'], ['cols', '칸 수']].map(([field, text]) => <label className="field" key={field}>{text}<input type="number" disabled={field === 'rows'} min="1" max={field === 'rows' ? 2 : 20} step="1" required value={dimensions[field]} onChange={e => { dirty.current = true; setDimensions({ ...dimensions, [field]: e.target.value }); }} /></label>)}</div> : <>
            <div className="movement-form">
              <label className="field">작업 유형<select value={type} onChange={event => { dirty.current = true; setType(event.target.value); }}>{Object.entries(operations).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>
              <label className="field">작업 사유 <span className="muted">필수 · 최대 500자</span><textarea required maxLength={500} value={reason} placeholder="예: 납품 입고, 주문 출고, 파손 폐기, 실사 수량 정정" onChange={event => { dirty.current = true; setReason(event.target.value); }} /></label>
            </div>
            <p className="muted">수량은 작업 후 남을 수량을 입력하세요. 품목·로트·유통기한 변경은 재고정정을 사용하세요. 빈 행은 저장 시 정리됩니다.</p>
            {!productsReady && <p className={productError ? 'error-banner' : 'muted'} role={productError ? 'alert' : 'status'}>{productError || '등록 품목 목록을 불러오는 중… 입력 내용은 유지됩니다.'}</p>}
            <button type="button" className="button subtle" onClick={onRefreshProducts}>품목 목록 새로고침</button>
            <div className="edit-rows">{rows.map((row, index) => <div className="edit-row" key={row.rowId}>
              <p className="row-number">제품 {index + 1}</p>
              <ProductSelect row={row} index={index} products={products} onChange={code => edit(index, 'code', code)} />
              <label className="field">수량<input aria-label={`제품 ${index + 1} 수량`} type="number" min="0" max="1000000000" step="1" value={row.qty} onChange={e => edit(index, 'qty', e.target.value)} /></label>
              <label className="field">기준수량<input aria-label={`제품 ${index + 1} 기준수량`} type="number" min="0" max="1000000000" step="1" value={row.threshold} onChange={e => edit(index, 'threshold', e.target.value)} /></label>
              <label className="field">로트번호<input aria-label={`제품 ${index + 1} 로트번호`} maxLength="80" value={row.lot} onChange={e => edit(index, 'lot', e.target.value)} /></label>
              <label className="field">유통기한<input aria-label={`제품 ${index + 1} 유통기한`} type="date" value={row.expiry} onChange={e => edit(index, 'expiry', e.target.value)} /></label>
              <button type="button" className="button subtle danger row-remove" aria-label={`제품 ${index + 1} 제거`} onClick={() => remove(index)}>제거</button>
            </div>)}</div>
            <button type="button" className="button" disabled={rows.length >= 100} onClick={() => { dirty.current = true; setRows([...rows, blank()]); }}>＋ 제품 행 추가</button>
            <div className="movement-summary" aria-live="polite"><h3>수량 변경 미리보기</h3>{stockChanges(baseItems, rows.filter(row => row.code && Number.isFinite(Number(row.qty)))).map(change => <p key={change.key}>{change.name} · {change.lot || '로트 없음'}{change.expiry ? ` · ${change.expiry}` : ''}: <strong>{change.before} → {change.after}</strong> ({change.delta > 0 ? '+' : ''}{change.delta})</p>)}<p className="muted">입고는 증가, 출고·폐기는 감소만 허용합니다. 재고정정은 수량과 정보를 함께 수정할 수 있습니다.</p></div>
          </>}
        </fieldset>
      </div>
      <div className="dialog-footer"><span className="muted">{busy ? '저장 처리 중…' : structure ? '선반 구조 변경이 이력에 기록됩니다.' : '작업 유형·사유·수량 변경이 이력에 기록됩니다.'}</span><button className="button" type="button" disabled={busy} onClick={close}>취소</button><button className="button primary" type="submit" disabled={busy || conflict || (!structure && !productsReady)}>{busy ? '저장 중…' : '변경사항 저장'}</button></div>
    </form>
  </dialog>{confirmation && <Confirmation key={confirmation.message} message={confirmation.message} onAnswer={answer => { setConfirmation(null); confirmation.resolve(answer); }} />}</>;
}

export default function Inventory({ locations, user, onUpdate, onMap, api, selectedId, onNotice, onLeaveGuardChange }) {
  const [query, setQuery] = useState('');
  const [showEmpty, setShowEmpty] = useState(true);
  const [lowOnly, setLowOnly] = useState(false);
  const [editor, setEditor] = useState(null);
  const [recovery, setRecovery] = useState(() => readStoredDraft(user));
  const [productState, setProductState] = useState({ products: [], loading: true, error: '' });
  const [productRefresh, setProductRefresh] = useState(0);
  const cards = useRef(new Map());
  const groups = useMemo(() => aggregate(locations), [locations]);
  const lowKeys = useMemo(() => new Set(groups.filter(g => g.low).map(g => g.key)), [groups]);
  const visible = filterLocations(locations, { query, showEmpty, lowOnly });
  const matches = visible.flatMap(itemsAt).filter(item => matchesItem(item, query, lowOnly ? lowKeys : null)).length;
  const filtered = Boolean(query.trim()) || lowOnly;

  useEffect(() => {
    let active = true;
    setProductState(current => ({ ...current, loading: true, error: '' }));
    api('/api/products').then(result => { if (active) setProductState({ products: result.products, loading: false, error: '' }); }).catch(error => { if (active) setProductState({ products: [], loading: false, error: error.message }); });
    return () => { active = false; };
  }, [api, user.id, productRefresh]);

  function refreshProducts() {
    setProductState(current => ({ ...current, loading: true, error: '' }));
    setProductRefresh(value => value + 1);
  }

  function openEditor(location, cellKey, structure = false) {
    if (recovery.draft) return;
    if (!structure) refreshProducts();
    setEditor({ location, cellKey, structure });
  }

  function recover() {
    const draft = recovery.draft;
    const location = locations.find(item => item.id === draft.locationId);
    if (!location || !Object.hasOwn(location.cells, draft.cellKey)) {
      setRecovery(current => ({ ...current, warning: '임시 입력의 위치 또는 칸이 삭제되었습니다. 아래 입력 내용을 복사한 뒤 임시 입력을 버리고 다른 칸에 다시 등록하세요.' }));
      return;
    }
    if (!draft.structure) refreshProducts();
    setEditor({ location, cellKey: draft.cellKey, structure: draft.structure, recovered: draft });
    setRecovery({ draft: null, warning: '' });
  }

  function discardRecovery() {
    try { sessionStorage.removeItem(draftKey(user)); } catch { /* Storage may be disabled. */ }
    setRecovery({ draft: null, warning: '' });
  }

  useEffect(() => {
    if (!selectedId) return;
    setQuery(''); setShowEmpty(true); setLowOnly(false);
    const timeout = setTimeout(() => {
      const card = cards.current.get(selectedId);
      card?.scrollIntoView({ block: 'center' }); card?.focus({ preventScroll: true });
      const selected = locations.find(location => location.id === selectedId);
      if (selected?.kind === 'pallet' && !recovery.draft) openEditor(selected, '1-1');
    }, 0);
    return () => clearTimeout(timeout);
  }, [selectedId]);

  return <section className="inventory-view" aria-label="위치별 재고 현황">
    {recovery.warning && <p className="draft-banner" role="status">{recovery.warning}</p>}
    {recovery.draft && <div className="draft-banner"><p>저장하지 않은 입력이 있습니다. {locations.find(location => location.id === recovery.draft.locationId)?.label || recovery.draft.locationId} · {recovery.draft.cellKey.replace('-', '단 ')}칸</p><p>이 계정의 입력만 이 탭에 최대 8시간 보관합니다. 로그아웃하면 삭제됩니다.</p><button type="button" className="button primary" onClick={recover}>임시 입력 복구</button><button type="button" className="button" onClick={discardRecovery}>임시 입력 버리기</button><details><summary>임시 입력 내용 확인</summary>{recovery.draft.rows.map((row, index) => <p key={index}>{row.code} · {row.name} · {row.lot || '로트 없음'} · 수량 {row.qty} · 기준 {row.threshold} · {row.expiry || '유통기한 없음'}</p>)}<p>사유: {recovery.draft.reason || '미입력'}</p></details></div>}
    {productState.loading && <p role="status">등록 품목을 불러오는 중…</p>}
    {productState.error && <div className="error-banner product-load-error" role="alert">{productState.error}</div>}
    {!productState.loading && !productState.error && !productState.products.length && <p className="notice-banner">등록된 품목이 없습니다. 2단계 관리자가 품목 관리에서 먼저 품목코드와 이름을 등록해야 합니다.</p>}
    <div className="inventory-toolbar">
      <label className="search-field"><span>품목코드·제품·로트 검색</span><input type="search" placeholder="품목코드, 제품명 또는 로트번호 입력" value={query} onChange={e => setQuery(e.target.value)} /></label>
      <label className="filter-check"><input type="checkbox" checked={showEmpty} onChange={e => setShowEmpty(e.target.checked)} />빈 위치도 보기</label>
      <label className="filter-check"><input type="checkbox" checked={lowOnly} onChange={e => setLowOnly(e.target.checked)} />재고 부족만 보기</label>
      <button type="button" className="button subtle" disabled={productState.loading} onClick={refreshProducts}>품목 목록 새로고침</button>
    </div>
    <div className="results-summary" aria-live="polite"><span><strong>{visible.length}</strong>개 위치 · 일치하는 제품 <strong>{matches}</strong>건</span><span>전체 부족 그룹 {lowKeys.size}건 · 총수량 ≤ 기준수량</span></div>
    {!visible.length && <div className="empty-state"><h3>{locations.length ? '조건에 맞는 재고가 없습니다' : '등록된 위치가 없습니다'}</h3><p>{locations.length ? '검색어나 필터를 변경하세요. 새 재고는 빈 위치에서 등록할 수 있습니다.' : '관리자에게 창고 도면 초기 설정을 요청하세요.'}</p>{locations.length > 0 && <button type="button" className="button" onClick={() => { setQuery(''); setShowEmpty(true); setLowOnly(false); }}>검색·필터 초기화</button>}</div>}
    <div className="inventory-grid">{visible.map(location => {
      return <article key={location.id} ref={node => { if (node) cards.current.set(location.id, node); else cards.current.delete(location.id); }} tabIndex="-1" className={`inventory-card${location.cols > 4 ? ' wide-card' : ''}${selectedId === location.id ? ' selected' : ''}`} data-zone={location.zone} aria-label={`${location.label} 재고`}>
      <div className="location-heading"><div><p className="eyebrow">{zones[location.zone]} · {location.id}</p><h3>{location.label}</h3><span className="muted">등록 제품 {itemsAt(location).length}건{location.kind === 'shelf' && ` · ${location.rows}단 ${location.cols}칸`}</span></div><div className="location-actions"><button type="button" className="button subtle" onClick={() => onMap(location.id)}>도면에서 보기 ↗</button>{user.role === 2 && location.kind === 'shelf' && <button type="button" className="button subtle" disabled={Boolean(recovery.draft)} onClick={() => openEditor(location, '1-1', true)}>구조 변경</button>}</div></div>
      {filtered && <p className="muted">조건에 일치하는 제품만 표시합니다. 편집 시 해당 칸의 모든 제품을 불러옵니다.</p>}
      <div className="shelf-scroll"><div className={location.kind === 'shelf' ? 'shelf-grid' : 'pallet-list'} style={location.kind === 'shelf' ? { gridTemplateColumns: `repeat(${location.cols}, minmax(220px, 1fr))`, gridTemplateRows: `repeat(${location.rows}, auto)` } : undefined}>
        {Object.entries(location.cells).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).map(([key, allItems]) => [key, filtered ? allItems.filter(item => matchesItem(item, query, lowOnly ? lowKeys : null)) : allItems]).filter(([, items]) => !filtered || items.length).map(([key, items]) => <button type="button" className={`inventory-cell${!items.length ? ' empty-cell' : ''}${filtered ? ' matching-cell' : ''}`} key={key} style={location.kind === 'shelf' ? { gridRow: Number(key.split('-')[0]), gridColumn: Number(key.split('-')[1]) } : undefined} disabled={Boolean(recovery.draft)} onClick={() => openEditor(location, key)} aria-label={`${location.label} ${location.kind === 'shelf' ? key.replace('-', '단 ') + '칸' : '제품 목록'} 편집, ${filtered ? '일치하는 ' : ''}제품 ${items.length}개`}>
          <span className="cell-label">{location.kind === 'shelf' ? key.replace('-', '단 ') + '칸' : '팔레트 제품 목록'}<span aria-hidden="true">＋</span></span>
          <span className="cell-items">{items.length ? items.map((item, i) => <ItemDetails key={i} item={item} low={lowKeys.has(groupKey(item))} />) : <span>비어 있음 · 제품 등록</span>}</span>
        </button>)}
      </div></div>
    </article>; })}</div>
    {editor && <Editor {...editor} user={user} api={api} products={productState.products} productsReady={!productState.loading && !productState.error} productError={productState.error} onRefreshProducts={refreshProducts} onUpdate={onUpdate} onNotice={onNotice} onLeaveGuardChange={onLeaveGuardChange} onClose={() => setEditor(null)} />}
  </section>;
}
