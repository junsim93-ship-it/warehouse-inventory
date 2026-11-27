import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Box,
  Layers3,
  GalleryVerticalEnd,
  ScanLine,
  Calculator,
  Map as MapIcon,
  Package,
  Menu,
  LogOut,
  UserRound,
  LockKeyhole,
  Check,
  CalendarDays,
} from 'lucide-react';
import { app, storeOptions } from './firebase-app.js';
import { createLotfolioStore } from './firebase-store.js';
import { Ctx, Modal } from './shared.jsx';
import { Generator, initialLotForm } from './Generator.jsx';
import { Products, ProductEditor, ProductImport } from './Products.jsx';
import { Designs, DesignEditor, DesignViewer } from './Designs.jsx';
import { parseLot, nextSeq } from './lot-engine.mjs';
import { freezeMap } from './design-freeze.mjs';
import { QuickSearch } from './QuickSearch.jsx';
import { Lookup, ProductLookup } from './Lookup.jsx';
import './views.css';
import './workspace.css';

const menu = [
  {
    group: '로트 · 디자인',
    items: [
      ['/', '로트 생성기', ScanLine],
      ['/designs', '디자인 라이브러리', GalleryVerticalEnd],
    ],
  },
  {
    group: '부자재 · 창고',
    items: [
      ['/calculator', '부자재 계산 · 발주', Calculator],
      ['/warehouse', '창고 구획도', MapIcon],
    ],
  },
  { group: '기준 정보', items: [['/products', '제품 마스터', Package]] },
];
const pages = new Map(menu.flatMap((group) => group.items.map((item) => [item[0], item[1]])));
const empty = { products: [], lots: [], designs: [], files: [] };
const dialogs = {
  viewer: DesignViewer,
  design: DesignEditor,
  product: ProductEditor,
  import: ProductImport,
  lookup: Lookup,
  productLookup: ProductLookup,
};
function readPage() {
  const route = location.hash.slice(1);
  return pages.has(route) ? route : location.pathname === '/calculator.html' ? '/calculator' : '/';
}
function Logo() {
  return (
    <span className="brand">
      <span className="brandmark">
        <Layers3 size={24} />
      </span>
      Lotfolio
    </span>
  );
}

function Login({ identity }) {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const denied = !!identity.user;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (denied) await app.auth().signOut();
      else await app.auth().signInWithEmailAndPassword(email.trim(), password);
    } catch (e) {
      setError(
        e.code === 'auth/network-request-failed'
          ? '연결 상태를 확인해 주세요.'
          : '로그인하지 못했습니다. 이메일과 비밀번호를 확인해 주세요.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="workspace-login">
      <div className="login-window">
        <div className="login-brand">
          <Logo />
          <span>패키징 · 창고 워크스페이스</span>
        </div>
        <form className="login-form" onSubmit={submit}>
          <h1>{denied ? '관리자 권한 확인' : '워크스페이스 로그인'}</h1>
          {denied ? (
            <p>
              {identity.error ? '계정 권한을 조회할 수 없습니다.' : '승인된 관리자 계정으로 접속해 주세요.'}{' '}
              {identity.user.email}
            </p>
          ) : (
            <>
              <label>
                이메일
                <input
                  autoFocus
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                비밀번호
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </>
          )}
          {(error || (!denied && identity.error)) && (
            <p className="error" role="alert">
              {error || '로그인 서비스를 사용할 수 없습니다. 연결 상태를 확인해 주세요.'}
            </p>
          )}
          <button className="btn primary" disabled={busy}>
            <LockKeyhole size={16} />
            {denied ? '다른 계정으로 로그인' : busy ? '확인 중…' : '로그인'}
          </button>
          {identity.error && (
            <button type="button" className="btn" onClick={() => location.reload()}>
              다시 연결
            </button>
          )}
        </form>
      </div>
    </main>
  );
}

function FramedPage({ show, frameRef, slug, title }) {
  const [visited, setVisited] = useState(show);
  useEffect(() => {
    if (show) setVisited(true);
  }, [show]);
  if (!visited && !show) return null;
  return (
    <section className="legacy-pane" hidden={!show} aria-label={title}>
      <iframe ref={frameRef} src={'/' + slug + '-frame.html'} title={title} />
    </section>
  );
}

// Warm only the code. Opening the calculator is what starts its inventory subscriptions.
function useCalculatorPrefetch() {
  useEffect(() => {
    const url = document.querySelector('meta[name="calculator-runtime"]')?.content;
    if (!url || readPage() === '/calculator' || navigator.connection?.saveData) return;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'script';
    link.crossOrigin = 'anonymous';
    link.href = url;
    const warm = () => document.head.append(link);
    const idle = typeof window.requestIdleCallback === 'function';
    const id = idle ? window.requestIdleCallback(warm, {timeout: 2000}) : setTimeout(warm, 300);
    return () => {
      if (idle) window.cancelIdleCallback(id); else clearTimeout(id);
      link.remove();
    };
  }, []);
}
function GeneratorPopup({ user, seed, confirm, close, applyDesign }) {
  const [form, setForm] = useState(() => initialLotForm(user, seed));
  useEffect(() => {
    applyDesign.current = (update) => setForm((previous) => ({ ...previous, ...update }));
    return () => {
      applyDesign.current = null;
    };
  }, [applyDesign]);
  return (
    <Modal title="발주 품목 로트 생성" close={close} wide>
      <div className="modal-body">
        <Generator form={form} setForm={setForm} onConfirm={confirm} />
      </div>
    </Modal>
  );
}

