import { freezeForLot } from './design-freeze.mjs';
export { freezeMap, freezeReason, freezeDescription, freezeForLot } from './design-freeze.mjs';

export const fefoSort = (lots) => [...lots].sort((a, b) => {
  if (a.e && b.e) return a.e.localeCompare(b.e) || a.l.localeCompare(b.l);
  if (a.e) return -1;
  if (b.e) return 1;
  return a.l.localeCompare(b.l);
});
export function allocateLots(lots, required, excluded) {
  const exSet = excluded || new Set();
  const usable = fefoSort(lots.filter((l) => !exSet.has(l.id)));
  let remain = required;
  const usedMap = new Map();
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

export function simulatePlan({ order, boms, getStock, excluded, manualAlloc, partMode, kernelByCode }) {
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
      const totalStock = availableQuantity(lots, excluded);
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
}

export function frozenLotsById(sources, freezes) {
  const matches = new Map();
  if (!freezes || Object.keys(freezes).length === 0) return matches;
  const cache = new Map();
  for (const source of Object.values(sources)) {
    for (const item of Object.values(source)) {
      for (const lot of item.lots) {
        if (!cache.has(lot.l)) cache.set(lot.l, freezeForLot(freezes, lot.l));
        const freeze = cache.get(lot.l);
        if (freeze) matches.set(lot.id, freeze);
      }
    }
  }
  return matches;
}

export function planExclusions(manual, frozen, includeFrozen = false) {
  return includeFrozen || !frozen.size ? manual : new Set([...manual, ...frozen.keys()]);
}

export function availableQuantity(lots, excluded) {
  return lots.reduce((quantity, lot) => quantity + (excluded.has(lot.id) ? 0 : lot.q), 0);
}
