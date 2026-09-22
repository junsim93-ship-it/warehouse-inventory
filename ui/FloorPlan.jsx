import React, { useEffect, useRef } from 'react';
import { itemsAt, aggregate, groupKey } from './domain.mjs';
import { plan } from './plan.mjs';

const zoneNames = { product: '제품', material: '부자재', machine: '기계팀', sample: '샘플' };
const points = vertices => vertices.map(p => p.join(',')).join(' ');
const rotation = s => `rotate(${s.rot || 0} ${s.x + s.w / 2} ${s.y + s.h / 2})`;
function Shape({ shape, className = 'plan-shape' }) {
  return shape.poly ? <polygon points={points(shape.poly)} className={className}/> : <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx="2" transform={rotation(shape)} className={className}/>;
}
function Label({ shape, text, className = 'map-label' }) {
  const quarterTurn = Math.abs(Math.sin((shape.rot || 0) * Math.PI / 180)) > .99;
  const w = quarterTurn ? shape.h : shape.w, h = quarterTurn ? shape.w : shape.h;
  const vertical = h > w * 1.4;
  const x = shape.x + shape.w / 2 + (shape.labelDx || 0), y = shape.y + shape.h / 2 + (shape.labelDy || 0);
  const letters = vertical ? [...text.replaceAll(' ', '')] : [text];
  const size = Math.min(36, vertical ? w * .5 : w / (text.length * .75), h / (letters.length * 1.15));
  const angle = shape.rot && shape.rot % 90 ? shape.rot : 0;
  return <text className={className} textAnchor="middle" dominantBaseline="central" style={{ fontSize: size }} transform={`rotate(${angle} ${x} ${y})`}>
    {letters.map((line, i) => <tspan key={i} x={x} y={y + (i - (letters.length - 1) / 2) * size * 1.15}>{line}</tspan>)}
  </text>;
}
export default function FloorPlan({ locations, selectedId, onSelect }) {
  const map = useRef(null);
  const counts = new Map();
  locations.forEach(l => counts.set(l.id, (counts.get(l.id) || 0) + 1));
  const isMatched = l => Boolean(l.id && l.label && counts.get(l.id) === 1 && ['x', 'y', 'w', 'h'].every(k => Number.isFinite(l[k])) && l.w > 0 && l.h > 0 && l.x >= 0 && l.y >= 0 && l.x + l.w <= plan.width && l.y + l.h <= plan.height);
  const unmatched = locations.filter(l => !isMatched(l));
  const low = new Set(aggregate(locations).filter(g => g.low).map(g => g.key));
  useEffect(() => {
    if (!selectedId) return;
    const node = [...(map.current?.querySelectorAll('[data-location-id]') || [])].find(el => el.dataset.locationId === selectedId);
    node?.focus();
    node?.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
  }, [selectedId]);
  return <section className="map-panel" aria-labelledby="map-heading">
    <div className="panel-heading"><div><h2 id="map-heading">창고 구획도</h2><p>위치를 선택하면 해당 위치의 재고를 확인할 수 있습니다.</p></div><span className="subtle-tag">B1 · 지하 창고</span></div>
    {unmatched.length > 0 && <div className="warning-banner" role="alert">도면 매칭 확인 필요: {unmatched.map(l => l.label || l.id || '이름 없는 위치').join(', ')}. 아래 점선 영역에서 재고를 확인해 주세요.</div>}
    <div className="map-scroll" ref={map} tabIndex={0} aria-label="창고 도면. 작은 화면에서는 가로로 스크롤할 수 있습니다.">
      <svg className="floor-plan" viewBox={`0 0 ${plan.width} ${plan.height}`} aria-label="지하 창고 위치 선택" role="group">
        <defs><pattern id="pallet-hatch" width="13" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="13" height="13" fill="var(--material)"/><path d="M0 0V13" stroke="var(--muted)" strokeWidth="1.4" opacity=".4"/></pattern></defs>
        <polygon points={points(plan.walls)} className="plan-wall"/>
        <polyline points={points(plan.innerWall)} className="plan-wall"/>
        <polygon points={points(plan.extraRoom)} className="plan-room"/>
        {plan.fixtures.filter(s => s.role !== 'pillar').map((s, i) => <g key={i}>
          {s.role === 'door' ? <path d={`M${s.x} ${s.y} A${Math.min(s.w,s.h)} ${Math.min(s.w,s.h)} 0 0 1 ${s.x+s.w} ${s.y+s.h} L${s.x} ${s.y+s.h} Z`} transform={`${rotation(s)} translate(${s.x+s.w/2} ${s.y+s.h/2}) scale(${s.flip?-1:1} ${s.vflip?-1:1}) translate(${-s.x-s.w/2} ${-s.y-s.h/2})`} className="plan-door"/> : <Shape shape={s} className={`plan-${s.role}`}/>}
          {s.label && <Label shape={s} text={s.label} className="plan-fixture-label"/>}
        </g>)}
        {locations.filter(isMatched).map(location => {
          const items = itemsAt(location);
          const shortage = items.some(i => low.has(groupKey(i)));
          return <g key={location.id} role="button" tabIndex={0} data-location-id={location.id} className={`map-location zone-${location.zone} ${location.kind} ${selectedId === location.id ? 'selected' : ''}`} aria-label={`${location.label}, ${location.kind === 'pallet' ? '팔레트' : '선반'}, ${zoneNames[location.zone] || '미분류'}, 제품 ${items.length}개${shortage ? ', 재고 부족' : ''}. 재고 보기`} onClick={() => onSelect(location.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(location.id); } }}>
            {(location.parts || [location]).map((shape, i) => <Shape key={i} shape={shape}/>)}
            {location.kind !== 'pallet' && <Label shape={location} text={location.label}/>}
            <title>{`${location.label} · ${zoneNames[location.zone]} · ${items.length}개 제품${shortage ? ' · 재고 부족' : ''}`}</title>
          </g>;
        })}
        {plan.fixtures.filter(s => s.role === 'pillar').map((s, i) => <g key={i} aria-label="기둥">
          <Shape shape={s} className="plan-pillar"/>
          <path d={`M${s.x} ${s.y}l${s.w} ${s.h}M${s.x+s.w} ${s.y}l${-s.w} ${s.h}`} className="plan-wall"/>
        </g>)}
      </svg>
    </div>
    {unmatched.length > 0 && <div className="unmatched-locations">{unmatched.map((l,i) => <button key={`${l.id}-${i}`} className="unmatched-location" disabled={!l.id || counts.get(l.id) > 1} onClick={() => onSelect(l.id)}>{l.label || l.id || '미확인 위치'} · 도면 확인 필요</button>)}</div>}
    <div className="map-footer"><div className="legend" aria-label="구역 범례">{Object.entries(zoneNames).map(([key,label]) => <span key={key}><i className={`zone-${key}`}/>{label}</span>)}<span><i className="legend-column"/>기둥</span><span><i className="legend-worktable"/>작업대</span><span><i className="legend-wall"/>벽</span><span><i className="legend-door"/>문</span></div><span className="map-help">Tab으로 이동 · Enter로 재고 보기</span></div>
    {!locations.length && <div className="empty-state"><h3>등록된 위치가 없습니다</h3><p>서버 초기 설정에서 창고 위치를 등록해 주세요.</p></div>}
  </section>;
}
