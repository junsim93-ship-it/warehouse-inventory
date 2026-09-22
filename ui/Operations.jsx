import React, { useEffect, useRef, useState } from 'react';

const types = { receipt: '입고', issue: '출고', discard: '폐기', adjustment: '재고 정정', undo: '되돌리기', restore: '백업 복원', threshold_sync: '기준수량 동기화' };
const when = value => new Date(value).toLocaleString('ko-KR');
const who = user => typeof user === 'object' ? user.name || user.email : user;
function ItemList({ items }) {
  return items?.length ? <ul>{items.map((item, i) => <li key={i}><strong>{item.name}</strong> · {item.code} · {item.lot || '로트 없음'} · <b>{item.qty.toLocaleString()}개</b><small>기준 {item.threshold} · 유통기한 {item.expiry || '미지정'}</small></li>)}</ul> : <p className="muted">재고 없음</p>;
}
function Confirm({ action, onClose, onDone }) {
  const ref = useRef(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const opener = document.activeElement; const dialog = ref.current; dialog.showModal(); return () => { dialog.close(); if (opener?.isConnected) opener.focus(); }; }, []);
  return <dialog ref={ref} className="editor-dialog ops-confirm" aria-labelledby="ops-confirm-title" onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}><form onSubmit={async e => { e.preventDefault(); if (busy) return; setBusy(true); setError(''); try { await action.run(reason.trim()); onDone(); } catch (error) { setError(error.message); } finally { setBusy(false); } }}>
    <div className="dialog-heading"><h2 id="ops-confirm-title">{action.title}</h2><button type="button" className="button subtle" disabled={busy} onClick={onClose}>닫기</button></div>
    <div className="dialog-body"><p>{action.description}</p>{action.reason && <label className="field">처리 사유<textarea required maxLength="300" value={reason} onChange={e => setReason(e.target.value)} disabled={busy}/></label>}{error && <p className="ops-error" role="alert">{error}</p>}</div>
    <div className="dialog-footer"><button autoFocus type="button" className="button" disabled={busy} onClick={onClose}>취소</button><button className="button primary" disabled={busy || (action.reason && !reason.trim())}>{busy ? '처리 중…' : action.title}</button></div>
  </form></dialog>;
}

