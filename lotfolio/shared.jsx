import React, { useContext, useEffect, useId, useRef, useState } from 'react';
import { Milk, Box, Tag, Check, Image as ImageIcon, X, Search, ChevronDown, File } from 'lucide-react';
import { types, regulations, productCode } from './lot-engine.mjs';
import { loadSpreadsheet as spreadsheet } from './spreadsheet.mjs';
export { spreadsheet };
export const Ctx = React.createContext(null);
export const useApp = () => useContext(Ctx);
export const typeIcons = { A: Milk, B: Box, C: Tag };
const calendar = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
export function dateText(value) {
  const date = value?.toDate?.() || new Date(value ?? NaN);
  return Number.isFinite(date.getTime()) ? calendar.format(date).replace(/\.\s*$/, '') : '—';
}
export const monthText = (m) => (m ? '20' + m.slice(0, 2) + '.' + m.slice(2) : '');
export const monthInput = (m) => (m ? '20' + m.slice(0, 2) + '-' + m.slice(2) : '');
export const inputMonth = (v) => (/^20\d{2}-(0[1-9]|1[0-2])$/.test(v) ? v.slice(2, 4) + v.slice(5) : '');
export const nameOf = (products, code) => products.find((p) => p.code === code)?.name || '미등록 제품';
import { useFileUrl } from './file-access.jsx';
import { openPdf } from './pdf.mjs';
export const humanSize = (n) =>
  n < 1024 * 1024 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1024 / 1024).toFixed(1) + ' MB';
export const regName = (reg) =>
  reg === 'KR'
    ? '국내 전용'
    : Array.from(reg || '')
        .map((x) => regulations[x])
        .join(' · ');
