import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { parseLot } from './lot-engine.mjs';
import { useApp } from './shared.jsx';

export function QuickSearch({ inputRef }) {
  const { state, dataReady, dataError, open } = useApp();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(false);
  const container = useRef(null);
  useEffect(() => {
    function dismiss(e) {
      if (!container.current?.contains(e.target)) setActive(false);
    }
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);
  const term = query.trim().toUpperCase();
  let parsed = null,
    error = '';
  if (term.includes('_')) {
    try {
      parsed = parseLot(term);
    } catch (e) {
      error = e.message;
    }
  }
  const products =
    !term || parsed || error
      ? []
      : state.products
          .filter((p) => p.code.toUpperCase().includes(term) || p.name.toUpperCase().includes(term))
          .sort((a, b) => Number(b.code === term) - Number(a.code === term))
          .slice(0, 12);
  function show(type, props) {
    setActive(false);
    inputRef.current?.blur();
    open(type, props);
  }
  function choose() {
    if (parsed) show('lookup', { parsed });
    else if (dataReady && products.length) show('productLookup', { product: products[0] });
  }
  return (
    <form
      className="quick-wrap"
      ref={container}
      onSubmit={(e) => {
        e.preventDefault();
        choose();
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setActive(false);
      }}
    >
      <div className={'quick-search ' + (active ? 'focus' : '')}>
        <Search size={17} />
        <input
          ref={inputRef}
          aria-label="통합 즉시 조회"
          placeholder="로트 코드, 디자인 키, 제품번호 또는 제품명"
          value={query}
          onFocus={() => setActive(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(true);
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'Escape') {
              setActive(false);
              inputRef.current.blur();
            }
          }}
          onPaste={(e) => {
            const field = e.currentTarget,
              pasted = e.clipboardData.getData('text');
            const next =
              field.value.slice(0, field.selectionStart) + pasted + field.value.slice(field.selectionEnd);
            let valid;
            try {
              valid = parseLot(next);
            } catch {
              return;
            }
            e.preventDefault();
            setQuery(next.trim());
            show('lookup', { parsed: valid });
          }}
        />
        {query ? (
          <button
            type="button"
            className="iconbtn"
            aria-label="검색 지우기"
            onClick={() => {
              setQuery('');
              inputRef.current.focus();
            }}
          >
            <X size={15} />
          </button>
        ) : (
          <kbd>Ctrl K</kbd>
        )}
      </div>
      {active && term && (
        <div className="lookup-menu">
          {parsed ? (
            <button type="submit">
              <span>
                로트 · 디자인 통합 조회<code>{parsed.lot}</code>
              </span>
              <ArrowRight size={16} />
            </button>
          ) : error ? (
            <p>{error}</p>
          ) : !dataReady ? (
            <p role="status">{dataError || '제품 목록을 확인하는 중…'}</p>
          ) : products.length ? (
            products.map((p) => (
              <button type="button" key={p.code} onClick={() => show('productLookup', { product: p })}>
                <span>
                  {p.name}
                  <code>{p.code}</code>
                </span>
                <ArrowRight size={14} />
              </button>
            ))
          ) : (
            <p>일치하는 제품이 없습니다.</p>
          )}
        </div>
      )}
    </form>
  );
}
