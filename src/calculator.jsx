
const { useState, useEffect, useMemo, useRef } = React;
const fmt = n => (n == null || !isFinite(n) ? "-" : Math.round(n).toLocaleString("ko-KR"));

const SRC = { p3l: "3PL 전산", ecount: "이카운트 전산", carton: "카톤박스 전산" };

const inp = {
  width:"100%", padding:"9px 11px", border:"1px solid #DDE4E2",
  borderRadius:8, fontSize:14, fontFamily:"inherit", color:"#15201F",
  background:"#fff", outline:"none",
};

function Btn({ children, kind="primary", onClick, disabled, small, style={} }) {
  const base = {
    border:"none", borderRadius:8, padding: small?"6px 12px":"10px 16px",
    fontSize: small?13:14, fontWeight:600, cursor: disabled?"not-allowed":"pointer",
    opacity: disabled?0.5:1, fontFamily:"inherit", transition:"filter .12s", ...style
  };
  const kinds = {
    primary:{ background:"#0E6E5C", color:"#fff" },
    ghost:{ background:"transparent", color:"#0E6E5C", border:"1px solid #0E6E5C" },
    danger:{ background:"transparent", color:"#C8372D", border:"1px solid #DDE4E2" },
    plain:{ background:"#EDF1F0", color:"#15201F" },
    amber:{ background:"transparent", color:"#9A6B00", border:"1px solid #E0C97A" },
  };
  return (
    <button style={{...base,...kinds[kind]}} onClick={onClick} disabled={disabled}
      onMouseOver={e=>{ if(!disabled) e.currentTarget.style.filter="brightness(0.9)"; }}
      onMouseOut={e=>{ e.currentTarget.style.filter="none"; }}>
      {children}
    </button>
  );
}

/* ── 엑셀 파서: 3PL(WMS)·이카운트 양식 자동 인식 ── */
function parseStockWorkbook(wb) {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header:1, raw:false, defval:"" });
  let hi = -1;
  for (let i=0; i<Math.min(rows.length, 10); i++) {
    const r = (rows[i]||[]).map(x=>String(x));
    if (r.some(x=>x.includes("품목코드")||x.includes("상품코드"))) { hi=i; break; }
  }
  if (hi < 0) throw new Error("헤더 행을 찾을 수 없습니다 (품목코드/상품코드 열 필요)");
  const header = rows[hi].map(x=>String(x).trim());
  const col = names => {
    for (const n of names) {
      const idx = header.findIndex(h=>h.includes(n));
      if (idx>=0) return idx;
    }
    return -1;
  };
  const ci = col(["품목코드","상품코드"]);
  const ni = col(["품목명","상품명"]);
  const li = col(["시리얼/로트","LOT NO","로트","LOT"]);
  const ei = col(["유효기한","유통기한"]);
  const qi = col(["재고수량","가용재고","수량"]);
  const wi = col(["창고명","로케이션","존"]);
  if (qi < 0) throw new Error("수량 열을 찾을 수 없습니다 (재고수량/가용재고/수량 중 하나 필요)");

  /* 수량 후보 열이 실제로 서로 다른 열인 경우에만 경고 (같은 열이 두 검색어에 걸리는 오탐 방지) */
  const qtyCandidateIdxs = new Set(
    ["재고수량","가용재고","수량"]
      .map(n => header.findIndex(h => h.includes(n)))
      .filter(idx => idx >= 0)
  );
  const qtyCandidateNames = [...qtyCandidateIdxs].map(idx => header[idx]);
  const warnings = [];
  if (qtyCandidateIdxs.size > 1) {
    warnings.push(`수량 후보 열이 ${qtyCandidateIdxs.size}개 발견됨 (${qtyCandidateNames.join(", ")}) → "${header[qi]}" 열을 사용했습니다`);
  }
  if (li < 0) warnings.push("로트 열을 찾지 못했습니다 — 로트 구분 없이 저장됩니다");
  if (ni < 0) warnings.push("품목명 열을 찾지 못했습니다");

  const lots = [];
  let skippedCode = 0, skippedQty = 0, badQty = 0;
  for (let i=hi+1; i<rows.length; i++) {
    const r = rows[i] || [];
    const code = String(r[ci]||"").trim();
    if (!code || !/^[A-Za-z0-9]{2}/.test(code)) {
      if (code) skippedCode++; /* "...계" 소계 행 등 */
      continue;
    }
    const rawQty = String(r[qi]).replace(/,/g,"").trim();
    const qty = parseFloat(rawQty);
    if (rawQty !== "" && (isNaN(qty) || !isFinite(qty))) { badQty++; continue; }
    if (!qty) { skippedQty++; continue; }
    lots.push({
      c: code,
      n: ni>=0 ? String(r[ni]||"").trim() : "",
      w: wi>=0 ? String(r[wi]||"").trim() : "",
      l: li>=0 ? String(r[li]||"").trim() : "",
      e: ei>=0 ? String(r[ei]||"").trim().slice(0,10) : "",
      q: qty,
    });
  }
  if (!lots.length) throw new Error("유효한 재고 행이 없습니다 — 파일 양식을 확인해 주세요");
  if (badQty > 0) warnings.push(`숫자로 해석할 수 없는 수량 ${badQty}행을 건너뛰었습니다`);

  const meta = {
    qtyCol: header[qi],
    codeCol: header[ci],
    lotCol: li>=0 ? header[li] : null,
    expCol: ei>=0 ? header[ei] : null,
    whCol: wi>=0 ? header[wi] : null,
    dataRows: rows.length - hi - 1,
    parsedRows: lots.length,
    skippedSubtotal: skippedCode,
    skippedZero: skippedQty,
    badQty,
    warnings,
  };
  return { lots, meta };
}

/* ── 작업지시서 파싱: 품목명·수량 행을 추출 (부자재 소요량 섹션은 무시) ── */
function parseWorkOrderWorkbook(wb) {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header:1, raw:false, defval:"" });

  /* 첫 번째 "품목명" 헤더 행 탐색 (부자재 소요량 섹션의 헤더는 무시하기 위해 "총합계" 전까지만 탐색) */
  let hi = -1;
  for (let i=0; i<rows.length; i++) {
    const r = rows[i]||[];
    if (r.some(x=>String(x).trim()==="품목명")) { hi=i; break; }
  }
  if (hi < 0) throw new Error('"품목명" 열을 찾을 수 없습니다. 작업지시서 양식이 맞는지 확인해 주세요.');
  const header = rows[hi].map(x=>String(x).trim());
  const nameIdx = header.indexOf("품목명");
  const qtyIdx = header.indexOf("수량");
  if (qtyIdx < 0) throw new Error('"수량" 열을 찾을 수 없습니다.');

  const lines = [];
  for (let i=hi+1; i<rows.length; i++) {
    const r = rows[i]||[];
    const first = String(r[0]||"").trim();
    if (first.includes("총합계")) break; /* 제품 목록 종료 지점 — 이후는 부자재 소요량 섹션 */
    const name = String(r[nameIdx]||"").trim();
    if (!name) continue;
    const qtyRaw = String(r[qtyIdx]||"").trim();
    const m = qtyRaw.match(/[\d,]+(\.\d+)?/);
    if (!m) continue;
    const qty = parseFloat(m[0].replace(/,/g,""));
    if (!Number.isFinite(qty) || qty <= 0) continue;
    const unit = /kg|킬로그램/i.test(qtyRaw) ? "kg" : "EA";
    lines.push({ rawName: name, qty, unit });
  }
  if (!lines.length) throw new Error("추출된 제품 행이 없습니다. 작업지시서 양식을 확인해 주세요.");
  return lines;
}

/* 매칭용 이름 정규화: 영문 대괄호(원어명)·중국어·기호 제거, 한글/숫자/단위만 남김 */
function normalizeForMatch(s) {
  let t = String(s||"");
  t = t.replace(/\[[^\]]*\]/g, " ");       // [Purifying Foaming Wash] 같은 영문 원어명 제거
  t = t.replace(/[\u4e00-\u9fff]/g, " ");   // 중국어 문자 제거
  t = t.replace(/[^\uac00-\ud7a3a-zA-Z0-9.\s]/g, " "); // 한글·영숫자·점·공백만 남김
  t = t.replace(/\s+/g, " ").trim();
  return t;
}
function tokenizeForMatch(s) {
  return normalizeForMatch(s).split(" ").filter(Boolean);
}
/* 작업지시서 품목명 ↔ 저장된 BOM 이름 사이 토큰 겹침 기반 유사도 매칭 */
function matchBomByName(rawName, bomList) {
  const tokens = new Set(tokenizeForMatch(rawName));
  let best = null, bestScore = 0;
  bomList.forEach(b => {
    const bTokens = tokenizeForMatch(b.name);
    if (!bTokens.length) return;
    let common = 0;
    bTokens.forEach(t => { if (tokens.has(t)) common++; });
    const score = common / Math.min(tokens.size || 1, bTokens.length);
    if (score > bestScore) { bestScore = score; best = b; }
  });
  return { bom: best, score: bestScore };
}

/* 로트 FEFO 정렬: 유효기한 빠른 순(없으면 뒤로) → 로트번호 순 */
const fefoSort = lots => [...lots].sort((a,b)=>{
  if (a.e && b.e) return a.e.localeCompare(b.e) || a.l.localeCompare(b.l);
  if (a.e) return -1;
  if (b.e) return 1;
  return a.l.localeCompare(b.l);
});

/* 소요량을 로트별로 FEFO 배분 (excluded 로트는 사용 안 함) */
function allocateLots(lots, required, excluded) {
  const exSet = excluded || new Set();
  const usable = fefoSort(lots.filter(l => !exSet.has(l.id)));
  let remain = required;
  const usedMap = new Map();
  for (const lot of usable) {
    const u = Math.min(lot.q, Math.max(0, remain));
    usedMap.set(lot.id, u);
    remain -= u;
  }
  return fefoSort(lots).map(lot => {
    const isExcluded = exSet.has(lot.id);
    const u = usedMap.get(lot.id) ?? 0;
    return {
      ...lot,
      use: isExcluded ? null : u,
      left: isExcluded ? null : lot.q - u,
      excluded: isExcluded,
    };
  });
}