function Workspace({ user, tier }) {
  useCalculatorPrefetch();
  const [page, setPage] = useState(readPage),
    [mobile, setMobile] = useState(false);
  const [store] = useState(() => createLotfolioStore(app, storeOptions));
  const [state, setState] = useState(empty),
    [dataReady, setDataReady] = useState(false),
    [dataError, setDataError] = useState(''),
    [retry, setRetry] = useState(0);
  const [modal, setModal] = useState(null),
    [form, setForm] = useState(() => initialLotForm(user));
  const [generation, setGeneration] = useState(null),
    applyPopupDesign = useRef(null);
  const [toast, setToast] = useState(''),
    toastTimer = useRef(null);
  const calculator = useRef(null),
    warehouse = useRef(null),
    search = useRef(null),
    drawerBtn = useRef(null),
    pending = useRef(null);
  const freezes = useMemo(() => dataReady ? freezeMap(state.designs) : null, [dataReady, state.designs]);
  const sendFreezes = useCallback((target) => {
    target?.postMessage({type: 'lotfolio:freeze-state', uid: user.uid, freezes}, location.origin);
  }, [user.uid, freezes]);
  useEffect(() => sendFreezes(calculator.current?.contentWindow), [sendFreezes]);
  useEffect(() => {
    let alive = true;
    setDataReady(false);
    setDataError('');
    const stop = store.subscribe(
      (next) => {
        if (alive) {
          setState(next);
          setDataReady(true);
          setDataError('');
        }
      },
      () => {
        if (alive) {
          setState(empty);
          setDataReady(false);
          setDataError('로트 데이터를 불러올 수 없습니다. 연결 상태와 접근 권한을 확인해 주세요.');
        }
      },
    );
    return () => {
      alive = false;
      stop?.();
    };
  }, [store, retry]);
  useEffect(
    () => () => {
      store.dispose();
      clearTimeout(toastTimer.current);
    },
    [store],
  );
  const notify = useCallback((text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3400);
  }, []);
  const finishRequest = useCallback((lotCode) => {
    const request = pending.current;
    pending.current = null;
    setGeneration(null);
    if (request && request.source === calculator.current?.contentWindow) {
      request.source.postMessage(
        {
          type: lotCode ? 'lotfolio:generated' : 'lotfolio:cancel',
          requestId: request.id,
          ...(lotCode ? { lotCode } : {}),
        },
        location.origin,
      );
    }
  }, []);
  const close = useCallback(() => setModal(null), []);
  const open = useCallback((type, props = {}) => setModal({ type, props }), []);
  const navigate = useCallback(
    (path) => {
      if (!pages.has(path)) return;
      close();
      finishRequest();
      setMobile(false);
      if (readPage() !== path) history.pushState(null, '', '/#' + path);
      setPage(path);
      window.scrollTo(0, 0);
    },
    [close, finishRequest],
  );
  useEffect(() => {
    function sync() {
      close();
      finishRequest();
      setMobile(false);
      setPage(readPage());
    }
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, [close, finishRequest]);
  useEffect(() => {
    document.title = pages.get(page) + ' | Lotfolio';
  }, [page]);
  useEffect(() => {
    const focus = () => {
      if (!document.querySelector('dialog[open]')) search.current?.focus();
    };
    function key(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        focus();
      }
      if (e.key === 'Escape' && mobile) {
        setMobile(false);
        drawerBtn.current?.focus();
      }
    }
    function message(e) {
      if (e.origin !== location.origin || !e.data || typeof e.data !== 'object') return;
      const fromCalc = e.source && e.source === calculator.current?.contentWindow;
      const fromWarehouse = e.source && e.source === warehouse.current?.contentWindow;
      if (!fromCalc && !fromWarehouse) return;
      const { type, requestId, lotCode, itemCode } = e.data;
      if (type === 'lotfolio:search') {
        focus();
        return;
      }
      if (!fromCalc) return;
      if (type === 'lotfolio:request-freezes') {
        sendFreezes(e.source);
        return;
      }
      if (type === 'lotfolio:view-design' && typeof lotCode === 'string') {
        try {
          open('lookup', { parsed: parseLot(lotCode) });
        } catch {}
        return;
      }
      if (typeof requestId !== 'string' || !requestId || requestId.length > 128) return;
      if (type === 'lotfolio:cancel' && pending.current?.id === requestId) {
        pending.current = null;
        setGeneration(null);
        setModal(null);
        return;
      }
      if (type !== 'lotfolio:generate') return;
      finishRequest();
      let seed = { code: typeof itemCode === 'string' ? itemCode : '' };
      if (typeof lotCode === 'string' && lotCode) {
        try {
          const p = parseLot(lotCode);
          seed = { ...p, omit: !p.seq };
        } catch {}
      }
      pending.current = { id: requestId, source: e.source };
      setModal(null);
      setGeneration({ id: requestId, seed });
    }
    document.addEventListener('keydown', key);
    window.addEventListener('message', message);
    return () => {
      document.removeEventListener('keydown', key);
      window.removeEventListener('message', message);
    };
  }, [mobile, open, finishRequest, sendFreezes]);
  function useDesign(design) {
    const seed = {
      code: design.code,
      month: design.month,
      type: design.type,
      reg: design.reg,
      seq: nextSeq(state.lots, design.key),
      omit: false,
    };
    if (pending.current && applyPopupDesign.current) {
      applyPopupDesign.current(seed);
      close();
      return;
    }
    setForm(initialLotForm(user, seed));
    navigate('/');
  }
  async function logout() {
    try {
      await app.auth().signOut();
    } catch {
      notify('로그아웃하지 못했습니다. 연결 상태를 확인해 주세요.');
    }
  }
  const Dialog = dialogs[modal?.type];
  const legacy = page === '/calculator' || page === '/warehouse';
  return (
    <Ctx.Provider value={{ state, dataReady, dataError, store, open, close, notify, user, tier, useDesign, navigate }}>
      <div className="shell">
        {mobile && <button className="scrim" aria-label="메뉴 닫기" onClick={() => setMobile(false)} />}
        <aside id="site-menu" className={'sidebar ' + (mobile ? 'shown' : '')}>
          <a
            className="brand-link"
            href="/#/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            <Logo />
          </a>
          <div className="workspace-name">
            <span className="workspace-icon">
              <Box size={18} />
            </span>
            <strong>
              패키징 · 창고<small>통합 워크스페이스</small>
            </strong>
          </div>
          <nav aria-label="워크스페이스 메뉴">
            {menu.map((group) => (
              <div className="nav-group" key={group.group}>
                <h2>{group.group}</h2>
                {group.items.map(([path, label, Icon]) => (
                  <a
                    key={path}
                    href={'/#' + path}
                    aria-current={page === path ? 'page' : undefined}
                    className={page === path ? 'active' : ''}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
                      e.preventDefault();
                      navigate(path);
                    }}
                  >
                    <Icon size={18} />
                    {label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
          <div className="side-foot">
            <div>
              <UserRound size={17} />
              <span title={user.email}>
                {user.email}
                <small>관리자 {tier}단계</small>
              </span>
            </div>
            <button className="iconbtn" aria-label="로그아웃" title="로그아웃" onClick={logout}>
              <LogOut size={16} />
            </button>
          </div>
        </aside>
        <div className={'workspace' + (legacy ? ' framed-workspace' : '')}>
          <header className="topbar">
            <button
              ref={drawerBtn}
              aria-controls="site-menu"
              aria-expanded={mobile}
              className="menubtn iconbtn"
              onClick={() => setMobile(!mobile)}
              aria-label="메뉴 열기"
            >
              <Menu size={21} />
            </button>
            <QuickSearch inputRef={search} />
            <span className="today">
              <CalendarDays size={15} />
              {new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(
                new Date(),
              )}
            </span>
          </header>
          <main className={legacy ? 'frame-content' : 'content'}>
            {dataError && !legacy && (
              <div className="data-error" role="alert">
                {dataError}{' '}
                <button className="btn" onClick={() => setRetry((r) => r + 1)}>
                  다시 연결
                </button>
              </div>
            )}
            {!dataReady && !dataError && !legacy && <p role="status">팀 워크스페이스를 불러오는 중…</p>}
            {dataReady && page === '/' && <Generator form={form} setForm={setForm} />}
            {dataReady && page === '/designs' && <Designs />}
            {dataReady && page === '/products' && <Products />}
            <FramedPage
              show={page === '/calculator'}
              frameRef={calculator}
              slug="calculator"
              title="부자재 계산 · 발주"
            />
            <FramedPage
              show={page === '/warehouse'}
              frameRef={warehouse}
              slug="warehouse"
              title="창고 구획도"
            />
          </main>
        </div>
      </div>
      {generation && (
        <GeneratorPopup
          key={generation.id}
          user={user}
          seed={generation.seed}
          applyDesign={applyPopupDesign}
          close={() => finishRequest()}
          confirm={finishRequest}
        />
      )}
      {Dialog && (
        <Dialog
          key={
            modal.type + '-' + (modal.props.id || modal.props.parsed?.lot || modal.props.product?.code || '')
          }
          {...modal.props}
        />
      )}
      {!!toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </Ctx.Provider>
  );
}

const root = createRoot(document.getElementById('root'));
function render(identity) {
  if (!identity.ready)
    root.render(
      <main className="loading">
        <Logo />
        <p>계정 확인 중…</p>
      </main>,
    );
  else if (identity.user && [1, 2].includes(identity.tier))
    root.render(<Workspace key={identity.user.uid} user={identity.user} tier={identity.tier} />);
  else root.render(<Login identity={identity} />);
}
render({ ready: false });
window.InventorySecurity.start(app, render);
