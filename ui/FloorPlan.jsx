import React, { useEffect, useRef, useState } from 'react';
import { itemsAt, aggregate, groupKey } from './domain.mjs';
import { plan } from './plan.mjs';

const zoneNames = { product: '제품', material: '부자재', machine: '기계팀', sample: '샘플' };
const points = vertices => vertices.map(p => p.join(',')).join(' ');
const rotation = s => `rotate(${s.rot || 0} ${s.x + s.w / 2} ${s.y + s.h / 2})`;
function Shape({ shape, className = 'plan-shape' }) {
  return shape.poly ? <polygon points={points(shape.poly)} className={className}/> : <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx="2" transform={rotation(shape)} className={className}/>;
}
function Label({ shape, text, className = 'map-label', scale = 1 }) {
  const quarterTurn = Math.abs(Math.sin((shape.rot || 0) * Math.PI / 180)) > .99;
  const w = quarterTurn ? shape.h : shape.w, h = quarterTurn ? shape.w : shape.h;
  const vertical = h > w * 1.4;
  const x = shape.x + shape.w / 2 + (shape.labelDx || 0), y = shape.y + shape.h / 2 + (shape.labelDy || 0);
  const lines = vertical ? [...text.replaceAll(' ', '')] : [text];
  const size = Math.min((className === 'map-label' ? 14 : 13) / scale, vertical ? w * .65 : w / (text.length * .75), h / (lines.length * 1.15));
  return <text className={className} textAnchor="middle" dominantBaseline="central" style={{ fontSize: size }}>
    {lines.map((line, index) => <tspan key={index} x={x} y={y + (index - (lines.length - 1) / 2) * size * 1.15}>{line}</tspan>)}
  </text>;
}

