import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Inventory from './Inventory.jsx';
import FloorPlan from './FloorPlan.jsx';
import Operations from './Operations.jsx';
import { aggregate, itemsAt } from './domain.mjs';
import {firebaseFetch as fetch} from './firebase-api.mjs';

const dateTime = value => new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value));
const deadline = (value, duration) => value ? (typeof value === 'number' ? value : Date.parse(value)) : Date.now() + duration;
function Mark() { return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 27V9l11-5 11 5v18H5Z" stroke="currentColor" strokeWidth="2"/><path d="M10 27V13h12v14M10 18h12M16 13v14M10 23h12" stroke="currentColor" strokeWidth="1.5"/></svg>; }
function auditSummary(value) {
  if (typeof value === 'string') return value;
  if (!value) return '없음';
  if ('itemCount' in value) {
    const names = { name: '제품명', qty: '수량', threshold: '기준수량', lot: '로트번호', expiry: '유통기한', rows: '단', cols: '칸', items: '제품 목록' };
    const changed = value.changedFields?.map(field => names[field] || field).join(', ');
    return `${value.rows}단 × ${value.cols}칸 · 사용 ${value.occupiedCells}칸 · 제품 ${value.itemCount}개 · 버전 ${value.version}${changed ? ` · 변경 항목: ${changed}` : ''}`;
  }
  const cells = value.cells || value;
  const entries = Object.values(cells).flat().filter(i => i && typeof i === 'object' && 'name' in i);
  if (entries.length) return entries.map(i => `${i.name} ${i.qty}개${i.lot ? ` (${i.lot})` : ''}`).join(', ');
  return JSON.stringify(value);
}
export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [notice, setNotice] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [tab, setTab] = useState('map');
  const [selectedId, setSelectedId] = useState(null);
  const [audit, setAudit] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const sessionRef = useRef(null);
  const epoch = useRef(0);
  const leaveGuard = useRef(null);
  const onLeaveGuardChange = useCallback(guard => { leaveGuard.current = guard; }, []);
  const revision = useRef(null);
  const needsRefresh = useRef(true);
  const deadlines = useRef({ idle: Infinity, absolute: Infinity });
  const clearSession = useCallback((message = '') => {
    try { for (const key of Object.keys(sessionStorage)) if (key.startsWith('warehouse:draft:')) sessionStorage.removeItem(key); } catch {}
    leaveGuard.current = null;
    epoch.current += 1; sessionRef.current = null; revision.current = null; needsRefresh.current = true;
    setSession(null); setLocations([]); setAudit([]); setSelectedId(null); setNotice('');
    setDataError(''); setAuditError(''); setTab('map'); setAuthMessage(message);
  }, []);
  const api = useCallback(async (path, options = {}) => {
    const requestEpoch = epoch.current;
    const headers = { ...options.headers };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (sessionRef.current?.csrfToken) headers['X-CSRF-Token'] = sessionRef.current.csrfToken;
    let response;
    try { response = await fetch(path, { credentials: 'same-origin', ...options, headers, body: typeof options.body === 'object' ? JSON.stringify(options.body) : options.body }); }
    catch { throw Object.assign(new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해 주세요.'), { code: 'NETWORK_ERROR', status: 0 }); }
    const body = await response.json().catch(() => ({ error: '서버 응답을 읽을 수 없습니다.' }));
    if (requestEpoch !== epoch.current) throw Object.assign(new Error('종료된 세션의 요청입니다.'), { status: 401, code: 'STALE_SESSION' });
    if (!response.ok) {
      if ((response.status === 401 || response.status === 403) && path !== '/api/login' && path !== '/api/session') clearSession(response.status === 403 ? '권한을 확인할 수 없어 내부 데이터를 비웠습니다. 다시 로그인해 주세요.' : '세션이 만료되었습니다. 다시 로그인해 주세요.');
      throw Object.assign(new Error(body.error || '요청을 처리하지 못했습니다.'), body, { status: response.status });
    }
    return body;
  }, [clearSession]);
  const establish = useCallback(data => {
    sessionRef.current = data;
    deadlines.current = { idle: deadline(data.idleExpiresAt, data.idleTimeoutMs), absolute: deadline(data.expiresAt, data.absoluteTimeoutMs) };
    setSession(data); setAuthMessage('');
  }, []);
  const updateLocations = useCallback(next => setLocations(previous => next.map(item => {
    const existing = previous.find(l => l.id === item.id);
    return existing && existing.version > item.version ? existing : item;
  })), []);
  const loadLocations = useCallback(async () => {
    setLoading(true); setDataError('');
    try { const data = await api('/api/locations'); updateLocations(data.locations); needsRefresh.current = false; setDataError(''); }
    catch (error) { needsRefresh.current = true; if (error.status !== 401 && error.status !== 403) setDataError(error.message); }
    finally { setLoading(false); }
  }, [api, updateLocations]);
  useEffect(() => { let live = true; api('/api/session').then(data => { if (live) establish(data); }).catch(error => { if (!live) return; if (error.status === 401 || error.status === 403) clearSession(); else setAuthMessage(error.message); }).finally(() => { if (live) setReady(true); }); return () => { live = false; }; }, [api, establish, clearSession]);
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);
  useEffect(() => { if (session?.user.id) loadLocations(); }, [session?.user.id, loadLocations]);
  useEffect(() => {
    if (!session?.user.id) return;
    let stopped = false, busy = false;
    const poll = async () => {
      if (busy || stopped || document.hidden) return;
      busy = true;
      try {
        const next = await api('/api/revision');
        if (!stopped && (revision.current !== next.revision || needsRefresh.current)) {
          const data = await api('/api/locations');
          if (!stopped) { updateLocations(data.locations); needsRefresh.current = false; setDataError(''); if (revision.current !== null) setNotice('최신 재고 변경사항을 반영했습니다.'); }
        }
        if (!stopped) revision.current = next.revision;
      } catch (error) { needsRefresh.current = true; if (!stopped && error.status !== 401 && error.status !== 403) setDataError(error.message); }
      finally { busy = false; }
    };
    poll(); const timer = setInterval(poll, 5000);
    return () => { stopped = true; clearInterval(timer); };
  }, [session?.user.id, api, updateLocations]);
  useEffect(() => {
    if (!session?.user.id) return;
    let lastSent = 0, pending = false, stopped = false;
    const expire = () => {
      if (Date.now() >= Math.min(deadlines.current.idle, deadlines.current.absolute)) {
        api('/api/logout', { method: 'POST' }).catch(() => {});
        clearSession('활동이 없거나 최대 로그인 시간이 지나 자동 로그아웃되었습니다.');
        return true;
      }
      return false;
    };
    const activity = event => {
      if (!event.isTrusted || expire() || pending || Date.now() - lastSent < 15000) return;
      pending = true; lastSent = Date.now();
      api('/api/activity', { method: 'POST' }).then(data => {
        if (!stopped) deadlines.current = { idle: deadline(data.idleExpiresAt, sessionRef.current.idleTimeoutMs), absolute: deadline(data.expiresAt, sessionRef.current.absoluteTimeoutMs) };
      }).catch(error => { if (!stopped && error.status !== 401 && error.status !== 403) setDataError(error.message); }).finally(() => { pending = false; });
    };
    const events = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'];
    events.forEach(type => window.addEventListener(type, activity, { passive: true, capture: true }));
    const timer = setInterval(expire, 1000);
    return () => { stopped = true; clearInterval(timer); events.forEach(type => window.removeEventListener(type, activity, true)); };
  }, [session?.user.id, api, clearSession]);
  const login = async event => {
    event.preventDefault(); setLoggingIn(true); setLoginError('');
    const form = new FormData(event.currentTarget);
    try { const data = await api('/api/login', { method: 'POST', body: { email: form.get('email'), password: form.get('password') } }); establish(data); }
    catch (error) { setLoginError(error.message); }
    finally { setLoggingIn(false); }
  };
  const logout = async () => {
    if (leaveGuard.current && !await leaveGuard.current()) return;
    try { await api('/api/logout', { method: 'POST' }); clearSession('안전하게 로그아웃되었습니다.'); }
    catch (error) { clearSession('화면의 내부 데이터를 비웠습니다. 서버 로그아웃을 확인하지 못했습니다. 연결을 확인하고 브라우저를 닫아 주세요.'); }
  };
  const showAudit = async () => {
    setTab('audit'); setAuditLoading(true); setAuditError('');
    try { const data = await api('/api/audit'); setAudit(data.entries); }
    catch (error) { if (error.status !== 401 && error.status !== 403) setAuditError(error.message); }
    finally { setAuditLoading(false); }
  };
  const summaries = useMemo(() => ({ occupied: locations.filter(l => itemsAt(l).length).length, low: aggregate(locations).filter(g => g.low).length }), [locations]);
  const navigate = async target => {
    if (target === tab) return true;
    if (leaveGuard.current && !await leaveGuard.current()) return false;
    leaveGuard.current = null;
    if (target === 'audit') showAudit(); else setTab(target);
    return true;
  };
  const select = async (id, target) => { if (await navigate(target)) setSelectedId(id); };
  const tabs = [{ id: 'map', label: '구획도' }, { id: 'inventory', label: '재고 현황' }, { id: 'ledger', label: '입출고 기록' }, ...(session?.user.role === 2 ? [{ id: 'management', label: '운영 관리' }, { id: 'audit', label: '변경 이력' }] : [])];
  return <>
    <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
    <header className="app-header"><div className="header-inner"><div className="brand"><span className="brand-mark"><Mark/></span><div><h1>지하 구획도</h1><p>지하 창고 재고 관리 도면</p></div></div><div className="header-actions"><button className="button subtle theme-button" onClick={() => setDark(!dark)} aria-label={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}>{dark ? '☀' : '☾'}<span>{dark ? '라이트' : '다크'} 모드</span></button>{session && <><span className="user-label">{session.user.name || session.user.email}<small>{session.user.role}단계 관리자</small></span><button className="button subtle" onClick={logout}>로그아웃</button></>}</div></div></header>
    <main id="main-content" className={session ? 'workspace' : 'login-layout'}>
      {!ready ? <div className="loading-state" role="status">로그인 상태를 확인하고 있습니다…</div> : !session ? <section className="login-card" aria-labelledby="login-heading"><div className="login-symbol"><Mark/></div><span className="eyebrow">창고 관리 시스템</span><h2 id="login-heading">업무 공간에 로그인</h2><p className="login-description">구획별 위치와 재고를 한곳에서 관리하세요.<br/>인가된 관리자만 접근할 수 있습니다.</p>{authMessage && <p className="warning-banner" role="status">{authMessage}</p>}<form onSubmit={login}><label className="field">이메일<input name="email" type="email" autoComplete="username" required maxLength={254} placeholder="이메일 주소를 입력하세요"/></label><label className="field">비밀번호<input name="password" type="password" autoComplete="current-password" required maxLength={256} placeholder="비밀번호를 입력하세요"/></label>{loginError && <p className="error-banner" role="alert">{loginError}</p>}<button className="button primary login-submit" disabled={loggingIn}>{loggingIn ? '로그인 확인 중…' : '로그인' }<span aria-hidden="true">→</span></button></form><div className="login-help">계정 발급 또는 비밀번호 재설정은 창고 운영 관리자에게 문의하세요.</div><div className="login-security"><span aria-hidden="true">▣</span> 활동이 없으면 자동으로 로그아웃됩니다.</div></section> : <>
        <div className="workspace-intro"><div><span className="eyebrow">창고 운영 현황</span></div><span className={`connection-status${dataError ? ' disconnected' : ''}`} role="status"><i/>{dataError ? '연결 확인 필요' : '5초마다 변경 확인'}</span></div>
        <div className="summary-strip" aria-label="재고 요약"><div><span>전체 위치</span><strong>{locations.length}<small>곳</small></strong></div><div><span>등록된 위치</span><strong>{summaries.occupied}<small>곳</small></strong></div><div className={summaries.low ? 'shortage-summary' : ''}><span>재고 부족</span><strong>{summaries.low}<small>그룹</small></strong></div><div className="summary-caption">위치를 선택해 재고를 확인하고<br/>등록·수정할 수 있습니다.</div></div>
        <div className="tabs" role="tablist" aria-label="창고 화면">{tabs.map((item,index) => <button key={item.id} role="tab" id={`tab-${item.id}`} aria-controls={`panel-${item.id}`} aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} onClick={() => navigate(item.id)} onKeyDown={async e => { if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return; e.preventDefault(); const next = e.key === 'Home' ? tabs[0] : e.key === 'End' ? tabs.at(-1) : tabs[(index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; if (await navigate(next.id)) document.getElementById(`tab-${next.id}`)?.focus(); }}>{item.label}{item.id === 'inventory' && <span className="tab-count">{locations.length}</span>}</button>)}</div>
        {notice && <div className="notice-banner" role="status">{typeof notice === 'string' ? notice : notice.message || '저장했습니다.'}<button className="button subtle" aria-label="알림 닫기" onClick={() => setNotice('')}>×</button></div>}
        {dataError && <div className="error-banner" role="alert">{dataError}<button className="button" onClick={loadLocations}>다시 불러오기</button></div>}
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {loading && !locations.length ? <div className="loading-state" role="status">창고 위치와 재고를 불러오고 있습니다…</div> : tab === 'map' ? <FloorPlan locations={locations} selectedId={selectedId} onSelect={setSelectedId} onInventory={id => select(id,'inventory')}/> : tab === 'inventory' ? <Inventory locations={locations} user={session.user} onUpdate={updateLocations} onMap={id => select(id,'map')} api={api} selectedId={selectedId} onNotice={setNotice} onLeaveGuardChange={onLeaveGuardChange}/> : ['ledger', 'management'].includes(tab) ? <Operations key={tab} mode={tab} user={session.user} api={api} locations={locations} onUpdate={updateLocations} onNotice={setNotice} onSessionReset={clearSession} onMap={id => select(id, 'map')}/> : <section className="audit-panel"><div className="panel-heading"><div><h2>변경 이력</h2><p>실제 저장된 재고와 위치 구조의 변경 기록입니다.</p></div><button className="button" onClick={showAudit} disabled={auditLoading}>새로고침</button></div>{auditError && <p className="error-banner" role="alert">{auditError}</p>}{auditLoading ? <div className="loading-state" role="status">변경 이력을 불러오고 있습니다…</div> : !audit.length ? <div className="empty-state"><h3>아직 변경 이력이 없습니다</h3><p>재고 또는 선반 구조를 저장하면 기록이 표시됩니다.</p></div> : <div className="audit-scroll"><table><thead><tr><th>변경 시간</th><th>관리자</th><th>위치 / 작업</th><th>변경 내용</th></tr></thead><tbody>{audit.map(entry => <tr key={entry.id}><td>{dateTime(entry.createdAt)}</td><td>{typeof entry.user === 'object' ? entry.user.name || entry.user.email || entry.user.id : entry.user}</td><td>{locations.find(l => l.id === entry.locationId)?.label || entry.locationId}<small>{entry.action === 'undo' ? '재고 되돌리기' : entry.action === 'restore' ? '백업 복원' : entry.action === 'plan_update' ? '도면 업데이트' : entry.action === 'structure' ? '구조 변경' : entry.action === 'threshold_sync' ? '기준수량 동기화' : '재고 저장'}</small></td><td><details><summary>변경 전·후 보기</summary><p><b>변경 전</b> {auditSummary(entry.before)}</p><p><b>변경 후</b> {auditSummary(entry.after)}</p></details></td></tr>)}</tbody></table></div>}</section>}
        </div><footer className="workspace-footer"><span>지하 구획도 · 창고 재고 관리</span><span>수량은 동일 제품코드·로트 전체 합계 기준</span></footer>
      </>}
    </main>
  </>;
}