export default function Operations({ mode, user, api, locations, onUpdate, onNotice, onSessionReset, onMap }) {
  const [section, setSection] = useState('products');
  const active = mode === 'ledger' ? 'ledger' : section;
  const activeRef = useRef(active);
  activeRef.current = active;
  const [data, setData] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backupStatus, setBackupStatus] = useState(null);
  const [action, setAction] = useState(null);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [account, setAccount] = useState({ email: '', name: '', role: 1, password: '' });
  const [product, setProduct] = useState({ code: '', name: '' });
  const [busy, setBusy] = useState(false);
  const epoch = useRef(0);
  const labels = { ledger: '입출고 기록', products: '제품 관리', backups: '백업·복원', users: '계정 관리' };
  async function load(older = false) {
    if (activeRef.current !== active) return;
    const ticket = ++epoch.current;
    setLoading(true); setError('');
    try {
      const result = await api(`/api/${active}${older && cursor ? `?before=${encodeURIComponent(cursor)}` : ''}`);
      if (ticket !== epoch.current) return;
      if (active === 'backups') setBackupStatus({ error: result.backupError, lastSuccess: result.lastSuccess });
      const rows = active === 'ledger' ? result.entries : result[active];
      setData(previous => older ? [...previous, ...rows] : rows); setCursor(result.nextCursor || null);
    } catch (error) { if (ticket === epoch.current) setError(error.message); }
    finally { if (ticket === epoch.current) setLoading(false); }
  }
  useEffect(() => { setData([]); setQuery(''); setEditing(null); setAccount({ email: '', name: '', role: 1, password: '' }); load(); return () => { epoch.current++; }; }, [active]);
  const changed = result => { if (result?.locations) onUpdate(result.locations); };
  const done = () => { setAction(null); load(); };
  const filtered = data.filter(row => !query.trim() || JSON.stringify(row).toLocaleLowerCase('ko').includes(query.trim().toLocaleLowerCase('ko')));
  function saveAccount(event) {
    event.preventDefault();
    const target = editing;
    const body = target ? { name: account.name, role: Number(account.role), ...(account.password ? { password: account.password } : {}) } : { ...account, role: Number(account.role) };
    setAction({ title: target ? '계정 변경' : '계정 생성', description: `${account.name} (${account.email}) · ${Number(account.role) === 0 ? '사용 중지' : `${account.role}단계 관리자`}${account.password && target ? ' · 비밀번호 재설정' : ''}. 변경된 계정의 기존 로그인은 종료됩니다.`, run: async () => {
      await api(target ? `/api/users/${encodeURIComponent(target.id)}` : '/api/users', { method: target ? 'PUT' : 'POST', body });
      setEditing(null); setAccount({ email: '', name: '', role: 1, password: '' }); onNotice('계정 설정을 저장했습니다.');
      if (target?.id === user.id) onSessionReset('계정 설정이 변경되었습니다. 다시 로그인해 주세요.');
    } });
  }
  async function addProduct(event) {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    try { await api('/api/products', { method: 'POST', body: { code: product.code.trim(), name: product.name.trim() } }); setProduct({ code: '', name: '' }); await load(); onNotice('제품을 등록했습니다. 재고 편집에서 선택할 수 있습니다.'); }
    catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <section className="ops-panel" aria-labelledby="ops-heading">
    {mode !== 'ledger' && <div className="ops-tabs" aria-label="관리 항목">{['products', 'backups', 'users'].map(key => <button type="button" className="button" aria-pressed={section === key} onClick={() => setSection(key)} key={key}>{labels[key]}</button>)}</div>}
    <div className="panel-heading"><div><h2 id="ops-heading">{labels[active]}</h2><p>{active === 'ledger' ? '입고부터 정정까지, 제품별 수량과 사유를 확인하세요.' : active === 'products' ? '제품코드로 같은 제품을 일관되게 관리합니다.' : active === 'backups' ? '자동 백업과 수동 백업으로 재고를 보관하고 복원합니다.' : '직원별 계정과 접근 권한을 관리합니다.'}</p></div><button className="button" disabled={loading} onClick={() => load()}>새로고침</button></div>
    {error && <p className="ops-error" role="alert">{error}</p>}
    {active === 'products' && <form className="ops-form" onSubmit={addProduct}><label className="field">제품코드<input required maxLength="40" pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,39}" placeholder="예: PART-001" value={product.code} onChange={e => setProduct({ ...product, code: e.target.value })}/></label><label className="field">제품명<input required maxLength="120" placeholder="공식 제품명" value={product.name} onChange={e => setProduct({ ...product, name: e.target.value })}/></label><button className="button primary" disabled={busy}>{busy ? '등록 중…' : '제품 등록'}</button></form>}
    {active === 'users' && <form className="ops-form" onSubmit={saveAccount}>
      <label className="field">이메일<input required disabled={Boolean(editing)} type="email" maxLength="254" autoComplete="off" value={account.email} onChange={e => setAccount({ ...account, email: e.target.value })}/></label>
      <label className="field">이름<input required maxLength="80" value={account.name} onChange={e => setAccount({ ...account, name: e.target.value })}/></label>
      <label className="field">권한<select value={account.role} onChange={e => setAccount({ ...account, role: Number(e.target.value) })}><option value="1">1단계 · 재고 담당</option><option value="2">2단계 · 운영 관리자</option>{editing && editing.id !== user.id && <option value="0">사용 중지</option>}</select></label>
      <label className="field">{editing ? '새 비밀번호 (변경할 때만 입력)' : '초기 비밀번호'}<input type="password" autoComplete="new-password" required={!editing} minLength="12" maxLength="256" value={account.password} onChange={e => setAccount({ ...account, password: e.target.value })}/></label>
      <div className="ops-actions"><button className="button primary">{editing ? '계정 변경' : '계정 생성'}</button>{editing && <button type="button" className="button" onClick={() => { setEditing(null); setAccount({ email: '', name: '', role: 1, password: '' }); }}>편집 취소</button>}</div>
    </form>}
    {active === 'backups' && backupStatus?.error && <p className="ops-error" role="alert">자동 백업 확인 필요: {backupStatus.error}</p>}
    {active === 'backups' && backupStatus?.lastSuccess && <p className="ops-success">최근 백업 완료: {when(backupStatus.lastSuccess)}</p>}
    {active === 'backups' && <div className="ops-toolbar"><p>복원은 현재 재고 전체에 적용됩니다. 복원 직전 상태도 자동 보관합니다. 내려받은 파일은 별도 장치에 보관하세요.</p><button className="button primary" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await api('/api/backups', { method: 'POST', body: {} }); await load(); onNotice('재고 백업을 만들었습니다.'); } catch (error) { setError(error.message); } finally { setBusy(false); } }}>지금 백업</button></div>}
    <div className="ops-toolbar"><label className="field">{active === 'ledger' ? '불러온 기록에서 검색' : '목록 검색'}<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={active === 'ledger' ? '제품명, 코드, 로트, 사유' : '검색어 입력'}/></label><span className="muted">{filtered.length}건</span></div>
    {loading && !data.length ? <p className="ops-empty" role="status">불러오는 중…</p> : !filtered.length ? <p className="ops-empty">{query ? '검색 결과가 없습니다.' : '아직 등록된 내용이 없습니다.'}</p> : <div className="ops-list">
      {filtered.map(row => active === 'ledger' ? <article className="ops-row" key={row.id}>
        <div className="ops-row-heading"><div><span className={`status-badge ${row.type}`}>{types[row.type] || row.type}</span><h3>{locations.find(l => l.id === row.locationId)?.label || row.locationId || '전체 재고'}{row.cellKey ? ` · ${row.cellKey.replace('-', '단 ')}칸` : ''}</h3><p className="muted">{when(row.createdAt)} · {who(row.user)}</p></div><div className="ops-actions">{row.locationId && <button className="button subtle" onClick={() => onMap(row.locationId)}>도면에서 보기</button>}{user.role === 2 && !row.undone && ['receipt','issue','discard','adjustment'].includes(row.type) && <button className="button" onClick={() => setAction({ title: '이 변경 되돌리기', description: '이 변경과 함께 적용된 기준수량 동기화도 복원됩니다. 이후 변경이 있으면 덮어쓰지 않고 차단합니다.', reason: true, run: async reason => { changed(await api(`/api/ledger/${row.id}/undo`, { method: 'POST', body: { reason } })); onNotice('선택한 변경을 되돌렸습니다.'); } })}>되돌리기</button>}</div></div>
        <p className="ops-reason">{row.reason}</p>{row.undone && <p className="muted">되돌리기 완료</p>}<details><summary>제품별 변경 전·후</summary><div className="ops-detail"><div><h4>변경 전</h4><ItemList items={row.before}/></div><div><h4>변경 후</h4><ItemList items={row.after}/></div></div></details>
      </article> : active === 'products' ? <div className="ops-row ops-inline" key={row.code}><div><h3>{row.name}</h3><p className="muted">{row.code}</p></div></div> : active === 'users' ? <div className="ops-row ops-inline" key={row.id}><div><h3>{row.name}{row.id === user.id ? ' · 나' : ''}</h3><p className="muted">{row.email} · {row.role === 0 ? '사용 중지' : `${row.role}단계 관리자`}</p></div><button className="button" onClick={() => { setEditing(row); setAccount({ email: row.email, name: row.name, role: row.role, password: '' }); }}>계정 편집</button></div> : <div className="ops-row ops-inline" key={row.id}><div><h3>{when(row.createdAt)}</h3><p className="muted">{row.reason} · {row.locationCount}개 위치</p></div><div className="ops-actions"><button className="button" onClick={async () => { setError(''); try { const result = await api(`/api/backups/${row.id}/download`); const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `warehouse-backup-${row.id}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch (error) { setError(error.message); } }}>내려받기</button><button className="button" onClick={async () => { setError(''); try { const current = await api('/api/revision'); setAction({ title: '이 백업으로 복원', description: `${when(row.createdAt)} 시점의 재고 전체로 복원합니다. 이후 입력한 재고는 복원 직전 백업에 보관되며 계정과 이력은 유지됩니다.`, reason: true, run: async reason => { changed(await api(`/api/backups/${row.id}/restore`, { method: 'POST', body: { revision: current.revision, reason } })); onNotice('재고 백업을 복원했습니다.'); } }); } catch (error) { setError(error.message); } }}>복원</button></div></div>)}
    </div>}
    {active === 'ledger' && cursor && <div className="ops-toolbar"><button className="button" disabled={loading} onClick={() => load(true)}>{loading ? '불러오는 중…' : '이전 기록 더 보기'}</button></div>}
    {action && <Confirm action={action} onClose={() => setAction(null)} onDone={done}/>}
  </section>;
}