export async function copyCode(value) {
  if (navigator.clipboard?.writeText)
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {}
  const area = document.createElement('textarea');
  area.value = value;
  area.style.cssText = 'position:fixed;left:-9999px';
  document.body.append(area);
  area.select();
  const ok = document.execCommand('copy');
  area.remove();
  if (!ok) throw Error('클립보드에 접근할 수 없습니다. 표시된 코드를 선택해 복사해 주세요.');
}
export function Badge({ children, tone = '' }) {
  return <span className={'badge ' + tone}>{children}</span>;
}
export function TypeBadge({ type }) {
  const Icon = typeIcons[type];
  return (
    <Badge tone={'type-' + type}>
      <Icon size={13} />
      {types[type]}
    </Badge>
  );
}
export function SectionTitle({ icon: Icon, title, children }) {
  return (
    <header className="section-title">
      <div>
        <Icon size={18} />
        <h2>{title}</h2>
      </div>
      {children}
    </header>
  );
}
export function PageTitle({ title, desc, children }) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      <div className="page-actions">{children}</div>
    </div>
  );
}
export function Modal({ title, children, close, wide = false }) {
  const ref = useRef(null),
    id = useId();
  useEffect(() => {
    const el = ref.current;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className={'dialog ' + (wide ? 'wide' : '')}
      onCancel={(e) => {
        e.preventDefault();
        e.stopPropagation();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
        }
      }}
    >
      <header>
        <h2 id={id}>{title}</h2>
        <button className="iconbtn" aria-label="닫기" onClick={close}>
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Field({ name, extra, children }) {
  return (
    <div className="field">
      <div className="fieldlabel">
        {name}
        {extra}
      </div>
      {children}
    </div>
  );
}
export function ProductPicker({ value, onChange, onDraftStatus }) {
  const { state } = useApp(),
    selected = state.products.find((p) => p.code === value);
  const [open, setOpen] = useState(false),
    [term, setTerm] = useState('');
  const draftCode = term.trim().toUpperCase();
  const canUseDraftCode = /^[A-Z0-9-]+$/.test(draftCode);
  const matchesTerm = (p, text) =>
    (p.code + ' ' + p.name + ' ' + p.brand).toLowerCase().includes(text.toLowerCase());
  const matches = state.products.filter((p) => matchesTerm(p, term));
  function close() {
    setOpen(false);
    onDraftStatus?.('');
  }
  function select(code) {
    onChange(code);
    close();
  }
  return (
    <div
      className="product-picker"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) close();
      }}
    >
      <div className={'picker-trigger ' + (open ? 'focus' : '')}>
        <Search size={16} />
        <input
          aria-label="제품 선택"
          autoComplete="off"
          value={open ? term : value + (selected ? '　' + selected.name : '')}
          placeholder="제품명 또는 고유번호 검색"
          onFocus={() => {
            if (!open) {
              setTerm('');
              setOpen(true);
            }
          }}
          onClick={() => {
            if (!open) {
              setTerm('');
              setOpen(true);
            }
          }}
          onChange={(e) => {
            const t = e.target.value;
            setTerm(t);
            const code = t.trim();
            if (/^[a-z0-9-]*$/i.test(code)) {
              onChange(code.toUpperCase());
              onDraftStatus?.('');
            } else {
              onDraftStatus?.(state.products.some((p) => matchesTerm(p, t)) ? 'searching' : 'invalid');
            }
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'Escape') close();
            if (e.key === 'Enter') {
              e.preventDefault();
              if (canUseDraftCode) select(draftCode);
              else if (matches[0]) select(matches[0].code);
            }
          }}
        />
        <ChevronDown size={15} />
      </div>
      {open && (
        <div className="options">
          {matches.slice(0, 12).map((p) => (
            <button type="button" key={p.code} onClick={() => select(p.code)}>
              <code>{p.code}</code>
              {p.name}
              {p.code === value && <Check size={14} />}
            </button>
          ))}
          {canUseDraftCode &&
            !state.products.some((p) => p.code === draftCode) && (
              <button type="button" onClick={() => select(draftCode)}>
                <code>{draftCode}</code>미등록 번호로 사용
              </button>
            )}
          {!matches.length && !canUseDraftCode && (
            <p>제품명이나 영문·숫자 번호를 입력해 주세요.</p>
          )}
        </div>
      )}
    </div>
  );
}
export function TypePicker({ value, onChange }) {
  return (
    <div className="type-picker">
      {Object.entries(types).map(([k, label]) => {
        const Icon = typeIcons[k];
        return (
          <button
            type="button"
            key={k}
            aria-pressed={value === k}
            className={value === k ? 'active' : ''}
            onClick={() => onChange(k)}
          >
            <Icon size={17} />
            <span>{label}</span>
            <small>{k}</small>
          </button>
        );
      })}
    </div>
  );
}
export function RegPicker({ value, onChange }) {
  function toggle(k) {
    if (k === 'KR') return onChange('KR');
    const current = value === 'KR' ? '' : value;
    onChange(
      [...'NMC'].filter((l) => (l === k ? !current.includes(l) : current.includes(l))).join('') || 'KR',
    );
  }
  return (
    <div className="reg-picker">
      {Object.entries({ ...regulations, KR: '국내 전용' }).map(([k, name]) => {
        const sel = k === 'KR' ? value === 'KR' : value.includes(k);
        return (
          <button
            type="button"
            key={k}
            className={sel ? 'selected' : ''}
            aria-pressed={sel}
            onClick={() => toggle(k)}
          >
            {sel && <Check size={12} />}
            <b>{k}</b>
            {name}
          </button>
        );
      })}
    </div>
  );
}
export function MonthField({ value, onChange }) {
  return (
    <input
      aria-label="디자인 확정 연월"
      type="month"
      min="2000-01"
      max="2099-12"
      value={monthInput(value)}
      onChange={(e) => onChange(inputMonth(e.target.value))}
    />
  );
}
export function PdfImage({ file, url }) {
  const ref = useRef(null),
    [bad, setBad] = useState(false);
  useEffect(() => {
    let disposed = false,
      loading,
      render;
    setBad(false);
    (async () => {
      loading = await openPdf(url);
      if (disposed) {
        await loading.destroy();
        return;
      }
      const doc = await loading.promise;
      if (disposed) return;
      const page = await doc.getPage(1);
      if (disposed) return;
      const canvas = ref.current,
        native = page.getViewport({ scale: 1 });
      const width = Math.max(320, canvas.clientWidth || 500) * Math.min(2, window.devicePixelRatio || 1);
      const scale = Math.min(width / native.width, 1400 / Math.max(native.width, native.height));
      const view = page.getViewport({ scale });
      canvas.width = Math.max(1, Math.round(view.width));
      canvas.height = Math.max(1, Math.round(view.height));
      render = page.render({ canvasContext: canvas.getContext('2d'), viewport: view });
      await render.promise;
    })().catch(() => {
      if (!disposed) setBad(true);
    });
    return () => {
      disposed = true;
      render?.cancel();
      loading?.destroy().catch(() => {});
    };
  }, [url]);
  return bad ? (
    <div className="art-placeholder">
      <File />
      PDF 첫 페이지를 표시할 수 없습니다.
    </div>
  ) : (
    <canvas ref={ref} aria-label={file.name + ' 첫 페이지'} />
  );
}
export function primaryImage(files) {
  return files.find((f) => f.kind === 'image' && f.primary) || files.find((f) => f.kind === 'image');
}
export function Art({ design, selected, children }) {
  const { state, store } = useApp();
  const files = state.files.filter((f) => f.design === design?.id);
  const file = selected || primaryImage(files) || files.find((f) => f.kind === 'pdf');
  const holder = useRef(null),
    [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!holder.current || !globalThis.IntersectionObserver) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '150px' },
    );
    observer.observe(holder.current);
    return () => observer.disconnect();
  }, []);
  const { url, error } = useFileUrl(store, file, visible);
  const Icon = typeIcons[design?.type] || ImageIcon;
  return (
    <div ref={holder} className="art">
      {url ? (
        file.kind === 'image' ? (
          <img src={url} alt={file.name} />
        ) : (
          <PdfImage url={url} file={file} />
        )
      ) : (
        <div className="art-placeholder">
          <Icon size={30} />
          <span>{error || (!file ? '미리보기 파일 없음' : '시안 불러오는 중…')}</span>
        </div>
      )}
      {children}
    </div>
  );
}
export function Filters({
  query,
  setQuery,
  type,
  setType,
  reg,
  setReg,
  month,
  setMonth,
  placeholder = '제품명 또는 코드 검색',
}) {
  return (
    <div className="filters">
      <label className="searchfield">
        <Search size={15} />
        <input
          aria-label={placeholder}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <select aria-label="부자재 필터" value={type} onChange={(e) => setType(e.target.value)}>
        <option value="">전체 부자재</option>
        {Object.entries(types).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <select aria-label="인허가 필터" value={reg} onChange={(e) => setReg(e.target.value)}>
        <option value="">전체 인허가</option>
        {Object.entries({ ...regulations, KR: '국내 전용' }).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      {setMonth && (
        <input
          aria-label="확정월 필터"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      )}
    </div>
  );
}
export async function exportSheet(rows, title, filename) {
  const x = await spreadsheet(),
    sheet = x.utils.aoa_to_sheet(rows),
    book = x.utils.book_new();
  sheet['!cols'] = rows[0].map((_, i) => ({ wch: i === 0 ? 26 : 20 }));
  x.utils.book_append_sheet(book, sheet, title);
  x.writeFile(book, filename);
}
