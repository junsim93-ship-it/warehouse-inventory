(() => {
  const { useState, useEffect, useMemo, useRef } = React;
  const fmt = (n) => n == null || !isFinite(n) ? "-" : Math.round(n).toLocaleString("ko-KR");
  const SRC = { p3l: "3PL \uC804\uC0B0", ecount: "\uC774\uCE74\uC6B4\uD2B8 \uC804\uC0B0", carton: "\uCE74\uD1A4\uBC15\uC2A4 \uC804\uC0B0" };
  const inp = {
    width: "100%",
    padding: "9px 11px",
    border: "1px solid #DDE4E2",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "inherit",
    color: "#15201F",
    background: "#fff",
    outline: "none"
  };
  function Btn({ children, kind = "primary", onClick, disabled, small, style = {} }) {
    const base = {
      border: "none",
      borderRadius: 8,
      padding: small ? "6px 12px" : "10px 16px",
      fontSize: small ? 13 : 14,
      fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      fontFamily: "inherit",
      transition: "filter .12s",
      ...style
    };
    const kinds = {
      primary: { background: "#0E6E5C", color: "#fff" },
      ghost: { background: "transparent", color: "#0E6E5C", border: "1px solid #0E6E5C" },
      danger: { background: "transparent", color: "#C8372D", border: "1px solid #DDE4E2" },
      plain: { background: "#EDF1F0", color: "#15201F" },
      amber: { background: "transparent", color: "#9A6B00", border: "1px solid #E0C97A" }
    };
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { ...base, ...kinds[kind] },
        onClick,
        disabled,
        onMouseOver: (e) => {
          if (!disabled) e.currentTarget.style.filter = "brightness(0.9)";
        },
        onMouseOut: (e) => {
          e.currentTarget.style.filter = "none";
        }
      },
      children
    );
  }
  function parseStockWorkbook(wb) {
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
    let hi = -1;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const r = (rows[i] || []).map((x) => String(x));
      if (r.some((x) => x.includes("\uD488\uBAA9\uCF54\uB4DC") || x.includes("\uC0C1\uD488\uCF54\uB4DC"))) {
        hi = i;
        break;
      }
    }
    if (hi < 0) throw new Error("\uD5E4\uB354 \uD589\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4 (\uD488\uBAA9\uCF54\uB4DC/\uC0C1\uD488\uCF54\uB4DC \uC5F4 \uD544\uC694)");
    const header = rows[hi].map((x) => String(x).trim());
    const col = (names) => {
      for (const n of names) {
        const idx = header.findIndex((h) => h.includes(n));
        if (idx >= 0) return idx;
      }
      return -1;
    };
    const ci = col(["\uD488\uBAA9\uCF54\uB4DC", "\uC0C1\uD488\uCF54\uB4DC"]);
    const ni = col(["\uD488\uBAA9\uBA85", "\uC0C1\uD488\uBA85"]);
    const li = col(["\uC2DC\uB9AC\uC5BC/\uB85C\uD2B8", "LOT NO", "\uB85C\uD2B8", "LOT"]);
    const ei = col(["\uC720\uD6A8\uAE30\uD55C", "\uC720\uD1B5\uAE30\uD55C"]);
    const qi = col(["\uC7AC\uACE0\uC218\uB7C9", "\uAC00\uC6A9\uC7AC\uACE0", "\uC218\uB7C9"]);
    const wi = col(["\uCC3D\uACE0\uBA85", "\uB85C\uCF00\uC774\uC158", "\uC874"]);
    if (qi < 0) throw new Error("\uC218\uB7C9 \uC5F4\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4 (\uC7AC\uACE0\uC218\uB7C9/\uAC00\uC6A9\uC7AC\uACE0/\uC218\uB7C9 \uC911 \uD558\uB098 \uD544\uC694)");
    const qtyCandidateIdxs = new Set(
      ["\uC7AC\uACE0\uC218\uB7C9", "\uAC00\uC6A9\uC7AC\uACE0", "\uC218\uB7C9"].map((n) => header.findIndex((h) => h.includes(n))).filter((idx) => idx >= 0)
    );
    const qtyCandidateNames = [...qtyCandidateIdxs].map((idx) => header[idx]);
    const warnings = [];
    if (qtyCandidateIdxs.size > 1) {
      warnings.push(`\uC218\uB7C9 \uD6C4\uBCF4 \uC5F4\uC774 ${qtyCandidateIdxs.size}\uAC1C \uBC1C\uACAC\uB428 (${qtyCandidateNames.join(", ")}) \u2192 "${header[qi]}" \uC5F4\uC744 \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4`);
    }
    if (li < 0) warnings.push("\uB85C\uD2B8 \uC5F4\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4 \u2014 \uB85C\uD2B8 \uAD6C\uBD84 \uC5C6\uC774 \uC800\uC7A5\uB429\uB2C8\uB2E4");
    if (ni < 0) warnings.push("\uD488\uBAA9\uBA85 \uC5F4\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4");
    const lots = [];
    let skippedCode = 0, skippedQty = 0, badQty = 0;
    for (let i = hi + 1; i < rows.length; i++) {
      const r = rows[i] || [];
      const code = String(r[ci] || "").trim();
      if (!code || !/^[A-Za-z0-9]{2}/.test(code)) {
        if (code) skippedCode++;
        continue;
      }
      const rawQty = String(r[qi]).replace(/,/g, "").trim();
      const qty = parseFloat(rawQty);
      if (rawQty !== "" && (isNaN(qty) || !isFinite(qty))) {
        badQty++;
        continue;
      }
      if (!qty) {
        skippedQty++;
        continue;
      }
      lots.push({
        c: code,
        n: ni >= 0 ? String(r[ni] || "").trim() : "",
        w: wi >= 0 ? String(r[wi] || "").trim() : "",
        l: li >= 0 ? String(r[li] || "").trim() : "",
        e: ei >= 0 ? String(r[ei] || "").trim().slice(0, 10) : "",
        q: qty
      });
    }
    if (!lots.length) throw new Error("\uC720\uD6A8\uD55C \uC7AC\uACE0 \uD589\uC774 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uD30C\uC77C \uC591\uC2DD\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694");
    if (badQty > 0) warnings.push(`\uC22B\uC790\uB85C \uD574\uC11D\uD560 \uC218 \uC5C6\uB294 \uC218\uB7C9 ${badQty}\uD589\uC744 \uAC74\uB108\uB6F0\uC5C8\uC2B5\uB2C8\uB2E4`);
    const meta = {
      qtyCol: header[qi],
      codeCol: header[ci],
      lotCol: li >= 0 ? header[li] : null,
      expCol: ei >= 0 ? header[ei] : null,
      whCol: wi >= 0 ? header[wi] : null,
      dataRows: rows.length - hi - 1,
      parsedRows: lots.length,
      skippedSubtotal: skippedCode,
      skippedZero: skippedQty,
      badQty,
      warnings
    };
    return { lots, meta };
  }
  function parseWorkOrderWorkbook(wb) {
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
    let hi = -1;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || [];
      if (r.some((x) => String(x).trim() === "\uD488\uBAA9\uBA85")) {
        hi = i;
        break;
      }
    }
    if (hi < 0) throw new Error('"\uD488\uBAA9\uBA85" \uC5F4\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC791\uC5C5\uC9C0\uC2DC\uC11C \uC591\uC2DD\uC774 \uB9DE\uB294\uC9C0 \uD655\uC778\uD574 \uC8FC\uC138\uC694.');
    const header = rows[hi].map((x) => String(x).trim());
    const nameIdx = header.indexOf("\uD488\uBAA9\uBA85");
    const qtyIdx = header.indexOf("\uC218\uB7C9");
    if (qtyIdx < 0) throw new Error('"\uC218\uB7C9" \uC5F4\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.');
    const lines = [];
    for (let i = hi + 1; i < rows.length; i++) {
      const r = rows[i] || [];
      const first = String(r[0] || "").trim();
      if (first.includes("\uCD1D\uD569\uACC4")) break;
      const name = String(r[nameIdx] || "").trim();
      if (!name) continue;
      const qtyRaw = String(r[qtyIdx] || "").trim();
      const m = qtyRaw.match(/[\d,]+(\.\d+)?/);
      if (!m) continue;
      const qty = parseFloat(m[0].replace(/,/g, ""));
      if (!Number.isFinite(qty) || qty <= 0) continue;
      const unit = /kg|킬로그램/i.test(qtyRaw) ? "kg" : "EA";
      lines.push({ rawName: name, qty, unit });
    }
    if (!lines.length) throw new Error("\uCD94\uCD9C\uB41C \uC81C\uD488 \uD589\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uC791\uC5C5\uC9C0\uC2DC\uC11C \uC591\uC2DD\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
    return lines;
  }
  function normalizeForMatch(s) {
    let t = String(s || "");
    t = t.replace(/\[[^\]]*\]/g, " ");
    t = t.replace(/[\u4e00-\u9fff]/g, " ");
    t = t.replace(/[^\uac00-\ud7a3a-zA-Z0-9.\s]/g, " ");
    t = t.replace(/\s+/g, " ").trim();
    return t;
  }
  function tokenizeForMatch(s) {
    return normalizeForMatch(s).split(" ").filter(Boolean);
  }
  function matchBomByName(rawName, bomList) {
    const tokens = new Set(tokenizeForMatch(rawName));
    let best = null, bestScore = 0;
    bomList.forEach((b) => {
      const bTokens = tokenizeForMatch(b.name);
      if (!bTokens.length) return;
      let common = 0;
      bTokens.forEach((t) => {
        if (tokens.has(t)) common++;
      });
      const score = common / Math.min(tokens.size || 1, bTokens.length);
      if (score > bestScore) {
        bestScore = score;
        best = b;
      }
    });
    return { bom: best, score: bestScore };
  }
  const fefoSort = (lots) => [...lots].sort((a, b) => {
    if (a.e && b.e) return a.e.localeCompare(b.e) || a.l.localeCompare(b.l);
    if (a.e) return -1;
    if (b.e) return 1;
    return a.l.localeCompare(b.l);
  });
  function allocateLots(lots, required, excluded) {
    const exSet = excluded || /* @__PURE__ */ new Set();
    const usable = fefoSort(lots.filter((l) => !exSet.has(l.id)));
    let remain = required;
    const usedMap = /* @__PURE__ */ new Map();
    for (const lot of usable) {
      const u = Math.min(lot.q, Math.max(0, remain));
      usedMap.set(lot.id, u);
      remain -= u;
    }
    return fefoSort(lots).map((lot) => {
      const isExcluded = exSet.has(lot.id);
      const u = usedMap.get(lot.id) ?? 0;
      return {
        ...lot,
        use: isExcluded ? null : u,
        left: isExcluded ? null : lot.q - u,
        excluded: isExcluded
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
      return items.filter((i) => i.code.toLowerCase().includes(t) || i.name.toLowerCase().includes(t)).slice(0, 30);
    }, [q, items]);
    useEffect(() => {
      const h = (e) => {
        if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      };
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
    return /* @__PURE__ */ React.createElement("div", { ref, style: { position: "relative", flex: 1, minWidth: 220 } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        style: inp,
        placeholder: "\uBD80\uC790\uC7AC \uCF54\uB4DC \uB610\uB294 \uC774\uB984 \uAC80\uC0C9\u2026",
        value: q,
        onFocus: openDropdown,
        onChange: (e) => {
          setQ(e.target.value);
          openDropdown();
        }
      }
    ), open && results.length > 0 && /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      left: 0,
      right: 0,
      zIndex: 30,
      ...dropUp ? { bottom: "calc(100% + 4px)" } : { top: "calc(100% + 4px)" },
      background: "#fff",
      border: "1px solid #DDE4E2",
      borderRadius: 10,
      boxShadow: "0 8px 24px rgba(21,32,31,.12)",
      maxHeight: 280,
      overflowY: "auto"
    } }, results.map((i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: i.code,
        onClick: () => {
          onPick(i);
          setQ("");
          setOpen(false);
        },
        style: { padding: "9px 12px", cursor: "pointer", borderBottom: "1px solid #F4F6F5" },
        onMouseOver: (e) => e.currentTarget.style.background = "#E3F0EC",
        onMouseOut: (e) => e.currentTarget.style.background = "transparent"
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600 } }, i.name),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#5C6B69", fontFamily: "monospace" } }, i.code, " \xB7 3PL ", fmt(i.t3), " / \uC774\uCE74\uC6B4\uD2B8 ", fmt(i.te))
    ))));
  }
  function BomSearch({ boms, value, onPick, onClear }) {
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const ref = useRef(null);
    const inputRef = useRef(null);
    const selected = boms.find((b) => b.id === value);
    const results = useMemo(() => {
      const t = q.trim().toLowerCase();
      if (!t) return boms.slice(0, 50);
      return boms.filter((b) => b.name.toLowerCase().includes(t)).slice(0, 50);
    }, [q, boms]);
    useEffect(() => {
      const h = (e) => {
        if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener("mousedown", h);
      return () => document.removeEventListener("mousedown", h);
    }, []);
    useEffect(() => {
      if (!value) setQ("");
    }, [value]);
    const openDropdown = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        setDropUp(spaceBelow < 320 && spaceAbove > spaceBelow);
      }
      setOpen(true);
    };
    return /* @__PURE__ */ React.createElement("div", { ref, style: { position: "relative", flex: 2, minWidth: 220 } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        ref: inputRef,
        style: { ...inp, paddingRight: selected ? 32 : 11 },
        placeholder: "\uC81C\uD488 \uC774\uB984\uC73C\uB85C \uAC80\uC0C9\u2026",
        value: open ? q : selected?.name || q,
        onFocus: () => {
          if (selected) setQ("");
          openDropdown();
        },
        onChange: (e) => {
          setQ(e.target.value);
          openDropdown();
          if (selected) onPick("");
        }
      }
    ), selected && !open && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setQ("");
          onClear && onClear();
          inputRef.current?.focus();
        },
        style: {
          position: "absolute",
          right: 6,
          top: "50%",
          transform: "translateY(-50%)",
          border: "none",
          background: "transparent",
          color: "#5C6B69",
          cursor: "pointer",
          fontSize: 16,
          padding: "4px 8px",
          lineHeight: 1
        }
      },
      "\xD7"
    ), open && /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      left: 0,
      right: 0,
      zIndex: 30,
      ...dropUp ? { bottom: "calc(100% + 4px)" } : { top: "calc(100% + 4px)" },
      background: "#fff",
      border: "1px solid #DDE4E2",
      borderRadius: 10,
      boxShadow: "0 8px 24px rgba(21,32,31,.12)",
      maxHeight: 300,
      overflowY: "auto"
    } }, results.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 12px", fontSize: 13, color: "#8A9694", textAlign: "center" } }, "\uC77C\uCE58\uD558\uB294 \uC81C\uD488\uC774 \uC5C6\uC2B5\uB2C8\uB2E4") : results.map((b) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: b.id,
        onClick: () => {
          onPick(b.id);
          setOpen(false);
          setQ("");
        },
        style: {
          padding: "9px 12px",
          cursor: "pointer",
          borderBottom: "1px solid #F4F6F5",
          background: b.id === value ? "#E3F0EC" : "transparent"
        },
        onMouseOver: (e) => e.currentTarget.style.background = "#E3F0EC",
        onMouseOut: (e) => e.currentTarget.style.background = b.id === value ? "#E3F0EC" : "transparent"
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600 } }, b.name),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "#5C6B69" } }, "\uBD80\uC790\uC7AC ", b.components.length, "\uC885")
    ))));
  }
  function BomEditor({ initial, items, getStock, onSave, onCancel }) {
    const [name, setName] = useState(initial?.name || "");
    const [comps, setComps] = useState(initial?.components || []);
    const [isKernel, setIsKernel] = useState(!!initial?.kernelCode);
    const [kernelCode, setKernelCode] = useState(initial?.kernelCode || "");
    const addComp = (item) => {
      if (comps.some((c) => c.code === item.code)) return;
      setComps([...comps, { code: item.code, name: item.name, qty: 1 }]);
    };
    const setQty = (code, qty) => setComps(comps.map((c) => c.code === code ? { ...c, qty } : c));
    const remove = (code) => setComps(comps.filter((c) => c.code !== code));
    const valid = name.trim() && comps.length > 0 && comps.every((c) => c.qty > 0) && (!isKernel || kernelCode.trim());
    return /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px solid #DDE4E2", borderRadius: 14, padding: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, marginBottom: 14 } }, initial ? "BOM \uC218\uC815" : "\uC0C8 \uC81C\uD488 BOM \uB4F1\uB85D"), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 12, color: "#5C6B69", fontWeight: 600 } }, "\uC81C\uD488 \uC774\uB984"), /* @__PURE__ */ React.createElement(
      "input",
      {
        style: { ...inp, marginTop: 4 },
        value: name,
        placeholder: "\uC608: \uD5C8\uBC8C \uD50C\uB8E8\uC774\uB4DC 50ml \uC138\uD2B8",
        onChange: (e) => setName(e.target.value)
      }
    )), /* @__PURE__ */ React.createElement("div", { style: {
      marginBottom: 14,
      padding: "10px 12px",
      borderRadius: 10,
      background: isKernel ? "#FBF3DE" : "#FAFBFB",
      border: `1px solid ${isKernel ? "#E0C97A" : "#DDE4E2"}`
    } }, /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: isKernel, onChange: (e) => setIsKernel(e.target.checked) }), "\u{1F9E9} \uC774 BOM\uC740 \uC54C\uB9F9\uC774(\uBC18\uC81C\uD488)\uC785\uB2C8\uB2E4 \u2014 \uB2E4\uB978 \uD0A4\uD2B8 BOM\uC5D0\uC11C \uC774 \uC54C\uB9F9\uC774\uB97C \uBD80\uC790\uC7AC\uCC98\uB7FC \uCC38\uC870\uD560 \uC218 \uC788\uAC8C \uB429\uB2C8\uB2E4"), isKernel && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8 } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11.5, color: "#7A5500", fontWeight: 600 } }, "\uC54C\uB9F9\uC774 \uD488\uBAA9\uCF54\uB4DC (\uC804\uC0B0\uC5D0 \uB4F1\uB85D\uB41C \uC7AC\uACE0 \uCF54\uB4DC\uC640 \uB3D9\uC77C\uD574\uC57C \uC790\uB3D9 \uC7AC\uACE0 \uC870\uD68C\uAC00 \uB429\uB2C8\uB2E4)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        style: { ...inp, marginTop: 4, maxWidth: 280 },
        value: kernelCode,
        placeholder: "\uC608: MR370050TG4",
        onChange: (e) => setKernelCode(e.target.value.trim())
      }
    ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#7A5500", marginTop: 4, lineHeight: 1.6 } }, "\uB2E4\uB978 \uD0A4\uD2B8 BOM\uC744 \uB9CC\uB4E4 \uB54C \uBD80\uC790\uC7AC \uAC80\uC0C9\uCC3D\uC5D0 \uC774 \uCF54\uB4DC\uB97C \uC785\uB825\uD558\uBA74 \uC54C\uB9F9\uC774\uB85C \uC778\uC2DD\uB418\uC5B4, \uBC1C\uC8FC \uC2DC\uBBAC\uB808\uC774\uC158\uC5D0\uC11C \uC7AC\uACE0 \uC6B0\uC120 \uC18C\uC9C4 / \uAC15\uC81C \uC804\uAC1C / \uAC15\uC81C \uC644\uC81C\uD488 \uC911 \uC120\uD0DD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 12, color: "#5C6B69", fontWeight: 600 } }, "\uBD80\uC790\uC7AC \uCD94\uAC00"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 4 } }, /* @__PURE__ */ React.createElement(ItemSearch, { items, onPick: addComp }))), comps.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 8 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { color: "#5C6B69", textAlign: "left", background: "#FAFBFB" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "8px 10px", fontWeight: 600 } }, "\uBD80\uC790\uC7AC"), /* @__PURE__ */ React.createElement("th", { style: { padding: "8px 10px", fontWeight: 600, width: 130 } }, "1\uAC1C\uB2F9 \uC18C\uC694\uB7C9"), /* @__PURE__ */ React.createElement("th", { style: { width: 60 } }))), /* @__PURE__ */ React.createElement("tbody", null, comps.map((c) => {
      const s = getStock(c.code);
      return /* @__PURE__ */ React.createElement("tr", { key: c.code, style: { borderTop: "1px solid #F4F6F5" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600 } }, c.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#5C6B69", fontFamily: "monospace" } }, c.code, " \xB7 3PL ", fmt(s.t3), " / \uC774\uCE74\uC6B4\uD2B8 ", fmt(s.te))), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px" } }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "number",
          min: "0.01",
          step: "any",
          value: c.qty,
          style: { ...inp, padding: "6px 8px" },
          onChange: (e) => setQty(c.code, parseFloat(e.target.value) || 0)
        }
      )), /* @__PURE__ */ React.createElement("td", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement(Btn, { kind: "danger", small: true, onClick: () => remove(c.code) }, "\uC0AD\uC81C")));
    })))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 16 } }, /* @__PURE__ */ React.createElement(Btn, { onClick: () => onSave({ id: initial?.id || Date.now().toString(36), name: name.trim(), components: comps, kernelCode: isKernel ? kernelCode.trim() : "" }), disabled: !valid }, "\uC800\uC7A5"), /* @__PURE__ */ React.createElement(Btn, { kind: "plain", onClick: onCancel }, "\uCDE8\uC18C")));
  }
  async function exportBoms(boms) {
    const data = { version: 1, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), boms };
    try {
      const downloads = await claude.use("downloads");
      if (!downloads) {
        alert("\uC774 \uD658\uACBD\uC5D0\uC11C\uB294 \uD30C\uC77C \uC800\uC7A5\uC744 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
        return false;
      }
      await downloads.save({
        filename: "BOM_" + (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) + ".json",
        data: JSON.stringify(data, null, 2)
      });
      return true;
    } catch (ex) {
      if (ex && ex.code === "declined") return false;
      console.error("BOM \uB0B4\uBCF4\uB0B4\uAE30 \uC624\uB958:", ex);
      alert("BOM \uB0B4\uBCF4\uB0B4\uAE30 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4:\n\n" + (ex && ex.message ? ex.message : ex));
      return false;
    }
  }
  function ImportBtn({ onImport }) {
    const ref = useRef(null);
    const handleFile = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        alert("\uD30C\uC77C\uC740 10MB \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4.");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          const boms = data.boms ?? data;
          if (!Array.isArray(boms)) throw new Error();
          await onImport(boms);
        } catch {
          alert("BOM \uD30C\uC77C\uC744 \uC77D\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC62C\uBC14\uB978 JSON \uD30C\uC77C\uC778\uC9C0 \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
        }
        e.target.value = "";
      };
      reader.readAsText(file);
    };
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("input", { ref, type: "file", accept: ".json", style: { display: "none" }, onChange: handleFile }), /* @__PURE__ */ React.createElement(Btn, { kind: "amber", small: true, onClick: () => ref.current.click() }, "\u{1F4C2} BOM \uBD88\uB7EC\uC624\uAE30"));
  }
  function StockUploadCard({ srcKey, data, prevData, onLoaded, onReset, onRevert, locked }) {
    const ref = useRef(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const total = useMemo(() => data.lots.reduce((s, l) => s + l.q, 0), [data]);
    const codes = useMemo(() => new Set(data.lots.map((l) => l.c)).size, [data]);
    const processFile = (file) => {
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        alert("\uD30C\uC77C\uC740 10MB \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4.");
        return;
      }
      const okExt = /\.(xlsx|xls|csv)$/i.test(file.name);
      if (!okExt) {
        setErr("\uC5D1\uC140 \uD30C\uC77C(.xlsx, .xls, .csv)\uB9CC \uAC00\uB2A5\uD569\uB2C8\uB2E4");
        return;
      }
      setBusy(true);
      setErr(null);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const wb = await readWorkbookSafely(ev.target.result);
          const { lots, meta } = parseStockWorkbook(wb);
          await onLoaded({ fileName: file.name, date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace("T", " "), lots, meta });
        } catch (ex) {
          setErr(ex.message || "\uD30C\uC77C \uD574\uC11D \uC2E4\uD328");
        }
        setBusy(false);
      };
      reader.onerror = () => {
        setErr("\uD30C\uC77C \uC77D\uAE30 \uC2E4\uD328");
        setBusy(false);
      };
      reader.readAsArrayBuffer(file);
    };
    const handleFile = (e) => {
      processFile(e.target.files[0]);
      e.target.value = "";
    };
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    };
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(true);
    };
    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
    };
    const tone = srcKey === "p3l" ? "#1D5C8A" : srcKey === "carton" ? "#7B4D1E" : "#0E6E5C";
    const toneSoft = srcKey === "p3l" ? "#E4EEF6" : srcKey === "carton" ? "#F5EDE4" : "#E3F0EC";
    return /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px solid #DDE4E2", borderRadius: 14, padding: 18, flex: 1, minWidth: 300 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 800, color: tone } }, SRC[srcKey]), /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 11,
      fontWeight: 700,
      padding: "3px 8px",
      borderRadius: 999,
      background: toneSoft,
      color: tone
    } }, srcKey === "p3l" ? "WMS" : "ERP")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: "#5C6B69", lineHeight: 1.7, marginBottom: 12 } }, "\uD30C\uC77C: ", /* @__PURE__ */ React.createElement("b", { style: { color: "#15201F" } }, data.fileName), /* @__PURE__ */ React.createElement("br", null), "\uC5C5\uB85C\uB4DC: ", data.date, /* @__PURE__ */ React.createElement("br", null), "\uD488\uBAA9 ", fmt(codes), "\uC885 \xB7 \uB85C\uD2B8 ", fmt(data.lots.length), "\uAC74 \xB7 \uCD1D ", fmt(total), "\uAC1C"), data.meta && /* @__PURE__ */ React.createElement("div", { style: {
      fontSize: 11.5,
      background: "#FAFBFB",
      border: "1px solid #EDF1F0",
      borderRadius: 8,
      padding: "8px 10px",
      marginBottom: 12,
      lineHeight: 1.7,
      color: "#5C6B69"
    } }, /* @__PURE__ */ React.createElement("b", { style: { color: "#15201F" } }, "\u{1F4CB} \uD30C\uC2F1 \uACB0\uACFC"), /* @__PURE__ */ React.createElement("br", null), "\uC218\uB7C9 \uC5F4: ", /* @__PURE__ */ React.createElement("b", { style: { color: tone } }, data.meta.qtyCol), " \xB7 \uCF54\uB4DC \uC5F4: ", data.meta.codeCol, data.meta.lotCol && /* @__PURE__ */ React.createElement(React.Fragment, null, " \xB7 \uB85C\uD2B8 \uC5F4: ", data.meta.lotCol), /* @__PURE__ */ React.createElement("br", null), "\uB370\uC774\uD130 ", fmt(data.meta.dataRows), "\uD589 \uC911 ", fmt(data.meta.parsedRows), "\uD589 \uBC18\uC601", data.meta.skippedSubtotal > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, " \xB7 \uC18C\uACC4 \uB4F1 \uC81C\uC678 ", fmt(data.meta.skippedSubtotal), "\uD589"), data.meta.skippedZero > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, " \xB7 \uC218\uB7C9 0 \uC81C\uC678 ", fmt(data.meta.skippedZero), "\uD589"), data.meta.warnings.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 4, color: "#9A6B00" } }, data.meta.warnings.map((w, i) => /* @__PURE__ */ React.createElement("div", { key: i }, "\u26A0 ", w)))), locked ? /* @__PURE__ */ React.createElement(LockedNotice, { tier: 1, label: "\uC7AC\uACE0 \uC5C5\uB85C\uB4DC/\uCD08\uAE30\uD654" }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: () => !busy && ref.current.click(),
        onDrop: handleDrop,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        style: {
          border: `2px dashed ${dragOver ? tone : "#C8D2D0"}`,
          background: dragOver ? toneSoft : "#FAFBFB",
          borderRadius: 10,
          padding: "20px 14px",
          textAlign: "center",
          cursor: busy ? "wait" : "pointer",
          transition: "all .15s",
          marginBottom: 10
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, marginBottom: 4, opacity: dragOver ? 1 : 0.6 } }, busy ? "\u23F3" : dragOver ? "\u{1F4E5}" : "\u{1F4CA}"),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: dragOver ? tone : "#15201F" } }, busy ? "\uC77D\uB294 \uC911\u2026" : dragOver ? "\uC5EC\uAE30\uC5D0 \uB193\uC544\uC8FC\uC138\uC694" : "\uC5D1\uC140 \uD30C\uC77C\uC744 \uB04C\uC5B4\uB2E4 \uB193\uAC70\uB098 \uD074\uB9AD"),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "#8A9694", marginTop: 4 } }, ".xlsx, .xls, .csv \uC9C0\uC6D0")
    ), /* @__PURE__ */ React.createElement("input", { ref, type: "file", accept: ".xlsx,.xls,.csv", style: { display: "none" }, onChange: handleFile }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, prevData && /* @__PURE__ */ React.createElement(Btn, { kind: "amber", small: true, onClick: onRevert }, "\u21B6 \uC9C1\uC804 \uB370\uC774\uD130\uB85C \uB418\uB3CC\uB9AC\uAE30"), /* @__PURE__ */ React.createElement(Btn, { kind: "plain", small: true, onClick: () => {
      if (confirm("\uC774 \uC7AC\uACE0\uB97C \uBE44\uC6B8\uAE4C\uC694? \uBCC0\uACBD \uC804 \uC7AC\uACE0\uB294 \uC774\uC804 \uC7AC\uACE0\uB85C \uBCF4\uAD00\uB429\uB2C8\uB2E4.")) onReset();
    } }, "\uC7AC\uACE0 \uBE44\uC6B0\uAE30"))), prevData && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 11.5, color: "#9A6B00", lineHeight: 1.6 } }, "\u21B6 \uB418\uB3CC\uB9AC\uAE30 \uAC00\uB2A5: ", /* @__PURE__ */ React.createElement("b", null, prevData.fileName), " (", prevData.date, ")"), err && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, fontSize: 12, color: "#C8372D", fontWeight: 600 } }, "\u26A0 ", err), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, fontSize: 11.5, color: "#8A9694", lineHeight: 1.6 } }, "\uD488\uBAA9\uCF54\uB4DC/\uC0C1\uD488\uCF54\uB4DC \xB7 \uC218\uB7C9(\uC7AC\uACE0\uC218\uB7C9/\uAC00\uC6A9\uC7AC\uACE0) \uC5F4\uC774 \uC788\uC73C\uBA74 \uC790\uB3D9 \uC778\uC2DD\uB429\uB2C8\uB2E4. \uB85C\uD2B8No.\xB7\uC720\uD6A8\uAE30\uD55C\xB7\uCC3D\uACE0\uBA85 \uC5F4\uC774 \uC788\uC73C\uBA74 \uB85C\uD2B8\uBCC4\uB85C \uBD84\uD560 \uC800\uC7A5\uB429\uB2C8\uB2E4."));
  }
  function ManualStockAddForm({ onAdd }) {
    const [srcKey, setSrcKey] = useState("p3l");
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [warehouse, setWarehouse] = useState("");
    const [lot, setLot] = useState("");
    const [qty, setQty] = useState("");
    const [msg, setMsg] = useState(null);
    const inpS = { ...inp, padding: "9px 11px", fontSize: 13 };
    const submit = async () => {
      const c = code.trim();
      const n = name.trim();
      const q = Number(qty);
      if (!c) {
        setMsg({ t: "err", m: "\uD488\uBAA9\uCF54\uB4DC\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694." });
        return;
      }
      if (!qty || !Number.isFinite(q) || q <= 0) {
        setMsg({ t: "err", m: "\uC218\uB7C9\uC740 0\uBCF4\uB2E4 \uD070 \uC22B\uC790\uC5EC\uC57C \uD569\uB2C8\uB2E4." });
        return;
      }
      if (!await onAdd(srcKey, { c, n: n || c, w: warehouse.trim(), l: lot.trim(), e: "", q })) return;
      setMsg(null);
      setCode("");
      setName("");
      setWarehouse("");
      setLot("");
      setQty("");
    };
    return /* @__PURE__ */ React.createElement("div", { style: {
      background: "#fff",
      border: "1px solid #DDE4E2",
      borderRadius: 14,
      padding: 16,
      marginTop: 18,
      maxWidth: 640
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, marginBottom: 4 } }, "\u270D\uFE0F \uC7AC\uACE0 \uC9C1\uC811 \uCD94\uAC00"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "#8A9694", marginBottom: 12, lineHeight: 1.6 } }, "\uC5D1\uC140 \uC5C5\uB85C\uB4DC \uC5C6\uC774 \uD488\uBAA9\uCF54\uB4DC\xB7\uBD80\uC790\uC7AC\uBA85\xB7\uC218\uB7C9\xB7\uB85C\uD2B8\uBC88\uD638\uB97C \uC785\uB825\uD574 \uC7AC\uACE0 1\uAC74\uC744 \uC989\uC2DC \uCD94\uAC00\uD569\uB2C8\uB2E4. \uAE30\uC874 \uC7AC\uACE0\uB294 \uADF8\uB300\uB85C \uC720\uC9C0\uB418\uACE0 \uC0C8 \uB85C\uD2B8\uAC00 \uCD94\uAC00\uB429\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 10 } }, ["p3l", "ecount", "carton"].map((k) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: k,
        onClick: () => setSrcKey(k),
        style: {
          padding: "6px 12px",
          borderRadius: 8,
          fontSize: 12.5,
          fontWeight: 700,
          cursor: "pointer",
          border: srcKey === k ? "1.5px solid #15201F" : "1px solid #DDE4E2",
          background: srcKey === k ? "#15201F" : "#fff",
          color: srcKey === k ? "#fff" : "#5C6B69"
        }
      },
      SRC[k]
    ))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11.5, color: "#5C6B69", fontWeight: 600 } }, "\uD488\uBAA9\uCF54\uB4DC *"), /* @__PURE__ */ React.createElement("input", { style: inpS, value: code, onChange: (e) => setCode(e.target.value), placeholder: "\uC608: MR390000PP4" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11.5, color: "#5C6B69", fontWeight: 600 } }, "\uBD80\uC790\uC7AC\uBA85"), /* @__PURE__ */ React.createElement("input", { style: inpS, value: name, onChange: (e) => setName(e.target.value), placeholder: "\uBE44\uC6CC\uB450\uBA74 \uD488\uBAA9\uCF54\uB4DC\uB85C \uD45C\uC2DC" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11.5, color: "#5C6B69", fontWeight: 600 } }, "\uC218\uB7C9 *"), /* @__PURE__ */ React.createElement("input", { style: inpS, type: "number", value: qty, onChange: (e) => setQty(e.target.value), placeholder: "\uC608: 500" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11.5, color: "#5C6B69", fontWeight: 600 } }, "\uB85C\uD2B8/\uC2DC\uB9AC\uC5BC No."), /* @__PURE__ */ React.createElement("input", { style: inpS, value: lot, onChange: (e) => setLot(e.target.value), placeholder: "\uC120\uD0DD \uC785\uB825" })), /* @__PURE__ */ React.createElement("div", { style: { gridColumn: "1 / -1" } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11.5, color: "#5C6B69", fontWeight: 600 } }, "\uCC3D\uACE0\uBA85 (\uC120\uD0DD)"), /* @__PURE__ */ React.createElement("input", { style: inpS, value: warehouse, onChange: (e) => setWarehouse(e.target.value), placeholder: "\uC608: 3PL A\uC874, \uBCF8\uC0AC (\uBD80\uC790\uC7AC \uCC3D\uACE0) \uB4F1" }))), msg && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, marginBottom: 8, color: msg.t === "err" ? "#C8372D" : "#0E6E5C" } }, msg.t === "err" ? "\u26A0 " : "\u2713 ", msg.m), /* @__PURE__ */ React.createElement(Btn, { kind: "primary", small: true, onClick: submit }, "+ ", SRC[srcKey], "\uC5D0 \uC7AC\uACE0 \uCD94\uAC00"));
  }
  function LotTable({ lots, required, allocations, showSource, excluded, onToggle, onSelectAll, onAllocChange, onResetAlloc, searchHighlight }) {
    let alloc;
    if (allocations) {
      alloc = allocations;
    } else if (required != null) {
      alloc = allocateLots(lots, required, excluded);
    } else {
      alloc = fefoSort(lots).map((l) => ({ ...l, use: null, left: null, excluded: excluded?.has(l.id) ?? false }));
    }
    const interactive = !!onToggle;
    const editable = !!onAllocChange;
    const allOn = interactive && lots.every((l) => !excluded?.has(l.id));
    const allOff = interactive && lots.every((l) => excluded?.has(l.id));
    const hasUseCol = alloc.some((a) => a.use != null);
    const hasManual = alloc.some((a) => a.manual);
    return /* @__PURE__ */ React.createElement("div", null, (interactive || editable && hasManual) && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 6, fontSize: 11.5, flexWrap: "wrap" } }, interactive && lots.length > 1 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => onSelectAll(true),
        disabled: allOn,
        style: {
          border: "1px solid #DDE4E2",
          background: allOn ? "#F4F6F5" : "#fff",
          color: allOn ? "#B9C2C0" : "#15201F",
          padding: "3px 8px",
          borderRadius: 5,
          cursor: allOn ? "default" : "pointer",
          fontFamily: "inherit",
          fontSize: 11.5,
          fontWeight: 600
        }
      },
      "\uBAA8\uB450 \uC0AC\uC6A9"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => onSelectAll(false),
        disabled: allOff,
        style: {
          border: "1px solid #DDE4E2",
          background: allOff ? "#F4F6F5" : "#fff",
          color: allOff ? "#B9C2C0" : "#15201F",
          padding: "3px 8px",
          borderRadius: 5,
          cursor: allOff ? "default" : "pointer",
          fontFamily: "inherit",
          fontSize: 11.5,
          fontWeight: 600
        }
      },
      "\uBAA8\uB450 \uC81C\uC678"
    )), editable && hasManual && onResetAlloc && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: onResetAlloc,
        style: {
          border: "1px solid #E0C97A",
          background: "#FBF3DE",
          color: "#7A5500",
          padding: "3px 10px",
          borderRadius: 5,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 11.5,
          fontWeight: 700
        }
      },
      "\u21BA \uC790\uB3D9 \uBC30\uBD84\uC73C\uB85C \uCD08\uAE30\uD654"
    )), /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: hasUseCol ? 520 : 320 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { color: "#5C6B69", background: "#F4F6F5", textAlign: "right" } }, interactive && /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 8px", width: 30 } }), showSource && /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", textAlign: "left", fontWeight: 600 } }, "\uC804\uC0B0"), /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", textAlign: "left", fontWeight: 600 } }, "\uB85C\uD2B8/\uC2DC\uB9AC\uC5BC No."), /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", fontWeight: 600 } }, "\uBCF4\uC720"), hasUseCol && /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", fontWeight: 600 } }, "\uC0AC\uC6A9", editable && " (\uC785\uB825 \uAC00\uB2A5)"), hasUseCol && /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", fontWeight: 600 } }, "\uC0AC\uC6A9 \uD6C4 \uC794\uC5EC"))), /* @__PURE__ */ React.createElement("tbody", null, alloc.map((l, idx) => {
      const dim = l.excluded;
      const overUse = l.left != null && l.left < 0;
      const hl = searchHighlight && l.l && l.l.toLowerCase().includes(searchHighlight.toLowerCase());
      return /* @__PURE__ */ React.createElement("tr", { key: l.id || idx, style: {
        borderTop: "1px solid #EDF1F0",
        background: dim ? "#F4F6F5" : hl ? "#FFF8B8" : l.manual ? "#FFF8E1" : l.use > 0 ? "#FFFBEB" : "transparent",
        color: dim ? "#8A9694" : "inherit",
        textDecoration: dim ? "line-through" : "none",
        outline: hl && !dim ? "2px solid #E5C100" : "none",
        outlineOffset: hl && !dim ? "-2px" : 0
      } }, interactive && /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 8px", textAlign: "center", textDecoration: "none" } }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          checked: !dim,
          onChange: () => onToggle(l.id),
          style: { cursor: "pointer", width: 14, height: 14, accentColor: "#0E6E5C" }
        }
      )), showSource && /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", textDecoration: "none" } }, /* @__PURE__ */ React.createElement("span", { style: {
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 6px",
        borderRadius: 4,
        background: l.src === "p3l" ? "#E4EEF6" : l.src === "carton" ? "#F5EDE4" : "#E3F0EC",
        color: l.src === "p3l" ? "#1D5C8A" : l.src === "carton" ? "#7B4D1E" : "#0E6E5C",
        opacity: dim ? 0.5 : 1
      } }, l.src === "p3l" ? "3PL" : l.src === "carton" ? "\uCE74\uD1A4\uBC15\uC2A4" : "\uC774\uCE74\uC6B4\uD2B8")), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", fontFamily: "monospace" } }, l.l || "-", l.manual && !dim && /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 6, fontSize: 10, fontWeight: 700, color: "#9A6B00", background: "#FBF3DE", padding: "1px 5px", borderRadius: 4, textDecoration: "none" } }, "\uC218\uB3D9")), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" } }, fmt(l.q)), hasUseCol && /* @__PURE__ */ React.createElement("td", { style: { padding: "4px 10px", textAlign: "right", textDecoration: "none" } }, dim ? /* @__PURE__ */ React.createElement("span", { style: { color: "#B9C2C0" } }, "\uC81C\uC678") : editable ? /* @__PURE__ */ React.createElement("div", { style: { display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 2 } }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "number",
          min: "0",
          max: l.q,
          step: "1",
          value: l.manual ? l.manualWant ?? 0 : l.use ?? 0,
          onChange: (e) => {
            const v = parseFloat(e.target.value);
            onAllocChange(l.id, isNaN(v) ? 0 : Math.min(Math.max(0, v), l.q));
          },
          onClick: (e) => e.stopPropagation(),
          style: {
            width: 84,
            textAlign: "right",
            border: l.conflictQty > 0 ? "1.5px solid #C8372D" : l.manual ? "1.5px solid #9A6B00" : "1px solid #DDE4E2",
            background: l.conflictQty > 0 ? "#FBEAE8" : l.manual ? "#FFFBEB" : "#fff",
            color: l.conflictQty > 0 ? "#C8372D" : l.use > 0 ? "#9A6B00" : "#5C6B69",
            fontWeight: l.use > 0 || l.conflictQty > 0 ? 700 : 400,
            padding: "4px 8px",
            borderRadius: 5,
            fontFamily: "inherit",
            fontSize: 12.5,
            fontVariantNumeric: "tabular-nums"
          }
        }
      ), l.conflictQty > 0 && /* @__PURE__ */ React.createElement("span", { style: {
        fontSize: 10.5,
        fontWeight: 700,
        color: "#fff",
        background: "#C8372D",
        padding: "1px 6px",
        borderRadius: 4,
        whiteSpace: "nowrap"
      } }, "\u26A0 ", fmt(l.conflictQty), "\uAC1C \uCC28\uB2E8 \u2192 \uC2E4\uC0AC\uC6A9 ", fmt(l.use))) : /* @__PURE__ */ React.createElement("span", { style: { fontWeight: l.use > 0 ? 700 : 400, color: l.use > 0 ? "#9A6B00" : "#B9C2C0", fontVariantNumeric: "tabular-nums" } }, l.use > 0 ? fmt(l.use) : "-")), hasUseCol && /* @__PURE__ */ React.createElement("td", { style: {
        padding: "7px 10px",
        textAlign: "right",
        fontVariantNumeric: "tabular-nums",
        color: overUse ? "#C8372D" : "inherit",
        fontWeight: overUse ? 700 : 400
      } }, dim ? "-" : fmt(l.left)));
    })))));
  }
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
    const [mode, setMode] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const submit = () => (mode === "login" ? onLogin : onSignup)(email.trim(), password);
    const fieldStyle = { padding: "9px 11px", border: "1px solid #DDE4E2", borderRadius: 8, fontSize: 14 };
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1e3
        },
        onClick: (e) => {
          if (e.target === e.currentTarget) onClose();
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: {
        background: "#fff",
        borderRadius: 14,
        padding: 24,
        width: "min(340px,90vw)",
        display: "flex",
        flexDirection: "column",
        gap: 12
      } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 17, fontWeight: 800 } }, mode === "login" ? "\uAD00\uB9AC\uC790 \uB85C\uADF8\uC778" : "\uAD00\uB9AC\uC790 \uACC4\uC815 \uAC00\uC785"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "email",
          placeholder: "\uC774\uBA54\uC77C",
          autoComplete: "username",
          style: fieldStyle,
          value: email,
          onChange: (e) => setEmail(e.target.value)
        }
      ), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "password",
          placeholder: "\uBE44\uBC00\uBC88\uD638 (6\uC790 \uC774\uC0C1)",
          autoComplete: mode === "login" ? "current-password" : "new-password",
          style: fieldStyle,
          value: password,
          onChange: (e) => setPassword(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter") submit();
          }
        }
      ), error && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: "#C8372D" } }, error), mode === "signup" && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#9A6B00" } }, "\uAC00\uC785 \uD6C4\uC5D0\uB3C4 \uC2E4\uC81C \uAD8C\uD55C(1/2\uB2E8\uACC4)\uC740 \uAD00\uB9AC\uC790\uAC00 \uBCC4\uB3C4\uB85C \uBD80\uC5EC\uD574\uC57C \uAE30\uB2A5\uC774 \uC5F4\uB9BD\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", small: true, onClick: () => setMode(mode === "login" ? "signup" : "login") }, mode === "login" ? "\uACC4\uC815 \uAC00\uC785" : "\uB85C\uADF8\uC778\uC73C\uB85C"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", onClick: onClose }, "\uCDE8\uC18C"), /* @__PURE__ */ React.createElement(Btn, { onClick: submit, disabled: busy }, mode === "login" ? "\uB85C\uADF8\uC778" : "\uAC00\uC785\uD558\uAE30"))))
    );
  }
  function AuthBox({ user, tier, onLoginClick, onLogout }) {
    if (!user) return /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", small: true, onClick: onLoginClick }, "\u{1F512} \uAD00\uB9AC\uC790 \uB85C\uADF8\uC778");
    const tierLabel = tier === 2 ? "2\uB2E8\uACC4 \uAD00\uB9AC\uC790" : tier === 1 ? "1\uB2E8\uACC4 \uAD00\uB9AC\uC790" : "\uAD8C\uD55C \uC5C6\uC74C";
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#5C6B69" } }, /* @__PURE__ */ React.createElement("span", null, user.email, " \xB7 ", tierLabel), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", small: true, onClick: onLogout }, "\uB85C\uADF8\uC544\uC6C3"));
  }
  function LockedNotice({ tier, label }) {
    return /* @__PURE__ */ React.createElement("div", { style: {
      fontSize: 12,
      color: "#9A6B00",
      background: "#FBF3DE",
      border: "1px solid #E0C97A",
      borderRadius: 8,
      padding: "8px 10px"
    } }, "\u{1F512} ", label ? label + "\uC740(\uB294) " : "", tier, "\uB2E8\uACC4 \uB85C\uADF8\uC778 \uD6C4 \uC774\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
  }
  function App() {
    const [tab, setTab] = useState("plan");
    const emptyStock = () => Object.fromEntries(["p3l", "ecount", "carton"].map((k) => [k, { fileName: "(\uB370\uC774\uD130 \uC5C6\uC74C)", date: "", lots: [] }]));
    const [boms, setBoms] = useState([]);
    const [stock, setStock] = useState(emptyStock);
    const [basis, setBasis] = useState("ecount");
    const [dedup, setDedup] = useState(true);
    const [prevStock, setPrevStock] = useState({ p3l: null, ecount: null, carton: null });
    const [authUser, setAuthUser] = useState(null);
    const [authTier, setAuthTier] = useState(0);
    const [authReady, setAuthReady] = useState(false);
    const [dataReady, setDataReady] = useState(false);
    const [accessError, setAccessError] = useState("");
    const [loginOpen, setLoginOpen] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [loginBusy, setLoginBusy] = useState(false);
    const [saving, setSaving] = useState(false);
    const savingRef = useRef(false), revisions = useRef({}), editRevision = useRef(0);
    const [editing, setEditing] = useState(null);
    const [order, setOrder] = useState([]);
    const [selBom, setSelBom] = useState("");
    const [selQty, setSelQty] = useState(1e3);
    const [stockQ, setStockQ] = useState("");
    const [expanded, setExpanded] = useState({});
    const [expandedStk, setExpandedStk] = useState({});
    const [excluded, setExcluded] = useState(() => /* @__PURE__ */ new Set());
    const [manualAlloc, setManualAlloc] = useState({});
    const [partMode, setPartMode] = useState({});
    const [viewMode, setViewMode] = useState("agg");
    const [toasts, setToasts] = useState([]);
    const showToast = (msg, color = "#0E6E5C") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, msg, color }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
    };
    const dbRef = useRef(null);
    useEffect(() => {
      const app = getFirebaseApp(), db = firebase.firestore(app);
      dbRef.current = db;
      let stops = [], epoch = 0, lastKey = "";
      const clear = () => {
        stops.forEach((stop) => stop());
        stops = [];
        revisions.current = {};
        setBoms([]);
        setStock(emptyStock());
        setPrevStock({ p3l: null, ecount: null, carton: null });
        setOrder([]);
        setEditing(null);
        setManualAlloc({});
        setExcluded(/* @__PURE__ */ new Set());
        setDataReady(false);
        setExpanded({});
        setExpandedStk({});
        setPartMode({});
        setWoReview(null);
        setImportedScenarios(/* @__PURE__ */ new Set());
      };
      InventorySecurity.start(app, (identity) => {
        setAuthUser(identity.user ? { email: identity.user.email, uid: identity.user.uid } : null);
        setAuthTier(identity.tier);
        setAuthReady(identity.ready);
        setAccessError(identity.error ? "\uAD8C\uD55C\uC744 \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694." : "");
        const key = identity.user ? identity.user.uid + ":" + identity.tier : "";
        if (key === lastKey) return;
        lastKey = key;
        const current = ++epoch;
        clear();
        if (identity.tier < 1) return;
        const paths = ["boms/list", "stock/p3l", "stock/ecount", "stock/carton", "stockPrev/p3l", "stockPrev/ecount", "stockPrev/carton", "settings/app"];
        const loaded = /* @__PURE__ */ new Set();
        paths.forEach((path) => stops.push(db.doc(path).onSnapshot((snap) => {
          if (current !== epoch) return;
          const d = snap.exists ? snap.data() : null;
          revisions.current[path] = d ? d._revision || 0 : 0;
          const [collection, id] = path.split("/");
          if (collection === "boms") setBoms(d && Array.isArray(d.boms) ? d.boms : []);
          if (collection === "stock") setStock((old) => ({ ...old, [id]: d && Array.isArray(d.lots) ? d : emptyStock()[id] }));
          if (collection === "stockPrev") setPrevStock((old) => ({ ...old, [id]: d && Array.isArray(d.lots) ? d : null }));
          if (collection === "settings" && d) {
            setBasis(d.basis || "ecount");
            setDedup(d.dedup !== false);
          }
          loaded.add(path);
          if (loaded.size === paths.length) setDataReady(true);
        }, () => {
          if (current !== epoch) return;
          ++epoch;
          clear();
          setAccessError("\uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694.");
        })));
      });
      return () => {
        ++epoch;
        stops.forEach((stop) => stop());
      };
    }, []);
    const doLogin = async (email, password) => {
      setLoginBusy(true);
      setLoginError("");
      try {
        await firebase.auth(getFirebaseApp()).setPersistence(firebase.auth.Auth.Persistence.SESSION);
        await firebase.auth(getFirebaseApp()).signInWithEmailAndPassword(email, password);
        setLoginOpen(false);
      } catch (e) {
        setLoginError("\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
      } finally {
        setLoginBusy(false);
      }
    };
    const doSignup = async (email, password) => {
      setLoginBusy(true);
      setLoginError("");
      try {
        await firebase.auth(getFirebaseApp()).setPersistence(firebase.auth.Auth.Persistence.SESSION);
        await firebase.auth(getFirebaseApp()).createUserWithEmailAndPassword(email, password);
        setLoginOpen(false);
        showToast("\uAC00\uC785\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uAD00\uB9AC\uC790\uC5D0\uAC8C \uAD8C\uD55C \uBD80\uC5EC\uB97C \uC694\uCCAD\uD558\uC138\uC694.");
      } catch (e) {
        setLoginError("\uAC00\uC785\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uC785\uB825 \uB0B4\uC6A9\uC744 \uD655\uC778\uD558\uAC70\uB098 \uAD00\uB9AC\uC790\uC5D0\uAC8C \uBB38\uC758\uD574 \uC8FC\uC138\uC694.");
      } finally {
        setLoginBusy(false);
      }
    };
    const doLogout = () => firebase.auth(getFirebaseApp()).signOut();
    const canEditStock = authTier >= 1 && dataReady;
    const canEditBom = authTier === 2 && dataReady;
    useEffect(() => {
      editRevision.current = revisions.current["boms/list"] || 0;
    }, [editing]);
    useEffect(() => {
      if (authTier !== 2) setEditing(null);
    }, [authTier]);
    const commit = async (mutations) => {
      if (savingRef.current) {
        showToast("\uC800\uC7A5 \uC911\uC785\uB2C8\uB2E4. \uC7A0\uC2DC \uAE30\uB2E4\uB824 \uC8FC\uC138\uC694.", "#9A6B00");
        return false;
      }
      savingRef.current = true;
      setSaving(true);
      try {
        await InventorySecurity.save(mutations);
        await Promise.all(mutations.map(async (m) => {
          const snap = await dbRef.current.doc(m.path).get({ source: "server" });
          revisions.current[m.path] = snap.data()?._revision || 0;
          const d = snap.data(), [collection, id] = m.path.split("/");
          if (collection === "stock") setStock((old) => ({ ...old, [id]: d }));
          if (collection === "boms") setBoms(d.boms);
        }));
        return true;
      } catch (e) {
        showToast(e.message || "\uC800\uC7A5\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.", "#C8372D");
        return false;
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    };
    const persistBoms = (next) => commit([{ path: "boms/list", expectedRevision: editing ? editRevision.current : revisions.current["boms/list"] || 0, data: { boms: next } }]);
    const updateStockSource = async (srcKey, data) => {
      const ok = await commit([{ path: "stock/" + srcKey, expectedRevision: revisions.current["stock/" + srcKey] || 0, data: InventorySecurity.clean(data) }]);
      if (ok) showToast("\uC7AC\uACE0\uAC00 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
      return ok;
    };
    const revertStockSource = async (srcKey) => {
      if (!prevStock[srcKey]) return false;
      const ok = await commit([{
        path: "stock/" + srcKey,
        expectedRevision: revisions.current["stock/" + srcKey] || 0,
        restore: true,
        backupRevision: revisions.current["stockPrev/" + srcKey] || 0
      }]);
      if (ok) showToast("\uC774\uC804 \uC7AC\uACE0\uB85C \uBCF5\uC6D0\uD588\uC2B5\uB2C8\uB2E4. \uBCC0\uACBD \uC804 \uC7AC\uACE0\uB3C4 \uBCF4\uAD00\uB429\uB2C8\uB2E4.");
      return ok;
    };
    const addManualLot = (srcKey, lot) => updateStockSource(srcKey, { ...stock[srcKey], lots: [...stock[srcKey].lots, lot] });
    const setBasisP = async (b) => {
      if (await commit([{ path: "settings/app", expectedRevision: revisions.current["settings/app"] || 0, data: { basis: b, dedup } }])) setBasis(b);
    };
    const setDedupP = async (v) => {
      if (await commit([{ path: "settings/app", expectedRevision: revisions.current["settings/app"] || 0, data: { basis, dedup: v } }])) setDedup(v);
    };
    const isDupLot = (l) => l.src === "ecount" && l.w && l.w.includes("3PL");
    const agg = useMemo(() => {
      const build = (lots, src) => {
        const m = {};
        lots.forEach((l) => {
          if (!m[l.c]) m[l.c] = { name: l.n, total: 0, lots: [] };
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
        carton: build(stock.carton?.lots || [], "carton")
      };
    }, [stock]);
    const items = useMemo(() => {
      const codes = /* @__PURE__ */ new Set([...Object.keys(agg.p3l), ...Object.keys(agg.ecount), ...Object.keys(agg.carton)]);
      return [...codes].map((code) => ({
        code,
        name: agg.ecount[code]?.name || agg.p3l[code]?.name || agg.carton[code]?.name || code,
        t3: agg.p3l[code]?.total ?? 0,
        te: agg.ecount[code]?.total ?? 0,
        tc: agg.carton[code]?.total ?? 0
      })).sort((a, b) => a.code.localeCompare(b.code));
    }, [agg]);
    const kernelByCode = useMemo(() => {
      const m = {};
      boms.forEach((b) => {
        if (b.kernelCode) m[b.kernelCode] = b;
      });
      return m;
    }, [boms]);
    const getStock = (code) => {
      const t3 = agg.p3l[code]?.total ?? 0;
      const te = agg.ecount[code]?.total ?? 0;
      const tc = agg.carton[code]?.total ?? 0;
      const l3 = agg.p3l[code]?.lots ?? [];
      const le = agg.ecount[code]?.lots ?? [];
      const lc = agg.carton[code]?.lots ?? [];
      let lots;
      if (basis === "p3l") lots = l3;
      else if (basis === "ecount") lots = le;
      else {
        lots = dedup ? [...l3, ...le.filter((l) => !isDupLot(l)), ...lc] : [...l3, ...le, ...lc];
      }
      const used = lots.reduce((s, l) => s + (excluded.has(l.id) ? 0 : l.q), 0);
      return { t3, te, tc, used, lots };
    };
    const dedupInfo = useMemo(() => {
      let lotCount = 0, qty = 0;
      Object.values(agg.ecount).forEach((item) => {
        item.lots.forEach((l) => {
          if (isDupLot(l)) {
            lotCount++;
            qty += l.q;
          }
        });
      });
      return { lotCount, qty };
    }, [agg]);
    const toggleLot = (id) => setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    const setLotsExcluded = (ids, exclude) => setExcluded((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (exclude) next.add(id);
        else next.delete(id);
      });
      return next;
    });
    const setManualUse = (lineId, code, lotId, qty) => {
      setManualAlloc((prev) => {
        const next = { ...prev };
        next[lineId] = { ...next[lineId] || {} };
        next[lineId][code] = { ...next[lineId][code] || {} };
        next[lineId][code][lotId] = qty;
        return next;
      });
    };
    const resetLineComponent = (lineId, code) => {
      setManualAlloc((prev) => {
        if (!prev[lineId]?.[code]) return prev;
        const next = { ...prev };
        next[lineId] = { ...next[lineId] };
        delete next[lineId][code];
        if (Object.keys(next[lineId]).length === 0) delete next[lineId];
        return next;
      });
    };
    const setKernelMode = (lineId, code, mode) => {
      setPartMode((prev) => {
        const next = { ...prev };
        if (mode === "auto") {
          if (!next[lineId]) return prev;
          next[lineId] = { ...next[lineId] };
          delete next[lineId][code];
          if (Object.keys(next[lineId]).length === 0) delete next[lineId];
          return next;
        }
        next[lineId] = { ...next[lineId] || {}, [code]: mode };
        return next;
      });
    };
    const saveBom = async (bom) => {
      const next = boms.some((b) => b.id === bom.id) ? boms.map((b) => b.id === bom.id ? bom : b) : [...boms, bom];
      if (!await persistBoms(next)) return;
      setEditing(null);
      showToast("BOM\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
    };
    const deleteBom = async (id) => {
      if (!await persistBoms(boms.filter((b) => b.id !== id))) return;
      setOrder(order.filter((o) => o.bomId !== id));
    };
    const deleteAllBoms = async () => {
      if (!await persistBoms([])) return;
      setOrder([]);
      showToast("\uBAA8\uB4E0 BOM\uC744 \uC0AD\uC81C\uD588\uC2B5\uB2C8\uB2E4.");
    };
    const handleImport = async (imported) => {
      const merged = [...boms];
      let added = 0, updated = 0, skippedName = 0;
      imported.forEach((b) => {
        const idx = merged.findIndex((x) => x.id === b.id);
        if (idx >= 0) {
          merged[idx] = b;
          updated++;
          return;
        }
        const nameIdx = merged.findIndex((x) => x.name.trim() === b.name.trim());
        if (nameIdx >= 0) {
          skippedName++;
          return;
        }
        merged.push(b);
        added++;
      });
      if (!await persistBoms(merged)) return;
      showToast(
        `\uBD88\uB7EC\uC624\uAE30 \uC644\uB8CC \u2014 \uCD94\uAC00 ${added}\uAC1C, \uC5C5\uB370\uC774\uD2B8 ${updated}\uAC1C` + (skippedName > 0 ? `, \uC774\uB984 \uC911\uBCF5\uC73C\uB85C \uAC74\uB108\uB700 ${skippedName}\uAC1C` : "")
      );
    };
    const calc = useMemo(() => {
      const lines = order.map((o) => ({ ...o, bom: boms.find((b) => b.id === o.bomId) })).filter((o) => o.bom && o.qty > 0);
      if (!lines.length) return null;
      const kernelLotsByCode = {};
      const kernelRemainByLot = {};
      const ensureKernelLots = (code) => {
        if (!kernelLotsByCode[code]) {
          const lots = fefoSort(getStock(code).lots);
          kernelLotsByCode[code] = lots;
          kernelRemainByLot[code] = {};
          lots.forEach((l) => {
            kernelRemainByLot[code][l.id] = excluded.has(l.id) ? 0 : l.q;
          });
        }
      };
      const MAX_KERNEL_DEPTH = 5;
      const resolvedByLine = lines.map((line) => {
        const resolved = [];
        const pushPlain = (code, name, required, expandedFrom) => {
          const existing = resolved.find((r) => r.code === code && !r.isKernel);
          if (existing) {
            existing.required += required;
            if (expandedFrom && !existing.expandedFrom) existing.expandedFrom = expandedFrom;
            return;
          }
          resolved.push({ code, name, required, isKernel: false, expandedFrom: expandedFrom || null });
        };
        const queue = line.bom.components.map((c) => ({
          code: c.code,
          name: c.name,
          required: c.qty * line.qty,
          depth: 0,
          expandedFrom: null
        }));
        while (queue.length) {
          const item = queue.shift();
          const kb = kernelByCode[item.code];
          if (!kb || item.depth >= MAX_KERNEL_DEPTH) {
            pushPlain(item.code, item.name, item.required, item.expandedFrom);
            continue;
          }
          const mode = partMode[line.id]?.[item.code] || "auto";
          if (mode === "force_finished") {
            resolved.push({
              code: item.code,
              name: item.name,
              required: item.required,
              isKernel: true,
              kernelMode: mode,
              kernelFullRequired: item.required,
              kernelExpanded: false,
              expandedFrom: item.expandedFrom
            });
            continue;
          }
          let used = 0, shortfall;
          if (mode === "force_expand") {
            shortfall = item.required;
          } else {
            ensureKernelLots(item.code);
            let remain = item.required;
            for (const lot of kernelLotsByCode[item.code]) {
              if (remain <= 0) break;
              const avail = kernelRemainByLot[item.code][lot.id] ?? 0;
              if (avail <= 0) continue;
              const u = Math.min(avail, remain);
              kernelRemainByLot[item.code][lot.id] = avail - u;
              used += u;
              remain -= u;
            }
            shortfall = remain;
          }
          if (used > 0 || shortfall > 0) {
            resolved.push({
              code: item.code,
              name: item.name,
              required: used,
              isKernel: true,
              kernelMode: mode,
              kernelFullRequired: item.required,
              kernelExpanded: shortfall > 0,
              expandedFrom: item.expandedFrom
            });
          }
          if (shortfall > 0) {
            kb.components.forEach((kc) => {
              queue.push({
                code: kc.code,
                name: kc.name,
                required: kc.qty * shortfall,
                depth: item.depth + 1,
                expandedFrom: { code: item.code, name: item.name }
              });
            });
          }
        }
        return resolved;
      });
      const need = {};
      resolvedByLine.forEach((resolved) => resolved.forEach((c) => {
        if (!need[c.code]) need[c.code] = { code: c.code, name: c.name, required: 0 };
        need[c.code].required += c.required;
      }));
      const rows = Object.values(need).map((n) => {
        const s = getStock(n.code);
        const remain = s.used - n.required;
        return { ...n, t3: s.t3, te: s.te, stock: s.used, lots: s.lots, remain, short: remain < 0 ? -remain : 0 };
      }).sort((a, b) => (b.short > 0 ? 1 : -1) - (a.short > 0 ? 1 : -1) || a.code.localeCompare(b.code));
      const perProduct = lines.map((l) => {
        let solo = Infinity, after = Infinity, bottleneck = "";
        l.bom.components.forEach((c) => {
          const s = getStock(c.code).used;
          const totalReq = need[c.code]?.required ?? c.qty * l.qty;
          const othersUse = totalReq - c.qty * l.qty;
          const so = Math.floor(s / c.qty);
          const a = Math.floor(Math.max(0, s - othersUse) / c.qty);
          if (so < solo) {
            solo = so;
            bottleneck = c.name;
          }
          if (a < after) after = a;
        });
        return { ...l, solo, after, bottleneck, ok: after >= l.qty };
      });
      const lotsByCode = {};
      const remainByLot = {};
      Object.keys(need).forEach((code) => {
        const lots = fefoSort(getStock(code).lots);
        lotsByCode[code] = lots;
        remainByLot[code] = {};
        lots.forEach((l) => {
          remainByLot[code][l.id] = excluded.has(l.id) ? 0 : l.q;
        });
      });
      const conflictByLot = {};
      const lineDetails = lines.map((line, li) => {
        const components = resolvedByLine[li].map((c) => {
          const required = c.required;
          const lots = lotsByCode[c.code] ?? [];
          const manuals = manualAlloc[line.id]?.[c.code] ?? {};
          let need_qty = required;
          const lineUse = {};
          const manualLots = new Set(Object.keys(manuals));
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
          const allocations = lots.map((lot) => ({
            ...lot,
            use: excluded.has(lot.id) ? null : lineUse[lot.id] ?? 0,
            left: excluded.has(lot.id) ? null : remainByLot[c.code][lot.id] ?? 0,
            excluded: excluded.has(lot.id),
            manual: manualLots.has(lot.id),
            manualWant: manualLots.has(lot.id) ? Math.max(0, manuals[lot.id] || 0) : null,
            conflictQty: manualLots.has(lot.id) && conflictByLot[lot.id] ? conflictByLot[lot.id] : 0
          }));
          const used = Object.values(lineUse).reduce((s, v) => s + v, 0);
          const totalStock = lots.reduce((s, l) => s + (excluded.has(l.id) ? 0 : l.q), 0);
          return {
            code: c.code,
            name: c.name,
            perUnit: line.qty ? required / line.qty : 0,
            required,
            used,
            allocations,
            lots,
            shortage: Math.max(0, need_qty),
            totalStock,
            isKernel: !!c.isKernel,
            kernelMode: c.kernelMode || null,
            kernelFullRequired: c.kernelFullRequired ?? null,
            kernelExpanded: !!c.kernelExpanded,
            expandedFrom: c.expandedFrom || null
          };
        });
        return { ...line, components, hasShortage: components.some((x) => x.shortage > 0) };
      });
      const aggByCode = {};
      lineDetails.forEach((line) => line.components.forEach((c) => {
        if (!aggByCode[c.code]) aggByCode[c.code] = {};
        c.allocations.forEach((a) => {
          if (!a.excluded && a.use > 0) {
            aggByCode[c.code][a.id] = (aggByCode[c.code][a.id] ?? 0) + a.use;
          }
        });
      }));
      rows.forEach((r) => {
        r.aggAllocations = r.lots.map((lot) => ({
          ...lot,
          use: excluded.has(lot.id) ? null : aggByCode[r.code]?.[lot.id] ?? 0,
          left: excluded.has(lot.id) ? null : lot.q - (aggByCode[r.code]?.[lot.id] ?? 0),
          excluded: excluded.has(lot.id)
        }));
      });
      const totalConflicts = Object.keys(conflictByLot).length;
      const totalConflictQty = Object.values(conflictByLot).reduce((s, v) => s + v, 0);
      return { rows, perProduct, totalShort: rows.filter((r) => r.short > 0), lineDetails, totalConflicts, totalConflictQty };
    }, [order, boms, agg, basis, excluded, manualAlloc, dedup, partMode, kernelByCode]);
    const stockResults = useMemo(() => {
      const t = stockQ.trim().toLowerCase();
      if (!t) return [];
      const out = [];
      for (const i of items) {
        const codeMatch = i.code.toLowerCase().includes(t);
        const nameMatch = i.name.toLowerCase().includes(t);
        let matchedLotNos = [];
        if (!codeMatch && !nameMatch) {
          const allLots = [...agg.p3l[i.code]?.lots || [], ...agg.ecount[i.code]?.lots || []];
          const matches = allLots.filter((lot) => lot.l && lot.l.toLowerCase().includes(t));
          if (matches.length === 0) continue;
          matchedLotNos = [...new Set(matches.map((m) => m.l))];
        }
        out.push({ ...i, matchedLotNos });
        if (out.length >= 50) break;
      }
      return out;
    }, [stockQ, items, agg]);
    const tabs = [["plan", "\uBC1C\uC8FC \uC2DC\uBBAC\uB808\uC774\uC158"], ["bom", `BOM \uAD00\uB9AC (${boms.length})`], ["stock", "\uC7AC\uACE0 \uC870\uD68C"], ["upload", "\uC7AC\uACE0 \uC5C5\uB85C\uB4DC"]];
    const basisLabel = basis === "sum" ? "3PL+\uC774\uCE74\uC6B4\uD2B8+\uCE74\uD1A4\uBC15\uC2A4 \uD569\uC0B0" : SRC[basis];
    const exportResultExcel = async () => {
      if (!calc) {
        showToast("\uB0B4\uBCF4\uB0BC \uBC1C\uC8FC \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uBA3C\uC800 \uBC1C\uC8FC \uD488\uBAA9\uC744 \uCD94\uAC00\uD558\uC138\uC694.", "#9A6B00");
        return;
      }
      try {
        const now = /* @__PURE__ */ new Date();
        const stamp = now.toISOString().slice(0, 16).replace("T", " ");
        const wb = XLSX.utils.book_new();
        const summaryRows = [
          ["\uBD80\uC790\uC7AC \uC18C\uC694\uB7C9 \xB7 \uD658\uC0B0\uC7AC\uACE0 \uACC4\uC0B0 \uACB0\uACFC"],
          [],
          ["\uC0DD\uC131 \uC77C\uC2DC", stamp],
          ["\uACC4\uC0B0 \uAE30\uC900 \uC7AC\uACE0", basisLabel + (basis === "sum" ? dedup ? " (\uC774\uCE74\uC6B4\uD2B8 3PL \uCC3D\uACE0\uBD84 \uC911\uBCF5 \uC81C\uAC70 ON)" : " (\u26A0 \uC911\uBCF5 \uC81C\uAC70 OFF)" : "")],
          ["3PL \uC804\uC0B0 \uB370\uC774\uD130", stock.p3l.fileName, stock.p3l.date],
          ["\uC774\uCE74\uC6B4\uD2B8 \uC804\uC0B0 \uB370\uC774\uD130", stock.ecount.fileName, stock.ecount.date],
          ["\uC0AC\uC6A9 \uC81C\uC678 \uB85C\uD2B8 \uC218", excluded.size],
          ["\uACFC\uBC30\uBD84 \uCC28\uB2E8", calc.totalConflicts > 0 ? `${calc.totalConflicts}\uAC74 / ${calc.totalConflictQty}\uAC1C` : "\uC5C6\uC74C"],
          [],
          ["\uBC1C\uC8FC \uB77C\uC778"],
          ["\uC21C\uBC88", "\uC81C\uD488", "\uBC1C\uC8FC \uC218\uB7C9", "\uB2E8\uB3C5 \uD658\uC0B0\uC7AC\uACE0", "\uB3D9\uC2DC \uC0DD\uC0B0 \uAC00\uB2A5", "\uBCD1\uBAA9 \uBD80\uC790\uC7AC", "\uCDA9\uC871 \uC5EC\uBD80"],
          ...calc.perProduct.map((p, i) => [
            i + 1,
            p.bom.name,
            p.qty,
            isFinite(p.solo) ? p.solo : "",
            isFinite(p.after) ? p.after : "",
            p.bottleneck || "",
            p.ok ? "\uCDA9\uBD84" : `\uBD80\uC871 ${p.qty - p.after}\uAC1C`
          ])
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
        ws1["!cols"] = [{ wch: 18 }, { wch: 40 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 30 }, { wch: 14 }];
        XLSX.utils.book_append_sheet(wb, ws1, "\uC694\uC57D");
        const lineHeader = ["\uBD80\uC790\uC7AC\uCF54\uB4DC", "\uBD80\uC790\uC7AC\uBA85", "1\uAC1C\uB2F9 \uC18C\uC694\uB7C9", "\uB77C\uC778 \uC18C\uC694\uB7C9", "3PL \uC804\uC0B0", "\uC774\uCE74\uC6B4\uD2B8", "\uAE30\uC900\uC7AC\uACE0", "\uBC30\uC815 \uC0AC\uC6A9\uB7C9", "\uC0DD\uC0B0 \uD6C4 \uC794\uC5EC", "\uBD80\uC871 \uC218\uB7C9", "\uC0C1\uD0DC"];
        const sheetNameCount = {};
        calc.lineDetails.forEach((line, li) => {
          const lineUsed = {};
          line.components.forEach((c) => {
            lineUsed[c.code] = c.used;
          });
          const lineRows = [
            [`\uB77C\uC778 ${li + 1}: ${line.bom.name}  /  \uBC1C\uC8FC \uC218\uB7C9 ${line.qty.toLocaleString()}\uAC1C`],
            [],
            lineHeader,
            ...line.components.map((c) => {
              const aggRow = calc.rows.find((r) => r.code === c.code);
              return [
                c.code,
                c.name,
                c.perUnit,
                c.required,
                aggRow ? aggRow.t3 : "",
                aggRow ? aggRow.te : "",
                aggRow ? aggRow.stock : "",
                c.used,
                aggRow ? aggRow.remain : "",
                c.shortage > 0 ? c.shortage : "",
                c.shortage > 0 ? "\uBD80\uC871" : "\uCDA9\uBD84"
              ];
            })
          ];
          const ws = XLSX.utils.aoa_to_sheet(lineRows);
          ws["!cols"] = [{ wch: 16 }, { wch: 42 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 8 }];
          const safeName = line.bom.name.replace(/[\\\/\?\*\[\]:]/g, " ").trim();
          let baseName = `L${li + 1}_${safeName}`.slice(0, 28);
          const cnt = sheetNameCount[baseName] = (sheetNameCount[baseName] ?? 0) + 1;
          const sheetName = cnt > 1 ? `${baseName}(${cnt})` : baseName;
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });
        const colHeader = ["\uBD80\uC790\uC7AC\uCF54\uB4DC", "\uBD80\uC790\uC7AC\uBA85", "1\uAC1C\uB2F9 \uC18C\uC694\uB7C9", "\uB77C\uC778 \uC18C\uC694\uB7C9", "3PL \uC804\uC0B0", "\uC774\uCE74\uC6B4\uD2B8", "\uAE30\uC900\uC7AC\uACE0", "\uBC30\uC815 \uC0AC\uC6A9\uB7C9", "\uC0DD\uC0B0 \uD6C4 \uC794\uC5EC", "\uBD80\uC871 \uC218\uB7C9", "\uC0C1\uD0DC"];
        const aggRows = [["\u203B \uC18C\uC694\uB0B4\uC5ED \u2014 \uC81C\uD488\uBCC4 \uAD6C\uBD84"], []];
        calc.lineDetails.forEach((line, li) => {
          aggRows.push([`\u25B6 \uB77C\uC778 ${li + 1}  ${line.bom.name}  (\uBC1C\uC8FC \uC218\uB7C9 ${line.qty.toLocaleString()}\uAC1C)`]);
          aggRows.push(colHeader);
          line.components.forEach((c) => {
            const aggRow = calc.rows.find((r) => r.code === c.code);
            aggRows.push([
              c.code,
              c.name,
              c.perUnit,
              c.required,
              aggRow ? aggRow.t3 : "",
              aggRow ? aggRow.te : "",
              aggRow ? aggRow.stock : "",
              c.used,
              aggRow ? aggRow.remain : "",
              c.shortage > 0 ? c.shortage : "",
              c.shortage > 0 ? "\uBD80\uC871" : "\uCDA9\uBD84"
            ]);
          });
          aggRows.push([]);
        });
        aggRows.push(["\u25B6 \uC804\uCCB4 \uD569\uC0B0"]);
        aggRows.push(["\uBD80\uC790\uC7AC\uCF54\uB4DC", "\uBD80\uC790\uC7AC\uBA85", "\uCD1D \uC18C\uC694\uB7C9", "3PL \uC804\uC0B0", "\uC774\uCE74\uC6B4\uD2B8", "\uAE30\uC900\uC7AC\uACE0", "\uC0DD\uC0B0 \uD6C4 \uC794\uC5EC", "\uBD80\uC871 \uC218\uB7C9", "\uC0C1\uD0DC"]);
        calc.rows.forEach((r) => {
          aggRows.push([
            r.code,
            r.name,
            r.required,
            r.t3,
            r.te,
            r.stock,
            r.remain,
            r.short > 0 ? r.short : "",
            r.short > 0 ? "\uBD80\uC871" : "\uCDA9\uBD84"
          ]);
        });
        const ws2 = XLSX.utils.aoa_to_sheet(aggRows);
        ws2["!cols"] = [{ wch: 16 }, { wch: 42 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 8 }];
        XLSX.utils.book_append_sheet(wb, ws2, "\uC18C\uC694\uB0B4\uC5ED(\uC804\uCCB4\uD569\uC0B0)");
        const lotRows = [
          ["\uB77C\uC778", "\uC81C\uD488", "\uBC1C\uC8FC\uC218\uB7C9", "\uBD80\uC790\uC7AC\uCF54\uB4DC", "\uBD80\uC790\uC7AC\uBA85", "1\uAC1C\uB2F9 \uC18C\uC694\uB7C9", "\uB77C\uC778 \uC18C\uC694\uB7C9", "\uC804\uC0B0", "\uB85C\uD2B8/\uC2DC\uB9AC\uC5BCNo.", "\uB85C\uD2B8 \uBCF4\uC720", "\uC774 \uB77C\uC778 \uC0AC\uC6A9", "\uC0AC\uC6A9 \uD6C4 \uC794\uC5EC", "\uBC30\uBD84 \uBC29\uC2DD", "\uCC28\uB2E8 \uCD08\uACFC\uBD84", "\uBE44\uACE0"]
        ];
        calc.lineDetails.forEach((line, li) => {
          line.components.forEach((c) => {
            let printedHeader = false;
            c.allocations.forEach((a) => {
              if (a.excluded) return;
              if (!(a.use > 0 || a.manual)) return;
              lotRows.push([
                li + 1,
                printedHeader ? "" : line.bom.name,
                printedHeader ? "" : line.qty,
                printedHeader ? "" : c.code,
                printedHeader ? "" : c.name,
                printedHeader ? "" : c.perUnit,
                printedHeader ? "" : c.required,
                a.src === "p3l" ? "3PL" : "\uC774\uCE74\uC6B4\uD2B8",
                a.l || "(\uB85C\uD2B8 \uC5C6\uC74C)",
                a.q,
                a.use,
                a.left,
                a.manual ? "\uC218\uB3D9 \uC9C0\uC815" : "\uC790\uB3D9(FEFO)",
                a.conflictQty > 0 ? a.conflictQty : "",
                a.conflictQty > 0 ? "\uC785\uB825 \uCD08\uACFC\uBD84 \uCC28\uB2E8\uB428" : ""
              ]);
              printedHeader = true;
            });
            lotRows.push([
              li + 1,
              printedHeader ? "" : line.bom.name,
              printedHeader ? "" : line.qty,
              printedHeader ? "" : c.code,
              printedHeader ? "" : c.name,
              printedHeader ? "" : c.perUnit,
              printedHeader ? "" : c.required,
              "",
              "\u25B6 \uC18C\uACC4",
              "",
              c.used,
              "",
              "",
              "",
              c.shortage > 0 ? `\uBD80\uC871 ${c.shortage}\uAC1C` : "\uCDA9\uC871"
            ]);
          });
          lotRows.push([]);
        });
        const ws3 = XLSX.utils.aoa_to_sheet(lotRows);
        ws3["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 9 }, { wch: 16 }, { wch: 42 }, { wch: 11 }, { wch: 11 }, { wch: 9 }, { wch: 22 }, { wch: 10 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, ws3, "\uB85C\uD2B8\uBC30\uBD84(\uB77C\uC778\uBCC4)");
        if (calc.totalShort.length > 0) {
          const shortRows = [
            ["\uBD80\uC790\uC7AC\uCF54\uB4DC", "\uBD80\uC790\uC7AC\uBA85", "\uBD80\uC871 \uC218\uB7C9", "\uAE30\uC900\uC7AC\uACE0", "\uCD1D \uC18C\uC694\uB7C9"],
            ...calc.totalShort.map((r) => [r.code, r.name, r.short, r.stock, r.required])
          ];
          const ws4 = XLSX.utils.aoa_to_sheet(shortRows);
          ws4["!cols"] = [{ wch: 16 }, { wch: 44 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
          XLSX.utils.book_append_sheet(wb, ws4, "\uBD80\uC871\uD488\uBAA9");
        }
        const usedBomIds = new Set(order.map((o) => o.bomId));
        let frontier = [...usedBomIds];
        for (let depth = 0; depth < 5 && frontier.length; depth++) {
          const next = [];
          frontier.forEach((id) => {
            const b = boms.find((x) => x.id === id);
            if (!b) return;
            b.components.forEach((c) => {
              const kb = kernelByCode[c.code];
              if (kb && !usedBomIds.has(kb.id)) {
                usedBomIds.add(kb.id);
                next.push(kb.id);
              }
            });
          });
          frontier = next;
        }
        const scenario = {
          v: 1,
          exportedAt: stamp,
          basis,
          dedup,
          order,
          excluded: [...excluded],
          manualAlloc,
          partMode,
          boms: boms.filter((b) => usedBomIds.has(b.id)),
          stockFiles: { p3l: stock.p3l.fileName, ecount: stock.ecount.fileName, carton: stock.carton?.fileName || "" }
        };
        const json = JSON.stringify(scenario);
        const CHUNK = 3e4;
        const chunkRows = [["SCENARIO_V1"], ["\u203B \uC774 \uC2DC\uD2B8\uB294 '\uBC1C\uC8FC \uACB0\uACFC \uBD88\uB7EC\uC624\uAE30' \uAE30\uB2A5\uC6A9 \uB370\uC774\uD130\uC785\uB2C8\uB2E4. \uC218\uC815\uD558\uC9C0 \uB9C8\uC138\uC694."]];
        for (let i = 0; i < json.length; i += CHUNK) chunkRows.push([json.slice(i, i + CHUNK)]);
        const ws5 = XLSX.utils.aoa_to_sheet(chunkRows);
        ws5["!cols"] = [{ wch: 80 }];
        XLSX.utils.book_append_sheet(wb, ws5, "\uC2DC\uB098\uB9AC\uC624(\uC218\uC815\uAE08\uC9C0)");
        const fname = `\uBC1C\uC8FC\uACC4\uC0B0_${now.toISOString().slice(0, 10)}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}.xlsx`;
        const downloads = await claude.use("downloads");
        if (!downloads) {
          alert("\uC774 \uD658\uACBD\uC5D0\uC11C\uB294 \uD30C\uC77C \uC800\uC7A5\uC744 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
          return;
        }
        const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        await downloads.save({ filename: fname, data: blob });
        showToast("\uACB0\uACFC\uB97C \uC5D1\uC140 \uD30C\uC77C\uB85C \uB0B4\uBCF4\uB0C8\uC2B5\uB2C8\uB2E4.");
      } catch (ex) {
        if (ex && ex.code === "declined") return;
        console.error("\uC5D1\uC140 \uB0B4\uBCF4\uB0B4\uAE30 \uC624\uB958:", ex);
        alert("\uC5D1\uC140 \uB0B4\uBCF4\uB0B4\uAE30 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4:\n\n" + (ex && ex.message ? ex.message : ex) + "\n\n(\uAC1C\uBC1C\uC790 \uB3C4\uAD6C \uCF58\uC194\uC5D0 \uC0C1\uC138 \uB0B4\uC6A9\uC774 \uCD9C\uB825\uB429\uB2C8\uB2E4)");
      }
    };
    const scenarioFileRef = useRef(null);
    const [importedScenarios, setImportedScenarios] = useState(/* @__PURE__ */ new Set());
    const workOrderFileRef = useRef(null);
    const [woReview, setWoReview] = useState(null);
    const handleWorkOrderFile = (file) => {
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        alert("\uD30C\uC77C\uC740 10MB \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4.");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (ev) => {
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
              checked: confident
            };
          });
          setWoReview({ fileName: file.name, lines });
        } catch (ex) {
          alert("\uC791\uC5C5\uC9C0\uC2DC\uC11C \uBD88\uB7EC\uC624\uAE30 \uC2E4\uD328: " + (ex.message || "\uD30C\uC77C\uC744 \uC77D\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4"));
        }
      };
      reader.onerror = () => alert("\uD30C\uC77C \uC77D\uAE30 \uC2E4\uD328");
      reader.readAsArrayBuffer(file);
    };
    const commitWorkOrderReview = () => {
      if (!woReview) return;
      const toAdd = woReview.lines.filter((l) => l.checked && l.bomId);
      if (!toAdd.length) {
        showToast("\uCD94\uAC00\uD560 \uD56D\uBAA9\uC744 \uC120\uD0DD\uD558\uACE0 BOM\uC744 \uC9C0\uC815\uD574\uC8FC\uC138\uC694.", "#9A6B00");
        return;
      }
      const newLines = toAdd.map((l) => ({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + l.id,
        bomId: l.bomId,
        qty: l.qty
      }));
      setOrder((prev) => [...prev, ...newLines]);
      showToast(`\uC791\uC5C5\uC9C0\uC2DC\uC11C\uC5D0\uC11C ${newLines.length}\uAC1C \uD488\uBAA9\uC744 \uBC1C\uC8FC \uD488\uBAA9\uC5D0 \uCD94\uAC00\uD588\uC2B5\uB2C8\uB2E4.`);
      setWoReview(null);
    };
    const importResultExcel = (file) => {
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        alert("\uD30C\uC77C\uC740 10MB \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4.");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const wb = await readWorkbookSafely(ev.target.result);
          let json = null;
          for (const name of wb.SheetNames) {
            const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: "" });
            if (rows.length && String(rows[0][0]).trim() === "SCENARIO_V1") {
              json = rows.slice(2).map((r) => String(r[0] ?? "")).join("");
              break;
            }
          }
          if (!json) throw new Error("\uC774 \uD30C\uC77C\uC5D0\uB294 \uC2DC\uB098\uB9AC\uC624 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. '\uACB0\uACFC \uB0B4\uBCF4\uB0B4\uAE30 (Excel)'\uB85C \uB9CC\uB4E0 \uD30C\uC77C\uC778\uC9C0 \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
          const s = JSON.parse(json);
          if (s.v !== 1) throw new Error("\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC2DC\uB098\uB9AC\uC624 \uBC84\uC804\uC785\uB2C8\uB2E4.");
          const scenarioKey = s.exportedAt || "(\uD0C0\uC784\uC2A4\uD0EC\uD504 \uC5C6\uC74C)";
          if (importedScenarios.has(scenarioKey)) {
            const proceed = confirm(
              `\u26A0 \uC774\uBBF8 \uBD88\uB7EC\uC628 \uBC1C\uC8FC \uACB0\uACFC \uC5D1\uC140\uC785\uB2C8\uB2E4.

\uC0DD\uC131 \uC77C\uC2DC: ${scenarioKey}

\uB2E4\uC2DC \uBD88\uB7EC\uC624\uBA74 \uAC19\uC740 \uBC1C\uC8FC \uB77C\uC778\uC774 \uC911\uBCF5\uC73C\uB85C \uCD94\uAC00\uB418\uC5B4 \uBD80\uC790\uC7AC\uAC00 \uC774\uC911\uC73C\uB85C \uCC28\uAC10\uB429\uB2C8\uB2E4.

\uADF8\uB798\uB3C4 \uCD94\uAC00\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`
            );
            if (!proceed) return;
          }
          let bomAdded = 0, bomUpdated = 0, bomSkipped = 0;
          if (canEditBom) {
            const mergedBoms = [...boms];
            (s.boms || []).forEach((b) => {
              const idx = mergedBoms.findIndex((x) => x.id === b.id);
              if (idx >= 0) {
                mergedBoms[idx] = b;
                bomUpdated++;
              } else {
                mergedBoms.push(b);
                bomAdded++;
              }
            });
            if (!await persistBoms(mergedBoms)) return;
          } else {
            bomSkipped = (s.boms || []).length;
          }
          const validLotIds = /* @__PURE__ */ new Set();
          Object.values(agg.p3l).forEach((it) => it.lots.forEach((l) => validLotIds.add(l.id)));
          Object.values(agg.ecount).forEach((it) => it.lots.forEach((l) => validLotIds.add(l.id)));
          Object.values(agg.carton).forEach((it) => it.lots.forEach((l) => validLotIds.add(l.id)));
          const exIn = s.excluded || [];
          const exValid = exIn.filter((id) => validLotIds.has(id));
          setExcluded(new Set(exValid));
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
          const idMap = {};
          const newLines = (s.order || []).map((o) => {
            const newId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            idMap[o.id] = newId;
            return { ...o, id: newId };
          });
          setOrder((prev) => [...prev, ...newLines]);
          const restoredPartMode = {};
          Object.entries(s.partMode || {}).forEach(([oldLineId, byCode]) => {
            const newId = idMap[oldLineId];
            if (newId) restoredPartMode[newId] = { ...byCode };
          });
          if (Object.keys(restoredPartMode).length) {
            setPartMode((prev) => ({ ...prev, ...restoredPartMode }));
          }
          setImportedScenarios((prev) => {
            const next = new Set(prev);
            next.add(scenarioKey);
            return next;
          });
          if (s.basis) setBasisP(s.basis);
          if (typeof s.dedup === "boolean") setDedupP(s.dedup);
          const stockMismatch = s.stockFiles?.p3l && s.stockFiles.p3l !== stock.p3l.fileName || s.stockFiles?.ecount && s.stockFiles.ecount !== stock.ecount.fileName;
          const parts = [`\uBC1C\uC8FC ${newLines.length}\uB77C\uC778 \uCD94\uAC00`];
          if (bomAdded || bomUpdated) parts.push(`BOM \uCD94\uAC00 ${bomAdded}\xB7\uAC31\uC2E0 ${bomUpdated}`);
          if (bomSkipped) parts.push(`BOM ${bomSkipped}\uAC1C\uB294 2\uB2E8\uACC4 \uB85C\uADF8\uC778 \uD544\uC694\uB85C \uAC74\uB108\uB700`);
          if (manualKept) parts.push(`\uC218\uB3D9 \uBC30\uBD84 ${manualKept}\uAC74 \uBCF5\uC6D0`);
          if (manualDropped || exIn.length - exValid.length > 0) {
            parts.push(`\uB85C\uD2B8 \uBD88\uC77C\uCE58\uB85C ${manualDropped + (exIn.length - exValid.length)}\uAC74 \uC81C\uC678`);
          }
          showToast(parts.join(" \xB7 "), stockMismatch || manualDropped ? "#9A6B00" : "#0E6E5C");
          if (stockMismatch) {
            setTimeout(() => alert(
              `\u26A0 \uC7AC\uACE0 \uB370\uC774\uD130 \uBD88\uC77C\uCE58 \uACBD\uACE0

\uB0B4\uBCF4\uB0BC \uB2F9\uC2DC \uC7AC\uACE0 \uD30C\uC77C:
  3PL: ${s.stockFiles.p3l}
  \uC774\uCE74\uC6B4\uD2B8: ${s.stockFiles.ecount}
  \uCE74\uD1A4\uBC15\uC2A4: ${s.stockFiles.carton || "(\uC5C6\uC74C)"}

\uD604\uC7AC \uC7AC\uACE0 \uD30C\uC77C:
  3PL: ${stock.p3l.fileName}
  \uC774\uCE74\uC6B4\uD2B8: ${stock.ecount.fileName}
  \uCE74\uD1A4\uBC15\uC2A4: ${stock.carton?.fileName || "(\uC5C6\uC74C)"}

\uC7AC\uACE0 \uB370\uC774\uD130\uAC00 \uB2EC\uB77C \uACC4\uC0B0 \uACB0\uACFC\xB7\uB85C\uD2B8 \uBC30\uBD84\uC774 \uC6D0\uBCF8\uACFC \uB2E4\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4.
\uB3D9\uC77C\uD55C \uACB0\uACFC\uB97C \uBCF4\uB824\uBA74 \uAC19\uC740 \uC7AC\uACE0 \uC5D1\uC140\uC744 \uBA3C\uC800 \uC5C5\uB85C\uB4DC\uD558\uC138\uC694.`
            ), 300);
          }
        } catch (ex) {
          alert("\uBC1C\uC8FC \uACB0\uACFC \uBD88\uB7EC\uC624\uAE30 \uC2E4\uD328: " + (ex.message || "\uD30C\uC77C\uC744 \uC77D\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4"));
        }
      };
      reader.onerror = () => alert("\uD30C\uC77C \uC77D\uAE30 \uC2E4\uD328");
      reader.readAsArrayBuffer(file);
    };
    if (authTier < 1 || !dataReady || accessError) return /* @__PURE__ */ React.createElement("main", { style: { maxWidth: 560, margin: "80px auto", padding: 24 } }, /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 22, marginBottom: 16 } }, "\uBD80\uC790\uC7AC \uC7AC\uACE0 \uAD00\uB9AC"), /* @__PURE__ */ React.createElement("p", { role: "status", style: { marginBottom: 16 } }, accessError || (!authReady ? "\uAD8C\uD55C\uC744 \uD655\uC778\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4." : authTier >= 1 ? "\uC7AC\uACE0\uB97C \uBD88\uB7EC\uC624\uACE0 \uC788\uC2B5\uB2C8\uB2E4." : "\uC2B9\uC778\uB41C \uACC4\uC815\uC73C\uB85C \uB85C\uADF8\uC778\uD558\uBA74 \uC7AC\uACE0\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")), /* @__PURE__ */ React.createElement(AuthBox, { user: authUser, tier: authTier, onLoginClick: () => setLoginOpen(true), onLogout: doLogout }), loginOpen && /* @__PURE__ */ React.createElement(LoginModal, { onClose: () => setLoginOpen(false), onLogin: doLogin, onSignup: doSignup, error: loginError, busy: loginBusy }));
    return /* @__PURE__ */ React.createElement("div", { style: { padding: "28px 20px", minHeight: "100vh", position: "relative" } }, toasts.length > 0 && /* @__PURE__ */ React.createElement("div", { style: {
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      alignItems: "center",
      zIndex: 999,
      pointerEvents: "none",
      maxWidth: "90vw"
    } }, toasts.map((t) => /* @__PURE__ */ React.createElement("div", { key: t.id, style: {
      background: t.color,
      color: "#fff",
      padding: "12px 24px",
      borderRadius: 12,
      fontSize: 14,
      fontWeight: 600,
      boxShadow: "0 4px 16px rgba(0,0,0,.2)",
      animation: "toastIn .2s ease-out"
    } }, t.msg))), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1060, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" } }, "\uBD80\uC790\uC7AC \uC18C\uC694\uB7C9 \xB7 \uD658\uC0B0\uC7AC\uACE0 \uACC4\uC0B0\uAE30"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#5C6B69", marginTop: 4 } }, "3PL: ", stock.p3l.fileName, " \xB7 \uC774\uCE74\uC6B4\uD2B8: ", stock.ecount.fileName, stock.carton && stock.carton.lots.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, " \xB7 \uCE74\uD1A4\uBC15\uC2A4: ", stock.carton.fileName))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(AuthBox, { user: authUser, tier: authTier, onLoginClick: () => setLoginOpen(true), onLogout: doLogout }), canEditBom && /* @__PURE__ */ React.createElement(ImportBtn, { onImport: handleImport }), canEditBom && /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", small: true, onClick: async () => {
      if (!boms.length) {
        showToast("\uC800\uC7A5\uB41C BOM\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", "#9A6B00");
        return;
      }
      const ok = await exportBoms(boms);
      if (ok) showToast("BOM \uD30C\uC77C\uC744 \uB0B4\uBCF4\uB0C8\uC2B5\uB2C8\uB2E4.");
    } }, "\u{1F4BE} BOM \uB0B4\uBCF4\uB0B4\uAE30"))), loginOpen && /* @__PURE__ */ React.createElement(LoginModal, { onClose: () => setLoginOpen(false), onLogin: doLogin, onSignup: doSignup, error: loginError, busy: loginBusy }), /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
      background: "#fff",
      border: "1px solid #DDE4E2",
      borderRadius: 12,
      padding: "10px 14px",
      marginBottom: 16
    } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "#5C6B69" } }, "\uC18C\uC694\uB7C9 \uACC4\uC0B0 \uAE30\uC900 \uC7AC\uACE0"), [["ecount", "\uC774\uCE74\uC6B4\uD2B8 \uC804\uC0B0"], ["p3l", "3PL \uC804\uC0B0"], ["sum", "\uD569\uC0B0 (3PL+\uC774\uCE74\uC6B4\uD2B8+\uCE74\uD1A4\uBC15\uC2A4)"]].map(([k, label]) => /* @__PURE__ */ React.createElement("label", { key: k, style: {
      display: "flex",
      alignItems: "center",
      gap: 5,
      fontSize: 13,
      cursor: "pointer",
      fontWeight: basis === k ? 700 : 400,
      color: basis === k ? "#0E6E5C" : "#15201F"
    } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "basis", checked: basis === k, onChange: () => setBasisP(k) }), label)), basis !== "sum" && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11.5, color: "#8A9694", marginLeft: "auto" } }, "\u203B 3PL \uCC3D\uACE0 \uC7AC\uACE0\uAC00 \uC774\uCE74\uC6B4\uD2B8\uC5D0\uB3C4 \uC7A1\uD600 \uC788\uB2E4\uBA74 \uD569\uC0B0 \uC2DC \uC911\uBCF5 \uACC4\uC0B0\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4")), basis === "sum" && /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
      background: dedup ? "#E3F0EC" : "#FBEAE8",
      border: `1px solid ${dedup ? "#0E6E5C44" : "#C8372D66"}`,
      borderRadius: 12,
      padding: "10px 14px",
      marginTop: -8,
      marginBottom: 16
    } }, /* @__PURE__ */ React.createElement("label", { style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      color: dedup ? "#0E6E5C" : "#C8372D"
    } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        checked: dedup,
        onChange: (e) => setDedupP(e.target.checked),
        style: { width: 15, height: 15, accentColor: "#0E6E5C", cursor: "pointer" }
      }
    ), "\uC774\uCE74\uC6B4\uD2B8\uC758 3PL \uCC3D\uACE0\uBD84 \uC81C\uC678 (\uC911\uBCF5 \uC81C\uAC70)"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: dedup ? "#5C6B69" : "#C8372D" } }, dedup ? `\uC774\uCE74\uC6B4\uD2B8 "\u20263PL\u2026" \uCC3D\uACE0 \uB85C\uD2B8 ${fmt(dedupInfo.lotCount)}\uAC74 \xB7 ${fmt(dedupInfo.qty)}\uAC1C\uB97C \uD569\uC0B0\uC5D0\uC11C \uC81C\uC678 \uC911 (3PL \uC804\uC0B0\uACFC \uC911\uBCF5\uC73C\uB85C \uD310\uB2E8)` : `\u26A0 \uC911\uBCF5 \uC81C\uAC70 \uAEBC\uC9D0 \u2014 3PL \uCC3D\uACE0 \uC7AC\uACE0 ${fmt(dedupInfo.qty)}\uAC1C\uAC00 \uB450 \uBC88 \uACC4\uC0B0\uB418\uACE0 \uC788\uC744 \uAC00\uB2A5\uC131\uC774 \uB192\uC2B5\uB2C8\uB2E4!`)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, borderBottom: "2px solid #DDE4E2", marginBottom: 20, overflowX: "auto" } }, tabs.map(([k, label]) => /* @__PURE__ */ React.createElement("button", { key: k, onClick: () => setTab(k), style: {
      border: "none",
      background: "transparent",
      padding: "10px 16px",
      fontSize: 14,
      whiteSpace: "nowrap",
      fontWeight: tab === k ? 700 : 500,
      color: tab === k ? "#0E6E5C" : "#5C6B69",
      borderBottom: tab === k ? "2px solid #0E6E5C" : "2px solid transparent",
      marginBottom: -2,
      cursor: "pointer",
      fontFamily: "inherit"
    } }, label))), tab === "plan" && /* @__PURE__ */ React.createElement("div", null, boms.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px dashed #DDE4E2", borderRadius: 14, padding: 32, textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700 } }, "\uB4F1\uB85D\uB41C BOM\uC774 \uC544\uC9C1 \uC5C6\uC2B5\uB2C8\uB2E4"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#5C6B69", margin: "8px 0 16px" } }, "BOM \uAD00\uB9AC \uD0ED\uC5D0\uC11C \uB4F1\uB85D\uD558\uAC70\uB098, \uB2E4\uB978 \uCEF4\uD4E8\uD130\uC5D0\uC11C \uB0B4\uBCF4\uB0B8 \uBC1C\uC8FC \uACB0\uACFC \uC5D1\uC140\uC744 \uBD88\uB7EC\uC62C \uC218 \uC788\uC2B5\uB2C8\uB2E4.", /* @__PURE__ */ React.createElement("br", null), "(\uBC1C\uC8FC \uACB0\uACFC \uC5D1\uC140\uC5D0\uB294 \uC0AC\uC6A9\uB41C BOM\uC774 \uD3EC\uD568\uB418\uC5B4 \uC788\uC5B4 \uC790\uB3D9\uC73C\uB85C \uB4F1\uB85D\uB429\uB2C8\uB2E4)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(Btn, { onClick: () => {
      setTab("bom");
      setEditing("new");
    } }, "BOM \uB4F1\uB85D\uD558\uB7EC \uAC00\uAE30"), /* @__PURE__ */ React.createElement(
      "input",
      {
        ref: scenarioFileRef,
        type: "file",
        accept: ".xlsx,.xls",
        style: { display: "none" },
        onChange: (e) => {
          importResultExcel(e.target.files[0]);
          e.target.value = "";
        }
      }
    ), /* @__PURE__ */ React.createElement(Btn, { kind: "amber", onClick: () => scenarioFileRef.current.click() }, "\u{1F4C2} \uBC1C\uC8FC \uACB0\uACFC \uBD88\uB7EC\uC624\uAE30 (Excel)"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px solid #DDE4E2", borderRadius: 14, padding: 18, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#5C6B69" } }, "\uBC1C\uC8FC \uD488\uBAA9 \uCD94\uAC00"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
      "input",
      {
        ref: scenarioFileRef,
        type: "file",
        accept: ".xlsx,.xls",
        style: { display: "none" },
        onChange: (e) => {
          importResultExcel(e.target.files[0]);
          e.target.value = "";
        }
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        ref: workOrderFileRef,
        type: "file",
        accept: ".xlsx,.xls",
        style: { display: "none" },
        onChange: (e) => {
          handleWorkOrderFile(e.target.files[0]);
          e.target.value = "";
        }
      }
    ), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", small: true, onClick: () => workOrderFileRef.current.click(), style: { marginRight: 8 } }, "\u{1F4CB} \uC791\uC5C5\uC9C0\uC2DC\uC11C \uBD88\uB7EC\uC624\uAE30 (Excel)"), /* @__PURE__ */ React.createElement(Btn, { kind: "amber", small: true, onClick: () => scenarioFileRef.current.click() }, "\u{1F4C2} \uBC1C\uC8FC \uACB0\uACFC \uBD88\uB7EC\uC624\uAE30 (Excel)"))), woReview && /* @__PURE__ */ React.createElement("div", { style: {
      marginTop: 14,
      background: "#FAFBFB",
      border: "1px solid #DDE4E2",
      borderRadius: 12,
      padding: 14
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700 } }, "\u{1F4CB} \uC791\uC5C5\uC9C0\uC2DC\uC11C \uAC80\uD1A0 \u2014 ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 400, color: "#5C6B69" } }, woReview.fileName)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#5C6B69" } }, "\uB9E4\uCE6D ", woReview.lines.filter((l) => l.bomId).length, " / ", woReview.lines.length, "\uAC74")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "#8A9694", marginBottom: 10, lineHeight: 1.6 } }, "\uC790\uB3D9\uC73C\uB85C \uB9E4\uCE6D\uB41C \uD56D\uBAA9\uC740 \uCCB4\uD06C\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. BOM\uC774 \uC798\uBABB \uB9E4\uCE6D\uB410\uAC70\uB098 \uBE44\uC5B4\uC788\uC73C\uBA74 \uC9C1\uC811 \uC120\uD0DD\uD558\uACE0, \uD544\uC694 \uC5C6\uB294 \uD56D\uBAA9\uC740 \uCCB4\uD06C\uB97C \uD574\uC81C\uD558\uC138\uC694. (\uD0AC\uB85C\uADF8\uB7A8 \uB2E8\uC704 \uBC8C\uD06C \uC6D0\uB8CC\uB294 \uC790\uB3D9 \uB9E4\uCE6D \uB300\uC0C1\uC774 \uC544\uB2C8\uB77C \uAE30\uBCF8\uC801\uC73C\uB85C \uCCB4\uD06C \uD574\uC81C\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4)"), /* @__PURE__ */ React.createElement("div", { style: { maxHeight: 360, overflowY: "auto", border: "1px solid #EDF1F0", borderRadius: 8 } }, woReview.lines.map((l, idx) => /* @__PURE__ */ React.createElement("div", { key: l.id, style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      borderBottom: idx < woReview.lines.length - 1 ? "1px solid #F4F6F5" : "none",
      background: l.checked ? "#fff" : "#F7F8F8"
    } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        checked: l.checked,
        onChange: (e) => setWoReview((prev) => ({ ...prev, lines: prev.lines.map((x) => x.id === l.id ? { ...x, checked: e.target.checked } : x) }))
      }
    ), /* @__PURE__ */ React.createElement("div", { style: { flex: 2, minWidth: 160 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, title: l.rawName }, l.rawName), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: l.unit === "kg" ? "#9A6B00" : "#8A9694" } }, fmt(l.qty), l.unit === "kg" ? "kg (\uBC8C\uD06C)" : "\uAC1C", l.bomId && l.score < 0.7 && /* @__PURE__ */ React.createElement("span", { style: { color: "#9A6B00" } }, " \xB7 \uB9E4\uCE6D \uD655\uC778 \uD544\uC694"))), /* @__PURE__ */ React.createElement("div", { style: { flex: 2, minWidth: 180 } }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: l.bomId,
        onChange: (e) => setWoReview((prev) => ({ ...prev, lines: prev.lines.map((x) => x.id === l.id ? { ...x, bomId: e.target.value } : x) })),
        style: {
          ...inp,
          padding: "6px 8px",
          fontSize: 12.5,
          width: "100%",
          borderColor: l.bomId ? "#DDE4E2" : "#E0967A"
        }
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "\u2014 BOM \uC120\uD0DD \u2014"),
      boms.map((b) => /* @__PURE__ */ React.createElement("option", { key: b.id, value: b.id }, b.name))
    )), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "1",
        value: l.qty,
        onChange: (e) => setWoReview((prev) => ({ ...prev, lines: prev.lines.map((x) => x.id === l.id ? { ...x, qty: parseInt(e.target.value) || 0 } : x) })),
        style: { ...inp, padding: "6px 8px", fontSize: 12.5, width: 90, textAlign: "right" }
      }
    )))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement(Btn, { kind: "plain", small: true, onClick: () => setWoReview(null) }, "\uCDE8\uC18C"), /* @__PURE__ */ React.createElement(Btn, { small: true, onClick: commitWorkOrderReview }, "\uC120\uD0DD\uD55C ", woReview.lines.filter((l) => l.checked && l.bomId).length, "\uAC74 \uBC1C\uC8FC \uD488\uBAA9\uC5D0 \uCD94\uAC00"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(BomSearch, { boms, value: selBom, onPick: (id) => setSelBom(id), onClear: () => setSelBom("") }), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "1",
        value: selQty,
        onChange: (e) => setSelQty(parseInt(e.target.value) || 0),
        style: { ...inp, flex: 1, minWidth: 110 },
        placeholder: "\uC0DD\uC0B0 \uC218\uB7C9"
      }
    ), /* @__PURE__ */ React.createElement(Btn, { disabled: !selBom || selQty <= 0, onClick: () => {
      const newId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      setOrder((prev) => [...prev, { id: newId, bomId: selBom, qty: selQty }]);
      setSelBom("");
    } }, "\uCD94\uAC00"), order.length > 0 && /* @__PURE__ */ React.createElement(Btn, { kind: "plain", onClick: () => setOrder([]) }, "\uC804\uCCB4 \uBE44\uC6B0\uAE30")), order.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 } }, order.map((o) => {
      const b = boms.find((x) => x.id === o.bomId);
      return b && /* @__PURE__ */ React.createElement("div", { key: o.id, style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "#E3F0EC",
        border: "1px solid #0E6E5C33",
        borderRadius: 999,
        padding: "6px 6px 6px 14px",
        fontSize: 13
      } }, /* @__PURE__ */ React.createElement("b", null, b.name), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "number",
          min: "1",
          value: o.qty,
          onChange: (e) => setOrder(order.map((x) => x.id === o.id ? { ...x, qty: parseInt(e.target.value) || 0 } : x)),
          style: { width: 80, border: "1px solid #DDE4E2", borderRadius: 6, padding: "3px 6px", fontSize: 13, fontFamily: "inherit" }
        }
      ), /* @__PURE__ */ React.createElement("span", { style: { color: "#5C6B69" } }, "\uAC1C"), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setOrder(order.filter((x) => x.id !== o.id)),
          style: { border: "none", background: "transparent", color: "#5C6B69", cursor: "pointer", fontSize: 16, padding: "0 6px" }
        },
        "\xD7"
      ));
    }))), calc && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: {
      borderRadius: 14,
      padding: "14px 18px",
      fontSize: 14,
      fontWeight: 600,
      marginBottom: 10,
      background: calc.totalShort.length ? "#FBEAE8" : "#E3F0EC",
      color: calc.totalShort.length ? "#C8372D" : "#0E6E5C",
      border: `1px solid ${calc.totalShort.length ? "#C8372D33" : "#0E6E5C33"}`
    } }, calc.totalShort.length ? `\u26A0 ${basisLabel} \uAE30\uC900 \uBD80\uC790\uC7AC ${calc.totalShort.length}\uC885\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4.` : `\u2713 ${basisLabel} \uAE30\uC900 \uBAA8\uB4E0 \uBD80\uC790\uC7AC \uC7AC\uACE0\uAC00 \uCDA9\uBD84\uD569\uB2C8\uB2E4. \uC804\uCCB4 \uBC1C\uC8FC\uB97C \uB3D9\uC2DC \uC0DD\uC0B0\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.`), calc.totalConflicts > 0 && /* @__PURE__ */ React.createElement("div", { style: {
      borderRadius: 14,
      padding: "12px 18px",
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 10,
      background: "#C8372D",
      color: "#fff"
    } }, "\u{1F6AB} \uB85C\uD2B8 \uACFC\uBC30\uBD84 \uCC28\uB2E8 ", calc.totalConflicts, "\uAC74 \u2014 \uC218\uB3D9 \uC785\uB825\uC774 \uBCF4\uC720\uB7C9(\uB610\uB294 \uB2E4\uB978 \uB77C\uC778\uC774 \uBA3C\uC800 \uC0AC\uC6A9\uD55C \uD6C4 \uC794\uC5EC\uB7C9)\uC744 \uCD08\uACFC\uD558\uC5EC \uCD1D ", fmt(calc.totalConflictQty), "\uAC1C\uAC00 \uCC28\uB2E8\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uCC28\uB2E8\uBD84\uC740 \uB2E4\uB978 \uB85C\uD2B8 \uB610\uB294 \uBD80\uC871 \uC218\uB7C9\uC73C\uB85C \uACC4\uC0B0\uB429\uB2C8\uB2E4. \uD574\uB2F9 \uC785\uB825\uCE78\uC774 \uBE68\uAC04\uC0C9\uC73C\uB85C \uD45C\uC2DC\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 10,
      background: "#fff",
      border: "1px solid #DDE4E2",
      borderRadius: 12,
      padding: "10px 14px",
      marginBottom: 16,
      fontSize: 11.5,
      color: "#5C6B69",
      lineHeight: 1.7
    } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", { style: { color: "#15201F" } }, "\uACC4\uC0B0 \uAE30\uC900:"), " ", basisLabel, basis === "sum" && (dedup ? " \xB7 \uC911\uBCF5 \uC81C\uAC70 ON" : " \xB7 \u26A0 \uC911\uBCF5 \uC81C\uAC70 OFF"), excluded.size > 0 && ` \xB7 \uB85C\uD2B8 ${excluded.size}\uAC1C \uC0AC\uC6A9 \uC81C\uC678`, /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#1D5C8A" } }, "3PL:"), " ", stock.p3l.fileName, " (", stock.p3l.date, ")", " \xB7 ", /* @__PURE__ */ React.createElement("span", { style: { color: "#0E6E5C" } }, "\uC774\uCE74\uC6B4\uD2B8:"), " ", stock.ecount.fileName, " (", stock.ecount.date, ")", stock.carton && stock.carton.lots.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, " \xB7 ", /* @__PURE__ */ React.createElement("span", { style: { color: "#7B4D1E" } }, "\uCE74\uD1A4\uBC15\uC2A4:"), " ", stock.carton.fileName, " (", stock.carton.date, ")")), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", small: true, onClick: () => exportResultExcel() }, "\u{1F4CA} \uACB0\uACFC \uB0B4\uBCF4\uB0B4\uAE30 (Excel)")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12, marginBottom: 16 } }, calc.perProduct.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.id, style: { background: "#fff", border: "1px solid #DDE4E2", borderRadius: 14, padding: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, marginBottom: 4 } }, p.bom.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#5C6B69", marginBottom: 12 } }, "\uBC1C\uC8FC \uC218\uB7C9 ", fmt(p.qty), "\uAC1C"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 20 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#5C6B69", fontWeight: 600 } }, "\uB2E8\uB3C5 \uC0DD\uC0B0 \uC2DC \uD658\uC0B0\uC7AC\uACE0"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 800 } }, fmt(p.solo))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#5C6B69", fontWeight: 600 } }, "\uB3D9\uC2DC \uC0DD\uC0B0 \uC2DC \uAC00\uB2A5"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 800, color: p.ok ? "#0E6E5C" : "#C8372D" } }, fmt(p.after)))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, marginTop: 8, color: p.ok ? "#5C6B69" : "#C8372D" } }, p.ok ? `\uBCD1\uBAA9 \uBD80\uC790\uC7AC: ${p.bottleneck}` : `\uBD80\uC871 \u2014 \uBC1C\uC8FC \uB300\uBE44 ${fmt(p.qty - p.after)}\uAC1C \uBAA8\uC790\uB78C`)))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 0, border: "1px solid #DDE4E2", borderRadius: 8, overflow: "hidden", marginBottom: 12, width: "fit-content" } }, [["agg", "\uD1B5\uD569 \uBCF4\uAE30"], ["line", "\uB77C\uC778\uBCC4 \uBCF4\uAE30"]].map(([k, label]) => /* @__PURE__ */ React.createElement("button", { key: k, onClick: () => setViewMode(k), style: {
      padding: "7px 16px",
      border: "none",
      fontSize: 13,
      fontWeight: 700,
      background: viewMode === k ? "#0E6E5C" : "#fff",
      color: viewMode === k ? "#fff" : "#5C6B69",
      cursor: viewMode === k ? "default" : "pointer",
      fontFamily: "inherit"
    } }, label))), excluded.size > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 12,
      color: "#9A6B00",
      background: "#FBF3DE",
      border: "1px solid #E0C97A",
      padding: "3px 10px",
      borderRadius: 999,
      fontWeight: 700
    } }, "\uB85C\uD2B8 ", excluded.size, "\uAC1C \uC0AC\uC6A9 \uC81C\uC678 \uC911"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setExcluded(/* @__PURE__ */ new Set()),
        style: {
          border: "1px solid #DDE4E2",
          background: "#fff",
          padding: "3px 10px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          color: "#15201F"
        }
      },
      "\uC804\uCCB4 \uCD08\uAE30\uD654"
    )), viewMode === "agg" && /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px solid #DDE4E2", borderRadius: 14, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#5C6B69", borderBottom: "1px solid #DDE4E2" } }, "\uBD80\uC790\uC7AC \uC18C\uC694 \uB0B4\uC5ED (\uC804\uCCB4 \uBC1C\uC8FC \uD569\uC0B0) \u2014 \uD589\uC744 \uD074\uB9AD\uD558\uBA74 \uB85C\uD2B8\uBCC4 \uCCB4\uD06C\uBC15\uC2A4\uB85C \uC0AC\uC6A9\uD560 \uC7AC\uACE0\uB97C \uC9C1\uC811 \uC120\uD0DD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4"), /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 820 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { color: "#5C6B69", textAlign: "right", background: "#FAFBFB" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", textAlign: "left", fontWeight: 600 } }, "\uBD80\uC790\uC7AC"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600 } }, "\uCD1D \uC18C\uC694\uB7C9"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600, color: "#1D5C8A" } }, "3PL \uC804\uC0B0"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600, color: "#0E6E5C" } }, "\uC774\uCE74\uC6B4\uD2B8"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600 } }, "\uAE30\uC900\uC7AC\uACE0"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600 } }, "\uC0DD\uC0B0 \uD6C4 \uC794\uC5EC"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600 } }, "\uC0C1\uD0DC"))), /* @__PURE__ */ React.createElement("tbody", null, calc.rows.map((r) => /* @__PURE__ */ React.createElement(React.Fragment, { key: r.code }, /* @__PURE__ */ React.createElement(
      "tr",
      {
        onClick: () => setExpanded((p) => ({ ...p, [r.code]: !p[r.code] })),
        style: {
          borderTop: "1px solid #F4F6F5",
          cursor: "pointer",
          background: r.short > 0 ? "#FBEAE8" : "transparent"
        }
      },
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, color: r.short > 0 ? "#C8372D" : "#15201F" } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", width: 14, color: "#8A9694" } }, expanded[r.code] ? "\u25BE" : "\u25B8"), r.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "#5C6B69", fontFamily: "monospace", paddingLeft: 14 } }, r.code)),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" } }, fmt(r.required)),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#1D5C8A" } }, fmt(r.t3)),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#0E6E5C" } }, fmt(r.te)),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" } }, fmt(r.stock)),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontWeight: 700, color: r.remain < 0 ? "#C8372D" : "#15201F", fontVariantNumeric: "tabular-nums" } }, fmt(r.remain)),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right" } }, r.short > 0 ? /* @__PURE__ */ React.createElement("span", { style: { color: "#fff", background: "#C8372D", borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" } }, "\uBD80\uC871 ", fmt(r.short)) : /* @__PURE__ */ React.createElement("span", { style: { color: "#0E6E5C", fontWeight: 700, fontSize: 12 } }, "\uCDA9\uBD84"))
    ), expanded[r.code] && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 7, style: { padding: "0 12px 14px 26px", background: "#FAFBFB" } }, r.lots.length ? /* @__PURE__ */ React.createElement(
      LotTable,
      {
        lots: r.lots,
        allocations: r.aggAllocations,
        showSource: basis === "sum",
        excluded,
        onToggle: toggleLot,
        onSelectAll: (on) => setLotsExcluded(r.lots.map((l) => l.id), !on)
      }
    ) : /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 0", fontSize: 12.5, color: "#8A9694" } }, basisLabel, "\uC5D0 \uC774 \uD488\uBAA9\uC758 \uB85C\uD2B8 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."))))))))), viewMode === "line" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#5C6B69", marginBottom: 10, padding: "8px 12px", background: "#EDF1F0", borderRadius: 8, lineHeight: 1.6 } }, "\u{1F4A1} \uB77C\uC778\uBCC4 \uBCF4\uAE30\uB294 \uBC1C\uC8FC \uC21C\uC11C\uB300\uB85C \uC7AC\uACE0\uB97C ", /* @__PURE__ */ React.createElement("b", null, "\uC21C\uCC28 \uBC30\uC815"), "\uD569\uB2C8\uB2E4 \u2014 \uC704\uCABD \uB77C\uC778\uC774 \uBA3C\uC800 \uC0AC\uC6A9\uD558\uACE0 \uB0A8\uC740 \uC7AC\uACE0\uB97C \uC544\uB798 \uB77C\uC778\uC774 \uBC1B\uC2B5\uB2C8\uB2E4. \uD589\uC744 \uD3BC\uCE58\uBA74 ", /* @__PURE__ */ React.createElement("b", null, '"\uC0AC\uC6A9" \uCE78\uC744 \uC9C1\uC811 \uC785\uB825'), "\uD574\uC11C \uC6D0\uD558\uB294 \uB85C\uD2B8\uB97C \uC6D0\uD558\uB294 \uB9CC\uD07C \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uCCB4\uD06C\uBC15\uC2A4\uB85C \uC0AC\uC6A9 \uC81C\uC678\uD55C \uB85C\uD2B8\uB294 \uBAA8\uB4E0 \uB77C\uC778\uC5D0\uC11C \uC0AC\uC6A9\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."), calc.lineDetails.map((line, lineIdx) => /* @__PURE__ */ React.createElement("div", { key: line.id, style: { background: "#fff", border: "1px solid #DDE4E2", borderRadius: 14, overflow: "hidden", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: {
      padding: "12px 16px",
      borderBottom: "1px solid #DDE4E2",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
      background: line.hasShortage ? "#FBEAE8" : "#E3F0EC"
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 24,
      height: 24,
      borderRadius: 999,
      background: "#fff",
      fontSize: 12,
      fontWeight: 800,
      color: "#0E6E5C",
      border: "1px solid #0E6E5C"
    } }, lineIdx + 1), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: line.hasShortage ? "#C8372D" : "#0E6E5C" } }, line.bom.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#5C6B69" } }, "\uBC1C\uC8FC \uC218\uB7C9 ", fmt(line.qty), "\uAC1C"))), /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 12,
      fontWeight: 700,
      padding: "4px 10px",
      borderRadius: 999,
      background: line.hasShortage ? "#C8372D" : "#0E6E5C",
      color: "#fff"
    } }, line.hasShortage ? `\u26A0 ${line.components.filter((c) => c.shortage > 0).length}\uC885 \uBD80\uC871` : "\u2713 \uCDA9\uBD84")), /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 720 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { color: "#5C6B69", textAlign: "right", background: "#FAFBFB" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", textAlign: "left", fontWeight: 600 } }, "\uBD80\uC790\uC7AC"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600 } }, "\uC774 \uB77C\uC778 \uC18C\uC694\uB7C9"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600 } }, "\uC774 \uB77C\uC778 \uD560\uB2F9"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600 } }, "\uB77C\uC778 \uD6C4 \uC794\uC5EC"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600 } }, "\uC0C1\uD0DC"))), /* @__PURE__ */ React.createElement("tbody", null, line.components.map((c) => {
      const key = `${line.id}:${c.code}`;
      const lineRemain = c.allocations.reduce((s, a) => s + (a.excluded ? 0 : a.left), 0);
      return /* @__PURE__ */ React.createElement(React.Fragment, { key: c.code }, /* @__PURE__ */ React.createElement(
        "tr",
        {
          onClick: () => setExpanded((p) => ({ ...p, [key]: !p[key] })),
          style: {
            borderTop: "1px solid #F4F6F5",
            cursor: "pointer",
            background: c.shortage > 0 ? "#FBEAE8" : "transparent"
          }
        },
        /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, color: c.shortage > 0 ? "#C8372D" : "#15201F", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", width: 14, color: "#8A9694" } }, expanded[key] ? "\u25BE" : "\u25B8"), c.expandedFrom && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#7A5500", fontWeight: 700 } }, "\u21B3 ", c.expandedFrom.name, " \uC804\uAC1C\uBD84"), c.name, c.isKernel && /* @__PURE__ */ React.createElement("span", { style: {
          fontSize: 10.5,
          fontWeight: 700,
          background: "#FBF3DE",
          color: "#7A5500",
          border: "1px solid #E0C97A",
          borderRadius: 5,
          padding: "1px 6px"
        } }, "\u{1F9E9} \uC54C\uB9F9\uC774")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "#5C6B69", fontFamily: "monospace", paddingLeft: 14 } }, c.code, " \xB7 \uB2E8\uC704\uB2F9 ", fmt(c.perUnit)), c.isKernel && /* @__PURE__ */ React.createElement("div", { style: { paddingLeft: 14, marginTop: 5, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement(
          "select",
          {
            value: partMode[line.id]?.[c.code] || "auto",
            onChange: (e) => setKernelMode(line.id, c.code, e.target.value),
            style: { fontSize: 11, padding: "3px 6px", borderRadius: 6, border: "1px solid #DDE4E2", fontFamily: "inherit" }
          },
          /* @__PURE__ */ React.createElement("option", { value: "auto" }, "\uC7AC\uACE0 \uC6B0\uC120 \uC18C\uC9C4 + \uBD80\uC871\uBD84 \uC790\uB3D9 \uC804\uAC1C"),
          /* @__PURE__ */ React.createElement("option", { value: "force_expand" }, "\uC804\uB7C9 \uBD80\uC790\uC7AC\uB85C \uAC15\uC81C \uC804\uAC1C"),
          /* @__PURE__ */ React.createElement("option", { value: "force_finished" }, "\uC804\uB7C9 \uC54C\uB9F9\uC774 \uC7AC\uACE0\uB85C\uB9CC (\uC804\uAC1C \uC548 \uD568)")
        ), c.kernelExpanded && c.kernelMode !== "force_expand" && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#7A5500" } }, "\uC54C\uB9F9\uC774 \uC7AC\uACE0 ", fmt(c.required), " \uC0AC\uC6A9 + \uBD80\uC790\uC7AC ", fmt(c.kernelFullRequired - c.required), " \uC804\uAC1C"), c.kernelMode === "force_expand" && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#7A5500" } }, "\uC54C\uB9F9\uC774 \uC7AC\uACE0 \uBBF8\uC0AC\uC6A9 \xB7 \uC804\uB7C9(", fmt(c.kernelFullRequired), ") \uBD80\uC790\uC7AC\uB85C \uC804\uAC1C\uB428"))),
        /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" } }, fmt(c.required)),
        /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#9A6B00", fontVariantNumeric: "tabular-nums" } }, fmt(c.used)),
        /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" } }, fmt(lineRemain)),
        /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right" } }, c.shortage > 0 ? /* @__PURE__ */ React.createElement("span", { style: { color: "#fff", background: "#C8372D", borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" } }, "\uBD80\uC871 ", fmt(c.shortage)) : /* @__PURE__ */ React.createElement("span", { style: { color: "#0E6E5C", fontWeight: 700, fontSize: 12 } }, "\uCDA9\uBD84"))
      ), expanded[key] && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 5, style: { padding: "0 12px 14px 26px", background: "#FAFBFB" } }, c.lots.length ? /* @__PURE__ */ React.createElement(
        LotTable,
        {
          lots: c.lots,
          allocations: c.allocations,
          showSource: basis === "sum",
          excluded,
          onToggle: toggleLot,
          onSelectAll: (on) => setLotsExcluded(c.lots.map((l) => l.id), !on),
          onAllocChange: (lotId, qty) => setManualUse(line.id, c.code, lotId, qty),
          onResetAlloc: () => resetLineComponent(line.id, c.code)
        }
      ) : /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 0", fontSize: 12.5, color: "#8A9694" } }, basisLabel, "\uC5D0 \uC774 \uD488\uBAA9\uC758 \uB85C\uD2B8 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."))));
    })))))))))), tab === "bom" && /* @__PURE__ */ React.createElement("div", null, editing ? /* @__PURE__ */ React.createElement(BomEditor, { initial: editing === "new" ? null : editing, items, getStock, onSave: saveBom, onCancel: () => setEditing(null) }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#5C6B69" } }, "BOM\uC740 \uC774 \uB9C1\uD06C\uB97C \uC5EC\uB294 \uBAA8\uB4E0 \uAE30\uAE30\uC5D0 \uC790\uB3D9\uC73C\uB85C \uACF5\uC720 \uC800\uC7A5\uB429\uB2C8\uB2E4. \uBC31\uC5C5\uC774 \uD544\uC694\uD558\uBA74 \uC0C1\uB2E8 ", /* @__PURE__ */ React.createElement("b", null, "BOM \uB0B4\uBCF4\uB0B4\uAE30"), "\uB97C \uC774\uC6A9\uD558\uC138\uC694."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } }, !canEditBom && /* @__PURE__ */ React.createElement(LockedNotice, { tier: 2, label: "BOM \uCD94\uAC00/\uC218\uC815/\uC0AD\uC81C" }), canEditBom && boms.length > 0 && /* @__PURE__ */ React.createElement(Btn, { kind: "danger", onClick: () => {
      if (confirm(
        `\u26A0 \uB4F1\uB85D\uB41C BOM ${boms.length}\uAC1C\uB97C \uC804\uBD80 \uC0AD\uC81C\uD569\uB2C8\uB2E4.

\uC774 BOM\uB4E4\uC744 \uC0AC\uC6A9 \uC911\uC778 \uBC1C\uC8FC \uD488\uBAA9\uB3C4 \uD568\uAED8 \uC0AC\uB77C\uC9D1\uB2C8\uB2E4.
\uC774 \uB9C1\uD06C\uB97C \uACF5\uC720 \uC911\uC778 \uB2E4\uB978 \uAE30\uAE30\uC5D0\uC11C\uB3C4 \uD568\uAED8 \uC0AD\uC81C\uB418\uBA70, \uB0B4\uBCF4\uB0B4\uAE30(\uBC31\uC5C5) \uC5C6\uC774 \uC9C4\uD589\uD558\uBA74 \uBCF5\uAD6C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.

\uC815\uB9D0 \uC804\uCCB4 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`
      )) deleteAllBoms();
    } }, "\u{1F5D1} BOM \uC804\uCCB4 \uC0AD\uC81C"), canEditBom && /* @__PURE__ */ React.createElement(Btn, { onClick: () => setEditing("new") }, "+ \uC0C8 BOM \uB4F1\uB85D"))), boms.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px dashed #DDE4E2", borderRadius: 14, padding: 32, textAlign: "center", color: "#5C6B69", fontSize: 14 } }, "\uC81C\uD488 \uC774\uB984\uACFC \uBD80\uC790\uC7AC \uAD6C\uC131(1\uAC1C\uB2F9 \uC18C\uC694\uB7C9)\uC744 \uB4F1\uB85D\uD558\uBA74", /* @__PURE__ */ React.createElement("br", null), "\uBC1C\uC8FC \uC2DC\uBBAC\uB808\uC774\uC158\uC5D0\uC11C \uBC14\uB85C \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.") : boms.map((b) => /* @__PURE__ */ React.createElement("div", { key: b.id, style: { background: "#fff", border: "1px solid #DDE4E2", borderRadius: 14, padding: 16, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 } }, b.name, b.kernelCode && /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 11,
      fontWeight: 700,
      background: "#FBF3DE",
      color: "#7A5500",
      border: "1px solid #E0C97A",
      borderRadius: 6,
      padding: "2px 7px"
    } }, "\u{1F9E9} \uC54C\uB9F9\uC774 \xB7 ", b.kernelCode)), canEditBom && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", small: true, onClick: () => setEditing(b) }, "\uC218\uC815"), /* @__PURE__ */ React.createElement(Btn, { kind: "danger", small: true, onClick: () => {
      if (confirm(`"${b.name}" BOM\uC744 \uC0AD\uC81C\uD560\uAE4C\uC694?`)) deleteBom(b.id);
    } }, "\uC0AD\uC81C"))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 } }, b.components.map((c) => /* @__PURE__ */ React.createElement("span", { key: c.code, style: {
      fontSize: 12,
      borderRadius: 6,
      padding: "4px 8px",
      background: kernelByCode[c.code] ? "#FBF3DE" : "#EDF1F0",
      color: kernelByCode[c.code] ? "#7A5500" : "#15201F"
    } }, kernelByCode[c.code] ? "\u{1F9E9} " : "", c.name, " \xD7 ", c.qty))))))), tab === "stock" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
      "input",
      {
        style: inp,
        placeholder: "\uBD80\uC790\uC7AC \uCF54\uB4DC \xB7 \uC774\uB984 \xB7 \uC2DC\uB9AC\uC5BC/\uB85C\uD2B8 No.\uB85C \uAC80\uC0C9\u2026",
        value: stockQ,
        onChange: (e) => setStockQ(e.target.value)
      }
    ), stockQ.trim() && /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px solid #DDE4E2", borderRadius: 14, marginTop: 12, overflow: "hidden" } }, stockResults.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: 20, color: "#5C6B69", fontSize: 13 } }, "\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.") : stockResults.map((i) => {
      const s = getStock(i.code);
      return /* @__PURE__ */ React.createElement(React.Fragment, { key: i.code }, /* @__PURE__ */ React.createElement(
        "div",
        {
          onClick: () => setExpandedStk((p) => ({ ...p, [i.code]: !p[i.code] })),
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 16px",
            borderBottom: "1px solid #F4F6F5",
            gap: 12,
            cursor: "pointer"
          }
        },
        /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0, flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", width: 14, color: "#8A9694" } }, expandedStk[i.code] ? "\u25BE" : "\u25B8"), i.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#5C6B69", fontFamily: "monospace", paddingLeft: 14 } }, i.code), i.matchedLotNos && i.matchedLotNos.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "#7A5500", paddingLeft: 14, marginTop: 3, lineHeight: 1.5 } }, "\u{1F3F7} \uC77C\uCE58 \uB85C\uD2B8: ", /* @__PURE__ */ React.createElement("b", { style: { fontFamily: "monospace" } }, i.matchedLotNos.slice(0, 5).join(", "), i.matchedLotNos.length > 5 ? ` \uC678 ${i.matchedLotNos.length - 5}\uAC74` : ""))),
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 18, textAlign: "right" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10.5, color: "#1D5C8A", fontWeight: 700 } }, "3PL \uC804\uC0B0"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" } }, fmt(i.t3))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10.5, color: "#0E6E5C", fontWeight: 700 } }, "\uC774\uCE74\uC6B4\uD2B8"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" } }, fmt(i.te))), i.tc > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10.5, color: "#7B4D1E", fontWeight: 700 } }, "\uCE74\uD1A4\uBC15\uC2A4"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" } }, fmt(i.tc))))
      ), expandedStk[i.code] && /* @__PURE__ */ React.createElement("div", { style: { padding: "4px 16px 14px 30px", background: "#FAFBFB", borderBottom: "1px solid #F4F6F5" } }, s.lots.length ? /* @__PURE__ */ React.createElement(LotTable, { lots: s.lots, required: null, showSource: basis === "sum", searchHighlight: stockQ.trim() }) : /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 0", fontSize: 12.5, color: "#8A9694" } }, basisLabel, "\uC5D0 \uB85C\uD2B8 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. (\uAE30\uC900 \uC7AC\uACE0\uB97C \uBC14\uAFD4\uBCF4\uC138\uC694)"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#8A9694", marginTop: 6 } }, "\uD45C\uC2DC \uAE30\uC900: ", basisLabel)));
    }))), tab === "upload" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: {
      background: "#FBF3DE",
      border: "1px solid #E0C97A",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: 12.5,
      color: "#7A5500",
      marginBottom: 16,
      lineHeight: 1.7
    } }, "\u{1F4A1} \uC7AC\uACE0\uAC00 \uBC14\uB014 \uB54C\uB9C8\uB2E4 \uAC01 \uC804\uC0B0\uC5D0\uC11C \uB0B4\uB824\uBC1B\uC740 \uC5D1\uC140\uC744 \uC544\uB798\uC5D0 \uC5C5\uB85C\uB4DC\uD558\uBA74 \uC989\uC2DC \uBC18\uC601\uB429\uB2C8\uB2E4. \uC5C5\uB85C\uB4DC\uD55C \uC7AC\uACE0\uB294 \uC11C\uBC84\uC5D0 \uC800\uC7A5\uB418\uBA70 \uC2B9\uC778\uB41C \uACC4\uC815\uC73C\uB85C \uB2E4\uB978 \uAE30\uAE30\uC5D0\uC11C\uB3C4 \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", /* @__PURE__ */ React.createElement("b", null, " 3PL \uC804\uC0B0"), "\uC740 WMS \uC7AC\uACE0 \uB9AC\uC2A4\uD2B8(\uC0C1\uD488\uCF54\uB4DC\xB7\uAC00\uC6A9\uC7AC\uACE0\xB7LOT NO\xB7\uC720\uD1B5\uAE30\uD55C),", /* @__PURE__ */ React.createElement("b", null, " \uC774\uCE74\uC6B4\uD2B8"), "\uB294 \uC2DC\uB9AC\uC5BC/\uB85C\uD2B8No. \uC7AC\uACE0\uD604\uD669(\uD488\uBAA9\uCF54\uB4DC\xB7\uC7AC\uACE0\uC218\uB7C9\xB7\uC2DC\uB9AC\uC5BC/\uB85C\uD2B8No.\xB7\uC720\uD6A8\uAE30\uD55C) \uC591\uC2DD\uC744 \uC790\uB3D9 \uC778\uC2DD\uD569\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(
      StockUploadCard,
      {
        srcKey: "p3l",
        data: stock.p3l,
        prevData: prevStock.p3l,
        locked: !canEditStock,
        onLoaded: async (d) => {
          if (order.length > 0) {
            const ok = confirm(
              `\u26A0 \uBC1C\uC8FC \uD488\uBAA9\uC774 ${order.length}\uAC1C \uB4F1\uB85D\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.

\uC7AC\uACE0\uB97C \uC0C8\uB85C \uC5C5\uB85C\uB4DC\uD558\uBA74 \uB2E4\uC74C \uC815\uBCF4\uAC00 \uBB34\uD6A8\uD654\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4:
\u2022 \uC218\uB3D9\uC73C\uB85C \uC9C0\uC815\uD55C \uB85C\uD2B8 \uBC30\uBD84
\u2022 \uC0AC\uC6A9 \uC81C\uC678(\uCCB4\uD06C \uD574\uC81C)\uD55C \uB85C\uD2B8

(\uB85C\uD2B8 ID\uAC00 \uC0C8 \uC7AC\uACE0 \uAE30\uC900\uC73C\uB85C \uB2E4\uC2DC \uBD80\uC5EC\uB418\uC5B4 \uAE30\uC874 \uC124\uC815\uC774 \uD480\uB9BD\uB2C8\uB2E4)

\uADF8\uB798\uB3C4 3PL \uC804\uC0B0 \uC7AC\uACE0\uB97C \uC5C5\uB370\uC774\uD2B8\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`
            );
            if (!ok) return;
          }
          await updateStockSource("p3l", d);
        },
        onRevert: () => revertStockSource("p3l"),
        onReset: () => updateStockSource("p3l", { fileName: "(\uB370\uC774\uD130 \uC5C6\uC74C)", date: "", lots: [] })
      }
    ), /* @__PURE__ */ React.createElement(
      StockUploadCard,
      {
        srcKey: "carton",
        data: stock.carton || { fileName: "(\uB370\uC774\uD130 \uC5C6\uC74C)", date: "", lots: [] },
        prevData: prevStock.carton,
        locked: !canEditStock,
        onLoaded: async (d) => {
          if (order.length > 0) {
            const ok = confirm(
              `\u26A0 \uBC1C\uC8FC \uD488\uBAA9\uC774 ${order.length}\uAC1C \uB4F1\uB85D\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.

\uC7AC\uACE0\uB97C \uC0C8\uB85C \uC5C5\uB85C\uB4DC\uD558\uBA74 \uB2E4\uC74C \uC815\uBCF4\uAC00 \uBB34\uD6A8\uD654\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4:
\u2022 \uC218\uB3D9\uC73C\uB85C \uC9C0\uC815\uD55C \uB85C\uD2B8 \uBC30\uBD84
\u2022 \uC0AC\uC6A9 \uC81C\uC678(\uCCB4\uD06C \uD574\uC81C)\uD55C \uB85C\uD2B8

(\uB85C\uD2B8 ID\uAC00 \uC0C8 \uC7AC\uACE0 \uAE30\uC900\uC73C\uB85C \uB2E4\uC2DC \uBD80\uC5EC\uB418\uC5B4 \uAE30\uC874 \uC124\uC815\uC774 \uD480\uB9BD\uB2C8\uB2E4)

\uADF8\uB798\uB3C4 \uCE74\uD1A4\uBC15\uC2A4 \uC804\uC0B0 \uC7AC\uACE0\uB97C \uC5C5\uB370\uC774\uD2B8\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`
            );
            if (!ok) return;
          }
          await updateStockSource("carton", d);
        },
        onRevert: () => revertStockSource("carton"),
        onReset: () => updateStockSource("carton", { fileName: "(\uB370\uC774\uD130 \uC5C6\uC74C)", date: "", lots: [] })
      }
    ), /* @__PURE__ */ React.createElement(
      StockUploadCard,
      {
        srcKey: "ecount",
        data: stock.ecount,
        prevData: prevStock.ecount,
        locked: !canEditStock,
        onLoaded: async (d) => {
          if (order.length > 0) {
            const ok = confirm(
              `\u26A0 \uBC1C\uC8FC \uD488\uBAA9\uC774 ${order.length}\uAC1C \uB4F1\uB85D\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.

\uC7AC\uACE0\uB97C \uC0C8\uB85C \uC5C5\uB85C\uB4DC\uD558\uBA74 \uB2E4\uC74C \uC815\uBCF4\uAC00 \uBB34\uD6A8\uD654\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4:
\u2022 \uC218\uB3D9\uC73C\uB85C \uC9C0\uC815\uD55C \uB85C\uD2B8 \uBC30\uBD84
\u2022 \uC0AC\uC6A9 \uC81C\uC678(\uCCB4\uD06C \uD574\uC81C)\uD55C \uB85C\uD2B8

(\uB85C\uD2B8 ID\uAC00 \uC0C8 \uC7AC\uACE0 \uAE30\uC900\uC73C\uB85C \uB2E4\uC2DC \uBD80\uC5EC\uB418\uC5B4 \uAE30\uC874 \uC124\uC815\uC774 \uD480\uB9BD\uB2C8\uB2E4)

\uADF8\uB798\uB3C4 \uC774\uCE74\uC6B4\uD2B8 \uC804\uC0B0 \uC7AC\uACE0\uB97C \uC5C5\uB370\uC774\uD2B8\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`
            );
            if (!ok) return;
          }
          await updateStockSource("ecount", d);
        },
        onRevert: () => revertStockSource("ecount"),
        onReset: () => updateStockSource("ecount", { fileName: "(\uB370\uC774\uD130 \uC5C6\uC74C)", date: "", lots: [] })
      }
    )), canEditStock ? /* @__PURE__ */ React.createElement(ManualStockAddForm, { onAdd: addManualLot }) : /* @__PURE__ */ React.createElement("div", { style: { marginTop: 18, maxWidth: 640 } }, /* @__PURE__ */ React.createElement(LockedNotice, { tier: 1, label: "\uC7AC\uACE0 \uC9C1\uC811 \uCD94\uAC00" })))));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
})();