function ItemSearch({ items, onPick }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef(null);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return items.filter(i => i.code.toLowerCase().includes(t) || i.name.toLowerCase().includes(t)).slice(0,30);
  }, [q, items]);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const openDropdown = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 300 && rect.top > spaceBelow);
    }
    setOpen(true);
  };
  return (
    <div ref={ref} style={{position:"relative", flex:1, minWidth:220}}>
      <input style={inp} placeholder="부자재 코드 또는 이름 검색…" value={q}
        onFocus={openDropdown}
        onChange={e=>{ setQ(e.target.value); openDropdown(); }} />
      {open && results.length > 0 && (
        <div style={{
          position:"absolute", left:0, right:0, zIndex:30,
          ...(dropUp ? {bottom:"calc(100% + 4px)"} : {top:"calc(100% + 4px)"}),
          background:"#fff", border:"1px solid #DDE4E2", borderRadius:10,
          boxShadow:"0 8px 24px rgba(21,32,31,.12)", maxHeight:280, overflowY:"auto",
        }}>
          {results.map(i => (
            <div key={i.code}
              onClick={()=>{ onPick(i); setQ(""); setOpen(false); }}
              style={{padding:"9px 12px", cursor:"pointer", borderBottom:"1px solid #F4F6F5"}}
              onMouseOver={e=>e.currentTarget.style.background="#E3F0EC"}
              onMouseOut={e=>e.currentTarget.style.background="transparent"}>
              <div style={{fontSize:13, fontWeight:600}}>{i.name}</div>
              <div style={{fontSize:12, color:"#5C6B69", fontFamily:"monospace"}}>
                {i.code} · 3PL {fmt(i.t3)} / 이카운트 {fmt(i.te)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 발주용 BOM 검색 콤보 (제품 이름 검색) ── */
function BomSearch({ boms, value, onPick, onClear }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const selected = boms.find(b => b.id === value);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return boms.slice(0, 50);
    return boms.filter(b => b.name.toLowerCase().includes(t)).slice(0, 50);
  }, [q, boms]);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // value가 외부에서 비워질 때(추가 후) 검색어도 초기화
  useEffect(() => { if (!value) setQ(""); }, [value]);

  // 열릴 때 화면 아래 공간이 부족하면 위로 펼침
  const openDropdown = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setDropUp(spaceBelow < 320 && spaceAbove > spaceBelow);
    }
    setOpen(true);
  };

  return (
    <div ref={ref} style={{position:"relative", flex:2, minWidth:220}}>
      <input ref={inputRef} style={{...inp, paddingRight: selected ? 32 : 11}}
        placeholder="제품 이름으로 검색…"
        value={open ? q : (selected?.name || q)}
        onFocus={()=>{ if (selected) setQ(""); openDropdown(); }}
        onChange={e=>{ setQ(e.target.value); openDropdown(); if (selected) onPick(""); }} />
      {selected && !open && (
        <button onClick={()=>{ setQ(""); onClear && onClear(); inputRef.current?.focus(); }}
          style={{
            position:"absolute", right:6, top:"50%", transform:"translateY(-50%)",
            border:"none", background:"transparent", color:"#5C6B69", cursor:"pointer",
            fontSize:16, padding:"4px 8px", lineHeight:1,
          }}>×</button>
      )}
      {open && (
        <div style={{
          position:"absolute", left:0, right:0, zIndex:30,
          ...(dropUp ? {bottom:"calc(100% + 4px)"} : {top:"calc(100% + 4px)"}),
          background:"#fff", border:"1px solid #DDE4E2", borderRadius:10,
          boxShadow:"0 8px 24px rgba(21,32,31,.12)", maxHeight:300, overflowY:"auto",
        }}>
          {results.length === 0 ? (
            <div style={{padding:"14px 12px", fontSize:13, color:"#8A9694", textAlign:"center"}}>
              일치하는 제품이 없습니다
            </div>
          ) : results.map(b => (
            <div key={b.id}
              onClick={()=>{ onPick(b.id); setOpen(false); setQ(""); }}
              style={{padding:"9px 12px", cursor:"pointer", borderBottom:"1px solid #F4F6F5",
                background: b.id === value ? "#E3F0EC" : "transparent"}}
              onMouseOver={e=>e.currentTarget.style.background="#E3F0EC"}
              onMouseOut={e=>e.currentTarget.style.background = b.id === value ? "#E3F0EC" : "transparent"}>
              <div style={{fontSize:13, fontWeight:600}}>{b.name}</div>
              <div style={{fontSize:11.5, color:"#5C6B69"}}>부자재 {b.components.length}종</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BomEditor({ initial, items, getStock, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [comps, setComps] = useState(initial?.components || []);
  const [isKernel, setIsKernel] = useState(!!initial?.kernelCode);
  const [kernelCode, setKernelCode] = useState(initial?.kernelCode || "");
  const addComp = item => {
    if (comps.some(c => c.code === item.code)) return;
    setComps([...comps, { code:item.code, name:item.name, qty:1 }]);
  };
  const setQty = (code, qty) => setComps(comps.map(c => c.code===code ? {...c,qty} : c));
  const remove = code => setComps(comps.filter(c => c.code!==code));
  const valid = name.trim() && comps.length > 0 && comps.every(c => c.qty > 0) && (!isKernel || kernelCode.trim());
  return (
    <div style={{background:"#fff", border:"1px solid #DDE4E2", borderRadius:14, padding:20}}>
      <div style={{fontSize:15, fontWeight:700, marginBottom:14}}>
        {initial ? "BOM 수정" : "새 제품 BOM 등록"}
      </div>
      <div style={{marginBottom:12}}>
        <label style={{fontSize:12, color:"#5C6B69", fontWeight:600}}>제품 이름</label>
        <input style={{...inp, marginTop:4}} value={name}
          placeholder="예: 허벌 플루이드 50ml 세트"
          onChange={e=>setName(e.target.value)} />
      </div>
      <div style={{
        marginBottom:14, padding:"10px 12px", borderRadius:10,
        background: isKernel ? "#FBF3DE" : "#FAFBFB", border: `1px solid ${isKernel ? "#E0C97A" : "#DDE4E2"}`,
      }}>
        <label style={{display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:600, cursor:"pointer"}}>
          <input type="checkbox" checked={isKernel} onChange={e=>setIsKernel(e.target.checked)} />
          🧩 이 BOM은 알맹이(반제품)입니다 — 다른 키트 BOM에서 이 알맹이를 부자재처럼 참조할 수 있게 됩니다
        </label>
        {isKernel && (
          <div style={{marginTop:8}}>
            <label style={{fontSize:11.5, color:"#7A5500", fontWeight:600}}>
              알맹이 품목코드 (전산에 등록된 재고 코드와 동일해야 자동 재고 조회가 됩니다)
            </label>
            <input style={{...inp, marginTop:4, maxWidth:280}} value={kernelCode}
              placeholder="예: MR370050TG4"
              onChange={e=>setKernelCode(e.target.value.trim())} />
            <div style={{fontSize:11, color:"#7A5500", marginTop:4, lineHeight:1.6}}>
              다른 키트 BOM을 만들 때 부자재 검색창에 이 코드를 입력하면 알맹이로 인식되어,
              발주 시뮬레이션에서 재고 우선 소진 / 강제 전개 / 강제 완제품 중 선택할 수 있습니다.
            </div>
          </div>
        )}
      </div>
      <div style={{marginBottom:10}}>
        <label style={{fontSize:12, color:"#5C6B69", fontWeight:600}}>부자재 추가</label>
        <div style={{display:"flex", gap:8, marginTop:4}}>
          <ItemSearch items={items} onPick={addComp} />
        </div>
      </div>
      {comps.length > 0 && (
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse", fontSize:13, marginTop:8}}>
            <thead>
              <tr style={{color:"#5C6B69", textAlign:"left", background:"#FAFBFB"}}>
                <th style={{padding:"8px 10px", fontWeight:600}}>부자재</th>
                <th style={{padding:"8px 10px", fontWeight:600, width:130}}>1개당 소요량</th>
                <th style={{width:60}}/>
              </tr>
            </thead>
            <tbody>
              {comps.map(c => {
                const s = getStock(c.code);
                return (
                  <tr key={c.code} style={{borderTop:"1px solid #F4F6F5"}}>
                    <td style={{padding:"8px 10px"}}>
                      <div style={{fontWeight:600}}>{c.name}</div>
                      <div style={{fontSize:12, color:"#5C6B69", fontFamily:"monospace"}}>
                        {c.code} · 3PL {fmt(s.t3)} / 이카운트 {fmt(s.te)}
                      </div>
                    </td>
                    <td style={{padding:"8px 10px"}}>
                      <input type="number" min="0.01" step="any" value={c.qty}
                        style={{...inp, padding:"6px 8px"}}
                        onChange={e=>setQty(c.code, parseFloat(e.target.value)||0)} />
                    </td>
                    <td style={{textAlign:"center"}}>
                      <Btn kind="danger" small onClick={()=>remove(c.code)}>삭제</Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{display:"flex", gap:8, marginTop:16}}>
        <Btn onClick={()=>onSave({id:initial?.id||Date.now().toString(36), name:name.trim(), components:comps, kernelCode: isKernel ? kernelCode.trim() : ""})} disabled={!valid}>저장</Btn>
        <Btn kind="plain" onClick={onCancel}>취소</Btn>
      </div>
    </div>
  );
}

async function exportBoms(boms) {
  const data = { version:1, exportedAt: new Date().toISOString(), boms };
  try {
    const downloads = await claude.use("downloads");
    if (!downloads) { alert("이 환경에서는 파일 저장을 지원하지 않습니다."); return false; }
    await downloads.save({
      filename: "BOM_" + new Date().toISOString().slice(0,10) + ".json",
      data: JSON.stringify(data, null, 2),
    });
    return true;
  } catch (ex) {
    if (ex && ex.code === "declined") return false;
    console.error("BOM 내보내기 오류:", ex);
    alert("BOM 내보내기 중 오류가 발생했습니다:\n\n" + (ex && ex.message ? ex.message : ex));
    return false;
  }
}

function ImportBtn({ onImport }) {
  const ref = useRef(null);
  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10*1024*1024) { alert("파일은 10MB 이하여야 합니다."); return; }
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const data = JSON.parse(ev.target.result);
        const boms = data.boms ?? data;
        if (!Array.isArray(boms)) throw new Error();
        await onImport(boms);
      } catch {
        alert("BOM 파일을 읽을 수 없습니다. 올바른 JSON 파일인지 확인해 주세요.");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  };
  return (
    <>
      <input ref={ref} type="file" accept=".json" style={{display:"none"}} onChange={handleFile} />
      <Btn kind="amber" small onClick={()=>ref.current.click()}>📂 BOM 불러오기</Btn>
    </>
  );
}

/* ── 재고 엑셀 업로드 카드 (3PL / 이카운트 각각) ── */
function StockUploadCard({ srcKey, data, prevData, onLoaded, onReset, onRevert, locked }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const total = useMemo(()=>data.lots.reduce((s,l)=>s+l.q,0), [data]);
  const codes = useMemo(()=>new Set(data.lots.map(l=>l.c)).size, [data]);

  const processFile = file => {
    if (!file) return;
    if (file.size > 10*1024*1024) { alert("파일은 10MB 이하여야 합니다."); return; }
    const okExt = /\.(xlsx|xls|csv)$/i.test(file.name);
    if (!okExt) { setErr("엑셀 파일(.xlsx, .xls, .csv)만 가능합니다"); return; }
    setBusy(true); setErr(null);
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const wb = await readWorkbookSafely(ev.target.result);
        const { lots, meta } = parseStockWorkbook(wb);
        await onLoaded({ fileName:file.name, date:new Date().toISOString().slice(0,16).replace("T"," "), lots, meta });
      } catch (ex) {
        setErr(ex.message || "파일 해석 실패");
      }
      setBusy(false);
    };
    reader.onerror = () => { setErr("파일 읽기 실패"); setBusy(false); };
    reader.readAsArrayBuffer(file);
  };

  const handleFile = e => {
    processFile(e.target.files[0]);
    e.target.value = "";
  };
  const handleDrop = e => {
    e.preventDefault(); e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };
  const handleDragOver = e => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
  const handleDragLeave = e => { e.preventDefault(); e.stopPropagation(); setDragOver(false); };

  const tone = srcKey==="p3l" ? "#1D5C8A" : srcKey==="carton" ? "#7B4D1E" : "#0E6E5C";
  const toneSoft = srcKey==="p3l" ? "#E4EEF6" : srcKey==="carton" ? "#F5EDE4" : "#E3F0EC";

  return (
    <div style={{background:"#fff", border:"1px solid #DDE4E2", borderRadius:14, padding:18, flex:1, minWidth:300}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
        <div style={{fontSize:15, fontWeight:800, color:tone}}>{SRC[srcKey]}</div>
        <span style={{
          fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:999,
          background:toneSoft, color:tone,
        }}>{srcKey==="p3l" ? "WMS" : "ERP"}</span>
      </div>
      <div style={{fontSize:12.5, color:"#5C6B69", lineHeight:1.7, marginBottom:12}}>
        파일: <b style={{color:"#15201F"}}>{data.fileName}</b><br/>
        업로드: {data.date}<br/>
        품목 {fmt(codes)}종 · 로트 {fmt(data.lots.length)}건 · 총 {fmt(total)}개
      </div>

      {/* 파싱 리포트 (침묵 실패 방지) */}
      {data.meta && (
        <div style={{fontSize:11.5, background:"#FAFBFB", border:"1px solid #EDF1F0", borderRadius:8,
          padding:"8px 10px", marginBottom:12, lineHeight:1.7, color:"#5C6B69"}}>
          <b style={{color:"#15201F"}}>📋 파싱 결과</b><br/>
          수량 열: <b style={{color:tone}}>{data.meta.qtyCol}</b> · 코드 열: {data.meta.codeCol}
          {data.meta.lotCol && <> · 로트 열: {data.meta.lotCol}</>}<br/>
          데이터 {fmt(data.meta.dataRows)}행 중 {fmt(data.meta.parsedRows)}행 반영
          {data.meta.skippedSubtotal>0 && <> · 소계 등 제외 {fmt(data.meta.skippedSubtotal)}행</>}
          {data.meta.skippedZero>0 && <> · 수량 0 제외 {fmt(data.meta.skippedZero)}행</>}
          {data.meta.warnings.length > 0 && (
            <div style={{marginTop:4, color:"#9A6B00"}}>
              {data.meta.warnings.map((w,i)=><div key={i}>⚠ {w}</div>)}
            </div>
          )}
        </div>
      )}

      {/* 드래그 앤 드롭 영역 */}
      {locked ? <LockedNotice tier={1} label="재고 업로드/초기화" /> : (
      <>
      <div onClick={()=>!busy && ref.current.click()}
        onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${dragOver ? tone : "#C8D2D0"}`,
          background: dragOver ? toneSoft : "#FAFBFB",
          borderRadius: 10, padding: "20px 14px", textAlign:"center",
          cursor: busy ? "wait" : "pointer", transition:"all .15s",
          marginBottom: 10,
        }}>
        <div style={{fontSize:24, marginBottom:4, opacity: dragOver ? 1 : 0.6}}>
          {busy ? "⏳" : dragOver ? "📥" : "📊"}
        </div>
        <div style={{fontSize:13, fontWeight:600, color: dragOver ? tone : "#15201F"}}>
          {busy ? "읽는 중…" : dragOver ? "여기에 놓아주세요" : "엑셀 파일을 끌어다 놓거나 클릭"}
        </div>
        <div style={{fontSize:11.5, color:"#8A9694", marginTop:4}}>.xlsx, .xls, .csv 지원</div>
      </div>
      <input ref={ref} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={handleFile} />

      <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
        {prevData && (
          <Btn kind="amber" small onClick={onRevert}>↶ 직전 데이터로 되돌리기</Btn>
        )}
        <Btn kind="plain" small onClick={()=>{if(confirm('이 재고를 비울까요? 변경 전 재고는 이전 재고로 보관됩니다.'))onReset();}}>재고 비우기</Btn>
      </div>
      </>
      )}
      {prevData && (
        <div style={{marginTop:8, fontSize:11.5, color:"#9A6B00", lineHeight:1.6}}>
          ↶ 되돌리기 가능: <b>{prevData.fileName}</b> ({prevData.date})
        </div>
      )}
      {err && <div style={{marginTop:10, fontSize:12, color:"#C8372D", fontWeight:600}}>⚠ {err}</div>}
      <div style={{marginTop:10, fontSize:11.5, color:"#8A9694", lineHeight:1.6}}>
        품목코드/상품코드 · 수량(재고수량/가용재고) 열이 있으면 자동 인식됩니다.
        로트No.·유효기한·창고명 열이 있으면 로트별로 분할 저장됩니다.
      </div>
    </div>
  );
}

/* 재고 직접 추가 폼: 엑셀 없이 품목코드·부자재명·수량·로트번호를 입력해 즉시 재고 1건 추가 */
function ManualStockAddForm({ onAdd }) {
  const [srcKey, setSrcKey] = useState("p3l");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [lot, setLot] = useState("");
  const [qty, setQty] = useState("");
  const [msg, setMsg] = useState(null);

  const inpS = { ...inp, padding:"9px 11px", fontSize:13 };

  const submit = async () => {
    const c = code.trim();
    const n = name.trim();
    const q = Number(qty);
    if (!c) { setMsg({ t:"err", m:"품목코드를 입력해주세요." }); return; }
    if (!qty || !Number.isFinite(q) || q <= 0) { setMsg({ t:"err", m:"수량은 0보다 큰 숫자여야 합니다." }); return; }
    if (!await onAdd(srcKey, { c, n: n || c, w: warehouse.trim(), l: lot.trim(), e:"", q })) return;
    setMsg(null);
    setCode(""); setName(""); setWarehouse(""); setLot(""); setQty("");
  };

  return (
    <div style={{
      background:"#fff", border:"1px solid #DDE4E2", borderRadius:14, padding:16,
      marginTop:18, maxWidth:640,
    }}>
      <div style={{fontSize:14, fontWeight:700, marginBottom:4}}>✍️ 재고 직접 추가</div>
      <div style={{fontSize:11.5, color:"#8A9694", marginBottom:12, lineHeight:1.6}}>
        엑셀 업로드 없이 품목코드·부자재명·수량·로트번호를 입력해 재고 1건을 즉시 추가합니다.
        기존 재고는 그대로 유지되고 새 로트가 추가됩니다.
      </div>

      <div style={{display:"flex", gap:6, marginBottom:10}}>
        {["p3l","ecount","carton"].map(k => (
          <button key={k} onClick={()=>setSrcKey(k)}
            style={{
              padding:"6px 12px", borderRadius:8, fontSize:12.5, fontWeight:700, cursor:"pointer",
              border: srcKey===k ? "1.5px solid #15201F" : "1px solid #DDE4E2",
              background: srcKey===k ? "#15201F" : "#fff",
              color: srcKey===k ? "#fff" : "#5C6B69",
            }}>{SRC[k]}</button>
        ))}
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8}}>
        <div>
          <label style={{fontSize:11.5, color:"#5C6B69", fontWeight:600}}>품목코드 *</label>
          <input style={inpS} value={code} onChange={e=>setCode(e.target.value)} placeholder="예: MR390000PP4" />
        </div>
        <div>
          <label style={{fontSize:11.5, color:"#5C6B69", fontWeight:600}}>부자재명</label>
          <input style={inpS} value={name} onChange={e=>setName(e.target.value)} placeholder="비워두면 품목코드로 표시" />
        </div>
        <div>
          <label style={{fontSize:11.5, color:"#5C6B69", fontWeight:600}}>수량 *</label>
          <input style={inpS} type="number" value={qty} onChange={e=>setQty(e.target.value)} placeholder="예: 500" />
        </div>
        <div>
          <label style={{fontSize:11.5, color:"#5C6B69", fontWeight:600}}>로트/시리얼 No.</label>
          <input style={inpS} value={lot} onChange={e=>setLot(e.target.value)} placeholder="선택 입력" />
        </div>
        <div style={{gridColumn:"1 / -1"}}>
          <label style={{fontSize:11.5, color:"#5C6B69", fontWeight:600}}>창고명 (선택)</label>
          <input style={inpS} value={warehouse} onChange={e=>setWarehouse(e.target.value)} placeholder="예: 3PL A존, 본사 (부자재 창고) 등" />
        </div>
      </div>

      {msg && (
        <div style={{fontSize:12, fontWeight:600, marginBottom:8, color: msg.t==="err" ? "#C8372D" : "#0E6E5C"}}>
          {msg.t==="err" ? "⚠ " : "✓ "}{msg.m}
        </div>
      )}

      <Btn kind="primary" small onClick={submit}>+ {SRC[srcKey]}에 재고 추가</Btn>
    </div>
  );
}

/* ── 로트 상세 테이블 (FEFO 배분 표시) ── */
function LotTable({ lots, required, allocations, showSource, excluded, onToggle, onSelectAll, onAllocChange, onResetAlloc, searchHighlight }) {
  let alloc;
  if (allocations) {
    alloc = allocations;
  } else if (required != null) {
    alloc = allocateLots(lots, required, excluded);
  } else {
    alloc = fefoSort(lots).map(l=>({...l, use:null, left:null, excluded: excluded?.has(l.id) ?? false}));
  }
  const interactive = !!onToggle;
  const editable = !!onAllocChange;
  const allOn = interactive && lots.every(l => !excluded?.has(l.id));
  const allOff = interactive && lots.every(l => excluded?.has(l.id));
  const hasUseCol = alloc.some(a => a.use != null);
  const hasManual = alloc.some(a => a.manual);
  return (
    <div>
      {(interactive || (editable && hasManual)) && (
        <div style={{display:"flex", gap:6, marginBottom:6, fontSize:11.5, flexWrap:"wrap"}}>
          {interactive && lots.length > 1 && (
            <>
              <button onClick={()=>onSelectAll(true)} disabled={allOn}
                style={{border:"1px solid #DDE4E2", background: allOn?"#F4F6F5":"#fff",
                  color: allOn?"#B9C2C0":"#15201F", padding:"3px 8px", borderRadius:5,
                  cursor:allOn?"default":"pointer", fontFamily:"inherit", fontSize:11.5, fontWeight:600}}>
                모두 사용
              </button>
              <button onClick={()=>onSelectAll(false)} disabled={allOff}
                style={{border:"1px solid #DDE4E2", background: allOff?"#F4F6F5":"#fff",
                  color: allOff?"#B9C2C0":"#15201F", padding:"3px 8px", borderRadius:5,
                  cursor:allOff?"default":"pointer", fontFamily:"inherit", fontSize:11.5, fontWeight:600}}>
                모두 제외
              </button>
            </>
          )}
          {editable && hasManual && onResetAlloc && (
            <button onClick={onResetAlloc}
              style={{border:"1px solid #E0C97A", background:"#FBF3DE", color:"#7A5500",
                padding:"3px 10px", borderRadius:5, cursor:"pointer",
                fontFamily:"inherit", fontSize:11.5, fontWeight:700}}>
              ↺ 자동 배분으로 초기화
            </button>
          )}
        </div>
      )}
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%", borderCollapse:"collapse", fontSize:12.5, minWidth: hasUseCol ? 520 : 320}}>
          <thead>
            <tr style={{color:"#5C6B69", background:"#F4F6F5", textAlign:"right"}}>
              {interactive && <th style={{padding:"7px 8px", width:30}}></th>}
              {showSource && <th style={{padding:"7px 10px", textAlign:"left", fontWeight:600}}>전산</th>}
              <th style={{padding:"7px 10px", textAlign:"left", fontWeight:600}}>로트/시리얼 No.</th>
              <th style={{padding:"7px 10px", fontWeight:600}}>보유</th>
              {hasUseCol && <th style={{padding:"7px 10px", fontWeight:600}}>사용{editable && " (입력 가능)"}</th>}
              {hasUseCol && <th style={{padding:"7px 10px", fontWeight:600}}>사용 후 잔여</th>}
            </tr>
          </thead>
          <tbody>
            {alloc.map((l,idx)=>{
              const dim = l.excluded;
              const overUse = l.left != null && l.left < 0;
              const hl = searchHighlight && l.l && l.l.toLowerCase().includes(searchHighlight.toLowerCase());
              return (
                <tr key={l.id || idx} style={{
                  borderTop:"1px solid #EDF1F0",
                  background: dim ? "#F4F6F5"
                    : (hl ? "#FFF8B8"
                    : (l.manual ? "#FFF8E1"
                    : (l.use>0 ? "#FFFBEB" : "transparent"))),
                  color: dim ? "#8A9694" : "inherit",
                  textDecoration: dim ? "line-through" : "none",
                  outline: hl && !dim ? "2px solid #E5C100" : "none",
                  outlineOffset: hl && !dim ? "-2px" : 0,
                }}>
                  {interactive && <td style={{padding:"7px 8px", textAlign:"center", textDecoration:"none"}}>
                    <input type="checkbox" checked={!dim} onChange={()=>onToggle(l.id)}
                      style={{cursor:"pointer", width:14, height:14, accentColor:"#0E6E5C"}} />
                  </td>}
                  {showSource && <td style={{padding:"7px 10px", textDecoration:"none"}}>
                    <span style={{fontSize:11, fontWeight:700, padding:"2px 6px", borderRadius:4,
                      background:l.src==="p3l"?"#E4EEF6":l.src==="carton"?"#F5EDE4":"#E3F0EC",
                      color:l.src==="p3l"?"#1D5C8A":l.src==="carton"?"#7B4D1E":"#0E6E5C",
                      opacity: dim?0.5:1}}>
                      {l.src==="p3l"?"3PL":l.src==="carton"?"카톤박스":"이카운트"}
                    </span>
                  </td>}
                  <td style={{padding:"7px 10px", fontFamily:"monospace"}}>
                    {l.l || "-"}
                    {l.manual && !dim && <span style={{marginLeft:6, fontSize:10, fontWeight:700, color:"#9A6B00", background:"#FBF3DE", padding:"1px 5px", borderRadius:4, textDecoration:"none"}}>수동</span>}
                  </td>
                  <td style={{padding:"7px 10px", textAlign:"right", fontVariantNumeric:"tabular-nums"}}>{fmt(l.q)}</td>
                  {hasUseCol && (
                    <td style={{padding:"4px 10px", textAlign:"right", textDecoration:"none"}}>
                      {dim ? (
                        <span style={{color:"#B9C2C0"}}>제외</span>
                      ) : editable ? (
                        <div style={{display:"inline-flex", flexDirection:"column", alignItems:"flex-end", gap:2}}>
                          <input type="number" min="0" max={l.q} step="1"
                            value={l.manual ? (l.manualWant ?? 0) : (l.use ?? 0)}
                            onChange={e=>{
                              const v = parseFloat(e.target.value);
                              onAllocChange(l.id, isNaN(v) ? 0 : Math.min(Math.max(0, v), l.q));
                            }}
                            onClick={e=>e.stopPropagation()}
                            style={{
                              width:84, textAlign:"right",
                              border: l.conflictQty > 0 ? "1.5px solid #C8372D" : (l.manual ? "1.5px solid #9A6B00" : "1px solid #DDE4E2"),
                              background: l.conflictQty > 0 ? "#FBEAE8" : (l.manual ? "#FFFBEB" : "#fff"),
                              color: l.conflictQty > 0 ? "#C8372D" : (l.use>0 ? "#9A6B00" : "#5C6B69"),
                              fontWeight: l.use>0 || l.conflictQty>0 ? 700 : 400,
                              padding:"4px 8px", borderRadius:5,
                              fontFamily:"inherit", fontSize:12.5,
                              fontVariantNumeric:"tabular-nums",
                            }} />
                          {l.conflictQty > 0 && (
                            <span style={{fontSize:10.5, fontWeight:700, color:"#fff", background:"#C8372D",
                              padding:"1px 6px", borderRadius:4, whiteSpace:"nowrap"}}>
                              ⚠ {fmt(l.conflictQty)}개 차단 → 실사용 {fmt(l.use)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{fontWeight:l.use>0?700:400, color:l.use>0?"#9A6B00":"#B9C2C0", fontVariantNumeric:"tabular-nums"}}>
                          {l.use>0 ? fmt(l.use) : "-"}
                        </span>
                      )}
                    </td>
                  )}
                  {hasUseCol && (
                    <td style={{padding:"7px 10px", textAlign:"right", fontVariantNumeric:"tabular-nums",
                      color: overUse ? "#C8372D" : "inherit", fontWeight: overUse ? 700 : 400}}>
                      {dim ? "-" : fmt(l.left)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* index.html과 같은 Firebase 프로젝트를 공유 -- 로그인 계정/권한(roles/{uid}.tier)도 그대로 재사용된다 */
function getFirebaseApp() {
  var firebaseConfig = {
    apiKey: "AIzaSyDHSvdVLhkOHWs1whqkJ4pyol69S6P5C4M",
    authDomain: "warehouse-inventory-84fef.firebaseapp.com",
    projectId: "warehouse-inventory-84fef",
    storageBucket: "warehouse-inventory-84fef.firebasestorage.app",
    messagingSenderId: "148799748197",
    appId: "1:148799748197:web:01f8b6022b7e471e306e8c"
  };
  return firebase.apps.length ? firebase.apps[0] : firebase.initializeApp(firebaseConfig);
}

function LoginModal({ onClose, onLogin, onSignup, error, busy }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submit = () => (mode === "login" ? onLogin : onSignup)(email.trim(), password);
  const fieldStyle = { padding:"9px 11px", border:"1px solid #DDE4E2", borderRadius:8, fontSize:14 };
  return (
    <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:1000}}
      onClick={e=>{ if (e.target === e.currentTarget) onClose(); }}>
      <div style={{background:"#fff", borderRadius:14, padding:24, width:"min(340px,90vw)",
        display:"flex", flexDirection:"column", gap:12}}>
        <div style={{fontSize:17, fontWeight:800}}>{mode === "login" ? "관리자 로그인" : "관리자 계정 가입"}</div>
        <input type="email" placeholder="이메일" autoComplete="username" style={fieldStyle}
          value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" placeholder="비밀번호 (6자 이상)" autoComplete={mode === "login" ? "current-password" : "new-password"} style={fieldStyle}
          value={password} onChange={e=>setPassword(e.target.value)}
          onKeyDown={e=>{ if (e.key==="Enter") submit(); }} />
        {error && <div style={{fontSize:12.5, color:"#C8372D"}}>{error}</div>}
        {mode === "signup" && (
          <div style={{fontSize:12, color:"#9A6B00"}}>가입 후에도 실제 권한(1/2단계)은 관리자가 별도로 부여해야 기능이 열립니다.</div>
        )}
        <div style={{display:"flex", gap:8, justifyContent:"space-between", alignItems:"center"}}>
          <Btn kind="ghost" small onClick={()=>setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "계정 가입" : "로그인으로"}
          </Btn>
          <div style={{display:"flex", gap:8}}>
            <Btn kind="ghost" onClick={onClose}>취소</Btn>
            <Btn onClick={submit} disabled={busy}>{mode === "login" ? "로그인" : "가입하기"}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthBox({ user, tier, onLoginClick, onLogout }) {
  if (!user) return <Btn kind="ghost" small onClick={onLoginClick}>🔒 관리자 로그인</Btn>;
  const tierLabel = tier === 2 ? "2단계 관리자" : tier === 1 ? "1단계 관리자" : "권한 없음";
  return (
    <div style={{display:"flex", alignItems:"center", gap:8, fontSize:12.5, color:"#5C6B69"}}>
      <span>{user.email} · {tierLabel}</span>
      <Btn kind="ghost" small onClick={onLogout}>로그아웃</Btn>
    </div>
  );
}

function LockedNotice({ tier, label }) {
  return (
    <div style={{fontSize:12, color:"#9A6B00", background:"#FBF3DE", border:"1px solid #E0C97A",
      borderRadius:8, padding:"8px 10px"}}>
      🔒 {label ? label + "은(는) " : ""}{tier}단계 로그인 후 이용할 수 있습니다.
    </div>
  );
}

function App() {
  const [tab, setTab] = useState("plan");
  const emptyStock = () => Object.fromEntries(['p3l','ecount','carton'].map(k=>[k,{fileName:'(데이터 없음)',date:'',lots:[]}]));
  const [boms,setBoms]=useState([]);
  const [stock,setStock]=useState(emptyStock);
  const [basis,setBasis]=useState('ecount');
  const [dedup,setDedup]=useState(true);
  const [prevStock,setPrevStock]=useState({p3l:null,ecount:null,carton:null});
  const [authUser,setAuthUser]=useState(null);
  const [authTier,setAuthTier]=useState(0);
  const [authReady,setAuthReady]=useState(false);
  const [dataReady,setDataReady]=useState(false);
  const [accessError,setAccessError]=useState('');
  const [loginOpen,setLoginOpen]=useState(false);
  const [loginError,setLoginError]=useState('');
  const [loginBusy,setLoginBusy]=useState(false);
  const [saving,setSaving]=useState(false);
  const savingRef=useRef(false), revisions=useRef({}), editRevision=useRef(0);
  const [editing, setEditing] = useState(null);
  const [order, setOrder] = useState([]);
  const [selBom, setSelBom] = useState("");
  const [selQty, setSelQty] = useState(1000);
  const [stockQ, setStockQ] = useState("");
  const [expanded, setExpanded] = useState({});     // 소요내역 행 펼침
  const [expandedStk, setExpandedStk] = useState({}); // 재고조회 행 펼침
  const [excluded, setExcluded] = useState(() => new Set()); // 계산에서 제외된 로트 ID
  const [manualAlloc, setManualAlloc] = useState({}); // {lineId: {code: {lotId: qty}}} 수동 배분
  const [partMode, setPartMode] = useState({}); // {lineId: {kernelCode: "auto"|"force_expand"|"force_finished"}} 알맹이 처리 방식 라인별 강제 전환
  const [viewMode, setViewMode] = useState("agg"); // "agg"(통합) | "line"(라인별)
  const [toasts, setToasts] = useState([]); // 여러 알림이 쌓이도록 배열로 관리

  const showToast = (msg, color="#0E6E5C") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, color }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  };

  const dbRef=useRef(null);
  useEffect(()=>{
    const app=getFirebaseApp(),db=firebase.firestore(app);
    dbRef.current=db;
    let stops=[],epoch=0,lastKey='';
    const clear=()=>{
      stops.forEach(stop=>stop());stops=[];revisions.current={};
      setBoms([]);setStock(emptyStock());setPrevStock({p3l:null,ecount:null,carton:null});
      setOrder([]);setEditing(null);setManualAlloc({});setExcluded(new Set());setDataReady(false);
      setExpanded({});setExpandedStk({});setPartMode({});setWoReview(null);setImportedScenarios(new Set());
    };
    InventorySecurity.start(app,identity=>{
      setAuthUser(identity.user?{email:identity.user.email,uid:identity.user.uid}:null);
      setAuthTier(identity.tier);setAuthReady(identity.ready);
      setAccessError(identity.error?'권한을 확인할 수 없습니다. 다시 로그인해 주세요.':'');
      const key=identity.user?identity.user.uid+':'+identity.tier:'';
      if(key===lastKey)return;
      lastKey=key;const current=++epoch;clear();
      if(identity.tier<1)return;
      const paths=['boms/list','stock/p3l','stock/ecount','stock/carton','stockPrev/p3l','stockPrev/ecount','stockPrev/carton','settings/app'];
      const loaded=new Set();
      paths.forEach(path=>stops.push(db.doc(path).onSnapshot(snap=>{
        if(current!==epoch)return;
        const d=snap.exists?snap.data():null;
        revisions.current[path]=d?d._revision||0:0;
        const [collection,id]=path.split('/');
        if(collection==='boms')setBoms(d&&Array.isArray(d.boms)?d.boms:[]);
        if(collection==='stock')setStock(old=>({...old,[id]:d&&Array.isArray(d.lots)?d:emptyStock()[id]}));
        if(collection==='stockPrev')setPrevStock(old=>({...old,[id]:d&&Array.isArray(d.lots)?d:null}));
        if(collection==='settings'&&d){setBasis(d.basis||'ecount');setDedup(d.dedup!==false);}
        loaded.add(path);if(loaded.size===paths.length)setDataReady(true);
      },()=>{if(current!==epoch)return;++epoch;clear();setAccessError('데이터를 불러올 수 없습니다. 다시 로그인해 주세요.');})));
    });
    return ()=>{++epoch;stops.forEach(stop=>stop());};
  },[]);

  const doLogin=async(email,password)=>{
    setLoginBusy(true);setLoginError('');
    try{
      await firebase.auth(getFirebaseApp()).setPersistence(firebase.auth.Auth.Persistence.SESSION);
      await firebase.auth(getFirebaseApp()).signInWithEmailAndPassword(email,password);
      setLoginOpen(false);
    }catch(e){setLoginError('이메일 또는 비밀번호가 올바르지 않습니다.');}
    finally{setLoginBusy(false);}
  };
  const doSignup=async(email,password)=>{
    setLoginBusy(true);setLoginError('');
    try{
      await firebase.auth(getFirebaseApp()).setPersistence(firebase.auth.Auth.Persistence.SESSION);
      await firebase.auth(getFirebaseApp()).createUserWithEmailAndPassword(email,password);
      setLoginOpen(false);showToast('가입되었습니다. 관리자에게 권한 부여를 요청하세요.');
    }catch(e){setLoginError('가입하지 못했습니다. 입력 내용을 확인하거나 관리자에게 문의해 주세요.');}
    finally{setLoginBusy(false);}
  };
  const doLogout=()=>firebase.auth(getFirebaseApp()).signOut();
  const canEditStock=authTier>=1&&dataReady;
  const canEditBom=authTier===2&&dataReady;
  useEffect(()=>{editRevision.current=revisions.current['boms/list']||0;},[editing]);
  useEffect(()=>{if(authTier!==2)setEditing(null);},[authTier]);

  const commit=async mutations=>{
    if(savingRef.current){showToast('저장 중입니다. 잠시 기다려 주세요.','#9A6B00');return false;}
    savingRef.current=true;setSaving(true);
    try{
      await InventorySecurity.save(mutations);
      // Wait for authoritative snapshots instead of optimistic local success or rollback.
      await Promise.all(mutations.map(async m=>{
        const snap=await dbRef.current.doc(m.path).get({source:'server'});
        revisions.current[m.path]=snap.data()?._revision||0;
        const d=snap.data(),[collection,id]=m.path.split('/');
        if(collection==='stock')setStock(old=>({...old,[id]:d}));
        if(collection==='boms')setBoms(d.boms);
      }));
      return true;
    }catch(e){showToast(e.message||'저장하지 못했습니다.','#C8372D');return false;}
    finally{savingRef.current=false;setSaving(false);}
  };
  const persistBoms=next=>commit([{path:'boms/list',expectedRevision:editing?editRevision.current:(revisions.current['boms/list']||0),data:{boms:next}}]);
  const updateStockSource=async(srcKey,data)=>{
    const ok=await commit([{path:'stock/'+srcKey,expectedRevision:revisions.current['stock/'+srcKey]||0,data:InventorySecurity.clean(data)}]);
    if(ok)showToast('재고가 저장되었습니다.');
    return ok;
  };
  const revertStockSource=async srcKey=>{
    if(!prevStock[srcKey])return false;
    const ok=await commit([{path:'stock/'+srcKey,expectedRevision:revisions.current['stock/'+srcKey]||0,
      restore:true,backupRevision:revisions.current['stockPrev/'+srcKey]||0}]);
    if(ok)showToast('이전 재고로 복원했습니다. 변경 전 재고도 보관됩니다.');
    return ok;
  };
  const addManualLot=(srcKey,lot)=>updateStockSource(srcKey,{...stock[srcKey],lots:[...stock[srcKey].lots,lot]});
  const setBasisP=async b=>{if(await commit([{path:'settings/app',expectedRevision:revisions.current['settings/app']||0,data:{basis:b,dedup}}]))setBasis(b);};
  const setDedupP=async v=>{if(await commit([{path:'settings/app',expectedRevision:revisions.current['settings/app']||0,data:{basis,dedup:v}}]))setDedup(v);};

  /* 합산 시 중복 제거 대상: 이카운트 전산의 "3PL" 창고 로트 */
  const isDupLot = l => l.src === "ecount" && l.w && l.w.includes("3PL");

  /* ── 전산별 품목 집계: code → {name, total, lots[]} ── */
  const agg = useMemo(() => {
    const build = (lots, src) => {
      const m = {};
      lots.forEach(l => {
        if (!m[l.c]) m[l.c] = { name:l.n, total:0, lots:[] };
        const idx = m[l.c].lots.length;
        m[l.c].total += l.q;
        m[l.c].lots.push({ ...l, src, id: `${src}:${l.c}:${idx}` });
        if (!m[l.c].name && l.n) m[l.c].name = l.n;
      });
      return m;
    };
    return {
      p3l: build(stock.p3l.lots, "p3l"),
      ecount: build(stock.ecount.lots, "ecount"),
      carton: build((stock.carton?.lots || []), "carton"),
    };
  }, [stock]);

  /* 통합 품목 마스터 (검색용) */
  const items = useMemo(() => {
    const codes = new Set([...Object.keys(agg.p3l), ...Object.keys(agg.ecount), ...Object.keys(agg.carton)]);
    return [...codes].map(code => ({
      code,
      name: agg.ecount[code]?.name || agg.p3l[code]?.name || agg.carton[code]?.name || code,
      t3: agg.p3l[code]?.total ?? 0,
      te: agg.ecount[code]?.total ?? 0,
      tc: agg.carton[code]?.total ?? 0,
    })).sort((a,b)=>a.code.localeCompare(b.code));
  }, [agg]);

  /* 알맹이(반제품) BOM 조회 테이블: 알맹이 품목코드 → 그 알맹이의 BOM */
  const kernelByCode = useMemo(() => {
    const m = {};
    boms.forEach(b => { if (b.kernelCode) m[b.kernelCode] = b; });
    return m;
  }, [boms]);

  /* 기준 재고 조회: basis에 따라 수량·로트 결정 (제외 로트 차감, 합산 시 중복 제거) */
  const getStock = code => {
    const t3 = agg.p3l[code]?.total ?? 0;
    const te = agg.ecount[code]?.total ?? 0;
    const tc = agg.carton[code]?.total ?? 0;
    const l3 = agg.p3l[code]?.lots ?? [];
    const le = agg.ecount[code]?.lots ?? [];
    const lc = agg.carton[code]?.lots ?? [];
    let lots;
    if (basis==="p3l") lots = l3;
    else if (basis==="ecount") lots = le;
    else {
      lots = dedup
        ? [...l3, ...le.filter(l => !isDupLot(l)), ...lc]
        : [...l3, ...le, ...lc];
    }
    const used = lots.reduce((s,l) => s + (excluded.has(l.id) ? 0 : l.q), 0);
    return { t3, te, tc, used, lots };
  };

  /* 합산 모드 중복 제거 현황 (안내용) */
  const dedupInfo = useMemo(() => {
    let lotCount = 0, qty = 0;
    Object.values(agg.ecount).forEach(item => {
      item.lots.forEach(l => { if (isDupLot(l)) { lotCount++; qty += l.q; } });
    });
    return { lotCount, qty };
  }, [agg]);

  const toggleLot = id => setExcluded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const setLotsExcluded = (ids, exclude) => setExcluded(prev => {
    const next = new Set(prev);
    ids.forEach(id => { if (exclude) next.add(id); else next.delete(id); });
    return next;
  });

  /* 수동 배분 setter */
  const setManualUse = (lineId, code, lotId, qty) => {
    setManualAlloc(prev => {
      const next = { ...prev };
      next[lineId] = { ...(next[lineId] || {}) };
      next[lineId][code] = { ...(next[lineId][code] || {}) };
      next[lineId][code][lotId] = qty;
      return next;
    });
  };
  const resetLineComponent = (lineId, code) => {
    setManualAlloc(prev => {
      if (!prev[lineId]?.[code]) return prev;
      const next = { ...prev };
      next[lineId] = { ...next[lineId] };
      delete next[lineId][code];
      if (Object.keys(next[lineId]).length === 0) delete next[lineId];
      return next;
    });
  };
  /* 알맹이 처리 방식 라인별 강제 전환: auto(재고 우선+부족분 자동전개) / force_expand(전량 부자재 전개) / force_finished(전량 알맹이 재고로만, 전개 안 함) */
  const setKernelMode = (lineId, code, mode) => {
    setPartMode(prev => {
      const next = { ...prev };
      if (mode === "auto") {
        // 기본값이므로 굳이 저장하지 않고 지워서 상태를 단순하게 유지
        if (!next[lineId]) return prev;
        next[lineId] = { ...next[lineId] };
        delete next[lineId][code];
        if (Object.keys(next[lineId]).length === 0) delete next[lineId];
        return next;
      }
      next[lineId] = { ...(next[lineId] || {}), [code]: mode };
      return next;
    });
  };

  const saveBom = async bom => {
    const next = boms.some(b=>b.id===bom.id) ? boms.map(b=>b.id===bom.id?bom:b) : [...boms,bom];
    if (!await persistBoms(next)) return;
    setEditing(null);
    showToast("BOM이 저장되었습니다.");
  };
  const deleteBom = async id => {
    if (!await persistBoms(boms.filter(b=>b.id!==id))) return;
    setOrder(order.filter(o=>o.bomId!==id));
  };
  const deleteAllBoms = async () => {
    if (!await persistBoms([])) return;
    setOrder([]); // 삭제된 BOM을 참조하는 발주 라인도 함께 비움
    showToast("모든 BOM을 삭제했습니다.");
  };
  const handleImport = async imported => {
    const merged = [...boms];
    let added=0, updated=0, skippedName=0;
    imported.forEach(b => {
      const idx = merged.findIndex(x=>x.id===b.id);
      if (idx>=0) { merged[idx]=b; updated++; return; }
      const nameIdx = merged.findIndex(x => x.name.trim() === b.name.trim());
      if (nameIdx>=0) { skippedName++; return; } // 이름이 같은 BOM이 이미 있으면 자동으로 추가하지 않음
      merged.push(b); added++;
    });
    if (!await persistBoms(merged)) return;
    showToast(
      `불러오기 완료 — 추가 ${added}개, 업데이트 ${updated}개` +
      (skippedName>0 ? `, 이름 중복으로 건너뜀 ${skippedName}개` : "")
    );
  };

  /* ── 발주 계산 ── */
  const calc = useMemo(() => {
    const lines = order.map(o=>({...o, bom:boms.find(b=>b.id===o.bomId)})).filter(o=>o.bom&&o.qty>0);
    if (!lines.length) return null;

    /* Phase 0: 알맹이(반제품) 해석 — 재고 우선 소진 후 부족분을 하위 부자재로 전개 (라인 순서대로 알맹이 재고를 순차 소진) */
    const kernelLotsByCode = {};
    const kernelRemainByLot = {};
    const ensureKernelLots = code => {
      if (!kernelLotsByCode[code]) {
        const lots = fefoSort(getStock(code).lots);
        kernelLotsByCode[code] = lots;
        kernelRemainByLot[code] = {};
        lots.forEach(l => { kernelRemainByLot[code][l.id] = excluded.has(l.id) ? 0 : l.q; });
      }
    };
    const MAX_KERNEL_DEPTH = 5; // 알맹이 안에 또 알맹이가 있는 경우 대비한 안전장치(무한루프 방지)
    const resolvedByLine = lines.map(line => {
      const resolved = []; // {code,name,required,isKernel,kernelMode,kernelFullRequired,kernelExpanded,expandedFrom}
      const pushPlain = (code, name, required, expandedFrom) => {
        const existing = resolved.find(r => r.code===code && !r.isKernel);
        if (existing) { existing.required += required; if (expandedFrom && !existing.expandedFrom) existing.expandedFrom = expandedFrom; return; }
        resolved.push({ code, name, required, isKernel:false, expandedFrom: expandedFrom||null });
      };
      const queue = line.bom.components.map(c => ({
        code:c.code, name:c.name, required: c.qty*line.qty, depth:0, expandedFrom:null,
      }));
      while (queue.length) {
        const item = queue.shift();
        const kb = kernelByCode[item.code];
        if (!kb || item.depth >= MAX_KERNEL_DEPTH) { pushPlain(item.code, item.name, item.required, item.expandedFrom); continue; }

        const mode = partMode[line.id]?.[item.code] || "auto";
        if (mode === "force_finished") {
          resolved.push({
            code:item.code, name:item.name, required: item.required,
            isKernel:true, kernelMode:mode, kernelFullRequired:item.required, kernelExpanded:false,
            expandedFrom: item.expandedFrom,
          });
          continue;
        }

        let used = 0, shortfall;
        if (mode === "force_expand") {
          shortfall = item.required; // 알맹이 재고 사용 안 함 — 전량 하위 부자재로 전개
        } else { // auto
          ensureKernelLots(item.code);
          let remain = item.required;
          for (const lot of kernelLotsByCode[item.code]) {
            if (remain <= 0) break;
            const avail = kernelRemainByLot[item.code][lot.id] ?? 0;
            if (avail <= 0) continue;
            const u = Math.min(avail, remain);
            kernelRemainByLot[item.code][lot.id] = avail - u;
            used += u; remain -= u;
          }
          shortfall = remain;
        }
        if (used > 0 || shortfall > 0) {
          resolved.push({
            code:item.code, name:item.name, required: used,
            isKernel:true, kernelMode:mode, kernelFullRequired:item.required, kernelExpanded: shortfall>0,
            expandedFrom: item.expandedFrom,
          });
        }
        if (shortfall > 0) {
          kb.components.forEach(kc => {
            queue.push({
              code:kc.code, name:kc.name, required: kc.qty*shortfall,
              depth:item.depth+1, expandedFrom: { code:item.code, name:item.name },
            });
          });
        }
      }
      return resolved;
    });

    const need = {};
    resolvedByLine.forEach(resolved => resolved.forEach(c => {
      if (!need[c.code]) need[c.code]={code:c.code, name:c.name, required:0};
      need[c.code].required += c.required;
    }));
    const rows = Object.values(need).map(n => {
      const s = getStock(n.code);
      const remain = s.used - n.required;
      return {...n, t3:s.t3, te:s.te, stock:s.used, lots:s.lots, remain, short: remain<0 ? -remain : 0};
    }).sort((a,b)=>(b.short>0?1:-1)-(a.short>0?1:-1)||a.code.localeCompare(b.code));

    /* 환산재고 카드(단독/동시 생산 가능 수량)는 원본 BOM 기준 — 알맹이 전개는 반영하지 않음(별도 참고용 지표) */
    const perProduct = lines.map(l => {
      let solo=Infinity, after=Infinity, bottleneck="";
      l.bom.components.forEach(c => {
        const s = getStock(c.code).used;
        const totalReq = need[c.code]?.required ?? c.qty*l.qty;
        const othersUse = totalReq - c.qty*l.qty;
        const so = Math.floor(s/c.qty);
        const a = Math.floor(Math.max(0, s-othersUse)/c.qty);
        if(so<solo){solo=so; bottleneck=c.name;}
        if(a<after)after=a;
      });
      return {...l, solo, after, bottleneck, ok:after>=l.qty};
    });

    /* 라인별 순차 FEFO 배분: 수동 배분 → FEFO 자동, 앞 라인 우선 (알맹이 전개로 생긴 부자재 소요도 동일하게 처리) */
    const lotsByCode = {};
    const remainByLot = {}; // code → lotId → 남은 수량(누적 차감, 과배분 시 음수 가능)
    Object.keys(need).forEach(code => {
      const lots = fefoSort(getStock(code).lots);
      lotsByCode[code] = lots;
      remainByLot[code] = {};
      lots.forEach(l => { remainByLot[code][l.id] = excluded.has(l.id) ? 0 : l.q; });
    });
    const conflictByLot = {}; // lotId → 차단된 초과 수량 (수동 배분이 가용량을 넘은 분)
    const lineDetails = lines.map((line, li) => {
      const components = resolvedByLine[li].map(c => {
        const required = c.required;
        const lots = lotsByCode[c.code] ?? [];
        const manuals = manualAlloc[line.id]?.[c.code] ?? {};
        let need_qty = required;
        const lineUse = {}; // lotId → 이 라인이 사용
        const manualLots = new Set(Object.keys(manuals));

        // Phase 1: 수동 배분 적용 — 가용량 초과분은 자동 차단(충돌 기록)
        for (const lot of lots) {
          if (excluded.has(lot.id)) continue;
          if (!manualLots.has(lot.id)) continue;
          const want = Math.max(0, manuals[lot.id] || 0);
          const avail = Math.max(0, remainByLot[c.code][lot.id] ?? 0);
          const u = Math.min(want, avail);
          lineUse[lot.id] = u;
          if (want > avail) {
            conflictByLot[lot.id] = (conflictByLot[lot.id] ?? 0) + (want - avail);
          }
          remainByLot[c.code][lot.id] = avail - u;
          need_qty -= u;
        }
        // Phase 2: 나머지를 FEFO로 자동 채움 (수동 로트는 건너뜀)
        for (const lot of lots) {
          if (excluded.has(lot.id)) continue;
          if (manualLots.has(lot.id)) continue;
          if (need_qty <= 0) break;
          const avail = remainByLot[c.code][lot.id] ?? 0;
          if (avail <= 0) continue;
          const u = Math.min(avail, need_qty);
          lineUse[lot.id] = u;
          remainByLot[c.code][lot.id] = avail - u;
          need_qty -= u;
        }

        const allocations = lots.map(lot => ({
          ...lot,
          use: excluded.has(lot.id) ? null : (lineUse[lot.id] ?? 0),
          left: excluded.has(lot.id) ? null : (remainByLot[c.code][lot.id] ?? 0),
          excluded: excluded.has(lot.id),
          manual: manualLots.has(lot.id),
          manualWant: manualLots.has(lot.id) ? Math.max(0, manuals[lot.id] || 0) : null,
          conflictQty: manualLots.has(lot.id) && conflictByLot[lot.id] ? conflictByLot[lot.id] : 0,
        }));
        const used = Object.values(lineUse).reduce((s,v)=>s+v, 0);
        const totalStock = lots.reduce((s,l)=>s + (excluded.has(l.id) ? 0 : l.q), 0);
        return {
          code: c.code, name: c.name, perUnit: line.qty ? required/line.qty : 0,
          required, used, allocations, lots,
          shortage: Math.max(0, need_qty),
          totalStock,
          isKernel: !!c.isKernel, kernelMode: c.kernelMode || null,
          kernelFullRequired: c.kernelFullRequired ?? null, kernelExpanded: !!c.kernelExpanded,
          expandedFrom: c.expandedFrom || null,
        };
      });
      return { ...line, components, hasShortage: components.some(x => x.shortage > 0) };
    });

    /* 통합 뷰용: 라인별 사용량을 코드별로 합산 → 일관된 로트 배분 표시 */
    const aggByCode = {}; // code → lotId → 누적 사용
    lineDetails.forEach(line => line.components.forEach(c => {
      if (!aggByCode[c.code]) aggByCode[c.code] = {};
      c.allocations.forEach(a => {
        if (!a.excluded && a.use > 0) {
          aggByCode[c.code][a.id] = (aggByCode[c.code][a.id] ?? 0) + a.use;
        }
      });
    }));
    rows.forEach(r => {
      r.aggAllocations = r.lots.map(lot => ({
        ...lot,
        use: excluded.has(lot.id) ? null : (aggByCode[r.code]?.[lot.id] ?? 0),
        left: excluded.has(lot.id) ? null : lot.q - (aggByCode[r.code]?.[lot.id] ?? 0),
        excluded: excluded.has(lot.id),
      }));
    });

    const totalConflicts = Object.keys(conflictByLot).length;
    const totalConflictQty = Object.values(conflictByLot).reduce((s,v)=>s+v, 0);

    return {rows, perProduct, totalShort:rows.filter(r=>r.short>0), lineDetails, totalConflicts, totalConflictQty};
  }, [order, boms, agg, basis, excluded, manualAlloc, dedup, partMode, kernelByCode]);

  const stockResults = useMemo(()=>{
    const t = stockQ.trim().toLowerCase();
    if (!t) return [];
    const out = [];
    for (const i of items) {
      const codeMatch = i.code.toLowerCase().includes(t);
      const nameMatch = i.name.toLowerCase().includes(t);
      let matchedLotNos = [];
      if (!codeMatch && !nameMatch) {
        const allLots = [...(agg.p3l[i.code]?.lots || []), ...(agg.ecount[i.code]?.lots || [])];
        const matches = allLots.filter(lot => lot.l && lot.l.toLowerCase().includes(t));
        if (matches.length === 0) continue;
        matchedLotNos = [...new Set(matches.map(m => m.l))];
      }
      out.push({...i, matchedLotNos});
      if (out.length >= 50) break;
    }
    return out;
  },[stockQ, items, agg]);

  const tabs=[["plan","발주 시뮬레이션"],["bom",`BOM 관리 (${boms.length})`],["stock","재고 조회"],["upload","재고 업로드"]];
  const basisLabel = basis==="sum" ? "3PL+이카운트+카톤박스 합산" : SRC[basis];

  /* ── 발주 계산 결과 엑셀 내보내기 (기준일·파일명·수동 배분 내역 포함) ── */
  const exportResultExcel = async () => {
    if (!calc) { showToast("내보낼 발주 결과가 없습니다. 먼저 발주 품목을 추가하세요.","#9A6B00"); return; }
   try {
    const now = new Date();
    const stamp = now.toISOString().slice(0,16).replace("T"," ");
    const wb = XLSX.utils.book_new();

    /* 시트 1: 요약 */
    const summaryRows = [
      ["부자재 소요량 · 환산재고 계산 결과"],
      [],
      ["생성 일시", stamp],
      ["계산 기준 재고", basisLabel + (basis==="sum" ? (dedup ? " (이카운트 3PL 창고분 중복 제거 ON)" : " (⚠ 중복 제거 OFF)") : "")],
      ["3PL 전산 데이터", stock.p3l.fileName, stock.p3l.date],
      ["이카운트 전산 데이터", stock.ecount.fileName, stock.ecount.date],
      ["사용 제외 로트 수", excluded.size],
      ["과배분 차단", calc.totalConflicts > 0 ? `${calc.totalConflicts}건 / ${calc.totalConflictQty}개` : "없음"],
      [],
      ["발주 라인"],
      ["순번", "제품", "발주 수량", "단독 환산재고", "동시 생산 가능", "병목 부자재", "충족 여부"],
      ...calc.perProduct.map((p, i) => [
        i+1, p.bom.name, p.qty, isFinite(p.solo)?p.solo:"", isFinite(p.after)?p.after:"",
        p.bottleneck || "", p.ok ? "충분" : `부족 ${p.qty - p.after}개`,
      ]),
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws1["!cols"] = [{wch:18},{wch:40},{wch:14},{wch:14},{wch:14},{wch:30},{wch:14}];
    XLSX.utils.book_append_sheet(wb, ws1, "요약");

    /* 시트 2~N: 라인별 소요 내역 (제품마다 별도 시트) */
    const lineHeader = ["부자재코드","부자재명","1개당 소요량","라인 소요량","3PL 전산","이카운트","기준재고","배정 사용량","생산 후 잔여","부족 수량","상태"];
    const sheetNameCount = {};
    calc.lineDetails.forEach((line, li) => {
      /* 이 라인이 사용하는 부자재별 사용량 집계 */
      const lineUsed = {};
      line.components.forEach(c => {
        lineUsed[c.code] = c.used;
      });
      const lineRows = [
        [`라인 ${li+1}: ${line.bom.name}  /  발주 수량 ${line.qty.toLocaleString()}개`],
        [],
        lineHeader,
        ...line.components.map(c => {
          const aggRow = calc.rows.find(r => r.code === c.code);
          return [
            c.code, c.name, c.perUnit, c.required,
            aggRow ? aggRow.t3 : "", aggRow ? aggRow.te : "",
            aggRow ? aggRow.stock : "",
            c.used,
            aggRow ? aggRow.remain : "",
            c.shortage > 0 ? c.shortage : "",
            c.shortage > 0 ? "부족" : "충분",
          ];
        }),
      ];
      const ws = XLSX.utils.aoa_to_sheet(lineRows);
      ws["!cols"] = [{wch:16},{wch:42},{wch:11},{wch:11},{wch:11},{wch:11},{wch:11},{wch:11},{wch:11},{wch:11},{wch:8}];
      /* 시트 이름: Excel 금지문자(\ / ? * [ ] :) 제거 + 31자 제한 + 중복 방지 */
      const safeName = line.bom.name.replace(/[\\\/\?\*\[\]:]/g, " ").trim();
      let baseName = `L${li+1}_${safeName}`.slice(0, 28);
      const cnt = sheetNameCount[baseName] = (sheetNameCount[baseName] ?? 0) + 1;
      const sheetName = cnt > 1 ? `${baseName}(${cnt})` : baseName;
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    /* 소요내역(전체합산) 시트: 제품별 섹션으로 구분 */
    const colHeader = ["부자재코드","부자재명","1개당 소요량","라인 소요량","3PL 전산","이카운트","기준재고","배정 사용량","생산 후 잔여","부족 수량","상태"];
    const aggRows = [["※ 소요내역 — 제품별 구분"], []];

    calc.lineDetails.forEach((line, li) => {
      /* 제품 헤더 */
      aggRows.push([`▶ 라인 ${li+1}  ${line.bom.name}  (발주 수량 ${line.qty.toLocaleString()}개)`]);
      aggRows.push(colHeader);
      line.components.forEach(c => {
        const aggRow = calc.rows.find(r => r.code === c.code);
        aggRows.push([
          c.code, c.name, c.perUnit, c.required,
          aggRow ? aggRow.t3 : "",
          aggRow ? aggRow.te : "",
          aggRow ? aggRow.stock : "",
          c.used,
          aggRow ? aggRow.remain : "",
          c.shortage > 0 ? c.shortage : "",
          c.shortage > 0 ? "부족" : "충분",
        ]);
      });
      aggRows.push([]); /* 제품 사이 빈 행 */
    });

    /* 전체 합산 섹션 */
    aggRows.push(["▶ 전체 합산"]);
    aggRows.push(["부자재코드","부자재명","총 소요량","3PL 전산","이카운트","기준재고","생산 후 잔여","부족 수량","상태"]);
    calc.rows.forEach(r => {
      aggRows.push([r.code, r.name, r.required, r.t3, r.te, r.stock, r.remain,
        r.short > 0 ? r.short : "", r.short > 0 ? "부족" : "충분"]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(aggRows);
    ws2["!cols"] = [{wch:16},{wch:42},{wch:11},{wch:11},{wch:11},{wch:11},{wch:11},{wch:11},{wch:11},{wch:11},{wch:8}];
    XLSX.utils.book_append_sheet(wb, ws2, "소요내역(전체합산)");

    /* 시트 3: 로트 배분 상세 (라인별 → 부자재별 → 로트별) */
    const lotRows = [
      ["라인","제품","발주수량","부자재코드","부자재명","1개당 소요량","라인 소요량","전산","로트/시리얼No.","로트 보유","이 라인 사용","사용 후 잔여","배분 방식","차단 초과분","비고"],
    ];
    calc.lineDetails.forEach((line, li) => {
      line.components.forEach(c => {
        let printedHeader = false;
        c.allocations.forEach(a => {
          // 사용 제외(체크 해제) 로트와 미사용 로트는 결과에서 제외 — 실제 사용/수동 지정만 표기
          if (a.excluded) return;
          if (!(a.use > 0 || a.manual)) return;
          lotRows.push([
            li+1,
            printedHeader ? "" : line.bom.name,
            printedHeader ? "" : line.qty,
            printedHeader ? "" : c.code,
            printedHeader ? "" : c.name,
            printedHeader ? "" : c.perUnit,
            printedHeader ? "" : c.required,
            a.src==="p3l" ? "3PL" : "이카운트",
            a.l || "(로트 없음)",
            a.q,
            a.use,
            a.left,
            a.manual ? "수동 지정" : "자동(FEFO)",
            a.conflictQty > 0 ? a.conflictQty : "",
            a.conflictQty > 0 ? "입력 초과분 차단됨" : "",
          ]);
          printedHeader = true;
        });
        /* 부자재별 합계 행 */
        lotRows.push([
          li+1,
          printedHeader ? "" : line.bom.name,
          printedHeader ? "" : line.qty,
          printedHeader ? "" : c.code,
          printedHeader ? "" : c.name,
          printedHeader ? "" : c.perUnit,
          printedHeader ? "" : c.required,
          "", "▶ 소계", "",
          c.used,
          "", "",
          "",
          c.shortage > 0 ? `부족 ${c.shortage}개` : "충족",
        ]);
      });
      lotRows.push([]); /* 라인 구분 빈 행 */
    });
    const ws3 = XLSX.utils.aoa_to_sheet(lotRows);
    ws3["!cols"] = [{wch:5},{wch:30},{wch:9},{wch:16},{wch:42},{wch:11},{wch:11},{wch:9},{wch:22},{wch:10},{wch:11},{wch:11},{wch:11},{wch:11},{wch:18}];
    XLSX.utils.book_append_sheet(wb, ws3, "로트배분(라인별)");

    /* 시트 4: 부족 품목만 (발주서 초안용) */
    if (calc.totalShort.length > 0) {
      const shortRows = [
        ["부자재코드","부자재명","부족 수량","기준재고","총 소요량"],
        ...calc.totalShort.map(r => [r.code, r.name, r.short, r.stock, r.required]),
      ];
      const ws4 = XLSX.utils.aoa_to_sheet(shortRows);
      ws4["!cols"] = [{wch:16},{wch:44},{wch:12},{wch:12},{wch:12}];
      XLSX.utils.book_append_sheet(wb, ws4, "부족품목");
    }

    /* 시트 5: 시나리오 (다른 컴퓨터에서 불러오기용 — 수정 금지) */
    const usedBomIds = new Set(order.map(o => o.bomId));
    /* 키트가 참조하는 알맹이 BOM도 함께 포함 (재귀적으로, 알맹이 속 알맹이까지 대비) */
    let frontier = [...usedBomIds];
    for (let depth=0; depth<5 && frontier.length; depth++) {
      const next = [];
      frontier.forEach(id => {
        const b = boms.find(x=>x.id===id);
        if (!b) return;
        b.components.forEach(c => {
          const kb = kernelByCode[c.code];
          if (kb && !usedBomIds.has(kb.id)) { usedBomIds.add(kb.id); next.push(kb.id); }
        });
      });
      frontier = next;
    }
    const scenario = {
      v: 1,
      exportedAt: stamp,
      basis, dedup,
      order,
      excluded: [...excluded],
      manualAlloc,
      partMode,
      boms: boms.filter(b => usedBomIds.has(b.id)),
      stockFiles: { p3l: stock.p3l.fileName, ecount: stock.ecount.fileName, carton: stock.carton?.fileName || "" },
    };
    const json = JSON.stringify(scenario);
    const CHUNK = 30000; /* 엑셀 셀 32767자 제한 대비 */
    const chunkRows = [["SCENARIO_V1"], ["※ 이 시트는 '발주 결과 불러오기' 기능용 데이터입니다. 수정하지 마세요."]];
    for (let i = 0; i < json.length; i += CHUNK) chunkRows.push([json.slice(i, i + CHUNK)]);
    const ws5 = XLSX.utils.aoa_to_sheet(chunkRows);
    ws5["!cols"] = [{wch:80}];
    XLSX.utils.book_append_sheet(wb, ws5, "시나리오(수정금지)");

    const fname = `발주계산_${now.toISOString().slice(0,10)}_${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}.xlsx`;
    const downloads = await claude.use("downloads");
    if (!downloads) { alert("이 환경에서는 파일 저장을 지원하지 않습니다."); return; }
    const buf = XLSX.write(wb, { bookType:"xlsx", type:"array" });
    const blob = new Blob([buf], {type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    await downloads.save({ filename: fname, data: blob });
    showToast("결과를 엑셀 파일로 내보냈습니다.");
   } catch (ex) {
    if (ex && ex.code === "declined") return;
    console.error("엑셀 내보내기 오류:", ex);
    alert("엑셀 내보내기 중 오류가 발생했습니다:\n\n" + (ex && ex.message ? ex.message : ex) + "\n\n(개발자 도구 콘솔에 상세 내용이 출력됩니다)");
   }
  };

  /* ── 발주 결과 엑셀 불러오기: 시나리오 복원 ── */
  const scenarioFileRef = useRef(null);
  const [importedScenarios, setImportedScenarios] = useState(new Set()); // 이번 세션에서 불러온 시나리오 식별자 (exportedAt 기반)

  /* ── 작업지시서 불러오기: 품목명·수량을 파싱해 BOM과 매칭 후 발주 품목으로 일괄 추가 ── */
  const workOrderFileRef = useRef(null);
  const [woReview, setWoReview] = useState(null); // { fileName, lines:[{id, rawName, qty, unit, bomId, checked}] }

  const handleWorkOrderFile = file => {
    if (!file) return;
    if (file.size > 10*1024*1024) { alert("파일은 10MB 이하여야 합니다."); return; }
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const wb = await readWorkbookSafely(ev.target.result);
        const parsed = parseWorkOrderWorkbook(wb);
        const lines = parsed.map((p, idx) => {
          const { bom, score } = matchBomByName(p.rawName, boms);
          const confident = bom && score >= 0.5 && p.unit === "EA";
          return {
            id: `wo-${idx}`,
            rawName: p.rawName,
            qty: p.qty,
            unit: p.unit,
            bomId: bom ? bom.id : "",
            score,
            checked: confident,
          };
        });
        setWoReview({ fileName: file.name, lines });
      } catch (ex) {
        alert("작업지시서 불러오기 실패: " + (ex.message || "파일을 읽을 수 없습니다"));
      }
    };
    reader.onerror = () => alert("파일 읽기 실패");
    reader.readAsArrayBuffer(file);
  };

  const commitWorkOrderReview = () => {
    if (!woReview) return;
    const toAdd = woReview.lines.filter(l => l.checked && l.bomId);
    if (!toAdd.length) { showToast("추가할 항목을 선택하고 BOM을 지정해주세요.", "#9A6B00"); return; }
    const newLines = toAdd.map(l => ({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,6) + l.id,
      bomId: l.bomId,
      qty: l.qty,
    }));
    setOrder(prev => [...prev, ...newLines]);
    showToast(`작업지시서에서 ${newLines.length}개 품목을 발주 품목에 추가했습니다.`);
    setWoReview(null);
  };
  const importResultExcel = file => {
    if (!file) return;
    if (file.size > 10*1024*1024) { alert("파일은 10MB 이하여야 합니다."); return; }
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const wb = await readWorkbookSafely(ev.target.result);
        /* SCENARIO_V1 마커가 있는 시트 탐색 */
        let json = null;
        for (const name of wb.SheetNames) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: "" });
          if (rows.length && String(rows[0][0]).trim() === "SCENARIO_V1") {
            json = rows.slice(2).map(r => String(r[0] ?? "")).join("");
            break;
          }
        }
        if (!json) throw new Error("이 파일에는 시나리오 데이터가 없습니다. '결과 내보내기 (Excel)'로 만든 파일인지 확인해 주세요.");
        const s = JSON.parse(json);
        if (s.v !== 1) throw new Error("지원하지 않는 시나리오 버전입니다.");

        /* 같은 엑셀(같은 exportedAt) 중복 불러오기 경고 */
        const scenarioKey = s.exportedAt || "(타임스탬프 없음)";
        if (importedScenarios.has(scenarioKey)) {
          const proceed = confirm(
            "⚠ 이미 불러온 발주 결과 엑셀입니다.\n\n" +
            `생성 일시: ${scenarioKey}\n\n` +
            "다시 불러오면 같은 발주 라인이 중복으로 추가되어 부자재가 이중으로 차감됩니다.\n\n" +
            "그래도 추가하시겠습니까?"
          );
          if (!proceed) return;
        }

        /* 1) BOM 병합 (같은 id면 갱신, 없으면 추가) — BOM 추가/갱신은 2단계 로그인이 있어야 반영된다 */
        let bomAdded = 0, bomUpdated = 0, bomSkipped = 0;
        if (canEditBom) {
          const mergedBoms = [...boms];
          (s.boms || []).forEach(b => {
            const idx = mergedBoms.findIndex(x => x.id === b.id);
            if (idx >= 0) { mergedBoms[idx] = b; bomUpdated++; }
            else { mergedBoms.push(b); bomAdded++; }
          });
          if (!await persistBoms(mergedBoms)) return;
        } else {
          bomSkipped = (s.boms || []).length;
        }

        /* 2) 현재 재고 데이터에 존재하는 로트 ID 집합 */
        const validLotIds = new Set();
        Object.values(agg.p3l).forEach(it => it.lots.forEach(l => validLotIds.add(l.id)));
        Object.values(agg.ecount).forEach(it => it.lots.forEach(l => validLotIds.add(l.id)));
        Object.values(agg.carton).forEach(it => it.lots.forEach(l => validLotIds.add(l.id)));

        /* 3) 제외 로트 복원 (현재 데이터에 없는 ID는 버림) */
        const exIn = (s.excluded || []);
        const exValid = exIn.filter(id => validLotIds.has(id));
        setExcluded(new Set(exValid));

        /* 4) 수동 배분 복원 (없는 로트 ID는 버리고 개수 집계) */
        let manualKept = 0, manualDropped = 0;
        const restoredManual = {};
        Object.entries(s.manualAlloc || {}).forEach(([lineId, byCode]) => {
          Object.entries(byCode).forEach(([code, byLot]) => {
            Object.entries(byLot).forEach(([lotId, qty]) => {
              if (validLotIds.has(lotId)) {
                if (!restoredManual[lineId]) restoredManual[lineId] = {};
                if (!restoredManual[lineId][code]) restoredManual[lineId][code] = {};
                restoredManual[lineId][code][lotId] = qty;
                manualKept++;
              } else manualDropped++;
            });
          });
        });
        setManualAlloc(restoredManual);

        /* 발주 라인: 기존 라인 유지하면서 불러온 라인 추가 (id 재발급해서 충돌 방지) */
        const idMap = {}; // 기존 라인 id → 새로 발급된 라인 id
        const newLines = (s.order || []).map(o => {
          const newId = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
          idMap[o.id] = newId;
          return { ...o, id: newId };
        });
        setOrder(prev => [...prev, ...newLines]);

        /* 알맹이 처리 방식(라인별 강제 전환) 복원 — 재발급된 새 라인 id로 매핑, 기존 세션 값과 병합 */
        const restoredPartMode = {};
        Object.entries(s.partMode || {}).forEach(([oldLineId, byCode]) => {
          const newId = idMap[oldLineId];
          if (newId) restoredPartMode[newId] = { ...byCode };
        });
        if (Object.keys(restoredPartMode).length) {
          setPartMode(prev => ({ ...prev, ...restoredPartMode }));
        }

        /* 중복 감지용: 이번 세션에서 불러온 시나리오 기록 */
        setImportedScenarios(prev => { const next = new Set(prev); next.add(scenarioKey); return next; });
        if (s.basis) setBasisP(s.basis);
        if (typeof s.dedup === "boolean") setDedupP(s.dedup);

        /* 6) 재고 파일 일치 여부 경고 */
        const stockMismatch =
          (s.stockFiles?.p3l && s.stockFiles.p3l !== stock.p3l.fileName) ||
          (s.stockFiles?.ecount && s.stockFiles.ecount !== stock.ecount.fileName);

        const parts = [`발주 ${newLines.length}라인 추가`];
        if (bomAdded || bomUpdated) parts.push(`BOM 추가 ${bomAdded}·갱신 ${bomUpdated}`);
        if (bomSkipped) parts.push(`BOM ${bomSkipped}개는 2단계 로그인 필요로 건너뜀`);
        if (manualKept) parts.push(`수동 배분 ${manualKept}건 복원`);
        if (manualDropped || (exIn.length - exValid.length) > 0) {
          parts.push(`로트 불일치로 ${manualDropped + (exIn.length - exValid.length)}건 제외`);
        }
        showToast(parts.join(" · "), stockMismatch || manualDropped ? "#9A6B00" : "#0E6E5C");
        if (stockMismatch) {
          setTimeout(() => alert(
            "⚠ 재고 데이터 불일치 경고\n\n" +
            `내보낼 당시 재고 파일:\n  3PL: ${s.stockFiles.p3l}\n  이카운트: ${s.stockFiles.ecount}\n  카톤박스: ${s.stockFiles.carton||"(없음)"}\n\n` +
            `현재 재고 파일:\n  3PL: ${stock.p3l.fileName}\n  이카운트: ${stock.ecount.fileName}\n  카톤박스: ${stock.carton?.fileName||"(없음)"}\n\n` +
            "재고 데이터가 달라 계산 결과·로트 배분이 원본과 다를 수 있습니다.\n" +
            "동일한 결과를 보려면 같은 재고 엑셀을 먼저 업로드하세요."
          ), 300);
        }
      } catch (ex) {
        alert("발주 결과 불러오기 실패: " + (ex.message || "파일을 읽을 수 없습니다"));
      }
    };
    reader.onerror = () => alert("파일 읽기 실패");
    reader.readAsArrayBuffer(file);
  };

  if(authTier<1||!dataReady||accessError) return (
    <main style={{maxWidth:560,margin:'80px auto',padding:24}}>
      <h1 style={{fontSize:22,marginBottom:16}}>부자재 재고 관리</h1>
      <p role="status" style={{marginBottom:16}}>{accessError||(!authReady?'권한을 확인하고 있습니다.':authTier>=1?'재고를 불러오고 있습니다.':'승인된 계정으로 로그인하면 재고를 확인할 수 있습니다.')}</p>
      <AuthBox user={authUser} tier={authTier} onLoginClick={()=>setLoginOpen(true)} onLogout={doLogout}/>
      {loginOpen&&<LoginModal onClose={()=>setLoginOpen(false)} onLogin={doLogin} onSignup={doSignup} error={loginError} busy={loginBusy}/>}
    </main>
  );
  return (
    <div style={{padding:"28px 20px", minHeight:"100vh", position:"relative"}}>
      {toasts.length > 0 && (
        <div style={{
          position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          display:"flex", flexDirection:"column", gap:8, alignItems:"center",
          zIndex:999, pointerEvents:"none", maxWidth:"90vw",
        }}>
          {toasts.map(t => (
            <div key={t.id} style={{
              background:t.color, color:"#fff", padding:"12px 24px", borderRadius:12,
              fontSize:14, fontWeight:600, boxShadow:"0 4px 16px rgba(0,0,0,.2)",
              animation:"toastIn .2s ease-out",
            }}>{t.msg}</div>
          ))}
        </div>
      )}

      <div style={{maxWidth:1060, margin:"0 auto"}}>
        {/* 헤더 */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10, marginBottom:10}}>
          <div>
            <div style={{fontSize:22, fontWeight:800, letterSpacing:"-0.02em"}}>부자재 소요량 · 환산재고 계산기</div>
            <div style={{fontSize:13, color:"#5C6B69", marginTop:4}}>
              3PL: {stock.p3l.fileName} · 이카운트: {stock.ecount.fileName}
              {stock.carton && stock.carton.lots.length > 0 && <> · 카톤박스: {stock.carton.fileName}</>}
            </div>
          </div>
          <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
            <AuthBox user={authUser} tier={authTier} onLoginClick={()=>setLoginOpen(true)} onLogout={doLogout} />
            {canEditBom && <ImportBtn onImport={handleImport} />}
            {canEditBom && (
              <Btn kind="ghost" small onClick={async ()=>{ if(!boms.length){showToast("저장된 BOM이 없습니다.","#9A6B00");return;} const ok = await exportBoms(boms); if (ok) showToast("BOM 파일을 내보냈습니다."); }}>
                💾 BOM 내보내기
              </Btn>
            )}
          </div>
        </div>
        {loginOpen && (
          <LoginModal onClose={()=>setLoginOpen(false)} onLogin={doLogin} onSignup={doSignup} error={loginError} busy={loginBusy} />
        )}

        {/* 재고 기준 선택 */}
        <div style={{
          display:"flex", alignItems:"center", gap:10, flexWrap:"wrap",
          background:"#fff", border:"1px solid #DDE4E2", borderRadius:12, padding:"10px 14px", marginBottom:16,
        }}>
          <span style={{fontSize:13, fontWeight:700, color:"#5C6B69"}}>소요량 계산 기준 재고</span>
          {[["ecount","이카운트 전산"],["p3l","3PL 전산"],["sum","합산 (3PL+이카운트+카톤박스)"]].map(([k,label])=>(
            <label key={k} style={{display:"flex", alignItems:"center", gap:5, fontSize:13, cursor:"pointer",
              fontWeight: basis===k?700:400, color: basis===k?"#0E6E5C":"#15201F"}}>
              <input type="radio" name="basis" checked={basis===k} onChange={()=>setBasisP(k)} />
              {label}
            </label>
          ))}
          {basis !== "sum" && (
            <span style={{fontSize:11.5, color:"#8A9694", marginLeft:"auto"}}>
              ※ 3PL 창고 재고가 이카운트에도 잡혀 있다면 합산 시 중복 계산될 수 있습니다
            </span>
          )}
        </div>

        {/* 합산 모드: 중복 제거 옵션 */}
        {basis === "sum" && (
          <div style={{
            display:"flex", alignItems:"center", gap:10, flexWrap:"wrap",
            background: dedup ? "#E3F0EC" : "#FBEAE8",
            border: `1px solid ${dedup ? "#0E6E5C44" : "#C8372D66"}`,
            borderRadius:12, padding:"10px 14px", marginTop:-8, marginBottom:16,
          }}>
            <label style={{display:"flex", alignItems:"center", gap:7, fontSize:13, fontWeight:700,
              cursor:"pointer", color: dedup ? "#0E6E5C" : "#C8372D"}}>
              <input type="checkbox" checked={dedup} onChange={e=>setDedupP(e.target.checked)}
                style={{width:15, height:15, accentColor:"#0E6E5C", cursor:"pointer"}} />
              이카운트의 3PL 창고분 제외 (중복 제거)
            </label>
            <span style={{fontSize:12, color: dedup ? "#5C6B69" : "#C8372D"}}>
              {dedup
                ? `이카운트 "…3PL…" 창고 로트 ${fmt(dedupInfo.lotCount)}건 · ${fmt(dedupInfo.qty)}개를 합산에서 제외 중 (3PL 전산과 중복으로 판단)`
                : `⚠ 중복 제거 꺼짐 — 3PL 창고 재고 ${fmt(dedupInfo.qty)}개가 두 번 계산되고 있을 가능성이 높습니다!`}
            </span>
          </div>
        )}

        {/* 탭 */}
        <div style={{display:"flex", gap:4, borderBottom:"2px solid #DDE4E2", marginBottom:20, overflowX:"auto"}}>
          {tabs.map(([k,label])=>(
            <button key={k} onClick={()=>setTab(k)} style={{
              border:"none", background:"transparent", padding:"10px 16px", fontSize:14, whiteSpace:"nowrap",
              fontWeight:tab===k?700:500, color:tab===k?"#0E6E5C":"#5C6B69",
              borderBottom:tab===k?"2px solid #0E6E5C":"2px solid transparent",
              marginBottom:-2, cursor:"pointer", fontFamily:"inherit",
            }}>{label}</button>
          ))}
        </div>

        {/* ── 발주 시뮬레이션 ── */}
        {tab==="plan" && (
          <div>
            {boms.length===0 ? (
              <div style={{background:"#fff", border:"1px dashed #DDE4E2", borderRadius:14, padding:32, textAlign:"center"}}>
                <div style={{fontSize:15, fontWeight:700}}>등록된 BOM이 아직 없습니다</div>
                <div style={{fontSize:13, color:"#5C6B69", margin:"8px 0 16px"}}>
                  BOM 관리 탭에서 등록하거나, 다른 컴퓨터에서 내보낸 발주 결과 엑셀을 불러올 수 있습니다.<br/>
                  (발주 결과 엑셀에는 사용된 BOM이 포함되어 있어 자동으로 등록됩니다)
                </div>
                <div style={{display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap"}}>
                  <Btn onClick={()=>{setTab("bom");setEditing("new");}}>BOM 등록하러 가기</Btn>
                  <input ref={scenarioFileRef} type="file" accept=".xlsx,.xls" style={{display:"none"}}
                    onChange={e=>{ importResultExcel(e.target.files[0]); e.target.value=""; }} />
                  <Btn kind="amber" onClick={()=>scenarioFileRef.current.click()}>📂 발주 결과 불러오기 (Excel)</Btn>
                </div>
              </div>
            ) : (
              <>
                <div style={{background:"#fff", border:"1px solid #DDE4E2", borderRadius:14, padding:18, marginBottom:16}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, flexWrap:"wrap", gap:8}}>
                    <div style={{fontSize:13, fontWeight:700, color:"#5C6B69"}}>발주 품목 추가</div>
                    <div>
                      <input ref={scenarioFileRef} type="file" accept=".xlsx,.xls" style={{display:"none"}}
                        onChange={e=>{ importResultExcel(e.target.files[0]); e.target.value=""; }} />
                      <input ref={workOrderFileRef} type="file" accept=".xlsx,.xls" style={{display:"none"}}
                        onChange={e=>{ handleWorkOrderFile(e.target.files[0]); e.target.value=""; }} />
                      <Btn kind="ghost" small onClick={()=>workOrderFileRef.current.click()} style={{marginRight:8}}>
                        📋 작업지시서 불러오기 (Excel)
                      </Btn>
                      <Btn kind="amber" small onClick={()=>scenarioFileRef.current.click()}>
                        📂 발주 결과 불러오기 (Excel)
                      </Btn>
                    </div>
                  </div>

                  {woReview && (
                    <div style={{
                      marginTop:14, background:"#FAFBFB", border:"1px solid #DDE4E2", borderRadius:12, padding:14,
                    }}>
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, flexWrap:"wrap", gap:8}}>
                        <div style={{fontSize:13, fontWeight:700}}>
                          📋 작업지시서 검토 — <span style={{fontWeight:400, color:"#5C6B69"}}>{woReview.fileName}</span>
                        </div>
                        <div style={{fontSize:12, color:"#5C6B69"}}>
                          매칭 {woReview.lines.filter(l=>l.bomId).length} / {woReview.lines.length}건
                        </div>
                      </div>
                      <div style={{fontSize:11.5, color:"#8A9694", marginBottom:10, lineHeight:1.6}}>
                        자동으로 매칭된 항목은 체크되어 있습니다. BOM이 잘못 매칭됐거나 비어있으면 직접 선택하고, 필요 없는 항목은 체크를 해제하세요.
                        (킬로그램 단위 벌크 원료는 자동 매칭 대상이 아니라 기본적으로 체크 해제되어 있습니다)
                      </div>
                      <div style={{maxHeight:360, overflowY:"auto", border:"1px solid #EDF1F0", borderRadius:8}}>
                        {woReview.lines.map((l, idx) => (
                          <div key={l.id} style={{
                            display:"flex", alignItems:"center", gap:8, padding:"8px 10px",
                            borderBottom: idx < woReview.lines.length-1 ? "1px solid #F4F6F5" : "none",
                            background: l.checked ? "#fff" : "#F7F8F8",
                          }}>
                            <input type="checkbox" checked={l.checked}
                              onChange={e=>setWoReview(prev=>({...prev, lines: prev.lines.map(x=>x.id===l.id?{...x, checked:e.target.checked}:x)}))} />
                            <div style={{flex:2, minWidth:160}}>
                              <div style={{fontSize:12.5, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}} title={l.rawName}>
                                {l.rawName}
                              </div>
                              <div style={{fontSize:11, color:l.unit==="kg"?"#9A6B00":"#8A9694"}}>
                                {fmt(l.qty)}{l.unit==="kg"?"kg (벌크)":"개"}
                                {l.bomId && l.score < 0.7 && <span style={{color:"#9A6B00"}}> · 매칭 확인 필요</span>}
                              </div>
                            </div>
                            <div style={{flex:2, minWidth:180}}>
                              <select value={l.bomId}
                                onChange={e=>setWoReview(prev=>({...prev, lines: prev.lines.map(x=>x.id===l.id?{...x, bomId:e.target.value}:x)}))}
                                style={{...inp, padding:"6px 8px", fontSize:12.5, width:"100%",
                                  borderColor: l.bomId ? "#DDE4E2" : "#E0967A"}}>
                                <option value="">— BOM 선택 —</option>
                                {boms.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                              </select>
                            </div>
                            <input type="number" min="1" value={l.qty}
                              onChange={e=>setWoReview(prev=>({...prev, lines: prev.lines.map(x=>x.id===l.id?{...x, qty:parseInt(e.target.value)||0}:x)}))}
                              style={{...inp, padding:"6px 8px", fontSize:12.5, width:90, textAlign:"right"}} />
                          </div>
                        ))}
                      </div>
                      <div style={{display:"flex", gap:8, marginTop:12, justifyContent:"flex-end"}}>
                        <Btn kind="plain" small onClick={()=>setWoReview(null)}>취소</Btn>
                        <Btn small onClick={commitWorkOrderReview}>
                          선택한 {woReview.lines.filter(l=>l.checked&&l.bomId).length}건 발주 품목에 추가
                        </Btn>
                      </div>
                    </div>
                  )}
                  <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                    <BomSearch boms={boms} value={selBom} onPick={id=>setSelBom(id)} onClear={()=>setSelBom("")} />
                    <input type="number" min="1" value={selQty} onChange={e=>setSelQty(parseInt(e.target.value)||0)}
                      style={{...inp, flex:1, minWidth:110}} placeholder="생산 수량" />
                    <Btn disabled={!selBom||selQty<=0} onClick={()=>{
                      const newId = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
                      setOrder(prev => [...prev, { id: newId, bomId: selBom, qty: selQty }]);
                      setSelBom("");
                    }}>추가</Btn>
                    {order.length>0 && <Btn kind="plain" onClick={()=>setOrder([])}>전체 비우기</Btn>}
                  </div>
                  {order.length>0 && (
                    <div style={{display:"flex", flexWrap:"wrap", gap:8, marginTop:14}}>
                      {order.map(o=>{
                        const b=boms.find(x=>x.id===o.bomId);
                        return b&&(
                          <div key={o.id} style={{
                            display:"flex", alignItems:"center", gap:8, background:"#E3F0EC",
                            border:"1px solid #0E6E5C33", borderRadius:999, padding:"6px 6px 6px 14px", fontSize:13,
                          }}>
                            <b>{b.name}</b>
                            <input type="number" min="1" value={o.qty}
                              onChange={e=>setOrder(order.map(x=>x.id===o.id?{...x,qty:parseInt(e.target.value)||0}:x))}
                              style={{width:80, border:"1px solid #DDE4E2", borderRadius:6, padding:"3px 6px", fontSize:13, fontFamily:"inherit"}} />
                            <span style={{color:"#5C6B69"}}>개</span>
                            <button onClick={()=>setOrder(order.filter(x=>x.id!==o.id))}
                              style={{border:"none", background:"transparent", color:"#5C6B69", cursor:"pointer", fontSize:16, padding:"0 6px"}}>×</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {calc && (
                  <>
                    <div style={{
                      borderRadius:14, padding:"14px 18px", fontSize:14, fontWeight:600, marginBottom:10,
                      background:calc.totalShort.length?"#FBEAE8":"#E3F0EC",
                      color:calc.totalShort.length?"#C8372D":"#0E6E5C",
                      border:`1px solid ${calc.totalShort.length?"#C8372D33":"#0E6E5C33"}`,
                    }}>
                      {calc.totalShort.length
                        ? `⚠ ${basisLabel} 기준 부자재 ${calc.totalShort.length}종이 부족합니다.`
                        : `✓ ${basisLabel} 기준 모든 부자재 재고가 충분합니다. 전체 발주를 동시 생산할 수 있습니다.`}
                    </div>

                    {/* 수동 배분 과배분 충돌 경고 */}
                    {calc.totalConflicts > 0 && (
                      <div style={{
                        borderRadius:14, padding:"12px 18px", fontSize:13, fontWeight:600, marginBottom:10,
                        background:"#C8372D", color:"#fff",
                      }}>
                        🚫 로트 과배분 차단 {calc.totalConflicts}건 — 수동 입력이 보유량(또는 다른 라인이 먼저 사용한 후 잔여량)을 초과하여
                        총 {fmt(calc.totalConflictQty)}개가 차단되었습니다. 차단분은 다른 로트 또는 부족 수량으로 계산됩니다.
                        해당 입력칸이 빨간색으로 표시되어 있습니다.
                      </div>
                    )}

                    {/* 계산 기준 정보 (데이터 출처·기준일) */}
                    <div style={{
                      display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10,
                      background:"#fff", border:"1px solid #DDE4E2", borderRadius:12,
                      padding:"10px 14px", marginBottom:16, fontSize:11.5, color:"#5C6B69", lineHeight:1.7,
                    }}>
                      <div>
                        <b style={{color:"#15201F"}}>계산 기준:</b> {basisLabel}
                        {basis==="sum" && (dedup ? " · 중복 제거 ON" : " · ⚠ 중복 제거 OFF")}
                        {excluded.size > 0 && ` · 로트 ${excluded.size}개 사용 제외`}
                        <br/>
                        <span style={{color:"#1D5C8A"}}>3PL:</span> {stock.p3l.fileName} ({stock.p3l.date})
                        {" · "}
                        <span style={{color:"#0E6E5C"}}>이카운트:</span> {stock.ecount.fileName} ({stock.ecount.date})
                        {stock.carton && stock.carton.lots.length > 0 && (
                          <>{" · "}<span style={{color:"#7B4D1E"}}>카톤박스:</span> {stock.carton.fileName} ({stock.carton.date})</>
                        )}
                      </div>
                      <Btn kind="ghost" small onClick={()=>exportResultExcel()}>
                        📊 결과 내보내기 (Excel)
                      </Btn>
                    </div>

                    <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12, marginBottom:16}}>
                      {calc.perProduct.map(p=>(
                        <div key={p.id} style={{background:"#fff", border:"1px solid #DDE4E2", borderRadius:14, padding:16}}>
                          <div style={{fontSize:14, fontWeight:700, marginBottom:4}}>{p.bom.name}</div>
                          <div style={{fontSize:12, color:"#5C6B69", marginBottom:12}}>발주 수량 {fmt(p.qty)}개</div>
                          <div style={{display:"flex", gap:20}}>
                            <div>
                              <div style={{fontSize:11, color:"#5C6B69", fontWeight:600}}>단독 생산 시 환산재고</div>
                              <div style={{fontSize:22, fontWeight:800}}>{fmt(p.solo)}</div>
                            </div>
                            <div>
                              <div style={{fontSize:11, color:"#5C6B69", fontWeight:600}}>동시 생산 시 가능</div>
                              <div style={{fontSize:22, fontWeight:800, color:p.ok?"#0E6E5C":"#C8372D"}}>{fmt(p.after)}</div>
                            </div>
                          </div>
                          <div style={{fontSize:12, marginTop:8, color:p.ok?"#5C6B69":"#C8372D"}}>
                            {p.ok ? `병목 부자재: ${p.bottleneck}` : `부족 — 발주 대비 ${fmt(p.qty-p.after)}개 모자람`}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 보기 모드 전환 */}
                    <div style={{display:"flex", gap:0, border:"1px solid #DDE4E2", borderRadius:8, overflow:"hidden", marginBottom:12, width:"fit-content"}}>
                      {[["agg","통합 보기"],["line","라인별 보기"]].map(([k,label])=>(
                        <button key={k} onClick={()=>setViewMode(k)} style={{
                          padding:"7px 16px", border:"none", fontSize:13, fontWeight:700,
                          background: viewMode===k ? "#0E6E5C" : "#fff",
                          color: viewMode===k ? "#fff" : "#5C6B69",
                          cursor: viewMode===k ? "default" : "pointer", fontFamily:"inherit",
                        }}>{label}</button>
                      ))}
                    </div>

                    {/* 사용 제외 배지 (두 뷰 공통) */}
                    {excluded.size > 0 && (
                      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
                        <span style={{fontSize:12, color:"#9A6B00", background:"#FBF3DE", border:"1px solid #E0C97A",
                          padding:"3px 10px", borderRadius:999, fontWeight:700}}>
                          로트 {excluded.size}개 사용 제외 중
                        </span>
                        <button onClick={()=>setExcluded(new Set())}
                          style={{border:"1px solid #DDE4E2", background:"#fff", padding:"3px 10px",
                            borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", color:"#15201F"}}>
                          전체 초기화
                        </button>
                      </div>
                    )}

                    {viewMode === "agg" && (
                    <div style={{background:"#fff", border:"1px solid #DDE4E2", borderRadius:14, overflow:"hidden"}}>
                      <div style={{padding:"12px 16px", fontSize:13, fontWeight:700, color:"#5C6B69", borderBottom:"1px solid #DDE4E2"}}>
                        부자재 소요 내역 (전체 발주 합산) — 행을 클릭하면 로트별 체크박스로 사용할 재고를 직접 선택할 수 있습니다
                      </div>
                      <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:820}}>
                          <thead>
                            <tr style={{color:"#5C6B69", textAlign:"right", background:"#FAFBFB"}}>
                              <th style={{padding:"9px 12px", textAlign:"left", fontWeight:600}}>부자재</th>
                              <th style={{padding:"9px 12px", fontWeight:600}}>총 소요량</th>
                              <th style={{padding:"9px 12px", fontWeight:600, color:"#1D5C8A"}}>3PL 전산</th>
                              <th style={{padding:"9px 12px", fontWeight:600, color:"#0E6E5C"}}>이카운트</th>
                              <th style={{padding:"9px 12px", fontWeight:600}}>기준재고</th>
                              <th style={{padding:"9px 12px", fontWeight:600}}>생산 후 잔여</th>
                              <th style={{padding:"9px 12px", fontWeight:600}}>상태</th>
                            </tr>
                          </thead>
                          <tbody>
                            {calc.rows.map(r=>(
                              <React.Fragment key={r.code}>
                                <tr onClick={()=>setExpanded(p=>({...p,[r.code]:!p[r.code]}))}
                                  style={{borderTop:"1px solid #F4F6F5", cursor:"pointer",
                                    background:r.short>0?"#FBEAE8":"transparent"}}>
                                  <td style={{padding:"10px 12px"}}>
                                    <div style={{fontWeight:600, color:r.short>0?"#C8372D":"#15201F"}}>
                                      <span style={{display:"inline-block", width:14, color:"#8A9694"}}>{expanded[r.code]?"▾":"▸"}</span>
                                      {r.name}
                                    </div>
                                    <div style={{fontSize:11.5, color:"#5C6B69", fontFamily:"monospace", paddingLeft:14}}>{r.code}</div>
                                  </td>
                                  <td style={{padding:"10px 12px", textAlign:"right", fontVariantNumeric:"tabular-nums"}}>{fmt(r.required)}</td>
                                  <td style={{padding:"10px 12px", textAlign:"right", fontVariantNumeric:"tabular-nums", color:"#1D5C8A"}}>{fmt(r.t3)}</td>
                                  <td style={{padding:"10px 12px", textAlign:"right", fontVariantNumeric:"tabular-nums", color:"#0E6E5C"}}>{fmt(r.te)}</td>
                                  <td style={{padding:"10px 12px", textAlign:"right", fontWeight:700, fontVariantNumeric:"tabular-nums"}}>{fmt(r.stock)}</td>
                                  <td style={{padding:"10px 12px", textAlign:"right", fontWeight:700, color:r.remain<0?"#C8372D":"#15201F", fontVariantNumeric:"tabular-nums"}}>{fmt(r.remain)}</td>
                                  <td style={{padding:"10px 12px", textAlign:"right"}}>
                                    {r.short>0
                                      ? <span style={{color:"#fff", background:"#C8372D", borderRadius:6, padding:"3px 8px", fontSize:12, fontWeight:700, whiteSpace:"nowrap"}}>부족 {fmt(r.short)}</span>
                                      : <span style={{color:"#0E6E5C", fontWeight:700, fontSize:12}}>충분</span>}
                                  </td>
                                </tr>
                                {expanded[r.code] && (
                                  <tr>
                                    <td colSpan={7} style={{padding:"0 12px 14px 26px", background:"#FAFBFB"}}>
                                      {r.lots.length
                                        ? <LotTable lots={r.lots} allocations={r.aggAllocations} showSource={basis==="sum"}
                                            excluded={excluded} onToggle={toggleLot}
                                            onSelectAll={on=>setLotsExcluded(r.lots.map(l=>l.id), !on)} />
                                        : <div style={{padding:"10px 0", fontSize:12.5, color:"#8A9694"}}>{basisLabel}에 이 품목의 로트 데이터가 없습니다.</div>}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    )}

                    {viewMode === "line" && (
                      <div>
                        <div style={{fontSize:12, color:"#5C6B69", marginBottom:10, padding:"8px 12px", background:"#EDF1F0", borderRadius:8, lineHeight:1.6}}>
                          💡 라인별 보기는 발주 순서대로 재고를 <b>순차 배정</b>합니다 — 위쪽 라인이 먼저 사용하고 남은 재고를 아래 라인이 받습니다.
                          행을 펼치면 <b>"사용" 칸을 직접 입력</b>해서 원하는 로트를 원하는 만큼 사용할 수 있습니다.
                          체크박스로 사용 제외한 로트는 모든 라인에서 사용되지 않습니다.
                        </div>
                        {calc.lineDetails.map((line, lineIdx) => (
                          <div key={line.id} style={{background:"#fff", border:"1px solid #DDE4E2", borderRadius:14, overflow:"hidden", marginBottom:14}}>
                            <div style={{padding:"12px 16px", borderBottom:"1px solid #DDE4E2", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8,
                              background: line.hasShortage ? "#FBEAE8" : "#E3F0EC"}}>
                              <div style={{display:"flex", alignItems:"center", gap:10}}>
                                <span style={{display:"inline-flex", alignItems:"center", justifyContent:"center",
                                  width:24, height:24, borderRadius:999, background:"#fff",
                                  fontSize:12, fontWeight:800, color:"#0E6E5C", border:"1px solid #0E6E5C"}}>{lineIdx+1}</span>
                                <div>
                                  <div style={{fontSize:14, fontWeight:700, color:line.hasShortage?"#C8372D":"#0E6E5C"}}>{line.bom.name}</div>
                                  <div style={{fontSize:12, color:"#5C6B69"}}>발주 수량 {fmt(line.qty)}개</div>
                                </div>
                              </div>
                              <span style={{fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:999,
                                background:line.hasShortage?"#C8372D":"#0E6E5C", color:"#fff"}}>
                                {line.hasShortage ? `⚠ ${line.components.filter(c=>c.shortage>0).length}종 부족` : "✓ 충분"}
                              </span>
                            </div>
                            <div style={{overflowX:"auto"}}>
                              <table style={{width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:720}}>
                                <thead>
                                  <tr style={{color:"#5C6B69", textAlign:"right", background:"#FAFBFB"}}>
                                    <th style={{padding:"9px 12px", textAlign:"left", fontWeight:600}}>부자재</th>
                                    <th style={{padding:"9px 12px", fontWeight:600}}>이 라인 소요량</th>
                                    <th style={{padding:"9px 12px", fontWeight:600}}>이 라인 할당</th>
                                    <th style={{padding:"9px 12px", fontWeight:600}}>라인 후 잔여</th>
                                    <th style={{padding:"9px 12px", fontWeight:600}}>상태</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {line.components.map(c => {
                                    const key = `${line.id}:${c.code}`;
                                    const lineRemain = c.allocations.reduce((s,a)=>s+(a.excluded?0:a.left), 0);
                                    return (
                                      <React.Fragment key={c.code}>
                                        <tr onClick={()=>setExpanded(p=>({...p,[key]:!p[key]}))}
                                          style={{borderTop:"1px solid #F4F6F5", cursor:"pointer",
                                            background:c.shortage>0?"#FBEAE8":"transparent"}}>
                                          <td style={{padding:"10px 12px"}}>
                                            <div style={{fontWeight:600, color:c.shortage>0?"#C8372D":"#15201F", display:"flex", alignItems:"center", gap:6, flexWrap:"wrap"}}>
                                              <span style={{display:"inline-block", width:14, color:"#8A9694"}}>{expanded[key]?"▾":"▸"}</span>
                                              {c.expandedFrom && (
                                                <span style={{fontSize:11, color:"#7A5500", fontWeight:700}}>
                                                  ↳ {c.expandedFrom.name} 전개분
                                                </span>
                                              )}
                                              {c.name}
                                              {c.isKernel && (
                                                <span style={{fontSize:10.5, fontWeight:700, background:"#FBF3DE", color:"#7A5500",
                                                  border:"1px solid #E0C97A", borderRadius:5, padding:"1px 6px"}}>
                                                  🧩 알맹이
                                                </span>
                                              )}
                                            </div>
                                            <div style={{fontSize:11.5, color:"#5C6B69", fontFamily:"monospace", paddingLeft:14}}>
                                              {c.code} · 단위당 {fmt(c.perUnit)}
                                            </div>
                                            {c.isKernel && (
                                              <div style={{paddingLeft:14, marginTop:5, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap"}} onClick={e=>e.stopPropagation()}>
                                                <select value={partMode[line.id]?.[c.code] || "auto"}
                                                  onChange={e=>setKernelMode(line.id, c.code, e.target.value)}
                                                  style={{fontSize:11, padding:"3px 6px", borderRadius:6, border:"1px solid #DDE4E2", fontFamily:"inherit"}}>
                                                  <option value="auto">재고 우선 소진 + 부족분 자동 전개</option>
                                                  <option value="force_expand">전량 부자재로 강제 전개</option>
                                                  <option value="force_finished">전량 알맹이 재고로만 (전개 안 함)</option>
                                                </select>
                                                {c.kernelExpanded && c.kernelMode!=="force_expand" && (
                                                  <span style={{fontSize:11, color:"#7A5500"}}>
                                                    알맹이 재고 {fmt(c.required)} 사용 + 부자재 {fmt(c.kernelFullRequired - c.required)} 전개
                                                  </span>
                                                )}
                                                {c.kernelMode==="force_expand" && (
                                                  <span style={{fontSize:11, color:"#7A5500"}}>
                                                    알맹이 재고 미사용 · 전량({fmt(c.kernelFullRequired)}) 부자재로 전개됨
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </td>
                                          <td style={{padding:"10px 12px", textAlign:"right", fontVariantNumeric:"tabular-nums"}}>{fmt(c.required)}</td>
                                          <td style={{padding:"10px 12px", textAlign:"right", fontWeight:700, color:"#9A6B00", fontVariantNumeric:"tabular-nums"}}>{fmt(c.used)}</td>
                                          <td style={{padding:"10px 12px", textAlign:"right", fontVariantNumeric:"tabular-nums"}}>{fmt(lineRemain)}</td>
                                          <td style={{padding:"10px 12px", textAlign:"right"}}>
                                            {c.shortage>0
                                              ? <span style={{color:"#fff", background:"#C8372D", borderRadius:6, padding:"3px 8px", fontSize:12, fontWeight:700, whiteSpace:"nowrap"}}>부족 {fmt(c.shortage)}</span>
                                              : <span style={{color:"#0E6E5C", fontWeight:700, fontSize:12}}>충분</span>}
                                          </td>
                                        </tr>
                                        {expanded[key] && (
                                          <tr>
                                            <td colSpan={5} style={{padding:"0 12px 14px 26px", background:"#FAFBFB"}}>
                                              {c.lots.length
                                                ? <LotTable lots={c.lots} allocations={c.allocations} showSource={basis==="sum"}
                                                    excluded={excluded} onToggle={toggleLot}
                                                    onSelectAll={on=>setLotsExcluded(c.lots.map(l=>l.id), !on)}
                                                    onAllocChange={(lotId, qty)=>setManualUse(line.id, c.code, lotId, qty)}
                                                    onResetAlloc={()=>resetLineComponent(line.id, c.code)} />
                                                : <div style={{padding:"10px 0", fontSize:12.5, color:"#8A9694"}}>{basisLabel}에 이 품목의 로트 데이터가 없습니다.</div>}
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── BOM 관리 ── */}
        {tab==="bom" && (
          <div>
            {editing ? (
              <BomEditor initial={editing==="new"?null:editing} items={items} getStock={getStock} onSave={saveBom} onCancel={()=>setEditing(null)} />
            ) : (
              <>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8}}>
                  <div style={{fontSize:13, color:"#5C6B69"}}>
                    BOM은 이 링크를 여는 모든 기기에 자동으로 공유 저장됩니다. 백업이 필요하면 상단 <b>BOM 내보내기</b>를 이용하세요.
                  </div>
                  <div style={{display:"flex", gap:8, alignItems:"center"}}>
                    {!canEditBom && <LockedNotice tier={2} label="BOM 추가/수정/삭제" />}
                    {canEditBom && boms.length > 0 && (
                      <Btn kind="danger" onClick={()=>{
                        if (confirm(
                          `⚠ 등록된 BOM ${boms.length}개를 전부 삭제합니다.\n\n` +
                          "이 BOM들을 사용 중인 발주 품목도 함께 사라집니다.\n" +
                          "이 링크를 공유 중인 다른 기기에서도 함께 삭제되며, 내보내기(백업) 없이 진행하면 복구할 수 없습니다.\n\n" +
                          "정말 전체 삭제하시겠습니까?"
                        )) deleteAllBoms();
                      }}>🗑 BOM 전체 삭제</Btn>
                    )}
                    {canEditBom && <Btn onClick={()=>setEditing("new")}>+ 새 BOM 등록</Btn>}
                  </div>
                </div>
                {boms.length===0 ? (
                  <div style={{background:"#fff", border:"1px dashed #DDE4E2", borderRadius:14, padding:32, textAlign:"center", color:"#5C6B69", fontSize:14}}>
                    제품 이름과 부자재 구성(1개당 소요량)을 등록하면<br/>발주 시뮬레이션에서 바로 사용할 수 있습니다.
                  </div>
                ) : boms.map(b=>(
                  <div key={b.id} style={{background:"#fff", border:"1px solid #DDE4E2", borderRadius:14, padding:16, marginBottom:10}}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap"}}>
                      <div style={{fontSize:15, fontWeight:700, display:"flex", alignItems:"center", gap:8}}>
                        {b.name}
                        {b.kernelCode && (
                          <span style={{fontSize:11, fontWeight:700, background:"#FBF3DE", color:"#7A5500",
                            border:"1px solid #E0C97A", borderRadius:6, padding:"2px 7px"}}>
                            🧩 알맹이 · {b.kernelCode}
                          </span>
                        )}
                      </div>
                      {canEditBom && (
                        <div style={{display:"flex", gap:6}}>
                          <Btn kind="ghost" small onClick={()=>setEditing(b)}>수정</Btn>
                          <Btn kind="danger" small onClick={()=>{ if(confirm(`"${b.name}" BOM을 삭제할까요?`)) deleteBom(b.id); }}>삭제</Btn>
                        </div>
                      )}
                    </div>
                    <div style={{marginTop:8, display:"flex", flexWrap:"wrap", gap:6}}>
                      {b.components.map(c=>(
                        <span key={c.code} style={{
                          fontSize:12, borderRadius:6, padding:"4px 8px",
                          background: kernelByCode[c.code] ? "#FBF3DE" : "#EDF1F0",
                          color: kernelByCode[c.code] ? "#7A5500" : "#15201F",
                        }}>
                          {kernelByCode[c.code] ? "🧩 " : ""}{c.name} × {c.qty}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── 재고 조회 ── */}
        {tab==="stock" && (
          <div>
            <input style={inp} placeholder="부자재 코드 · 이름 · 시리얼/로트 No.로 검색…"
              value={stockQ} onChange={e=>setStockQ(e.target.value)} />
            {stockQ.trim() && (
              <div style={{background:"#fff", border:"1px solid #DDE4E2", borderRadius:14, marginTop:12, overflow:"hidden"}}>
                {stockResults.length===0
                  ? <div style={{padding:20, color:"#5C6B69", fontSize:13}}>검색 결과가 없습니다.</div>
                  : stockResults.map(i=>{
                    const s = getStock(i.code);
                    return (
                      <React.Fragment key={i.code}>
                        <div onClick={()=>setExpandedStk(p=>({...p,[i.code]:!p[i.code]}))}
                          style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px",
                            borderBottom:"1px solid #F4F6F5", gap:12, cursor:"pointer"}}>
                          <div style={{minWidth:0, flex:1}}>
                            <div style={{fontSize:13, fontWeight:600}}>
                              <span style={{display:"inline-block", width:14, color:"#8A9694"}}>{expandedStk[i.code]?"▾":"▸"}</span>
                              {i.name}
                            </div>
                            <div style={{fontSize:12, color:"#5C6B69", fontFamily:"monospace", paddingLeft:14}}>{i.code}</div>
                            {i.matchedLotNos && i.matchedLotNos.length > 0 && (
                              <div style={{fontSize:11.5, color:"#7A5500", paddingLeft:14, marginTop:3, lineHeight:1.5}}>
                                🏷 일치 로트: <b style={{fontFamily:"monospace"}}>{i.matchedLotNos.slice(0,5).join(", ")}{i.matchedLotNos.length>5?` 외 ${i.matchedLotNos.length-5}건`:""}</b>
                              </div>
                            )}
                          </div>
                          <div style={{display:"flex", gap:18, textAlign:"right"}}>
                            <div>
                              <div style={{fontSize:10.5, color:"#1D5C8A", fontWeight:700}}>3PL 전산</div>
                              <div style={{fontSize:15, fontWeight:800, fontVariantNumeric:"tabular-nums"}}>{fmt(i.t3)}</div>
                            </div>
                            <div>
                              <div style={{fontSize:10.5, color:"#0E6E5C", fontWeight:700}}>이카운트</div>
                              <div style={{fontSize:15, fontWeight:800, fontVariantNumeric:"tabular-nums"}}>{fmt(i.te)}</div>
                            </div>
                            {i.tc > 0 && (
                              <div>
                                <div style={{fontSize:10.5, color:"#7B4D1E", fontWeight:700}}>카톤박스</div>
                                <div style={{fontSize:15, fontWeight:800, fontVariantNumeric:"tabular-nums"}}>{fmt(i.tc)}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        {expandedStk[i.code] && (
                          <div style={{padding:"4px 16px 14px 30px", background:"#FAFBFB", borderBottom:"1px solid #F4F6F5"}}>
                            {s.lots.length
                              ? <LotTable lots={s.lots} required={null} showSource={basis==="sum"} searchHighlight={stockQ.trim()} />
                              : <div style={{padding:"8px 0", fontSize:12.5, color:"#8A9694"}}>{basisLabel}에 로트 데이터가 없습니다. (기준 재고를 바꿔보세요)</div>}
                            <div style={{fontSize:11, color:"#8A9694", marginTop:6}}>표시 기준: {basisLabel}</div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })
                }
              </div>
            )}
          </div>
        )}

        {/* ── 재고 업로드 ── */}
        {tab==="upload" && (
          <div>
            <div style={{
              background:"#FBF3DE", border:"1px solid #E0C97A", borderRadius:10,
              padding:"10px 14px", fontSize:12.5, color:"#7A5500", marginBottom:16, lineHeight:1.7,
            }}>
              💡 재고가 바뀔 때마다 각 전산에서 내려받은 엑셀을 아래에 업로드하면 즉시 반영됩니다.
              업로드한 재고는 서버에 저장되며 승인된 계정으로 다른 기기에서도 확인할 수 있습니다.
              <b> 3PL 전산</b>은 WMS 재고 리스트(상품코드·가용재고·LOT NO·유통기한),
              <b> 이카운트</b>는 시리얼/로트No. 재고현황(품목코드·재고수량·시리얼/로트No.·유효기한) 양식을 자동 인식합니다.
            </div>
            <div style={{display:"flex", gap:14, flexWrap:"wrap"}}>
              <StockUploadCard srcKey="p3l" data={stock.p3l} prevData={prevStock.p3l} locked={!canEditStock}
                onLoaded={async d=>{
                  if (order.length > 0) {
                    const ok = confirm(
                      `⚠ 발주 품목이 ${order.length}개 등록되어 있습니다.\n\n` +
                      "재고를 새로 업로드하면 다음 정보가 무효화될 수 있습니다:\n" +
                      "• 수동으로 지정한 로트 배분\n" +
                      "• 사용 제외(체크 해제)한 로트\n\n" +
                      "(로트 ID가 새 재고 기준으로 다시 부여되어 기존 설정이 풀립니다)\n\n" +
                      "그래도 3PL 전산 재고를 업데이트하시겠습니까?"
                    );
                    if (!ok) return;
                  }
                  await updateStockSource("p3l", d);
                }}
                onRevert={()=>revertStockSource("p3l")}
                onReset={()=>updateStockSource("p3l",{fileName:"(데이터 없음)",date:"",lots:[]})} />
              <StockUploadCard srcKey="carton" data={stock.carton || {fileName:"(데이터 없음)",date:"",lots:[]}} prevData={prevStock.carton} locked={!canEditStock}
                onLoaded={async d=>{
                  if (order.length > 0) {
                    const ok = confirm(
                      `⚠ 발주 품목이 ${order.length}개 등록되어 있습니다.\n\n` +
                      "재고를 새로 업로드하면 다음 정보가 무효화될 수 있습니다:\n" +
                      "• 수동으로 지정한 로트 배분\n" +
                      "• 사용 제외(체크 해제)한 로트\n\n" +
                      "(로트 ID가 새 재고 기준으로 다시 부여되어 기존 설정이 풀립니다)\n\n" +
                      "그래도 카톤박스 전산 재고를 업데이트하시겠습니까?"
                    );
                    if (!ok) return;
                  }
                  await updateStockSource("carton", d);
                }}
                onRevert={()=>revertStockSource("carton")}
                onReset={()=>updateStockSource("carton",{fileName:"(데이터 없음)",date:"",lots:[]})} />
              <StockUploadCard srcKey="ecount" data={stock.ecount} prevData={prevStock.ecount} locked={!canEditStock}
                onLoaded={async d=>{
                  if (order.length > 0) {
                    const ok = confirm(
                      `⚠ 발주 품목이 ${order.length}개 등록되어 있습니다.\n\n` +
                      "재고를 새로 업로드하면 다음 정보가 무효화될 수 있습니다:\n" +
                      "• 수동으로 지정한 로트 배분\n" +
                      "• 사용 제외(체크 해제)한 로트\n\n" +
                      "(로트 ID가 새 재고 기준으로 다시 부여되어 기존 설정이 풀립니다)\n\n" +
                      "그래도 이카운트 전산 재고를 업데이트하시겠습니까?"
                    );
                    if (!ok) return;
                  }
                  await updateStockSource("ecount", d);
                }}
                onRevert={()=>revertStockSource("ecount")}
                onReset={()=>updateStockSource("ecount",{fileName:"(데이터 없음)",date:"",lots:[]})} />
            </div>
            {canEditStock ? (
              <ManualStockAddForm onAdd={addManualLot} />
            ) : (
              <div style={{marginTop:18, maxWidth:640}}><LockedNotice tier={1} label="재고 직접 추가" /></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