export default function FloorPlan({ locations, selectedId, onSelect, onInventory }) {
  const map = useRef(null);
  const drawing = useRef(null);
  const [scale, setScale] = useState(1200 / plan.width);
  const selected = locations.find(l => l.id === selectedId);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / plan.width));
    observer.observe(drawing.current);
    return () => observer.disconnect();
  }, []);
  const closeDetails = () => {
    map.current?.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true });
    onSelect(null);
  };
  const counts = new Map();
  locations.forEach(l => counts.set(l.id, (counts.get(l.id) || 0) + 1));
  const isMatched = l => Boolean(l.id && l.label && counts.get(l.id) === 1 && ['x', 'y', 'w', 'h'].every(k => Number.isFinite(l[k])) && l.w > 0 && l.h > 0 && l.x >= 0 && l.y >= 0 && l.x + l.w <= plan.width && l.y + l.h <= plan.height);
  const unmatched = locations.filter(l => !isMatched(l));
  const low = new Set(aggregate(locations).filter(g => g.low).map(g => g.key));
  useEffect(() => {
    if (!selectedId) return;
    const node = [...(map.current?.querySelectorAll('[data-location-id]') || [])].find(el => el.dataset.locationId === selectedId);
    const frame = requestAnimationFrame(() => {
      node?.focus({ preventScroll: true });
      node?.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId]);
  return <section className="map-panel" aria-labelledby="map-heading">
    <div className="panel-heading"><div><h2 id="map-heading">창고 구획도</h2><p>위치를 선택하면 해당 위치의 재고를 확인합니다.</p></div><span className="subtle-tag">B1 · 지하 창고</span></div>
    <div className="map-legend legend" aria-label="구역 범례">{Object.entries(zoneNames).map(([key,label]) => <span key={key}><i className={`zone-${key}`}/>{label}</span>)}<span><i className="legend-special"/>미품 선반</span><span><i className="legend-worktable"/>고정 설비</span><span><i className="legend-column"/>기둥</span><span><i className="legend-pallet"/>팔레트 · 선택 가능</span></div>
    <div className="map-tools" aria-label="도면 탐색">
      <label className="map-location-picker">위치 찾기<select value={selectedId || ''} onChange={e => onSelect(e.target.value || null)}><option value="">위치 선택</option>{locations.filter(isMatched).map(l => <option key={l.id} value={l.id}>{l.label} · {l.id}</option>)}</select></label>
    </div>
    {unmatched.length > 0 && <div className="warning-banner" role="alert">도면 매칭 확인 필요: {unmatched.map(l => l.label || l.id || '이름 없는 위치').join(', ')}. 아래 점선 영역에서 재고를 확인해 주세요.</div>}
    <div className={`map-body${selected ? ' has-selection' : ''}`}>
    <div className="map-scroll" ref={map} onKeyDown={e => { if (e.key === 'Escape' && selected) closeDetails(); }}>

      <svg ref={drawing} className="floor-plan" viewBox={`0 0 ${plan.width} ${plan.height}`} aria-label="지하 창고 위치 선택" role="group">
        <defs><pattern id="pillar-hatch" width={8 / scale} height={8 / scale} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width={8 / scale} height={8 / scale}/><path d={`M0 0V${8 / scale}`} strokeWidth={1 / scale}/></pattern></defs>
        <polygon points={points(plan.walls)} className="plan-wall"/>
        <polyline points={points(plan.innerWall)} className="plan-wall plan-inner-wall"/>
        <polygon points={points(plan.extraRoom)} className="plan-room"/>
        {plan.fixtures.filter(s => s.role !== 'pillar').map((s, i) => <g key={i}>
          {s.role === 'door' ? <path d={`M${s.x} ${s.y} A${Math.min(s.w,s.h)} ${Math.min(s.w,s.h)} 0 0 1 ${s.x+s.w} ${s.y+s.h} L${s.x} ${s.y+s.h} Z`} transform={`translate(${s.x+s.w/2} ${s.y+s.h/2}) scale(${s.flip?-1:1} ${s.vflip?-1:1}) translate(${-s.x-s.w/2} ${-s.y-s.h/2}) ${rotation(s)}`} className="plan-door"/> : <Shape shape={s} className={`plan-${s.role}`}/>}
          {s.label && <Label scale={scale} shape={s} text={s.label} className="plan-fixture-label"/>}
        </g>)}
        <g aria-hidden="true" className="map-hit-targets">{locations.filter(l => isMatched(l) && l.kind !== 'pallet' && !l.poly).map(location => <rect key={location.id} data-hit-id={location.id} className="map-hit-area" x={location.x + location.w / 2 - Math.max(location.w, 44 / scale) / 2} y={location.y + location.h / 2 - Math.max(location.h, 44 / scale) / 2} width={Math.max(location.w, 44 / scale)} height={Math.max(location.h, 44 / scale)} transform={rotation(location)} onClick={() => onSelect(location.id)}/>)}</g>
        {locations.filter(isMatched).map(location => {
          const items = itemsAt(location);
          const shortage = items.some(i => low.has(groupKey(i)));
          return <g key={location.id} role="button" tabIndex={0} aria-pressed={selectedId === location.id} data-location-id={location.id} className={`map-location zone-${location.zone} ${location.kind} ${selectedId === location.id ? 'selected' : ''}`} aria-label={`${location.label}, ${location.kind === 'pallet' ? '팔레트' : '선반'}, ${zoneNames[location.zone] || '미분류'}, 제품 ${items.length}개${shortage ? ', 재고 부족' : ''}. 재고 보기`} onClick={() => onSelect(location.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(location.id); } }}>

            {(location.parts || [location]).map((shape, i) => <Shape key={i} shape={shape}/>)}
            {location.kind !== 'pallet' && <Label scale={scale} shape={location} text={location.label}/>}
            <title>{`${location.label} · ${zoneNames[location.zone]} · ${items.length}개 제품${shortage ? ' · 재고 부족' : ''}`}</title>
          </g>;
        })}
        {plan.fixtures.filter(s => s.role === 'pillar').map((s, i) => <g key={i} aria-label="기둥">
          <Shape shape={s} className="plan-pillar"/>
          <title>기둥 · 고정 구조물</title>
        </g>)}
      </svg>
    </div>
    {selected && <aside className="map-details" aria-labelledby="map-details-title" onKeyDown={e => { if (e.key === 'Escape') closeDetails(); }}>
      <div className="map-details-heading"><div><span className="eyebrow">{zoneNames[selected.zone]} · {selected.id}</span><h3 id="map-details-title">{selected.label}</h3></div><button className="button subtle" aria-label="위치 상세 닫기" onClick={closeDetails}>×</button></div>
      <p className="map-details-summary">등록 제품 {itemsAt(selected).length}건{selected.kind === 'shelf' ? ` · ${selected.rows}단 ${selected.cols}칸` : ' · 팔레트'}</p>
      <div className="map-detail-items">{itemsAt(selected).length ? Object.entries(selected.cells || {}).flatMap(([cell, items]) => items.map((item, index) => <div className="map-detail-item" key={`${cell}-${index}`}><div><strong>{item.name || item.code || '이름 없는 제품'}</strong><span>{item.qty}개</span></div><small>{selected.kind === 'shelf' ? cell.replace('-', '단 ') + '칸 · ' : ''}{item.code}{item.lot ? ` · 로트 ${item.lot}` : ''}</small>{item.expiry && <small>유통기한 {item.expiry}</small>}</div>)) : <p>등록된 제품이 없습니다.</p>}</div>
      <button className="button primary map-inventory-link" onClick={() => onInventory(selected.id)}>재고 상세·등록·수정 →</button>
    </aside>}
    </div>
    {unmatched.length > 0 && <div className="unmatched-locations">{unmatched.map((l,i) => <button key={`${l.id}-${i}`} className="unmatched-location" disabled={!l.id || counts.get(l.id) > 1} onClick={() => onSelect(l.id)}>{l.label || l.id || '미확인 위치'} · 도면 확인 필요</button>)}</div>}
    <div className="map-footer"><span className="map-help">Tab으로 위치 이동 · Enter로 선택 · Esc로 상세 닫기</span></div>
    {!locations.length && <div className="empty-state"><h3>등록된 위치가 없습니다</h3><p>서버 초기 설정에서 창고 위치를 등록해 주세요.</p></div>}
  </section>;
}
