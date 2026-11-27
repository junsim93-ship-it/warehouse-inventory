(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var require_calculation_state = __commonJS({
    "src/calculation-state.js"(exports, module) {
      (function(root) {
        const key = (lot, src) => JSON.stringify([src, lot.c, lot.w || "", lot.l || "", lot.e || ""]);
        function identifyLots(lots, src) {
          const counts = /* @__PURE__ */ new Map();
          lots.forEach((l) => counts.set(key(l, src), (counts.get(key(l, src)) || 0) + 1));
          return lots.map((l) => ({ ...l, src, id: counts.get(key(l, src)) === 1 ? "lot:v2:" + key(l, src) : "lot:ambiguous:" + crypto.randomUUID() }));
        }
        function restoreScenario(s, currentLots, newId = () => crypto.randomUUID()) {
          if (!Array.isArray(s.order) || s.order.length > 1e3) throw new Error("\uC2DC\uB098\uB9AC\uC624 \uBC1C\uC8FC \uBAA9\uB85D\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
          const ids = /* @__PURE__ */ new Map();
          const lines = s.order.map((o) => {
            if (!o || typeof o.id !== "string" || !o.id || ids.has(o.id)) throw new Error("\uC2DC\uB098\uB9AC\uC624 \uC8FC\uBB38 ID\uAC00 \uC5C6\uAC70\uB098 \uC911\uBCF5\uB429\uB2C8\uB2E4.");
            const id = newId();
            if ([...ids.values()].includes(id)) throw new Error("\uC0C8 \uC8FC\uBB38 ID\uAC00 \uC911\uBCF5\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694.");
            ids.set(o.id, id);
            return { ...o, id };
          });
          const lots = new Map(currentLots.map((l) => [l.id, l]));
          const manualAlloc = /* @__PURE__ */ Object.create(null), partMode = /* @__PURE__ */ Object.create(null);
          let manualKept = 0, manualDropped = 0;
          const stable = (id) => s.lotIdentityVersion === 2 && id.startsWith("lot:v2:") && lots.has(id);
          for (const [oldId, byCode] of Object.entries(s.manualAlloc || {})) {
            for (const [code, byLot] of Object.entries(byCode || {})) for (const [lotId, qty] of Object.entries(byLot || {})) {
              if (!ids.has(oldId) || !stable(lotId) || lots.get(lotId).c !== code || !Number.isFinite(qty) || qty < 0 || qty > 1e9) {
                manualDropped++;
                continue;
              }
              const id = ids.get(oldId);
              if (!manualAlloc[id]) manualAlloc[id] = /* @__PURE__ */ Object.create(null);
              if (!manualAlloc[id][code]) manualAlloc[id][code] = /* @__PURE__ */ Object.create(null);
              manualAlloc[id][code][lotId] = qty;
              manualKept++;
            }
          }
          for (const [oldId, modes] of Object.entries(s.partMode || {})) if (ids.has(oldId) && modes && typeof modes === "object" && !Array.isArray(modes)) partMode[ids.get(oldId)] = { ...modes };
          const excludedIn = Array.isArray(s.excluded) ? s.excluded : [];
          const excluded = excludedIn.filter((id) => typeof id === "string" && stable(id));
          return { lines, manualAlloc, partMode, excluded, manualKept, manualDropped, excludedDropped: excludedIn.length - excluded.length };
        }
        function pruneSelections(manual, excluded, currentLots) {
          const ids = new Set(currentLots.map((l) => l.id));
          const manualAlloc = /* @__PURE__ */ Object.create(null);
          let dropped = 0;
          for (const [line, byCode] of Object.entries(manual)) for (const [code, byLot] of Object.entries(byCode)) for (const [id, qty] of Object.entries(byLot)) {
            if (!ids.has(id)) {
              dropped++;
              continue;
            }
            if (!manualAlloc[line]) manualAlloc[line] = /* @__PURE__ */ Object.create(null);
            if (!manualAlloc[line][code]) manualAlloc[line][code] = /* @__PURE__ */ Object.create(null);
            manualAlloc[line][code][id] = qty;
          }
          const kept = [...excluded].filter((id) => ids.has(id));
          dropped += excluded.size - kept.length;
          return { manualAlloc, excluded: kept, dropped };
        }
        const api = { identifyLots, restoreScenario, pruneSelections };
        root.CalculationState = api;
        if (typeof module === "object" && module.exports) module.exports = api;
      })(globalThis);
    }
  });
  require_calculation_state();
})();
