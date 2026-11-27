import React, { useEffect, useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { Modal, useApp, nameOf } from './shared.jsx';
import { DesignPreview } from './Designs.jsx';
import { DesignFreezeControls } from './DesignFreeze.jsx';
import { formatQuantity, lookupInventory, stockBySource } from './inventory-lookup.mjs';
import { parseLot } from './lot-engine.mjs';
import { app } from './firebase-app.js';

function Quantities({ rows, label, loading, showLocation = true }) {
  if (loading)
    return (
      <p className="muted" role="status">
        조회 중…
      </p>
    );
  if (!rows?.length) return <p className="muted">표시할 수량이 없습니다.</p>;
  return (
    <ul className="quantity-list">
      {rows.map((row, index) => (
        <li key={index}>
          <span>
            {showLocation && row.location}
            <code>{row.lotCode}</code>
          </span>
          <strong>
            {formatQuantity(row.quantity)}
            <small> {label}</small>
          </strong>
        </li>
      ))}
    </ul>
  );
}

export function Lookup({ parsed }) {
  const { state, dataReady, dataError, open, close } = useApp();
  const design = state.designs.find((d) => d.key === parsed.key);
  const [result, setResult] = useState(null);
  useEffect(() => {
    let active = true;
    setResult(null);
    lookupInventory(app.firestore(), parsed.lot).then(
      (data) => {
        if (active) setResult(data);
      },
      () => {
        if (active) setResult({ errors: ['재고와 창고 위치를 조회하지 못했습니다.'] });
      },
    );
    return () => {
      active = false;
    };
  }, [parsed.lot]);
  return (
    <Modal title="로트 통합 조회" close={close} wide>
      <div className="modal-body unified-lookup">
        {design && <DesignFreezeControls key={design.id} design={design} />}
        <div className="lookup-heading">
          <h3>{nameOf(state.products, parsed.code)}</h3>
          <code>{parsed.lot}</code>
          {parsed.corrected && <p role="status">인허가 표기를 표준 순서 {parsed.reg}로 정리했습니다.</p>}
        </div>
        <section aria-label="연결된 디자인">
          <h3>디자인 시안</h3>
          {!dataReady ? (
            <p role="status">{dataError || '디자인 목록을 확인하는 중…'}</p>
          ) : design ? (
            <DesignPreview design={design} parsed={parsed} />
          ) : (
            <div className="register-design">
              <span>등록된 시안이 없습니다.</span>
              <button className="btn" onClick={() => open('design', { initial: parsed })}>
                <Plus size={15} />이 코드로 디자인 등록
              </button>
            </div>
          )}
        </section>
        <div className="lookup-columns">
          <section>
            <h3>전산 재고 · 같은 디자인 키</h3>
            {result?.stock?.length ? (
              stockBySource(result.stock).map((group) => (
                <div className="stock-source" key={group.source}>
                  <h4>
                    {group.source} <span>합계 {formatQuantity(group.total)}개</span>
                  </h4>
                  <Quantities rows={group.rows} label="개" showLocation={false} />
                </div>
              ))
            ) : (
              <Quantities rows={[]} label="개" loading={!result} />
            )}
          </section>
          <section>
            <h3>지하 창고 위치</h3>
            <Quantities rows={result?.locations} label="개" loading={!result} />
          </section>
        </div>
        {!!result?.errors?.length && (
          <div role="alert" className="error">
            {result.errors.join(' · ')}
          </div>
        )}
      </div>
    </Modal>
  );
}

export function ProductLookup({ product }) {
  const { state, open, close } = useApp();
  const keys = new Set(state.designs.filter((d) => d.code === product.code).map((d) => d.key));
  for (const r of state.lots) if (r.code === product.code) keys.add(r.key);
  return (
    <Modal title="제품 조회" close={close}>
      <div className="modal-body">
        <h3>{product.name}</h3>
        <code>{product.code}</code>
        <div className="product-links">
          {[...keys]
            .sort()
            .reverse()
            .map((key) => (
              <button className="btn" key={key} onClick={() => open('lookup', { parsed: parseLot(key) })}>
                <code>{key}</code>
                <ArrowRight size={14} />
              </button>
            ))}
        </div>
        {!keys.size && <p className="muted">이 제품에 등록된 디자인이나 로트 이력이 없습니다.</p>}
      </div>
    </Modal>
  );
}
