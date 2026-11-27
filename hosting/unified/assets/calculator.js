(() => {
  // functions/ui-shared/ecount-contract.mjs
  var ECOUNT_TARGET_MS = 3e4;
  var ecountActive = (state) => state?.mode === "ecount-authoritative" && state?.current != null;
  var EcountSyncError = class extends Error {
    constructor(code) {
      super(code);
      this.name = "EcountSyncError";
      this.code = code;
    }
  };
  var fail = (code) => {
    throw new EcountSyncError(code);
  };
  var text = (value, max = 500) => typeof value === "string" && value.length <= max && value.trim() !== "";
  var fields = (object, names) => object && typeof object === "object" && !Array.isArray(object) && Object.keys(object).every((name) => names.includes(name));
  var recordKey = (record) => JSON.stringify([record.itemCode, record.warehouseCode, record.lot]);
  var sameWarehouse = (a, b) => a?.code === b?.code && a?.name === b?.name;
  function decimalUnits(value) {
    if (!["string", "number"].includes(typeof value)) return null;
    const match = /^(-?)(\d+)(?:\.(\d{1,6}))?$/.exec(String(value));
    if (!match) return null;
    const amount = (BigInt(match[2]) * 1000000n + BigInt((match[3] || "").padEnd(6, "0"))) * (match[1] ? -1n : 1n);
    return amount <= BigInt(Number.MAX_SAFE_INTEGER) && amount >= -BigInt(Number.MAX_SAFE_INTEGER) ? amount : null;
  }
  function utcInstant(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) || !Number.isFinite(Date.parse(value))) return null;
    const normalized = new Date(value).toISOString();
    return normalized.slice(0, 19) === value.slice(0, 19) ? normalized : null;
  }
  function sourceTimeToUtc(raw, offset) {
    if (typeof raw !== "string" || typeof offset !== "string" || !/^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(offset) || /^[+-]14:/.test(offset) && !offset.endsWith(":00")) return null;
    const match = /(\d{4})[/-](\d{2})[/-](\d{2})[ T]+(?:(오전|오후|AM|PM)\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?!\d)/i.exec(raw);
    if (!match || +match[5] > 23 || +match[6] > 59 || +(match[7] || 0) > 59) return null;
    let hour = +match[5];
    if (match[4]) {
      if (hour < 1 || hour > 12) return null;
      hour = hour % 12 + (/^(오후|PM)$/i.test(match[4]) ? 12 : 0);
    }
    const local = `${match.slice(1, 4).join("-")}T${String(hour).padStart(2, "0")}:${match[6]}:${match[7] || "00"}`;
    return utcInstant(local + "Z") ? new Date(local + offset).toISOString() : null;
  }
  function normalizeCollectionEvidence(input, snapshotId, warehouse) {
    if (input == null) return null;
    const status = (value) => ["confirmed", "unconfirmed"].includes(value);
    const reference = (value) => typeof value === "string" && /^[A-Za-z0-9_.:-]{1,160}$/.test(value);
    if (!fields(input, ["fileSha256", "collection", "scope", "sourceTime", "completeness"]) || typeof input.fileSha256 !== "string" || !/^[a-f0-9]{64}$/.test(input.fileSha256)) fail("EVIDENCE_INVALID");
    const { collection, scope, sourceTime, completeness } = input;
    if (!fields(collection, ["id", "startedAtUtc", "completedAtUtc"]) || collection.id !== snapshotId) fail("EVIDENCE_MISMATCH");
    const startedAtUtc = collection.startedAtUtc === null ? null : utcInstant(collection.startedAtUtc), completedAtUtc = collection.completedAtUtc === null ? null : utcInstant(collection.completedAtUtc);
    if (collection.startedAtUtc !== null && !startedAtUtc || collection.completedAtUtc !== null && !completedAtUtc || startedAtUtc && completedAtUtc && Date.parse(startedAtUtc) > Date.parse(completedAtUtc)) fail("EVIDENCE_INVALID");
    if (!fields(scope, ["status", "warehouse", "report", "evidenceRef"]) || !status(scope.status) || !fields(scope.warehouse, ["code", "name"]) || !text(scope.warehouse.code, 80) || !text(scope.warehouse.name, 200) || scope.report !== "serial-lot-stock-by-warehouse" || scope.evidenceRef !== null && !reference(scope.evidenceRef) || scope.status === "confirmed" && !reference(scope.evidenceRef)) fail("EVIDENCE_INVALID");
    if (!sameWarehouse(scope.warehouse, warehouse)) fail("EVIDENCE_MISMATCH");
    if (!fields(sourceTime, ["raw", "timezoneStatus", "utcOffset", "asOfStatus", "evidenceRef", "utc"]) || !text(sourceTime.raw, 200) || !status(sourceTime.timezoneStatus) || !status(sourceTime.asOfStatus) || sourceTime.evidenceRef !== null && !reference(sourceTime.evidenceRef) || (sourceTime.timezoneStatus === "confirmed" || sourceTime.asOfStatus === "confirmed") && !reference(sourceTime.evidenceRef)) fail("EVIDENCE_INVALID");
    const utc = sourceTime.timezoneStatus === "confirmed" ? sourceTimeToUtc(sourceTime.raw, sourceTime.utcOffset) : null;
    if (sourceTime.timezoneStatus === "confirmed" && !utc || sourceTime.timezoneStatus === "unconfirmed" && sourceTime.utcOffset !== null) fail("EVIDENCE_INVALID");
    if (Object.hasOwn(sourceTime, "utc") && sourceTime.utc !== utc) fail("EVIDENCE_MISMATCH");
    if (!fields(completeness, ["status", "evidenceRef"]) || !status(completeness.status) || completeness.evidenceRef !== null && !reference(completeness.evidenceRef) || completeness.status === "confirmed" && !reference(completeness.evidenceRef)) fail("EVIDENCE_INVALID");
    return { fileSha256: input.fileSha256, collection: { id: collection.id, startedAtUtc, completedAtUtc }, scope: { status: scope.status, warehouse: { code: warehouse.code, name: warehouse.name }, report: scope.report, evidenceRef: scope.evidenceRef }, sourceTime: { raw: sourceTime.raw, timezoneStatus: sourceTime.timezoneStatus, utcOffset: sourceTime.utcOffset, asOfStatus: sourceTime.asOfStatus, evidenceRef: sourceTime.evidenceRef, utc }, completeness: { status: completeness.status, evidenceRef: completeness.evidenceRef } };
  }
  function snapshotHoldReasons(snapshot) {
    const reasons = [];
    if (snapshot?.coverage?.full !== true) reasons.push("INCOMPLETE_SNAPSHOT");
    const evidence = snapshot?.evidence;
    if (!evidence) return [...reasons, "EVIDENCE_REQUIRED"];
    if (evidence.scope.status !== "confirmed") reasons.push("SCOPE_UNCONFIRMED");
    if (!evidence.collection.startedAtUtc || !evidence.collection.completedAtUtc) reasons.push("COLLECTION_TIME_UNCONFIRMED");
    if (evidence.sourceTime.timezoneStatus !== "confirmed") reasons.push("SOURCE_TIMEZONE_UNCONFIRMED");
    if (evidence.sourceTime.asOfStatus !== "confirmed" || !snapshot.sourceAsOf) reasons.push("SOURCE_FRESHNESS_UNCONFIRMED");
    if (evidence.completeness.status !== "confirmed") reasons.push("COMPLETENESS_UNCONFIRMED");
    return reasons;
  }
  function validExpiry(value) {
    return value === null || typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && utcInstant(value + "T00:00:00Z") != null;
  }
  function normalizeSnapshot(input, policy) {
    if (!fields(input, ["schemaVersion", "source", "kind", "snapshotId", "warehouse", "sourceAsOf", "observedAt", "coverage", "records", "evidence"]) || input.schemaVersion !== 1 || input.source !== "ecount" || input.kind !== "full-lot-stock" || typeof input.snapshotId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(input.snapshotId)) fail("SNAPSHOT_INVALID");
    if (!sameWarehouse(input.warehouse, policy.warehouse)) fail("SCOPE_MISMATCH");
    const sourceAsOf = input.sourceAsOf === null ? null : utcInstant(input.sourceAsOf), observedAt = input.observedAt === null ? null : utcInstant(input.observedAt);
    if (input.sourceAsOf !== null && !sourceAsOf || input.observedAt !== null && !observedAt || sourceAsOf && observedAt && Date.parse(observedAt) < Date.parse(sourceAsOf) - 5e3) fail("TIMESTAMP_INVALID");
    const evidence = normalizeCollectionEvidence(input.evidence, input.snapshotId, policy.warehouse);
    if (evidence) {
      const verifiedSource = evidence.sourceTime.asOfStatus === "confirmed" ? evidence.sourceTime.utc : null;
      if (sourceAsOf !== verifiedSource || observedAt !== evidence.collection.completedAtUtc) fail("EVIDENCE_MISMATCH");
    }
    const coverage = input.coverage;
    if (!fields(coverage, ["full", "proof", "recordCount", "itemCount", "totalQuantity"]) || typeof coverage.full !== "boolean" || coverage.proof !== policy.coverageProof) fail("INCOMPLETE_SNAPSHOT");
    if (!Array.isArray(input.records) || input.records.length > 1e4) fail("SNAPSHOT_INVALID");
    if (!input.records.length && policy.allowEmptySnapshot !== true) fail("EMPTY_SNAPSHOT");
    const keys = /* @__PURE__ */ new Set(), items = /* @__PURE__ */ new Set();
    let total = 0n;
    const records = input.records.map((record) => {
      if (!fields(record, ["itemCode", "itemName", "barcode", "warehouseCode", "warehouse", "lot", "expiry", "quantity"]) || !text(record.itemCode, 200) || !text(record.itemName, 300) || !text(record.lot) || !validExpiry(record.expiry) || record.barcode !== null && (typeof record.barcode !== "string" || record.barcode.length > 500) || typeof record.quantity !== "number") fail("RECORD_INVALID");
      if (record.warehouseCode !== policy.warehouse.code || record.warehouse !== policy.warehouse.name) fail("SCOPE_MISMATCH");
      const amount = decimalUnits(record.quantity);
      if (amount === null || decimalUnits(Number(amount) / 1e6) !== amount) fail("RECORD_INVALID");
      const key = recordKey(record);
      if (keys.has(key)) fail("DUPLICATE_KEY");
      keys.add(key);
      items.add(record.itemCode);
      total += amount;
      return { itemCode: record.itemCode, itemName: record.itemName, barcode: record.barcode, warehouseCode: record.warehouseCode, warehouse: record.warehouse, lot: record.lot, expiry: record.expiry, quantity: record.quantity };
    });
    if (!Number.isInteger(coverage.recordCount) || coverage.recordCount !== records.length || !Number.isInteger(coverage.itemCount) || coverage.itemCount !== items.size || decimalUnits(coverage.totalQuantity) !== total || decimalUnits(Number(total) / 1e6) !== total) fail("COVERAGE_MISMATCH");
    records.sort((a, b) => recordKey(a) < recordKey(b) ? -1 : recordKey(a) > recordKey(b) ? 1 : 0);
    return { schemaVersion: 1, source: "ecount", kind: "full-lot-stock", snapshotId: input.snapshotId, warehouse: { ...policy.warehouse }, sourceAsOf, observedAt, coverage: { full: coverage.full, proof: coverage.proof, recordCount: records.length, itemCount: items.size, totalQuantity: Number(total) / 1e6 }, records, evidence };
  }

  // ui/ecount-state.mjs
  function ecountPublicMessage(status) {
    if (status.code === "waiting") return "ECOUNT \uD604\uC7AC\uACE0 \uC5F0\uACB0 \uB300\uAE30 \uC911\uC785\uB2C8\uB2E4.";
    if (["held", "rejected", "error"].includes(status.code)) return "ECOUNT \uD604\uC7AC\uACE0 \uD655\uC778 \uD544\uC694 \xB7 \uC774\uC804 \uC815\uC0C1 \uC790\uB8CC\uB97C \uC720\uC9C0\uD569\uB2C8\uB2E4.";
    return status.message;
  }
  function reduceEcountState(previous, event) {
    const state = previous || { document: null, fromCache: true, hasPendingWrites: false, receivedAt: null, error: null };
    if (event.type === "error") return { ...state, error: event.code || "LISTENER_ERROR" };
    if (event.type !== "snapshot") return state;
    if (event.hasPendingWrites === true) return { ...state, hasPendingWrites: true, fromCache: event.fromCache === true };
    const incoming = event.document;
    try {
      if (ecountActive(state.document) && (!ecountActive(incoming) || !sameWarehouse(state.document.warehouse, incoming.warehouse) || incoming.revision < state.document.revision)) throw new Error("SOURCE_REVERSED");
      if (incoming) {
        if (incoming.schemaVersion !== 1 || !["pending", "ecount-authoritative"].includes(incoming.mode) || !Number.isSafeInteger(incoming.revision) || incoming.revision < 0) throw new Error("SOURCE_INVALID");
        if (ecountActive(incoming)) {
          if (incoming.revision < 1 || !utcInstant(incoming.lastSuccessAt)) throw new Error("SOURCE_INVALID");
          const normalized = (current) => {
            const { payloadHash, ...snapshot } = current;
            return normalizeSnapshot(snapshot, { warehouse: incoming.warehouse, coverageProof: current.coverage?.proof, allowEmptySnapshot: true });
          };
          const next = normalized(incoming.current);
          if (state.document?.current) {
            if (incoming.revision === state.document.revision && Date.parse(incoming.lastAttempt?.at) < Date.parse(state.document.lastAttempt?.at)) throw new Error("SOURCE_REVERSED");
            if (incoming.revision === state.document.revision && (incoming.lastSuccessAt !== state.document.lastSuccessAt || JSON.stringify(next) !== JSON.stringify(normalized(state.document.current)))) throw new Error("SOURCE_REVERSED");
            if (incoming.revision > state.document.revision && Date.parse(next.sourceAsOf) <= Date.parse(state.document.current.sourceAsOf)) throw new Error("SOURCE_REVERSED");
          }
        } else if (incoming.current != null) throw new Error("SOURCE_INVALID");
      }
      return { document: structuredClone(incoming), fromCache: event.fromCache === true, hasPendingWrites: event.hasPendingWrites === true, receivedAt: event.receivedAt, error: null };
    } catch {
      return { ...state, fromCache: event.fromCache === true, error: "SOURCE_INVALID" };
    }
  }
  function ecountStatus(state, now = Date.now()) {
    const source = state?.document;
    const currentHolds = source?.current ? snapshotHoldReasons(source.current) : [];
    const evidence = source?.lastAttempt?.evidence || source?.current?.evidence || null;
    const result = { sourceAsOf: currentHolds.length ? null : source?.current?.sourceAsOf || null, lastSuccessAt: currentHolds.length ? null : source?.lastSuccessAt || null, evidence, collectionStartedAtUtc: evidence?.collection?.startedAtUtc || null, collectionCompletedAtUtc: evidence?.collection?.completedAtUtc || null, targetMs: ECOUNT_TARGET_MS, ageMs: null };
    const status = (code, message) => ({ ...result, code, message });
    const holds = {
      EVIDENCE_REQUIRED: "\uC218\uC9D1 \uC99D\uAC70 \uBBF8\uD655\uC778 \xB7 \uCD5C\uC2E0\uC131 \uD310\uB2E8\uACFC \uBC18\uC601\uC744 \uBCF4\uB958\uD569\uB2C8\uB2E4.",
      SCOPE_UNCONFIRMED: "\uC870\uD68C \uCC3D\uACE0 \uBC94\uC704 \uBBF8\uD655\uC815 \xB7 \uBC18\uC601\uC744 \uBCF4\uB958\uD569\uB2C8\uB2E4.",
      COLLECTION_TIME_UNCONFIRMED: "UTC \uC218\uC9D1 \uC2DC\uC791\xB7\uC644\uB8CC \uC2DC\uAC01 \uBBF8\uD655\uC778 \xB7 \uBC18\uC601\uC744 \uBCF4\uB958\uD569\uB2C8\uB2E4.",
      SOURCE_TIMEZONE_UNCONFIRMED: "\uC6D0\uBB38 \uC2DC\uAC01\uC758 \uC2DC\uAC04\uB300 \uBBF8\uD655\uC815 \xB7 \uCD5C\uC2E0\uC131 \uD310\uB2E8\uACFC \uBC18\uC601\uC744 \uBCF4\uB958\uD569\uB2C8\uB2E4.",
      SOURCE_FRESHNESS_UNCONFIRMED: "\uC6D0\uCC9C \uAE30\uC900 \uC2DC\uAC01\xB7\uCD5C\uC2E0\uC131 \uBBF8\uD655\uC815 \xB7 \uBC18\uC601\uC744 \uBCF4\uB958\uD569\uB2C8\uB2E4.",
      COMPLETENESS_UNCONFIRMED: "\uC804\uCCB4 \uC790\uB8CC \uC5EC\uBD80 \uBBF8\uD655\uC815 \xB7 \uC774\uC804 \uC815\uC0C1 \uC790\uB8CC\uB97C \uC720\uC9C0\uD558\uACE0 \uBC18\uC601\uC744 \uBCF4\uB958\uD569\uB2C8\uB2E4.",
      MISSING_UNRESOLVED: "\uB204\uB77D \uB85C\uD2B8 \uD655\uC778 \uD544\uC694 \xB7 \uC790\uB3D9 0 \uCC98\uB9AC \uC5C6\uC774 \uC774\uC804 \uC815\uC0C1 \uC790\uB8CC\uB97C \uC720\uC9C0\uD569\uB2C8\uB2E4."
    };
    const held = (reason) => ({ ...status("held", holds[reason]), reason, blockedReasons: source?.lastAttempt?.blockedReasons || currentHolds });
    if (state?.error) return status("error", "ECOUNT \uC5F0\uACB0 \uD655\uC778 \uD544\uC694 \xB7 \uC774\uC804 \uC815\uC0C1 \uC790\uB8CC\uB97C \uC720\uC9C0\uD569\uB2C8\uB2E4.");
    if (!ecountActive(source) && holds[source?.lastAttempt?.code]) return held(source.lastAttempt.code);
    if (!ecountActive(source)) return source?.lastAttempt?.code && source.lastAttempt.code !== "OK" ? status("rejected", "ECOUNT \uC218\uC2E0 \uC790\uB8CC \uAC80\uC99D \uC2E4\uD328 \xB7 \uC544\uC9C1 \uC815\uC0C1 \uC790\uB8CC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.") : status("waiting", "ECOUNT \uC218\uC9D1 \uACBD\uB85C \uC900\uBE44 \uC911 \xB7 \uC544\uC9C1 \uC6B4\uC601 \uC790\uB8CC\uC5D0 \uC5F0\uACB0\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
    if (state.hasPendingWrites) return status("unconfirmed", "\uC11C\uBC84 \uD655\uC778 \uC804 \uC790\uB8CC \xB7 \uCD5C\uC2E0 \uC790\uB8CC\uB85C \uD310\uC815\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
    if (state.fromCache) return status("cached", "\uCE90\uC2DC \uC790\uB8CC \uD45C\uC2DC \uC911 \xB7 \uC5F0\uACB0\uACFC \uCD5C\uC2E0 \uC5EC\uBD80\uB97C \uD655\uC778\uD558\uC138\uC694.");
    if (holds[source.lastAttempt?.code]) return held(source.lastAttempt.code);
    if (source.lastAttempt?.code && source.lastAttempt.code !== "OK") return status("rejected", "\uCD5C\uADFC \uC218\uC2E0 \uC790\uB8CC \uAC80\uC99D \uC2E4\uD328 \xB7 \uC774\uC804 \uC815\uC0C1 \uC790\uB8CC\uB97C \uC720\uC9C0\uD569\uB2C8\uB2E4.");
    if (currentHolds.length) return held(currentHolds.find((code) => holds[code]) || "EVIDENCE_REQUIRED");
    result.ageMs = now - Date.parse(result.sourceAsOf);
    if (!Number.isFinite(result.ageMs) || result.ageMs < -5e3) return status("error", "\uC2DC\uAC01\uC744 \uD655\uC778\uD560 \uC218 \uC5C6\uC5B4 \uCD5C\uC2E0 \uC5EC\uBD80\uB97C \uD310\uB2E8\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    if (result.ageMs > ECOUNT_TARGET_MS) return status("late", "30\uCD08 \uBAA9\uD45C \uCD08\uACFC \xB7 \uC774\uC804 \uC815\uC0C1 \uC790\uB8CC\uB97C \uD45C\uC2DC\uD569\uB2C8\uB2E4.");
    return status("ready", "ECOUNT \uC815\uC0C1 \uC218\uC2E0 \uC790\uB8CC\uB97C \uD45C\uC2DC\uD569\uB2C8\uB2E4.");
  }

  // src/calculator.jsx
  var { useState, useEffect, useMemo, useRef } = React;
  var fmt = (n) => n == null || !isFinite(n) ? "-" : Math.round(n).toLocaleString("ko-KR");
  var SRC = { p3l: "3PL \uC804\uC0B0", ecount: "\uC774\uCE74\uC6B4\uD2B8 \uC804\uC0B0", carton: "\uCE74\uD1A4\uBC15\uC2A4 \uC804\uC0B0" };
  var inp = {
    width: "100%",
    padding: "9px 11px",
    border: "1px solid #E0E4EB",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "inherit",
    color: "#20273A",
    background: "#fff",
    outline: "none"
  };
  async function readCalculatorWorkbook(buffer) {
    const [book] = await Promise.all([readWorkbookSafely(buffer), window.XLSX || LotfolioSheets.loadSpreadsheet()]);
    return book;
  }
  async function downloadFile({ filename, data }) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }
  function Btn({ children, kind = "primary", onClick, disabled, small, type = "button", style = {} }) {
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
      primary: { background: "#4D56CB", color: "#fff" },
      ghost: { background: "transparent", color: "#4D56CB", border: "1px solid #4D56CB" },
      danger: { background: "transparent", color: "#C8372D", border: "1px solid #E0E4EB" },
      plain: { background: "#EFF1F7", color: "#20273A" },
      amber: { background: "transparent", color: "#9A6B00", border: "1px solid #E0C97A" }
    };
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        type,
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
      const qty = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(rawQty) ? Number(rawQty) : NaN;
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
  const { fefoSort, allocateLots, simulatePlan } = CalculatorPlan;
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
      border: "1px solid #E0E4EB",
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
        style: { padding: "9px 12px", cursor: "pointer", borderBottom: "1px solid #F6F7FA" },
        onMouseOver: (e) => e.currentTarget.style.background = "#EDEEFF",
        onMouseOut: (e) => e.currentTarget.style.background = "transparent"
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600 } }, i.name),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#59657A", fontFamily: "monospace" } }, i.code, " \xB7 3PL ", fmt(i.t3), " / \uC774\uCE74\uC6B4\uD2B8 ", fmt(i.te))
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
          color: "#59657A",
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
      border: "1px solid #E0E4EB",
      borderRadius: 10,
      boxShadow: "0 8px 24px rgba(21,32,31,.12)",
      maxHeight: 300,
      overflowY: "auto"
    } }, results.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 12px", fontSize: 13, color: "#69768A", textAlign: "center" } }, "\uC77C\uCE58\uD558\uB294 \uC81C\uD488\uC774 \uC5C6\uC2B5\uB2C8\uB2E4") : results.map((b) => /* @__PURE__ */ React.createElement(
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
          borderBottom: "1px solid #F6F7FA",
          background: b.id === value ? "#EDEEFF" : "transparent"
        },
        onMouseOver: (e) => e.currentTarget.style.background = "#EDEEFF",
        onMouseOut: (e) => e.currentTarget.style.background = b.id === value ? "#EDEEFF" : "transparent"
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600 } }, b.name),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "#59657A" } }, "\uBD80\uC790\uC7AC ", b.components.length, "\uC885")
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
    return /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px solid #E0E4EB", borderRadius: 14, padding: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, marginBottom: 14 } }, initial ? "BOM \uC218\uC815" : "\uC0C8 \uC81C\uD488 BOM \uB4F1\uB85D"), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 12, color: "#59657A", fontWeight: 600 } }, "\uC81C\uD488 \uC774\uB984"), /* @__PURE__ */ React.createElement(
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
      background: isKernel ? "#FBF3DE" : "#FAFAFD",
      border: `1px solid ${isKernel ? "#E0C97A" : "#E0E4EB"}`
    } }, /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: isKernel, onChange: (e) => setIsKernel(e.target.checked) }), "\u{1F9E9} \uC774 BOM\uC740 \uC54C\uB9F9\uC774(\uBC18\uC81C\uD488)\uC785\uB2C8\uB2E4 \u2014 \uB2E4\uB978 \uD0A4\uD2B8 BOM\uC5D0\uC11C \uC774 \uC54C\uB9F9\uC774\uB97C \uBD80\uC790\uC7AC\uCC98\uB7FC \uCC38\uC870\uD560 \uC218 \uC788\uAC8C \uB429\uB2C8\uB2E4"), isKernel && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8 } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11.5, color: "#7A5500", fontWeight: 600 } }, "\uC54C\uB9F9\uC774 \uD488\uBAA9\uCF54\uB4DC (\uC804\uC0B0\uC5D0 \uB4F1\uB85D\uB41C \uC7AC\uACE0 \uCF54\uB4DC\uC640 \uB3D9\uC77C\uD574\uC57C \uC790\uB3D9 \uC7AC\uACE0 \uC870\uD68C\uAC00 \uB429\uB2C8\uB2E4)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        style: { ...inp, marginTop: 4, maxWidth: 280 },
        value: kernelCode,
        placeholder: "\uC608: MR370050TG4",
        onChange: (e) => setKernelCode(e.target.value.trim())
      }
    ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#7A5500", marginTop: 4, lineHeight: 1.6 } }, "\uB2E4\uB978 \uD0A4\uD2B8 BOM\uC744 \uB9CC\uB4E4 \uB54C \uBD80\uC790\uC7AC \uAC80\uC0C9\uCC3D\uC5D0 \uC774 \uCF54\uB4DC\uB97C \uC785\uB825\uD558\uBA74 \uC54C\uB9F9\uC774\uB85C \uC778\uC2DD\uB418\uC5B4, \uBC1C\uC8FC \uC2DC\uBBAC\uB808\uC774\uC158\uC5D0\uC11C \uC7AC\uACE0 \uC6B0\uC120 \uC18C\uC9C4 / \uAC15\uC81C \uC804\uAC1C / \uAC15\uC81C \uC644\uC81C\uD488 \uC911 \uC120\uD0DD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 12, color: "#59657A", fontWeight: 600 } }, "\uBD80\uC790\uC7AC \uCD94\uAC00"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 4 } }, /* @__PURE__ */ React.createElement(ItemSearch, { items, onPick: addComp }))), comps.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 8 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { color: "#59657A", textAlign: "left", background: "#FAFAFD" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "8px 10px", fontWeight: 600 } }, "\uBD80\uC790\uC7AC"), /* @__PURE__ */ React.createElement("th", { style: { padding: "8px 10px", fontWeight: 600, width: 130 } }, "1\uAC1C\uB2F9 \uC18C\uC694\uB7C9"), /* @__PURE__ */ React.createElement("th", { style: { width: 60 } }))), /* @__PURE__ */ React.createElement("tbody", null, comps.map((c) => {
      const s = getStock(c.code);
      return /* @__PURE__ */ React.createElement("tr", { key: c.code, style: { borderTop: "1px solid #F6F7FA" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600 } }, c.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#59657A", fontFamily: "monospace" } }, c.code, " \xB7 3PL ", fmt(s.t3), " / \uC774\uCE74\uC6B4\uD2B8 ", fmt(s.te))), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px" } }, /* @__PURE__ */ React.createElement(
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
      const downloads = { save: downloadFile };
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
          const wb = await readCalculatorWorkbook(ev.target.result);
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
    const tone = srcKey === "p3l" ? "#1D5C8A" : srcKey === "carton" ? "#7B4D1E" : "#4D56CB";
    const toneSoft = srcKey === "p3l" ? "#E4EEF6" : srcKey === "carton" ? "#F5EDE4" : "#EDEEFF";
    return /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px solid #E0E4EB", borderRadius: 14, padding: 18, flex: 1, minWidth: 300 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 800, color: tone } }, SRC[srcKey]), /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 11,
      fontWeight: 700,
      padding: "3px 8px",
      borderRadius: 999,
      background: toneSoft,
      color: tone
    } }, srcKey === "p3l" ? "WMS" : "ERP")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: "#59657A", lineHeight: 1.7, marginBottom: 12 } }, "\uD30C\uC77C: ", /* @__PURE__ */ React.createElement("b", { style: { color: "#20273A" } }, data.fileName), /* @__PURE__ */ React.createElement("br", null), "\uC5C5\uB85C\uB4DC: ", data.date, /* @__PURE__ */ React.createElement("br", null), "\uD488\uBAA9 ", fmt(codes), "\uC885 \xB7 \uB85C\uD2B8 ", fmt(data.lots.length), "\uAC74 \xB7 \uCD1D ", fmt(total), "\uAC1C"), data.meta && /* @__PURE__ */ React.createElement("div", { style: {
      fontSize: 11.5,
      background: "#FAFAFD",
      border: "1px solid #EFF1F7",
      borderRadius: 8,
      padding: "8px 10px",
      marginBottom: 12,
      lineHeight: 1.7,
      color: "#59657A"
    } }, /* @__PURE__ */ React.createElement("b", { style: { color: "#20273A" } }, "\u{1F4CB} \uD30C\uC2F1 \uACB0\uACFC"), /* @__PURE__ */ React.createElement("br", null), "\uC218\uB7C9 \uC5F4: ", /* @__PURE__ */ React.createElement("b", { style: { color: tone } }, data.meta.qtyCol), " \xB7 \uCF54\uB4DC \uC5F4: ", data.meta.codeCol, data.meta.lotCol && /* @__PURE__ */ React.createElement(React.Fragment, null, " \xB7 \uB85C\uD2B8 \uC5F4: ", data.meta.lotCol), /* @__PURE__ */ React.createElement("br", null), "\uB370\uC774\uD130 ", fmt(data.meta.dataRows), "\uD589 \uC911 ", fmt(data.meta.parsedRows), "\uD589 \uBC18\uC601", data.meta.skippedSubtotal > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, " \xB7 \uC18C\uACC4 \uB4F1 \uC81C\uC678 ", fmt(data.meta.skippedSubtotal), "\uD589"), data.meta.skippedZero > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, " \xB7 \uC218\uB7C9 0 \uC81C\uC678 ", fmt(data.meta.skippedZero), "\uD589"), data.meta.warnings.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 4, color: "#9A6B00" } }, data.meta.warnings.map((w, i) => /* @__PURE__ */ React.createElement("div", { key: i }, "\u26A0 ", w)))), locked ? /* @__PURE__ */ React.createElement(LockedNotice, { tier: 1, label: "\uC7AC\uACE0 \uC5C5\uB85C\uB4DC/\uCD08\uAE30\uD654" }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: () => !busy && ref.current.click(),
        onDrop: handleDrop,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        style: {
          border: `2px dashed ${dragOver ? tone : "#C8CDDB"}`,
          background: dragOver ? toneSoft : "#FAFAFD",
          borderRadius: 10,
          padding: "20px 14px",
          textAlign: "center",
          cursor: busy ? "wait" : "pointer",
          transition: "all .15s",
          marginBottom: 10
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, marginBottom: 4, opacity: dragOver ? 1 : 0.6 } }, busy ? "\u23F3" : dragOver ? "\u{1F4E5}" : "\u{1F4CA}"),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: dragOver ? tone : "#20273A" } }, busy ? "\uC77D\uB294 \uC911\u2026" : dragOver ? "\uC5EC\uAE30\uC5D0 \uB193\uC544\uC8FC\uC138\uC694" : "\uC5D1\uC140 \uD30C\uC77C\uC744 \uB04C\uC5B4\uB2E4 \uB193\uAC70\uB098 \uD074\uB9AD"),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "#69768A", marginTop: 4 } }, ".xlsx, .xls, .csv \uC9C0\uC6D0")
    ), /* @__PURE__ */ React.createElement("input", { ref, type: "file", accept: ".xlsx,.xls,.csv", style: { display: "none" }, onChange: handleFile }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, prevData && /* @__PURE__ */ React.createElement(Btn, { kind: "amber", small: true, onClick: onRevert }, "\u21B6 \uC9C1\uC804 \uB370\uC774\uD130\uB85C \uB418\uB3CC\uB9AC\uAE30"), /* @__PURE__ */ React.createElement(Btn, { kind: "plain", small: true, onClick: () => {
      if (confirm("\uC774 \uC7AC\uACE0\uB97C \uBE44\uC6B8\uAE4C\uC694? \uBCC0\uACBD \uC804 \uC7AC\uACE0\uB294 \uC774\uC804 \uC7AC\uACE0\uB85C \uBCF4\uAD00\uB429\uB2C8\uB2E4.")) onReset();
    } }, "\uC7AC\uACE0 \uBE44\uC6B0\uAE30"))), prevData && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 11.5, color: "#9A6B00", lineHeight: 1.6 } }, "\u21B6 \uB418\uB3CC\uB9AC\uAE30 \uAC00\uB2A5: ", /* @__PURE__ */ React.createElement("b", null, prevData.fileName), " (", prevData.date, ")"), err && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, fontSize: 12, color: "#C8372D", fontWeight: 600 } }, "\u26A0 ", err), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, fontSize: 11.5, color: "#69768A", lineHeight: 1.6 } }, "\uD488\uBAA9\uCF54\uB4DC/\uC0C1\uD488\uCF54\uB4DC \xB7 \uC218\uB7C9(\uC7AC\uACE0\uC218\uB7C9/\uAC00\uC6A9\uC7AC\uACE0) \uC5F4\uC774 \uC788\uC73C\uBA74 \uC790\uB3D9 \uC778\uC2DD\uB429\uB2C8\uB2E4. \uB85C\uD2B8No.\xB7\uC720\uD6A8\uAE30\uD55C\xB7\uCC3D\uACE0\uBA85 \uC5F4\uC774 \uC788\uC73C\uBA74 \uB85C\uD2B8\uBCC4\uB85C \uBD84\uD560 \uC800\uC7A5\uB429\uB2C8\uB2E4."));
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
      border: "1px solid #E0E4EB",
      borderRadius: 14,
      padding: 16,
      marginTop: 18,
      maxWidth: 640
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, marginBottom: 4 } }, "\u270D\uFE0F \uC7AC\uACE0 \uC9C1\uC811 \uCD94\uAC00"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "#69768A", marginBottom: 12, lineHeight: 1.6 } }, "\uC5D1\uC140 \uC5C5\uB85C\uB4DC \uC5C6\uC774 \uD488\uBAA9\uCF54\uB4DC\xB7\uBD80\uC790\uC7AC\uBA85\xB7\uC218\uB7C9\xB7\uB85C\uD2B8\uBC88\uD638\uB97C \uC785\uB825\uD574 \uC7AC\uACE0 1\uAC74\uC744 \uC989\uC2DC \uCD94\uAC00\uD569\uB2C8\uB2E4. \uAE30\uC874 \uC7AC\uACE0\uB294 \uADF8\uB300\uB85C \uC720\uC9C0\uB418\uACE0 \uC0C8 \uB85C\uD2B8\uAC00 \uCD94\uAC00\uB429\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 10 } }, ["p3l", "ecount", "carton"].map((k) => /* @__PURE__ */ React.createElement(
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
          border: srcKey === k ? "1.5px solid #20273A" : "1px solid #E0E4EB",
          background: srcKey === k ? "#20273A" : "#fff",
          color: srcKey === k ? "#fff" : "#59657A"
        }
      },
      SRC[k]
    ))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11.5, color: "#59657A", fontWeight: 600 } }, "\uD488\uBAA9\uCF54\uB4DC *"), /* @__PURE__ */ React.createElement("input", { style: inpS, value: code, onChange: (e) => setCode(e.target.value), placeholder: "\uC608: MR390000PP4" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11.5, color: "#59657A", fontWeight: 600 } }, "\uBD80\uC790\uC7AC\uBA85"), /* @__PURE__ */ React.createElement("input", { style: inpS, value: name, onChange: (e) => setName(e.target.value), placeholder: "\uBE44\uC6CC\uB450\uBA74 \uD488\uBAA9\uCF54\uB4DC\uB85C \uD45C\uC2DC" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11.5, color: "#59657A", fontWeight: 600 } }, "\uC218\uB7C9 *"), /* @__PURE__ */ React.createElement("input", { style: inpS, type: "number", value: qty, onChange: (e) => setQty(e.target.value), placeholder: "\uC608: 500" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11.5, color: "#59657A", fontWeight: 600 } }, "\uB85C\uD2B8/\uC2DC\uB9AC\uC5BC No."), /* @__PURE__ */ React.createElement("input", { style: inpS, value: lot, onChange: (e) => setLot(e.target.value), placeholder: "\uC120\uD0DD \uC785\uB825" })), /* @__PURE__ */ React.createElement("div", { style: { gridColumn: "1 / -1" } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11.5, color: "#59657A", fontWeight: 600 } }, "\uCC3D\uACE0\uBA85 (\uC120\uD0DD)"), /* @__PURE__ */ React.createElement("input", { style: inpS, value: warehouse, onChange: (e) => setWarehouse(e.target.value), placeholder: "\uC608: 3PL A\uC874, \uBCF8\uC0AC (\uBD80\uC790\uC7AC \uCC3D\uACE0) \uB4F1" }))), msg && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, marginBottom: 8, color: msg.t === "err" ? "#C8372D" : "#4D56CB" } }, msg.t === "err" ? "\u26A0 " : "\u2713 ", msg.m), /* @__PURE__ */ React.createElement(Btn, { kind: "primary", small: true, onClick: submit }, "+ ", SRC[srcKey], "\uC5D0 \uC7AC\uACE0 \uCD94\uAC00"));
  }
  function designButton(value) {
    const bridge = window.LotfolioFrame;
    if (!bridge.embedded) return null;
    const parsed = bridge.parse(value);
    if (!parsed) return null;
    return React.createElement("button", {
      type: "button", className: "lotfolio-design-button",
      "aria-label": value + " 시안 보기",
      onClick: (event) => { event.stopPropagation(); bridge.view(parsed.lot); }
    }, "시안");
  }
  function FreezeLotBadge({ freeze }) {
    if (!freeze) return null;
    const description = CalculatorPlan.freezeDescription(freeze);
    return React.createElement("details", {className: "lotfolio-freeze-lot", onClick: (event) => event.stopPropagation()},
      React.createElement("summary", {title: description}, "🔒 동결 · ", CalculatorPlan.freezeReason(freeze.reason)),
      React.createElement("span", null, description)
    );
  }
  function PlanFreezeStatus({ ready, includeFrozen, count, onToggle }) {
    return React.createElement("section", {className: "lotfolio-freeze-plan", "aria-label": "동결 로트 계산 설정"},
      React.createElement("span", {role: "status"}, !ready
        ? "디자인 동결 상태를 확인할 수 있을 때 발주 계산 결과가 표시됩니다."
        : includeFrozen ? "동결 로트 자동 제외 해제" : `동결 로트 ${count}건 제외 중`),
      React.createElement("label", null,
        React.createElement("input", {type: "checkbox", checked: includeFrozen, disabled: !ready,
          onChange: (event) => onToggle(event.target.checked)}),
        "동결 로트 포함해서 계산"
      )
    );
  }
  function LotTable({ lots, required, allocations, showSource, excluded, frozenById, forceExcludeFrozen, onToggle, onSelectAll, onAllocChange, onResetAlloc, searchHighlight }) {
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
    const selectable = interactive ? lots.filter((lot) => !forceExcludeFrozen || !frozenById?.has(lot.id)) : [];
    const allOn = selectable.every((l) => !excluded?.has(l.id));
    const allOff = selectable.every((l) => excluded?.has(l.id));
    const hasUseCol = alloc.some((a) => a.use != null);
    const hasManual = alloc.some((a) => a.manual);
    return /* @__PURE__ */ React.createElement("div", null, (interactive || editable && hasManual) && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 6, fontSize: 11.5, flexWrap: "wrap" } }, interactive && selectable.length > 1 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => onSelectAll(true, selectable.map((lot) => lot.id)),
        disabled: allOn,
        style: {
          border: "1px solid #E0E4EB",
          background: allOn ? "#F6F7FA" : "#fff",
          color: allOn ? "#A7B0C0" : "#20273A",
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
        onClick: () => onSelectAll(false, selectable.map((lot) => lot.id)),
        disabled: allOff,
        style: {
          border: "1px solid #E0E4EB",
          background: allOff ? "#F6F7FA" : "#fff",
          color: allOff ? "#A7B0C0" : "#20273A",
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
    )), /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: hasUseCol ? 520 : 320 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { color: "#59657A", background: "#F6F7FA", textAlign: "right" } }, interactive && /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 8px", width: 30 } }), showSource && /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", textAlign: "left", fontWeight: 600 } }, "\uC804\uC0B0"), /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", textAlign: "left", fontWeight: 600 } }, "\uB85C\uD2B8/\uC2DC\uB9AC\uC5BC No."), /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", fontWeight: 600 } }, "\uBCF4\uC720"), hasUseCol && /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", fontWeight: 600 } }, "\uC0AC\uC6A9", editable && " (\uC785\uB825 \uAC00\uB2A5)"), hasUseCol && /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", fontWeight: 600 } }, "\uC0AC\uC6A9 \uD6C4 \uC794\uC5EC"))), /* @__PURE__ */ React.createElement("tbody", null, alloc.map((l, idx) => {
      const dim = l.excluded;
      const overUse = l.left != null && l.left < 0;
      const hl = searchHighlight && l.l && l.l.toLowerCase().includes(searchHighlight.toLowerCase());
      return /* @__PURE__ */ React.createElement("tr", { key: l.id || idx, style: {
        borderTop: "1px solid #EFF1F7",
        background: dim ? "#F6F7FA" : hl ? "#FFF8B8" : l.manual ? "#FFF8E1" : l.use > 0 ? "#FFFBEB" : "transparent",
        color: dim ? "#69768A" : "inherit",
        textDecoration: dim ? "line-through" : "none",
        outline: hl && !dim ? "2px solid #E5C100" : "none",
        outlineOffset: hl && !dim ? "-2px" : 0
      } }, interactive && /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 8px", textAlign: "center", textDecoration: "none" } }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          checked: !dim,
          disabled: forceExcludeFrozen && frozenById?.has(l.id),
          "aria-label": l.l + " 사용",
          onChange: () => onToggle(l.id),
          style: { cursor: "pointer", width: 14, height: 14, accentColor: "#4D56CB" }
        }
      )), showSource && /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", textDecoration: "none" } }, /* @__PURE__ */ React.createElement("span", { style: {
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 6px",
        borderRadius: 4,
        background: l.src === "p3l" ? "#E4EEF6" : l.src === "carton" ? "#F5EDE4" : "#EDEEFF",
        color: l.src === "p3l" ? "#1D5C8A" : l.src === "carton" ? "#7B4D1E" : "#4D56CB",
        opacity: dim ? 0.5 : 1
      } }, l.src === "p3l" ? "3PL" : l.src === "carton" ? "\uCE74\uD1A4\uBC15\uC2A4" : "\uC774\uCE74\uC6B4\uD2B8")), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", fontFamily: "monospace" } }, l.l || "-", designButton(l.l), React.createElement(FreezeLotBadge, {freeze: frozenById?.get(l.id)}), l.manual && !dim && /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 6, fontSize: 10, fontWeight: 700, color: "#9A6B00", background: "#FBF3DE", padding: "1px 5px", borderRadius: 4, textDecoration: "none" } }, "\uC218\uB3D9")), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" } }, fmt(l.q)), hasUseCol && /* @__PURE__ */ React.createElement("td", { style: { padding: "4px 10px", textAlign: "right", textDecoration: "none" } }, dim ? /* @__PURE__ */ React.createElement("span", { style: { color: "#A7B0C0" } }, "\uC81C\uC678") : editable ? /* @__PURE__ */ React.createElement("div", { style: { display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 2 } }, /* @__PURE__ */ React.createElement(
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
            border: l.conflictQty > 0 ? "1.5px solid #C8372D" : l.manual ? "1.5px solid #9A6B00" : "1px solid #E0E4EB",
            background: l.conflictQty > 0 ? "#FBEAE8" : l.manual ? "#FFFBEB" : "#fff",
            color: l.conflictQty > 0 ? "#C8372D" : l.use > 0 ? "#9A6B00" : "#59657A",
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
      } }, "\u26A0 ", fmt(l.conflictQty), "\uAC1C \uCC28\uB2E8 \u2192 \uC2E4\uC0AC\uC6A9 ", fmt(l.use))) : /* @__PURE__ */ React.createElement("span", { style: { fontWeight: l.use > 0 ? 700 : 400, color: l.use > 0 ? "#9A6B00" : "#A7B0C0", fontVariantNumeric: "tabular-nums" } }, l.use > 0 ? fmt(l.use) : "-")), hasUseCol && /* @__PURE__ */ React.createElement("td", { style: {
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
    const [mode, setMode] = useState("login"), [email, setEmail] = useState(""), [password, setPassword] = useState("");
    const dialog = useRef(null);
    useEffect(() => {
      const previous = document.activeElement, node = dialog.current;
      node.showModal();
      return () => {
        node.close();
        if (previous?.isConnected) previous.focus();
      };
    }, []);
    const fieldStyle = { padding: "10px 11px", border: "1px solid #E0E4EB", borderRadius: 8, fontSize: 16, width: "100%", boxSizing: "border-box", minHeight: 44 };
    const trapTab = (e) => {
      if (e.key !== "Tab") return;
      const fields2 = [...e.currentTarget.querySelectorAll("input,button,[tabindex]")].filter((el) => !el.disabled && el.tabIndex >= 0);
      const first = fields2[0], last = fields2[fields2.length - 1];
      if (first && (e.shiftKey && document.activeElement === first || !e.shiftKey && document.activeElement === last)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    return /* @__PURE__ */ React.createElement("dialog", { ref: dialog, className: "calc-login-dialog", "aria-labelledby": "calc-login-title", onKeyDown: trapTab, style: { border: 0, borderRadius: 14, padding: 24, margin: "auto", width: "min(380px,calc(100vw - 32px))", maxHeight: "calc(100dvh - 32px)", overflowY: "auto", background: "#fff", color: "#20273A" }, onCancel: (e) => {
      e.preventDefault();
      if (!busy) onClose();
    } }, /* @__PURE__ */ React.createElement("style", null, ".calc-login-dialog::backdrop{background:rgba(0,0,0,.4)}.calc-login-dialog :focus-visible{outline:3px solid #2161cf;outline-offset:2px}"), /* @__PURE__ */ React.createElement("form", { style: { display: "flex", flexDirection: "column", gap: 14 }, onSubmit: (e) => {
      e.preventDefault();
      if (!busy) (mode === "login" ? onLogin : onSignup)(email.trim(), password);
    } }, /* @__PURE__ */ React.createElement("h2", { id: "calc-login-title", style: { fontSize: 18 } }, mode === "login" ? "\uAD00\uB9AC\uC790 \uB85C\uADF8\uC778" : "\uAD00\uB9AC\uC790 \uACC4\uC815 \uAC00\uC785"), /* @__PURE__ */ React.createElement("label", { style: { display: "grid", gap: 6 } }, "\uC774\uBA54\uC77C", /* @__PURE__ */ React.createElement("input", { type: "email", required: true, autoFocus: true, autoComplete: "username", style: fieldStyle, value: email, onChange: (e) => setEmail(e.target.value) })), /* @__PURE__ */ React.createElement("label", { style: { display: "grid", gap: 6 } }, "\uBE44\uBC00\uBC88\uD638", /* @__PURE__ */ React.createElement("input", { type: "password", required: true, minLength: mode === "signup" ? 6 : void 0, autoComplete: mode === "login" ? "current-password" : "new-password", style: fieldStyle, value: password, onChange: (e) => setPassword(e.target.value) })), error && /* @__PURE__ */ React.createElement("p", { role: "alert", style: { fontSize: 14, color: "#C8372D" } }, error), mode === "signup" && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "#626b78" } }, "\uAC00\uC785 \uD6C4 \uAD00\uB9AC\uC790 \uC2B9\uC778\uC774 \uC788\uC5B4\uC57C \uC5C5\uBB34 \uAE30\uB2A5\uC744 \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uBE44\uBC00\uBC88\uD638\uB294 6\uC790 \uC774\uC0C1 \uC785\uB825\uD558\uC138\uC694."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", style: { minHeight: 44 }, disabled: busy, onClick: () => setMode(mode === "login" ? "signup" : "login") }, mode === "login" ? "\uACC4\uC815 \uAC00\uC785" : "\uB85C\uADF8\uC778\uC73C\uB85C"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", style: { minHeight: 44 }, disabled: busy, onClick: onClose }, "\uCDE8\uC18C"), /* @__PURE__ */ React.createElement(Btn, { type: "submit", style: { minHeight: 44 }, disabled: busy }, busy ? "\uCC98\uB9AC \uC911\u2026" : mode === "login" ? "\uB85C\uADF8\uC778" : "\uAC00\uC785\uD558\uAE30")))));
  }
  function AuthBox({ user, tier, onLoginClick, onLogout }) {
    if (window.LotfolioFrame.embedded) return null;
    if (!user) return /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", small: true, onClick: onLoginClick }, "\u{1F512} \uAD00\uB9AC\uC790 \uB85C\uADF8\uC778");
    const tierLabel = tier === 2 ? "2\uB2E8\uACC4 \uAD00\uB9AC\uC790" : tier === 1 ? "1\uB2E8\uACC4 \uAD00\uB9AC\uC790" : "\uAD8C\uD55C \uC5C6\uC74C";
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#59657A" } }, /* @__PURE__ */ React.createElement("span", null, user.email, " \xB7 ", tierLabel), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", small: true, onClick: onLogout }, "\uB85C\uADF8\uC544\uC6C3"));
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
  var blankSupplier = () => ({ name: "", email: "", tel: "", fax: "", deliveryAddress: "" });
  function previewPurchaseOrder(record, onError) {
    const popup = window.open("", "_blank");
    if (!popup) {
      onError("\uD31D\uC5C5\uC774 \uCC28\uB2E8\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC774 \uC0AC\uC774\uD2B8\uC758 \uD31D\uC5C5\uC744 \uD5C8\uC6A9\uD574 \uC8FC\uC138\uC694.");
      return;
    }
    popup.document.write(window.PurchaseOrder.render(record.order, record));
    popup.document.close();
    popup.document.getElementById("printOrder").addEventListener("click", () => popup.print());
  }
  function PurchaseOrderDialog({ shortages, suppliers, itemSuppliers = [], onSaveSuppliers, onCreateOrders, onClose, supplierOnly = false, reorder = null, freezes }) {
    const [rows, setRows] = useState(() => reorder ? reorder.order.lines.map((line) => ({ ...line, short: shortages.find((s) => s.code === line.code)?.short || 0, qty: String(line.qty), supplierId: suppliers.some((s) => s.id === reorder.order.supplier.id) ? reorder.order.supplier.id : "" })) : shortages.map(({ code, name, short }) => {
      const remembered = itemSuppliers.find((b) => b.code === code)?.supplierId;
      return { code, name, short, qty: "", supplierId: suppliers.some((s) => s.id === remembered) ? remembered : "", detail: "", lot: "" };
    }));
    const [selected, setSelected] = useState("");
    const [supplierSearch, setSupplierSearch] = useState("");
    const [supplierOpen, setSupplierOpen] = useState(false);
    const [supplierActive, setSupplierActive] = useState(-1);
    const matchingSuppliers = suppliers.filter((s) => s.name.toLowerCase().includes(supplierSearch.trim().toLowerCase()));
    const supplierOptions = [{ id: "", name: "\uC0C8 \uACF5\uAE09\uCC98" }, ...matchingSuppliers];
    const [supplierForm, setSupplierForm] = useState(blankSupplier);
    const [supplierBusy, setSupplierBusy] = useState(false);
    const [issueDate, setIssueDate] = useState(() => (/* @__PURE__ */ new Date()).toLocaleDateString("sv-SE"));
    const [deliveryDate, setDeliveryDate] = useState("");
    const [deliveryAddress, setDeliveryAddress] = useState(reorder?.deliveryAddress || "");
    const [request, setRequest] = useState(reorder?.request || "");
    const [groups, setGroups] = useState([]);
    const draftRecords = useRef(null);
    useEffect(() => () => window.LotfolioFrame.cancel(), []);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
      const close = (e) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", close);
      return () => document.removeEventListener("keydown", close);
    }, [onClose]);
    const field = (label, value, onChange, props = {}) => /* @__PURE__ */ React.createElement("label", { style: { display: "grid", gap: 4, fontSize: 12, fontWeight: 600 } }, label, /* @__PURE__ */ React.createElement("input", { style: inp, value, onChange: (e) => onChange(e.target.value), ...props }));
    const pickSupplier = (id) => {
      setSelected(id);
      setSupplierForm(suppliers.find((s) => s.id === id) || blankSupplier());
      setSupplierOpen(false);
      setSupplierSearch("");
    };
    const invalidate = () => {
      setGroups([]);
      draftRecords.current = null;
      setError("");
    };
    const setRow = (index, key, value) => {
      setRows((old) => old.map((row, i) => i === index ? { ...row, [key]: value } : row));
      invalidate();
    };
    const lotField = (row, index) => {
      const freeze = CalculatorPlan.freezeForLot(freezes, row.lot);
      const warningId = "po-frozen-lot-" + index;
      return React.createElement("div", null, React.createElement("div", {className: "lotfolio-lot-field"},
      React.createElement("input", {
        "aria-label": row.code + " 시리얼/로트", maxLength: 300,
        "aria-describedby": freeze ? warningId : undefined,
        style: {...inp, minWidth: 130}, value: row.lot,
        onChange: (event) => setRow(index, "lot", event.target.value)
      }),
      window.LotfolioFrame.embedded && React.createElement("button", {
        type: "button", className: "lotfolio-generate-button", "aria-label": row.code + " 로트 생성",
        onClick: () => window.LotfolioFrame.generate(row, (lot) => setRow(index, "lot", lot))
      }, "로트 생성")
      ), freeze && React.createElement("p", {id: warningId, className: "lotfolio-freeze-warning", role: "status"},
        "🔒 동결된 디자인 · ", CalculatorPlan.freezeDescription(freeze))
      );
    };
    const saveSupplier = async () => {
      const name = supplierForm.name.trim();
      if (!name) {
        setError("\uACF5\uAE09\uCC98 \uC774\uB984\uC744 \uC785\uB825\uD558\uC138\uC694.");
        return;
      }
      const id = selected || window.LotfolioEngine.randomId();
      const entry = { id, ...supplierForm, name };
      const next = selected ? suppliers.map((s) => s.id === selected ? entry : s) : [...suppliers, entry];
      setSupplierBusy(true);
      try {
        if (await onSaveSuppliers(next)) {
          setSelected(id);
          setSupplierForm(entry);
          invalidate();
        } else setError("\uACF5\uAE09\uCC98\uB97C \uC800\uC7A5\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uCD5C\uC2E0 \uBAA9\uB85D\uC744 \uD655\uC778\uD558\uACE0 \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694.");
      } finally {
        setSupplierBusy(false);
      }
    };
    const create = async () => {
      if (creating || groups.length) return;
      setCreating(true);
      setGroups([]);
      setError("");
      try {
        const orders = window.PurchaseOrder.group(rows, suppliers);
        if (!draftRecords.current) draftRecords.current = window.PurchaseOrder.records(orders, { issueDate, deliveryDate, deliveryAddress, request }, reorder?.id || "");
        if (!await onCreateOrders(draftRecords.current)) throw new Error("\uBC1C\uC8FC \uB0B4\uC5ED\uC744 \uC800\uC7A5\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uBC1C\uC8FC \uB0B4\uC5ED\uC744 \uD655\uC778\uD55C \uB4A4 \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694.");
        setGroups(draftRecords.current);
      } catch (e) {
        setError(e.message);
      } finally {
        setCreating(false);
      }
    };
    return /* @__PURE__ */ React.createElement("div", { role: "dialog", "aria-modal": "true", "aria-label": supplierOnly ? "\uAC70\uB798\uCC98 \uCD94\uAC00\xB7\uC218\uC815" : reorder ? "\uBD80\uC790\uC7AC \uC7AC\uBC1C\uC8FC" : "\uBD80\uC790\uC7AC \uBC1C\uC8FC\uC11C \uB9CC\uB4E4\uAE30", style: { position: "fixed", inset: 0, zIndex: 2e3, background: "#20273A99", padding: 16, overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: supplierOnly ? 760 : 1150, margin: "20px auto", background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 20px 60px #0003" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { style: { margin: "0 0 4px", fontSize: 22 } }, supplierOnly ? "\uAC70\uB798\uCC98 \uCD94\uAC00\xB7\uC218\uC815" : reorder ? "\uBD80\uC790\uC7AC \uC7AC\uBC1C\uC8FC" : "\uBD80\uC790\uC7AC \uBC1C\uC8FC\uC11C \uB9CC\uB4E4\uAE30"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#59657A" } }, supplierOnly ? "\uC800\uC7A5\uD55C \uAC70\uB798\uCC98 \uC815\uBCF4\uB294 \uC2B9\uC778\uB41C \uACC4\uC815 \uC0AC\uC6A9\uC790\uC640 \uACF5\uC720\uB429\uB2C8\uB2E4." : reorder ? `\uC6D0\uBCF8: ${reorder.number} \xB7 \uC218\uB7C9\uACFC \uB0A9\uAE30\uC77C\uC744 \uD655\uC778\uD55C \uB4A4 \uC0C8 \uBC1C\uC8FC\uC11C\uB97C \uC0DD\uC131\uD558\uC138\uC694.` : "\uBD80\uC871 \uD488\uBAA9\uC744 \uD655\uC778\uD558\uACE0 \uACF5\uAE09\uCC98\uC640 \uBC1C\uC8FC \uC218\uB7C9\uC744 \uC785\uB825\uD558\uC138\uC694. \uC218\uB7C9\uC774 \uBE48 \uD488\uBAA9\uC740 \uC81C\uC678\uB429\uB2C8\uB2E4.")), /* @__PURE__ */ React.createElement(Btn, { kind: "plain", onClick: onClose }, "\uB2EB\uAE30")), /* @__PURE__ */ React.createElement("fieldset", { disabled: creating, style: { border: 0, padding: 0, margin: 0, minWidth: 0 } }, /* @__PURE__ */ React.createElement("section", { style: { background: "#F6F8F7", padding: 16, borderRadius: 10, marginBottom: 18 } }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 16, margin: "0 0 12px" } }, "\uAC70\uB798\uCC98 \uC815\uBCF4 \uC800\uC7A5 \xB7 \uACC4\uC815 \uC0AC\uC6A9\uC790\uC640 \uACF5\uC720"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement("label", { style: { display: "grid", gap: 4, fontSize: 12, fontWeight: 600 } }, "\uC800\uC7A5\uB41C \uACF5\uAE09\uCC98", /* @__PURE__ */ React.createElement(
      "input",
      {
        style: { ...inp, boxSizing: "border-box" },
        role: "combobox",
        "aria-autocomplete": "list",
        "aria-expanded": supplierOpen,
        "aria-controls": "saved-supplier-options",
        "aria-activedescendant": supplierOpen && supplierActive >= 0 ? `saved-supplier-option-${supplierActive}` : void 0,
        placeholder: "\uACF5\uAE09\uCC98 \uC774\uB984 \uAC80\uC0C9\u2026",
        autoComplete: "off",
        value: supplierOpen ? supplierSearch : suppliers.find((s) => s.id === selected)?.name || "\uC0C8 \uACF5\uAE09\uCC98",
        onFocus: () => {
          setSupplierSearch("");
          setSupplierActive(-1);
          setSupplierOpen(true);
        },
        onBlur: () => setSupplierOpen(false),
        onClick: () => {
          if (!supplierOpen) {
            setSupplierSearch("");
            setSupplierActive(-1);
            setSupplierOpen(true);
          }
        },
        onChange: (e) => {
          setSupplierSearch(e.target.value);
          setSupplierActive(-1);
          setSupplierOpen(true);
        },
        onKeyDown: (e) => {
          if (e.key === "Escape" && supplierOpen) {
            e.preventDefault();
            e.stopPropagation();
            setSupplierOpen(false);
          }
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setSupplierOpen(true);
            setSupplierActive((i) => e.key === "ArrowDown" ? Math.min(i + 1, supplierOptions.length - 1) : Math.max(i - 1, 0));
          }
          if (e.key === "Enter" && supplierOpen) {
            e.preventDefault();
            const option = supplierOptions[supplierActive] || (supplierSearch.trim() ? matchingSuppliers[0] : supplierOptions[0]);
            if (option) pickSupplier(option.id);
          }
        }
      }
    )), supplierOpen && /* @__PURE__ */ React.createElement("div", { id: "saved-supplier-options", role: "listbox", "aria-label": "\uACF5\uAE09\uCC98 \uAC80\uC0C9 \uACB0\uACFC", style: { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, maxHeight: 240, overflowY: "auto", background: "#fff", border: "1px solid #E0E4EB", borderRadius: 8, boxShadow: "0 6px 18px #0002" } }, supplierOptions.map((s, i) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: s.id,
        id: `saved-supplier-option-${i}`,
        type: "button",
        role: "option",
        "aria-selected": s.id === selected,
        tabIndex: -1,
        onMouseDown: (e) => e.preventDefault(),
        onClick: () => pickSupplier(s.id),
        onMouseEnter: () => setSupplierActive(i),
        style: { display: "block", width: "100%", border: 0, padding: "9px 11px", textAlign: "left", fontFamily: "inherit", fontSize: 14, cursor: "pointer", background: i === supplierActive ? "#EDEEFF" : "#fff", color: "#20273A" }
      },
      s.name
    )), !matchingSuppliers.length && /* @__PURE__ */ React.createElement("div", { role: "status", style: { padding: "9px 11px", fontSize: 12, color: "#59657A" } }, "\uC77C\uCE58\uD558\uB294 \uACF5\uAE09\uCC98\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."))), ["name", "email", "tel", "fax", "deliveryAddress"].map((key, i) => field(["\uACF5\uAE09\uCC98\uBA85 *", "\uC774\uBA54\uC77C", "\uC804\uD654\uBC88\uD638", "\uD329\uC2A4", "\uAE30\uBCF8 \uB0A9\uD488\uCC98 \uC8FC\uC18C"][i], supplierForm[key], (value) => setSupplierForm((old) => ({ ...old, [key]: value })), { key, maxLength: key === "deliveryAddress" ? 500 : ["tel", "fax"].includes(key) ? 80 : 200 }))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement(Btn, { onClick: saveSupplier, disabled: supplierBusy }, supplierBusy ? "\uC800\uC7A5 \uC911\u2026" : selected ? "\uACF5\uAE09\uCC98 \uC218\uC815 \uC800\uC7A5" : "\uACF5\uAE09\uCC98 \uC800\uC7A5"))), !supplierOnly && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", minWidth: 850, fontSize: 13 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#F1F2FB" } }, ["\uD488\uBAA9\uCF54\uB4DC", reorder ? "\uD488\uBAA9" : "\uBD80\uC871 \uD488\uBAA9", reorder ? "\uD604\uC7AC \uBD80\uC871 \uC218\uB7C9" : "\uBD80\uC871 \uC218\uB7C9", "\uACF5\uAE09\uCC98", "\uBC1C\uC8FC \uC218\uB7C9 *", "\uC138\uBD80\uC0AC\uD56D", "\uC2DC\uB9AC\uC5BC/\uB85C\uD2B8No."].map((t) => /* @__PURE__ */ React.createElement("th", { key: t, style: { textAlign: "left", padding: 8 } }, t)))), /* @__PURE__ */ React.createElement("tbody", null, rows.map((row, index) => /* @__PURE__ */ React.createElement("tr", { key: row.code, style: { borderBottom: "1px solid #E0E4EB" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: 8, whiteSpace: "nowrap" } }, row.code), /* @__PURE__ */ React.createElement("td", { style: { padding: 8, minWidth: 190 } }, row.name), /* @__PURE__ */ React.createElement("td", { style: { padding: 8, textAlign: "right" } }, fmt(row.short)), /* @__PURE__ */ React.createElement("td", { style: { padding: 5 } }, /* @__PURE__ */ React.createElement("select", { "aria-label": `${row.code} \uACF5\uAE09\uCC98`, style: { ...inp, minWidth: 140 }, value: row.supplierId, onChange: (e) => setRow(index, "supplierId", e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "\uC120\uD0DD"), suppliers.map((s) => /* @__PURE__ */ React.createElement("option", { key: s.id, value: s.id }, s.name)))), /* @__PURE__ */ React.createElement("td", { style: { padding: 5 } }, /* @__PURE__ */ React.createElement("input", { "aria-label": `${row.code} \uBC1C\uC8FC \uC218\uB7C9`, type: "number", min: "1", step: "1", inputMode: "numeric", style: { ...inp, minWidth: 100 }, value: row.qty, onChange: (e) => setRow(index, "qty", e.target.value) })), /* @__PURE__ */ React.createElement("td", { style: { padding: 5 } }, /* @__PURE__ */ React.createElement("input", { "aria-label": `${row.code} \uC138\uBD80\uC0AC\uD56D`, maxLength: 500, style: { ...inp, minWidth: 130 }, value: row.detail, onChange: (e) => setRow(index, "detail", e.target.value) })), /* @__PURE__ */ React.createElement("td", { style: { padding: 5 } }, lotField(row, index))))))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, margin: "18px 0" } }, field("\uBC1C\uC8FC\uC77C", issueDate, (value) => {
      setIssueDate(value);
      invalidate();
    }, { type: "date" }), field("\uB0A9\uAE30\uC77C", deliveryDate, (value) => {
      setDeliveryDate(value);
      invalidate();
    }, { type: "date" }), field("\uB0A9\uD488\uCC98 \uC8FC\uC18C (\uACF5\uAE09\uCC98 \uAE30\uBCF8\uAC12\uBCF4\uB2E4 \uC6B0\uC120)", deliveryAddress, (value) => {
      setDeliveryAddress(value);
      invalidate();
    }, { maxLength: 500 }), field("\uB0A9\uD488 \uC694\uCCAD\uC0AC\uD56D", request, (value) => {
      setRequest(value);
      invalidate();
    }, { maxLength: 2e3 }))), error && /* @__PURE__ */ React.createElement("div", { role: "alert", style: { color: "#C8372D", marginBottom: 10 } }, error), !supplierOnly && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#59657A", marginBottom: 8 } }, "\uBC1C\uC8FC\uC11C \uC0DD\uC131 \uC2DC \uBC1C\uC8FC \uB0B4\uC5ED\uACFC \uD488\uBAA9\uBCC4 \uACF5\uAE09\uCC98\uB97C \uD568\uAED8 \uC800\uC7A5\uD569\uB2C8\uB2E4."), /* @__PURE__ */ React.createElement(Btn, { onClick: create, disabled: creating || supplierBusy || groups.length > 0 }, creating ? "\uBC1C\uC8FC \uB0B4\uC5ED \uC800\uC7A5 \uC911\u2026" : groups.length ? "\uBC1C\uC8FC \uB0B4\uC5ED \uC800\uC7A5 \uC644\uB8CC" : "\uACF5\uAE09\uCC98\uBCC4 \uBC1C\uC8FC\uC11C \uB9CC\uB4E4\uAE30"), groups.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 } }, groups.map((record) => /* @__PURE__ */ React.createElement(Btn, { key: record.id, kind: "ghost", onClick: () => previewPurchaseOrder(record, setError) }, record.order.supplier.name, " \xB7 ", record.order.lines.length, "\uD488\uBAA9 \xB7 PDF \uC800\uC7A5/\uC778\uC1C4")))))));
  }
  function PurchaseOrderHistory({ records, loading, error, onClose, onReorder }) {
    const [query, setQuery] = useState("");
    const [previewError, setPreviewError] = useState("");
    const filtered = records.filter((record) => [record.number, record.issueDate, record.deliveryDate, record.order.supplier.name, ...record.order.lines.map((l) => `${l.code} ${l.name}`)].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
    useEffect(() => {
      const close = (e) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", close);
      return () => document.removeEventListener("keydown", close);
    }, [onClose]);
    return /* @__PURE__ */ React.createElement("div", { role: "dialog", "aria-modal": "true", "aria-label": "\uBC1C\uC8FC \uB0B4\uC5ED \xB7 \uC7AC\uBC1C\uC8FC", style: { position: "fixed", inset: 0, zIndex: 2e3, background: "#20273A99", padding: 16, overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1150, margin: "20px auto", background: "#fff", borderRadius: 16, padding: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { style: { margin: "0 0 6px", fontSize: 22 } }, "\uBC1C\uC8FC \uB0B4\uC5ED \xB7 \uC7AC\uBC1C\uC8FC"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#59657A" } }, "\uC2B9\uC778\uB41C \uACC4\uC815 \uC0AC\uC6A9\uC790\uC640 \uACF5\uC720\uB429\uB2C8\uB2E4. \uC7AC\uBC1C\uC8FC\uB294 \uC6D0\uBCF8\uC744 \uC720\uC9C0\uD558\uACE0 \uC0C8 \uB0B4\uC5ED\uC73C\uB85C \uC800\uC7A5\uB429\uB2C8\uB2E4.")), /* @__PURE__ */ React.createElement(Btn, { kind: "plain", onClick: onClose }, "\uB2EB\uAE30")), /* @__PURE__ */ React.createElement("label", { style: { display: "grid", gap: 6, fontSize: 13, fontWeight: 600 } }, "\uBC1C\uC8FC \uB0B4\uC5ED \uAC80\uC0C9", /* @__PURE__ */ React.createElement("input", { type: "search", style: { ...inp, boxSizing: "border-box" }, placeholder: "\uB0A0\uC9DC \xB7 \uAC70\uB798\uCC98 \xB7 \uD488\uBAA9\uBA85 \xB7 \uD488\uBAA9\uCF54\uB4DC \xB7 \uBC1C\uC8FC\uBC88\uD638", value: query, onChange: (e) => setQuery(e.target.value) })), (error || previewError) && /* @__PURE__ */ React.createElement("div", { role: "alert", style: { color: "#C8372D", marginTop: 12 } }, error || previewError), loading ? /* @__PURE__ */ React.createElement("div", { role: "status", style: { padding: 20 } }, "\uBC1C\uC8FC \uB0B4\uC5ED\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\u2026") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { role: "status", style: { margin: "12px 0", fontSize: 13, color: "#59657A" } }, filtered.length, "\uAC74 / \uC804\uCCB4 ", records.length, "\uAC74"), !filtered.length ? /* @__PURE__ */ React.createElement("div", { style: { padding: 24, textAlign: "center", color: "#59657A" } }, records.length ? "\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." : "\uC800\uC7A5\uB41C \uBC1C\uC8FC \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uBC1C\uC8FC\uC11C\uB97C \uC0DD\uC131\uD558\uBA74 \uC5EC\uAE30\uC5D0 \uC800\uC7A5\uB429\uB2C8\uB2E4.") : /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", minWidth: 760, fontSize: 13 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#F1F2FB" } }, ["\uBC1C\uC8FC\uC77C / \uBC88\uD638", "\uAC70\uB798\uCC98", "\uD488\uBAA9", "\uCD1D \uC218\uB7C9", "\uB0A9\uAE30\uC77C", "\uBC1C\uC8FC\uC11C / \uC7AC\uBC1C\uC8FC"].map((label) => /* @__PURE__ */ React.createElement("th", { key: label, style: { padding: 10, textAlign: "left" } }, label)))), /* @__PURE__ */ React.createElement("tbody", null, filtered.map((record) => /* @__PURE__ */ React.createElement("tr", { key: record.id, style: { borderBottom: "1px solid #E0E4EB" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: 10 } }, record.issueDate, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#59657A", marginTop: 4 } }, record.number, record.sourceId ? " \xB7 \uC7AC\uBC1C\uC8FC" : "")), /* @__PURE__ */ React.createElement("td", { style: { padding: 10, fontWeight: 600 } }, record.order.supplier.name), /* @__PURE__ */ React.createElement("td", { style: { padding: 10, maxWidth: 280 } }, record.order.lines.slice(0, 2).map((l) => /* @__PURE__ */ React.createElement("div", { key: l.code }, l.code, " \xB7 ", l.name)), record.order.lines.length > 2 && /* @__PURE__ */ React.createElement("div", null, "\uC678 ", record.order.lines.length - 2, "\uD488\uBAA9")), /* @__PURE__ */ React.createElement("td", { style: { padding: 10 } }, fmt(record.order.total)), /* @__PURE__ */ React.createElement("td", { style: { padding: 10 } }, record.deliveryDate || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { padding: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, whiteSpace: "nowrap" } }, /* @__PURE__ */ React.createElement(Btn, { small: true, kind: "ghost", onClick: () => previewPurchaseOrder(record, setPreviewError) }, "PDF / \uC778\uC1C4"), /* @__PURE__ */ React.createElement(Btn, { small: true, onClick: () => onReorder(record) }, "\uC7AC\uBC1C\uC8FC")))))))))));
  }
  function App() {
    const [tab, setTab] = useState("plan");
    const emptyStock = () => Object.fromEntries(["p3l", "ecount", "carton"].map((k) => [k, { fileName: "(\uB370\uC774\uD130 \uC5C6\uC74C)", date: "", lots: [] }]));
    const [boms, setBoms] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [itemSuppliers, setItemSuppliers] = useState([]);
    const [poMode, setPoMode] = useState(null);
    const [reorder, setReorder] = useState(null);
    const [poHistory, setPoHistory] = useState([]);
    const [poHistoryLoading, setPoHistoryLoading] = useState(false);
    const [poHistoryError, setPoHistoryError] = useState("");
    const [storedStock, setStock] = useState(emptyStock);
    const [ecountSync, setEcountSync] = useState(null);
    const [syncClock, setSyncClock] = useState(Date.now);
    const ecountManaged = ecountSync?.document?.mode === "ecount-authoritative" && !!ecountSync.document.current;
    const stock = useMemo(() => {
      if (!ecountManaged) return storedStock;
      const current = ecountSync.document.current;
      return { ...storedStock, ecount: { fileName: "ECOUNT " + current.snapshotId, date: current.sourceAsOf, lots: current.records.map((r) => ({ c: r.itemCode, n: r.itemName, w: r.warehouse, l: r.lot, e: r.expiry || "", q: r.quantity })) } };
    }, [storedStock, ecountSync, ecountManaged]);
    const [savedBasis, setBasis] = useState("ecount");
    const basis = ecountManaged ? "ecount" : savedBasis;
    const syncStatus = ecountStatus(ecountSync, syncClock);
    const [dedup, setDedup] = useState(true);
    const [prevStock, setPrevStock] = useState({ p3l: null, ecount: null, carton: null });
    const [authUser, setAuthUser] = useState(null);
    const [authTier, setAuthTier] = useState(0);
    const [freezeState, setFreezeState] = useState(null);
    const [includeFrozen, setIncludeFrozen] = useState(false);
    const freezes = freezeState?.uid === authUser?.uid ? freezeState?.freezes ?? null : null;
    useEffect(() => {
      const uid = authUser?.uid;
      if (!uid || authTier < 1) return;
      const update = (freezes) => {
        setFreezeState({uid, freezes});
        if (freezes === null) setIncludeFrozen(false);
      };
      const bridge = window.LotfolioFrame;
      const subscribeDesigns = () => firebase.firestore(getFirebaseApp()).collection("lotDesigns").onSnapshot(
        {includeMetadataChanges: true},
        (snapshot) => {
          if (snapshot.metadata.fromCache) return;
          update(CalculatorPlan.freezeMap(snapshot.docs.map((doc) => ({key: doc.id, freeze: doc.data().freeze}))));
        },
        () => update(null)
      );
      if (!bridge.embedded) return subscribeDesigns();
      // An already open workspace may still be running the shell from a prior release.
      let stopFallback;
      const timer = setTimeout(() => { stopFallback = subscribeDesigns(); }, 1500);
      const stopBridge = bridge.subscribeFreezes(uid, (snapshot) => {
        clearTimeout(timer);
        stopFallback?.();
        stopFallback = undefined;
        update(snapshot);
      });
      return () => {
        clearTimeout(timer);
        stopFallback?.();
        stopBridge();
      };
    }, [authUser?.uid, authTier]);
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
    useEffect(() => {
      if (!editing && !order.length && !saving) return;
      const beforeUnload = (event) => {
        event.preventDefault();
        event.returnValue = "";
      };
      window.addEventListener("beforeunload", beforeUnload);
      return () => window.removeEventListener("beforeunload", beforeUnload);
    }, [editing, order.length, saving]);
    const showToast = (msg, color = "#4D56CB") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, msg, color }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
    };
    const dbRef = useRef(null);
    const retryRef = useRef(null);
    useEffect(() => {
      const app = getFirebaseApp(), db = firebase.firestore(app);
      dbRef.current = db;
      let stops = [], epoch = 0, lastKey = "";
      const clear = (discardDraft = true) => {
        stops.forEach((stop) => stop());
        stops = [];
        revisions.current = {};
        setBoms([]);
        setSuppliers([]);
        setItemSuppliers([]);
        setPoMode(null);
        setReorder(null);
        setPoHistory([]);
        setPoHistoryError("");
        setStock(emptyStock());
        setPrevStock({ p3l: null, ecount: null, carton: null });
        setEcountSync(null);
        if (discardDraft) {
          setOrder([]);
          setEditing(null);
          setManualAlloc({});
          setExcluded(/* @__PURE__ */ new Set());
          setFreezeState(null);
          setIncludeFrozen(false);
          setPartMode({});
          setWoReview(null);
          setImportedScenarios(/* @__PURE__ */ new Set());
        }
        setDataReady(false);
        setExpanded({});
        setExpandedStk({});
      };
      const subscribe = (identity) => {
        const current = ++epoch;
        clear(false);
        const paths = ["boms/list", "stock/p3l", "stock/ecount", "stock/ecountCurrent", "stock/carton", "stockPrev/p3l", "stockPrev/ecount", "stockPrev/carton", "settings/app", "settings/itemSuppliers", "suppliers/list"];
        const loaded = /* @__PURE__ */ new Set();
        paths.forEach((path) => stops.push(db.doc(path).onSnapshot({ includeMetadataChanges: true }, (snap) => {
          if (current !== epoch) return;
          const d = snap.exists ? snap.data() : null;
          revisions.current[path] = d ? d._revision || 0 : 0;
          const [collection, id] = path.split("/");
          if (collection === "boms") setBoms(d && Array.isArray(d.boms) ? d.boms : []);
          if (collection === "suppliers") setSuppliers(d && Array.isArray(d.suppliers) ? d.suppliers : []);
          if (path === "stock/ecountCurrent") setEcountSync((previous) => reduceEcountState(previous, { type: "snapshot", document: d, fromCache: snap.metadata.fromCache, hasPendingWrites: snap.metadata.hasPendingWrites, receivedAt: Date.now() }));
          if (collection === "stock" && id !== "ecountCurrent") setStock((old) => ({ ...old, [id]: d && Array.isArray(d.lots) ? d : emptyStock()[id] }));
          if (collection === "stockPrev") setPrevStock((old) => ({ ...old, [id]: d && Array.isArray(d.lots) ? d : null }));
          if (collection === "settings" && id === "app" && d) {
            setBasis(d.basis || "ecount");
            setDedup(d.dedup !== false);
          }
          if (collection === "settings" && id === "itemSuppliers") setItemSuppliers(d?.bindings || []);
          loaded.add(path);
          if (loaded.size === paths.length) setDataReady(true);
        }, (error) => {
          if (current !== epoch) return;
          const denied = ["permission-denied", "unauthenticated"].includes(error?.code);
          if (path === "stock/ecountCurrent" && !denied) {
            setEcountSync((previous) => reduceEcountState(previous, { type: "error", code: error.code }));
            loaded.add(path);
            if (loaded.size === paths.length) setDataReady(true);
            return;
          }
          ++epoch;
          clear(denied);
          if (denied) retryRef.current = null;
          setAccessError(denied ? "\uC811\uADFC \uAD8C\uD55C\uC774 \uBCC0\uACBD\uB410\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694." : "\uB370\uC774\uD130 \uC870\uD68C\uAC00 \uC911\uB2E8\uB410\uC2B5\uB2C8\uB2E4. \uC791\uC131 \uC911 \uACC4\uC0B0\uC740 \uBCF4\uC874\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uBD88\uB7EC\uC624\uAE30\uB97C \uB20C\uB7EC \uC8FC\uC138\uC694.");
        })));
      };
      InventorySecurity.start(app, (identity) => {
        setAuthUser(identity.user ? { email: identity.user.email, uid: identity.user.uid } : null);
        setAuthTier(identity.tier);
        setAuthReady(identity.ready);
        setAccessError(identity.error ? "\uAD8C\uD55C\uC744 \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694." : "");
        if (identity.error && identity.preserveDraft) retryRef.current = () => InventorySecurity.retry();
        const key = identity.user ? identity.user.uid + ":" + identity.tier + ":" + Boolean(identity.preserveDraft) : "";
        if (key === lastKey) return;
        const sameAccount = identity.user && lastKey.startsWith(identity.user.uid + ":");
        lastKey = key;
        ++epoch;
        clear(!sameAccount || identity.tier < 1 && !identity.preserveDraft);
        retryRef.current = identity.error && identity.preserveDraft ? () => InventorySecurity.retry() : null;
        if (identity.tier < 1) return;
        retryRef.current = () => {
          if (firebase.auth(app).currentUser?.uid !== identity.user.uid) return;
          setAccessError("");
          subscribe(identity);
        };
        subscribe(identity);
      });
      return () => {
        ++epoch;
        stops.forEach((stop) => stop());
      };
    }, []);
    useEffect(() => {
      if (authTier < 1) return;
      const timer = setInterval(() => setSyncClock(Date.now()), 1e3);
      return () => clearInterval(timer);
    }, [authTier]);
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
    const canEditStock = authTier >= 1 && dataReady && !ecountManaged && !ecountSync?.error && !ecountSync?.fromCache && !ecountSync?.hasPendingWrites;
    const canEditBom = authTier === 2 && dataReady;
    useEffect(() => {
      editRevision.current = revisions.current["boms/list"] || 0;
    }, [editing]);
    useEffect(() => {
      if (authReady && authTier !== 2 && !accessError) setEditing(null);
    }, [authTier, authReady, accessError]);
    useEffect(() => {
      if (poMode !== "history" || !canEditStock) return;
      setPoHistoryLoading(true);
      setPoHistoryError("");
      return dbRef.current.collection("purchaseOrders").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        setPoHistory(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setPoHistoryLoading(false);
      }, () => {
        setPoHistoryLoading(false);
        setPoHistoryError("\uBC1C\uC8FC \uB0B4\uC5ED\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC5F4\uC5B4 \uC8FC\uC138\uC694.");
      });
    }, [poMode, canEditStock, authUser?.uid]);
    const commit = async (mutations) => {
      if (savingRef.current) {
        showToast("\uC800\uC7A5 \uC911\uC785\uB2C8\uB2E4. \uC7A0\uC2DC \uAE30\uB2E4\uB824 \uC8FC\uC138\uC694.", "#9A6B00");
        return false;
      }
      savingRef.current = true;
      setSaving(true);
      try {
        await InventorySecurity.save(mutations);
        await Promise.all(mutations.filter((m) => !m.path.startsWith("purchaseOrders/")).map(async (m) => {
          const snap = await dbRef.current.doc(m.path).get({ source: "server" });
          revisions.current[m.path] = snap.data()?._revision || 0;
          const d = snap.data(), [collection, id] = m.path.split("/");
          if (collection === "stock") setStock((old) => ({ ...old, [id]: d }));
          if (collection === "boms") setBoms(d.boms);
          if (collection === "suppliers") setSuppliers(d.suppliers);
          if (collection === "settings" && id === "itemSuppliers") setItemSuppliers(d.bindings);
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
    const persistSuppliers = (next) => commit([{ path: "suppliers/list", expectedRevision: revisions.current["suppliers/list"] || 0, data: { suppliers: next } }]);
    const persistPurchaseOrders = (records) => {
      const remembered = new Map(itemSuppliers.map((b) => [b.code, b.supplierId]));
      let changed = false;
      for (const { order: order2 } of records) for (const line of order2.lines) {
        if (remembered.get(line.code) !== order2.supplier.id) changed = true;
        remembered.set(line.code, order2.supplier.id);
      }
      const mutations = records.map(({ id, ...data }) => ({ path: "purchaseOrders/" + id, expectedRevision: 0, data }));
      if (changed) mutations.push({ path: "settings/itemSuppliers", expectedRevision: revisions.current["settings/itemSuppliers"] || 0, data: { bindings: [...remembered].map(([code, supplierId]) => ({ code, supplierId })) } });
      return commit(mutations);
    };
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
        CalculationState.identifyLots(lots, src).forEach((l) => {
          if (!m[l.c]) m[l.c] = { name: l.n, total: 0, lots: [] };
          m[l.c].total += l.q;
          m[l.c].lots.push(l);
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
    const frozenById = useMemo(() => CalculatorPlan.frozenLotsById(agg, freezes), [agg, freezes]);
    const planExcluded = useMemo(() => CalculatorPlan.planExclusions(excluded, frozenById, includeFrozen),
      [excluded, frozenById, includeFrozen]);
    useEffect(() => {
      if (!dataReady) return;
      const currentLots = Object.values(agg).flatMap((source) => Object.values(source).flatMap((it) => it.lots));
      const pruned = CalculationState.pruneSelections(manualAlloc, excluded, currentLots);
      if (pruned.dropped) {
        setManualAlloc(pruned.manualAlloc);
        setExcluded(new Set(pruned.excluded));
        showToast(`\uC7AC\uACE0 \uBCC0\uACBD\uC73C\uB85C \uC5F0\uACB0\uD560 \uC218 \uC5C6\uB294 \uB85C\uD2B8 \uC124\uC815 ${pruned.dropped}\uAC74\uC744 \uD574\uC81C\uD588\uC2B5\uB2C8\uB2E4. \uBC30\uBD84\uC744 \uD655\uC778\uD558\uC138\uC694.`, "#9A6B00");
      }
    }, [agg, dataReady]);
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
      const used = CalculatorPlan.availableQuantity(lots, planExcluded);
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
    const calc = useMemo(() => freezes === null ? null : simulatePlan({
      order, boms, getStock, excluded: planExcluded, manualAlloc, partMode, kernelByCode
    }), [freezes, order, boms, agg, basis, planExcluded, manualAlloc, dedup, partMode, kernelByCode]);
    const frozenCount = useMemo(() => new Set(calc?.rows.flatMap((row) =>
      row.lots.filter((lot) => frozenById.has(lot.id)).map((lot) => lot.id)) ?? []).size, [calc, frozenById]);
    const stockResults = useMemo(() => {
      const t = stockQ.trim().toLowerCase();
      if (!t) return [];
      const out = [];
      for (const i of items) {
        const codeMatch = i.code.toLowerCase().includes(t);
        const nameMatch = i.name.toLowerCase().includes(t);
        let matchedLotNos = [];
        if (!codeMatch && !nameMatch) {
          const allLots = [...agg.p3l[i.code]?.lots || [], ...agg.ecount[i.code]?.lots || [], ...agg.carton[i.code]?.lots || []];
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
        const XLSX = window.XLSX || await LotfolioSheets.loadSpreadsheet();
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
          lotIdentityVersion: 2,
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
        const downloads = { save: downloadFile };
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
          const wb = await readCalculatorWorkbook(ev.target.result);
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
          const wb = await readCalculatorWorkbook(ev.target.result);
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
          const currentLots = Object.values(agg).flatMap((source) => Object.values(source).flatMap((it) => it.lots));
          const restored = CalculationState.restoreScenario(s, currentLots);
          if ((restored.manualDropped || restored.excludedDropped) && !confirm("\uD604\uC7AC \uB85C\uD2B8\uB97C \uC2DD\uBCC4\uD560 \uC218 \uC5C6\uC5B4 \uC77C\uBD80 \uC218\uB3D9 \uBC30\uBD84\xB7\uC81C\uC678 \uC124\uC815\uC740 \uBCF5\uC6D0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBC1C\uC8FC \uBAA9\uB85D\uC744 \uACC4\uC18D \uCD94\uAC00\uD560\uAE4C\uC694?")) return;
          if (order.length && restored.excluded.some((id) => !excluded.has(id)) && !confirm("\uAC00\uC838\uC628 \uB85C\uD2B8 \uC81C\uC678 \uC124\uC815\uC774 \uD604\uC7AC \uACC4\uC0B0 \uC804\uCCB4\uC5D0 \uBCD1\uD569\uB429\uB2C8\uB2E4. \uAE30\uC874 \uBC1C\uC8FC \uACC4\uC0B0\uB3C4 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uACC4\uC18D\uD560\uAE4C\uC694?")) return;
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
          const { manualKept, manualDropped, excludedDropped } = restored;
          setExcluded((prev) => /* @__PURE__ */ new Set([...prev, ...restored.excluded]));
          setManualAlloc((prev) => ({ ...prev, ...restored.manualAlloc }));
          const newLines = restored.lines;
          setOrder((prev) => [...prev, ...newLines]);
          setPartMode((prev) => ({ ...prev, ...restored.partMode }));
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
          if (manualDropped || excludedDropped) {
            parts.push(`\uB85C\uD2B8 \uBD88\uC77C\uCE58\uB85C ${manualDropped + excludedDropped}\uAC74 \uC81C\uC678`);
          }
          showToast(parts.join(" \xB7 "), stockMismatch || manualDropped ? "#9A6B00" : "#4D56CB");
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
    if (authTier < 1 || !dataReady || accessError) return /* @__PURE__ */ React.createElement("main", { style: { maxWidth: 560, margin: "80px auto", padding: 24 } }, /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 22, marginBottom: 16 } }, "\uBD80\uC790\uC7AC \uC7AC\uACE0 \uAD00\uB9AC"), /* @__PURE__ */ React.createElement("p", { role: "status", style: { marginBottom: 16 } }, accessError || (!authReady ? "\uAD8C\uD55C\uC744 \uD655\uC778\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4." : authTier >= 1 ? "\uC7AC\uACE0\uB97C \uBD88\uB7EC\uC624\uACE0 \uC788\uC2B5\uB2C8\uB2E4." : "\uC2B9\uC778\uB41C \uACC4\uC815\uC73C\uB85C \uB85C\uADF8\uC778\uD558\uBA74 \uC7AC\uACE0\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")), accessError && retryRef.current && /* @__PURE__ */ React.createElement(Btn, { onClick: () => retryRef.current() }, "\uB2E4\uC2DC \uBD88\uB7EC\uC624\uAE30"), /* @__PURE__ */ React.createElement(AuthBox, { user: authUser, tier: authTier, onLoginClick: () => setLoginOpen(true), onLogout: doLogout }), loginOpen && /* @__PURE__ */ React.createElement(LoginModal, { onClose: () => setLoginOpen(false), onLogin: doLogin, onSignup: doSignup, error: loginError, busy: loginBusy }));
    return /* @__PURE__ */ React.createElement("div", { className: "calculator-workspace", style: { minHeight: "100vh", position: "relative" } }, ecountManaged && /* @__PURE__ */ React.createElement("section", { "aria-label": "ECOUNT \uB3D9\uAE30\uD654 \uC0C1\uD0DC", style: { maxWidth: 1060, margin: "0 auto 20px", padding: 16, border: "1px solid #E0E4EB", borderRadius: 8 } }, /* @__PURE__ */ React.createElement("p", { role: "status" }, /* @__PURE__ */ React.createElement("strong", null, ecountPublicMessage(syncStatus))), /* @__PURE__ */ React.createElement("p", null, "\uC6D0\uCC9C \uAE30\uC900 \uC2DC\uAC01: ", syncStatus.sourceAsOf || "\uC544\uC9C1 \uC5C6\uC74C", " \xB7 \uB9C8\uC9C0\uB9C9 \uC815\uC0C1 \uBC18\uC601: ", syncStatus.lastSuccessAt || "\uC544\uC9C1 \uC5C6\uC74C"), /* @__PURE__ */ React.createElement("small", null, "\uC804\uD45C\uB294 ECOUNT\uC5D0\uC11C\uB9CC \uC785\uB825\uD569\uB2C8\uB2E4.")), toasts.length > 0 && /* @__PURE__ */ React.createElement("div", { style: {
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
    } }, t.msg))), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1060, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" } }, "\uBD80\uC790\uC7AC \uC18C\uC694\uB7C9 \xB7 \uD658\uC0B0\uC7AC\uACE0 \uACC4\uC0B0\uAE30"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#59657A", marginTop: 4 } }, "3PL: ", stock.p3l.fileName, " \xB7 \uC774\uCE74\uC6B4\uD2B8: ", stock.ecount.fileName, stock.carton && stock.carton.lots.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, " \xB7 \uCE74\uD1A4\uBC15\uC2A4: ", stock.carton.fileName))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", small: true, onClick: () => setPoMode("suppliers") }, "\uAC70\uB798\uCC98 \uCD94\uAC00\xB7\uC218\uC815"), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", small: true, onClick: () => setPoMode("history") }, "\uBC1C\uC8FC \uB0B4\uC5ED \xB7 \uC7AC\uBC1C\uC8FC"), /* @__PURE__ */ React.createElement(AuthBox, { user: authUser, tier: authTier, onLoginClick: () => setLoginOpen(true), onLogout: doLogout }), canEditBom && /* @__PURE__ */ React.createElement(ImportBtn, { onImport: handleImport }), canEditBom && /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", small: true, onClick: async () => {
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
      border: "1px solid #E0E4EB",
      borderRadius: 12,
      padding: "10px 14px",
      marginBottom: 16
    } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "#59657A" } }, "\uC18C\uC694\uB7C9 \uACC4\uC0B0 \uAE30\uC900 \uC7AC\uACE0"), [["ecount", "\uC774\uCE74\uC6B4\uD2B8 \uC804\uC0B0"], ["p3l", "3PL \uC804\uC0B0"], ["sum", "\uD569\uC0B0 (3PL+\uC774\uCE74\uC6B4\uD2B8+\uCE74\uD1A4\uBC15\uC2A4)"]].map(([k, label]) => /* @__PURE__ */ React.createElement("label", { key: k, style: {
      display: "flex",
      alignItems: "center",
      gap: 5,
      fontSize: 13,
      cursor: "pointer",
      fontWeight: basis === k ? 700 : 400,
      color: basis === k ? "#4D56CB" : "#20273A"
    } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "basis", disabled: ecountManaged && k !== "ecount", checked: basis === k, onChange: () => setBasisP(k) }), label)), basis !== "sum" && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11.5, color: "#69768A", marginLeft: "auto" } }, "\u203B 3PL \uCC3D\uACE0 \uC7AC\uACE0\uAC00 \uC774\uCE74\uC6B4\uD2B8\uC5D0\uB3C4 \uC7A1\uD600 \uC788\uB2E4\uBA74 \uD569\uC0B0 \uC2DC \uC911\uBCF5 \uACC4\uC0B0\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4")), basis === "sum" && /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
      background: dedup ? "#EDEEFF" : "#FBEAE8",
      border: `1px solid ${dedup ? "#4D56CB44" : "#C8372D66"}`,
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
      color: dedup ? "#4D56CB" : "#C8372D"
    } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        checked: dedup,
        onChange: (e) => setDedupP(e.target.checked),
        style: { width: 15, height: 15, accentColor: "#4D56CB", cursor: "pointer" }
      }
    ), "\uC774\uCE74\uC6B4\uD2B8\uC758 3PL \uCC3D\uACE0\uBD84 \uC81C\uC678 (\uC911\uBCF5 \uC81C\uAC70)"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: dedup ? "#59657A" : "#C8372D" } }, dedup ? `\uC774\uCE74\uC6B4\uD2B8 "\u20263PL\u2026" \uCC3D\uACE0 \uB85C\uD2B8 ${fmt(dedupInfo.lotCount)}\uAC74 \xB7 ${fmt(dedupInfo.qty)}\uAC1C\uB97C \uD569\uC0B0\uC5D0\uC11C \uC81C\uC678 \uC911 (3PL \uC804\uC0B0\uACFC \uC911\uBCF5\uC73C\uB85C \uD310\uB2E8)` : `\u26A0 \uC911\uBCF5 \uC81C\uAC70 \uAEBC\uC9D0 \u2014 3PL \uCC3D\uACE0 \uC7AC\uACE0 ${fmt(dedupInfo.qty)}\uAC1C\uAC00 \uB450 \uBC88 \uACC4\uC0B0\uB418\uACE0 \uC788\uC744 \uAC00\uB2A5\uC131\uC774 \uB192\uC2B5\uB2C8\uB2E4!`)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, borderBottom: "2px solid #E0E4EB", marginBottom: 20, overflowX: "auto" } }, tabs.map(([k, label]) => /* @__PURE__ */ React.createElement("button", { key: k, onClick: () => setTab(k), style: {
      border: "none",
      background: "transparent",
      padding: "10px 16px",
      fontSize: 14,
      whiteSpace: "nowrap",
      fontWeight: tab === k ? 700 : 500,
      color: tab === k ? "#4D56CB" : "#59657A",
      borderBottom: tab === k ? "2px solid #4D56CB" : "2px solid transparent",
      marginBottom: -2,
      cursor: "pointer",
      fontFamily: "inherit"
    } }, label))), tab === "plan" && /* @__PURE__ */ React.createElement("div", null, React.createElement(PlanFreezeStatus, {ready: freezes !== null, includeFrozen, count: frozenCount, onToggle: setIncludeFrozen}), boms.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px dashed #E0E4EB", borderRadius: 14, padding: 32, textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700 } }, "\uB4F1\uB85D\uB41C BOM\uC774 \uC544\uC9C1 \uC5C6\uC2B5\uB2C8\uB2E4"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#59657A", margin: "8px 0 16px" } }, "BOM \uAD00\uB9AC \uD0ED\uC5D0\uC11C \uB4F1\uB85D\uD558\uAC70\uB098, \uB2E4\uB978 \uCEF4\uD4E8\uD130\uC5D0\uC11C \uB0B4\uBCF4\uB0B8 \uBC1C\uC8FC \uACB0\uACFC \uC5D1\uC140\uC744 \uBD88\uB7EC\uC62C \uC218 \uC788\uC2B5\uB2C8\uB2E4.", /* @__PURE__ */ React.createElement("br", null), "(\uBC1C\uC8FC \uACB0\uACFC \uC5D1\uC140\uC5D0\uB294 \uC0AC\uC6A9\uB41C BOM\uC774 \uD3EC\uD568\uB418\uC5B4 \uC788\uC5B4 \uC790\uB3D9\uC73C\uB85C \uB4F1\uB85D\uB429\uB2C8\uB2E4)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(Btn, { onClick: () => {
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
    ), /* @__PURE__ */ React.createElement(Btn, { kind: "amber", onClick: () => scenarioFileRef.current.click() }, "\u{1F4C2} \uBC1C\uC8FC \uACB0\uACFC \uBD88\uB7EC\uC624\uAE30 (Excel)"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px solid #E0E4EB", borderRadius: 14, padding: 18, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#59657A" } }, "\uBC1C\uC8FC \uD488\uBAA9 \uCD94\uAC00"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
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
      background: "#FAFAFD",
      border: "1px solid #E0E4EB",
      borderRadius: 12,
      padding: 14
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700 } }, "\u{1F4CB} \uC791\uC5C5\uC9C0\uC2DC\uC11C \uAC80\uD1A0 \u2014 ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 400, color: "#59657A" } }, woReview.fileName)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#59657A" } }, "\uB9E4\uCE6D ", woReview.lines.filter((l) => l.bomId).length, " / ", woReview.lines.length, "\uAC74")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "#69768A", marginBottom: 10, lineHeight: 1.6 } }, "\uC790\uB3D9\uC73C\uB85C \uB9E4\uCE6D\uB41C \uD56D\uBAA9\uC740 \uCCB4\uD06C\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. BOM\uC774 \uC798\uBABB \uB9E4\uCE6D\uB410\uAC70\uB098 \uBE44\uC5B4\uC788\uC73C\uBA74 \uC9C1\uC811 \uC120\uD0DD\uD558\uACE0, \uD544\uC694 \uC5C6\uB294 \uD56D\uBAA9\uC740 \uCCB4\uD06C\uB97C \uD574\uC81C\uD558\uC138\uC694. (\uD0AC\uB85C\uADF8\uB7A8 \uB2E8\uC704 \uBC8C\uD06C \uC6D0\uB8CC\uB294 \uC790\uB3D9 \uB9E4\uCE6D \uB300\uC0C1\uC774 \uC544\uB2C8\uB77C \uAE30\uBCF8\uC801\uC73C\uB85C \uCCB4\uD06C \uD574\uC81C\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4)"), /* @__PURE__ */ React.createElement("div", { style: { maxHeight: 360, overflowY: "auto", border: "1px solid #EFF1F7", borderRadius: 8 } }, woReview.lines.map((l, idx) => /* @__PURE__ */ React.createElement("div", { key: l.id, style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      borderBottom: idx < woReview.lines.length - 1 ? "1px solid #F6F7FA" : "none",
      background: l.checked ? "#fff" : "#F7F8F8"
    } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        checked: l.checked,
        onChange: (e) => setWoReview((prev) => ({ ...prev, lines: prev.lines.map((x) => x.id === l.id ? { ...x, checked: e.target.checked } : x) }))
      }
    ), /* @__PURE__ */ React.createElement("div", { style: { flex: 2, minWidth: 160 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, title: l.rawName }, l.rawName), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: l.unit === "kg" ? "#9A6B00" : "#69768A" } }, fmt(l.qty), l.unit === "kg" ? "kg (\uBC8C\uD06C)" : "\uAC1C", l.bomId && l.score < 0.7 && /* @__PURE__ */ React.createElement("span", { style: { color: "#9A6B00" } }, " \xB7 \uB9E4\uCE6D \uD655\uC778 \uD544\uC694"))), /* @__PURE__ */ React.createElement("div", { style: { flex: 2, minWidth: 180 } }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: l.bomId,
        onChange: (e) => setWoReview((prev) => ({ ...prev, lines: prev.lines.map((x) => x.id === l.id ? { ...x, bomId: e.target.value } : x) })),
        style: {
          ...inp,
          padding: "6px 8px",
          fontSize: 12.5,
          width: "100%",
          borderColor: l.bomId ? "#E0E4EB" : "#E0967A"
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
        background: "#EDEEFF",
        border: "1px solid #4D56CB33",
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
          style: { width: 80, border: "1px solid #E0E4EB", borderRadius: 6, padding: "3px 6px", fontSize: 13, fontFamily: "inherit" }
        }
      ), /* @__PURE__ */ React.createElement("span", { style: { color: "#59657A" } }, "\uAC1C"), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setOrder(order.filter((x) => x.id !== o.id)),
          style: { border: "none", background: "transparent", color: "#59657A", cursor: "pointer", fontSize: 16, padding: "0 6px" }
        },
        "\xD7"
      ));
    }))), calc && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: {
      borderRadius: 14,
      padding: "14px 18px",
      fontSize: 14,
      fontWeight: 600,
      marginBottom: 10,
      background: calc.totalShort.length ? "#FBEAE8" : "#EDEEFF",
      color: calc.totalShort.length ? "#C8372D" : "#4D56CB",
      border: `1px solid ${calc.totalShort.length ? "#C8372D33" : "#4D56CB33"}`
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
      border: "1px solid #E0E4EB",
      borderRadius: 12,
      padding: "10px 14px",
      marginBottom: 16,
      fontSize: 11.5,
      color: "#59657A",
      lineHeight: 1.7
    } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", { style: { color: "#20273A" } }, "\uACC4\uC0B0 \uAE30\uC900:"), " ", basisLabel, basis === "sum" && (dedup ? " \xB7 \uC911\uBCF5 \uC81C\uAC70 ON" : " \xB7 \u26A0 \uC911\uBCF5 \uC81C\uAC70 OFF"), excluded.size > 0 && ` \xB7 \uB85C\uD2B8 ${excluded.size}\uAC1C \uC0AC\uC6A9 \uC81C\uC678`, /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: "#1D5C8A" } }, "3PL:"), " ", stock.p3l.fileName, " (", stock.p3l.date, ")", " \xB7 ", /* @__PURE__ */ React.createElement("span", { style: { color: "#4D56CB" } }, "\uC774\uCE74\uC6B4\uD2B8:"), " ", stock.ecount.fileName, " (", stock.ecount.date, ")", stock.carton && stock.carton.lots.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, " \xB7 ", /* @__PURE__ */ React.createElement("span", { style: { color: "#7B4D1E" } }, "\uCE74\uD1A4\uBC15\uC2A4:"), " ", stock.carton.fileName, " (", stock.carton.date, ")")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, calc.totalShort.length > 0 && /* @__PURE__ */ React.createElement(Btn, { small: true, onClick: () => {
      setReorder(null);
      setPoMode("order");
    } }, "\uBC1C\uC8FC\uC11C \uB9CC\uB4E4\uAE30"), /* @__PURE__ */ React.createElement(Btn, { kind: "ghost", small: true, onClick: () => exportResultExcel() }, "\u{1F4CA} \uACB0\uACFC \uB0B4\uBCF4\uB0B4\uAE30 (Excel)"))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12, marginBottom: 16 } }, calc.perProduct.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.id, style: { background: "#fff", border: "1px solid #E0E4EB", borderRadius: 14, padding: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, marginBottom: 4 } }, p.bom.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#59657A", marginBottom: 12 } }, "\uBC1C\uC8FC \uC218\uB7C9 ", fmt(p.qty), "\uAC1C"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 20 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#59657A", fontWeight: 600 } }, "\uB2E8\uB3C5 \uC0DD\uC0B0 \uC2DC \uD658\uC0B0\uC7AC\uACE0"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 800 } }, fmt(p.solo))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#59657A", fontWeight: 600 } }, "\uB3D9\uC2DC \uC0DD\uC0B0 \uC2DC \uAC00\uB2A5"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 800, color: p.ok ? "#4D56CB" : "#C8372D" } }, fmt(p.after)))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, marginTop: 8, color: p.ok ? "#59657A" : "#C8372D" } }, p.ok ? `\uBCD1\uBAA9 \uBD80\uC790\uC7AC: ${p.bottleneck}` : `\uBD80\uC871 \u2014 \uBC1C\uC8FC \uB300\uBE44 ${fmt(p.qty - p.after)}\uAC1C \uBAA8\uC790\uB78C`)))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 0, border: "1px solid #E0E4EB", borderRadius: 8, overflow: "hidden", marginBottom: 12, width: "fit-content" } }, [["agg", "\uD1B5\uD569 \uBCF4\uAE30"], ["line", "\uB77C\uC778\uBCC4 \uBCF4\uAE30"]].map(([k, label]) => /* @__PURE__ */ React.createElement("button", { key: k, onClick: () => setViewMode(k), style: {
      padding: "7px 16px",
      border: "none",
      fontSize: 13,
      fontWeight: 700,
      background: viewMode === k ? "#4D56CB" : "#fff",
      color: viewMode === k ? "#fff" : "#59657A",
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
          border: "1px solid #E0E4EB",
          background: "#fff",
          padding: "3px 10px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          color: "#20273A"
        }
      },
      "\uC804\uCCB4 \uCD08\uAE30\uD654"
    )), viewMode === "agg" && /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px solid #E0E4EB", borderRadius: 14, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#59657A", borderBottom: "1px solid #E0E4EB" } }, "\uBD80\uC790\uC7AC \uC18C\uC694 \uB0B4\uC5ED (\uC804\uCCB4 \uBC1C\uC8FC \uD569\uC0B0) \u2014 \uD589\uC744 \uD074\uB9AD\uD558\uBA74 \uB85C\uD2B8\uBCC4 \uCCB4\uD06C\uBC15\uC2A4\uB85C \uC0AC\uC6A9\uD560 \uC7AC\uACE0\uB97C \uC9C1\uC811 \uC120\uD0DD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4"), /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 820 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { color: "#59657A", textAlign: "right", background: "#FAFAFD" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", textAlign: "left", fontWeight: 600 } }, "\uBD80\uC790\uC7AC"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600 } }, "\uCD1D \uC18C\uC694\uB7C9"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600, color: "#1D5C8A" } }, "3PL \uC804\uC0B0"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600, color: "#4D56CB" } }, "\uC774\uCE74\uC6B4\uD2B8"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600 } }, "\uAE30\uC900\uC7AC\uACE0"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600 } }, "\uC0DD\uC0B0 \uD6C4 \uC794\uC5EC"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600 } }, "\uC0C1\uD0DC"))), /* @__PURE__ */ React.createElement("tbody", null, calc.rows.map((r) => /* @__PURE__ */ React.createElement(React.Fragment, { key: r.code }, /* @__PURE__ */ React.createElement(
      "tr",
      {
        onClick: () => setExpanded((p) => ({ ...p, [r.code]: !p[r.code] })),
        style: {
          borderTop: "1px solid #F6F7FA",
          cursor: "pointer",
          background: r.short > 0 ? "#FBEAE8" : "transparent"
        }
      },
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, color: r.short > 0 ? "#C8372D" : "#20273A" } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", width: 14, color: "#69768A" } }, expanded[r.code] ? "\u25BE" : "\u25B8"), r.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "#59657A", fontFamily: "monospace", paddingLeft: 14 } }, r.code)),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" } }, fmt(r.required)),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#1D5C8A" } }, fmt(r.t3)),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#4D56CB" } }, fmt(r.te)),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" } }, fmt(r.stock)),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontWeight: 700, color: r.remain < 0 ? "#C8372D" : "#20273A", fontVariantNumeric: "tabular-nums" } }, fmt(r.remain)),
      /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right" } }, r.short > 0 ? /* @__PURE__ */ React.createElement("span", { style: { color: "#fff", background: "#C8372D", borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" } }, "\uBD80\uC871 ", fmt(r.short)) : /* @__PURE__ */ React.createElement("span", { style: { color: "#4D56CB", fontWeight: 700, fontSize: 12 } }, "\uCDA9\uBD84"))
    ), expanded[r.code] && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 7, style: { padding: "0 12px 14px 26px", background: "#FAFAFD" } }, r.lots.length ? /* @__PURE__ */ React.createElement(
      LotTable,
      {
        lots: r.lots,
        allocations: r.aggAllocations,
        showSource: basis === "sum",
        excluded: planExcluded,
        frozenById,
        forceExcludeFrozen: !includeFrozen,
        onToggle: toggleLot,
        onSelectAll: (on, ids) => setLotsExcluded(ids, !on)
      }
    ) : /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 0", fontSize: 12.5, color: "#69768A" } }, basisLabel, "\uC5D0 \uC774 \uD488\uBAA9\uC758 \uB85C\uD2B8 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."))))))))), viewMode === "line" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#59657A", marginBottom: 10, padding: "8px 12px", background: "#EFF1F7", borderRadius: 8, lineHeight: 1.6 } }, "\u{1F4A1} \uB77C\uC778\uBCC4 \uBCF4\uAE30\uB294 \uBC1C\uC8FC \uC21C\uC11C\uB300\uB85C \uC7AC\uACE0\uB97C ", /* @__PURE__ */ React.createElement("b", null, "\uC21C\uCC28 \uBC30\uC815"), "\uD569\uB2C8\uB2E4 \u2014 \uC704\uCABD \uB77C\uC778\uC774 \uBA3C\uC800 \uC0AC\uC6A9\uD558\uACE0 \uB0A8\uC740 \uC7AC\uACE0\uB97C \uC544\uB798 \uB77C\uC778\uC774 \uBC1B\uC2B5\uB2C8\uB2E4. \uD589\uC744 \uD3BC\uCE58\uBA74 ", /* @__PURE__ */ React.createElement("b", null, '"\uC0AC\uC6A9" \uCE78\uC744 \uC9C1\uC811 \uC785\uB825'), "\uD574\uC11C \uC6D0\uD558\uB294 \uB85C\uD2B8\uB97C \uC6D0\uD558\uB294 \uB9CC\uD07C \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uCCB4\uD06C\uBC15\uC2A4\uB85C \uC0AC\uC6A9 \uC81C\uC678\uD55C \uB85C\uD2B8\uB294 \uBAA8\uB4E0 \uB77C\uC778\uC5D0\uC11C \uC0AC\uC6A9\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."), calc.lineDetails.map((line, lineIdx) => /* @__PURE__ */ React.createElement("div", { key: line.id, style: { background: "#fff", border: "1px solid #E0E4EB", borderRadius: 14, overflow: "hidden", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: {
      padding: "12px 16px",
      borderBottom: "1px solid #E0E4EB",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
      background: line.hasShortage ? "#FBEAE8" : "#EDEEFF"
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
      color: "#4D56CB",
      border: "1px solid #4D56CB"
    } }, lineIdx + 1), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: line.hasShortage ? "#C8372D" : "#4D56CB" } }, line.bom.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#59657A" } }, "\uBC1C\uC8FC \uC218\uB7C9 ", fmt(line.qty), "\uAC1C"))), /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 12,
      fontWeight: 700,
      padding: "4px 10px",
      borderRadius: 999,
      background: line.hasShortage ? "#C8372D" : "#4D56CB",
      color: "#fff"
    } }, line.hasShortage ? `\u26A0 ${line.components.filter((c) => c.shortage > 0).length}\uC885 \uBD80\uC871` : "\u2713 \uCDA9\uBD84")), /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 720 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { color: "#59657A", textAlign: "right", background: "#FAFAFD" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", textAlign: "left", fontWeight: 600 } }, "\uBD80\uC790\uC7AC"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600 } }, "\uC774 \uB77C\uC778 \uC18C\uC694\uB7C9"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600 } }, "\uC774 \uB77C\uC778 \uD560\uB2F9"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600 } }, "\uB77C\uC778 \uD6C4 \uC794\uC5EC"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", fontWeight: 600 } }, "\uC0C1\uD0DC"))), /* @__PURE__ */ React.createElement("tbody", null, line.components.map((c) => {
      const key = `${line.id}:${c.code}`;
      const lineRemain = c.allocations.reduce((s, a) => s + (a.excluded ? 0 : a.left), 0);
      return /* @__PURE__ */ React.createElement(React.Fragment, { key: c.code }, /* @__PURE__ */ React.createElement(
        "tr",
        {
          onClick: () => setExpanded((p) => ({ ...p, [key]: !p[key] })),
          style: {
            borderTop: "1px solid #F6F7FA",
            cursor: "pointer",
            background: c.shortage > 0 ? "#FBEAE8" : "transparent"
          }
        },
        /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, color: c.shortage > 0 ? "#C8372D" : "#20273A", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", width: 14, color: "#69768A" } }, expanded[key] ? "\u25BE" : "\u25B8"), c.expandedFrom && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#7A5500", fontWeight: 700 } }, "\u21B3 ", c.expandedFrom.name, " \uC804\uAC1C\uBD84"), c.name, c.isKernel && /* @__PURE__ */ React.createElement("span", { style: {
          fontSize: 10.5,
          fontWeight: 700,
          background: "#FBF3DE",
          color: "#7A5500",
          border: "1px solid #E0C97A",
          borderRadius: 5,
          padding: "1px 6px"
        } }, "\u{1F9E9} \uC54C\uB9F9\uC774")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "#59657A", fontFamily: "monospace", paddingLeft: 14 } }, c.code, " \xB7 \uB2E8\uC704\uB2F9 ", fmt(c.perUnit)), c.isKernel && /* @__PURE__ */ React.createElement("div", { style: { paddingLeft: 14, marginTop: 5, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement(
          "select",
          {
            value: partMode[line.id]?.[c.code] || "auto",
            onChange: (e) => setKernelMode(line.id, c.code, e.target.value),
            style: { fontSize: 11, padding: "3px 6px", borderRadius: 6, border: "1px solid #E0E4EB", fontFamily: "inherit" }
          },
          /* @__PURE__ */ React.createElement("option", { value: "auto" }, "\uC7AC\uACE0 \uC6B0\uC120 \uC18C\uC9C4 + \uBD80\uC871\uBD84 \uC790\uB3D9 \uC804\uAC1C"),
          /* @__PURE__ */ React.createElement("option", { value: "force_expand" }, "\uC804\uB7C9 \uBD80\uC790\uC7AC\uB85C \uAC15\uC81C \uC804\uAC1C"),
          /* @__PURE__ */ React.createElement("option", { value: "force_finished" }, "\uC804\uB7C9 \uC54C\uB9F9\uC774 \uC7AC\uACE0\uB85C\uB9CC (\uC804\uAC1C \uC548 \uD568)")
        ), c.kernelExpanded && c.kernelMode !== "force_expand" && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#7A5500" } }, "\uC54C\uB9F9\uC774 \uC7AC\uACE0 ", fmt(c.required), " \uC0AC\uC6A9 + \uBD80\uC790\uC7AC ", fmt(c.kernelFullRequired - c.required), " \uC804\uAC1C"), c.kernelMode === "force_expand" && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#7A5500" } }, "\uC54C\uB9F9\uC774 \uC7AC\uACE0 \uBBF8\uC0AC\uC6A9 \xB7 \uC804\uB7C9(", fmt(c.kernelFullRequired), ") \uBD80\uC790\uC7AC\uB85C \uC804\uAC1C\uB428"))),
        /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" } }, fmt(c.required)),
        /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#9A6B00", fontVariantNumeric: "tabular-nums" } }, fmt(c.used)),
        /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" } }, fmt(lineRemain)),
        /* @__PURE__ */ React.createElement("td", { style: { padding: "10px 12px", textAlign: "right" } }, c.shortage > 0 ? /* @__PURE__ */ React.createElement("span", { style: { color: "#fff", background: "#C8372D", borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" } }, "\uBD80\uC871 ", fmt(c.shortage)) : /* @__PURE__ */ React.createElement("span", { style: { color: "#4D56CB", fontWeight: 700, fontSize: 12 } }, "\uCDA9\uBD84"))
      ), expanded[key] && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 5, style: { padding: "0 12px 14px 26px", background: "#FAFAFD" } }, c.lots.length ? /* @__PURE__ */ React.createElement(
        LotTable,
        {
          lots: c.lots,
          allocations: c.allocations,
          showSource: basis === "sum",
          excluded: planExcluded,
          frozenById,
          forceExcludeFrozen: !includeFrozen,
          onToggle: toggleLot,
          onSelectAll: (on, ids) => setLotsExcluded(ids, !on),
          onAllocChange: (lotId, qty) => setManualUse(line.id, c.code, lotId, qty),
          onResetAlloc: () => resetLineComponent(line.id, c.code)
        }
      ) : /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 0", fontSize: 12.5, color: "#69768A" } }, basisLabel, "\uC5D0 \uC774 \uD488\uBAA9\uC758 \uB85C\uD2B8 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."))));
    })))))))))), tab === "bom" && /* @__PURE__ */ React.createElement("div", null, editing ? /* @__PURE__ */ React.createElement(BomEditor, { initial: editing === "new" ? null : editing, items, getStock, onSave: saveBom, onCancel: () => setEditing(null) }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#59657A" } }, "BOM\uC740 \uC774 \uB9C1\uD06C\uB97C \uC5EC\uB294 \uBAA8\uB4E0 \uAE30\uAE30\uC5D0 \uC790\uB3D9\uC73C\uB85C \uACF5\uC720 \uC800\uC7A5\uB429\uB2C8\uB2E4. \uBC31\uC5C5\uC774 \uD544\uC694\uD558\uBA74 \uC0C1\uB2E8 ", /* @__PURE__ */ React.createElement("b", null, "BOM \uB0B4\uBCF4\uB0B4\uAE30"), "\uB97C \uC774\uC6A9\uD558\uC138\uC694."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } }, !canEditBom && /* @__PURE__ */ React.createElement(LockedNotice, { tier: 2, label: "BOM \uCD94\uAC00/\uC218\uC815/\uC0AD\uC81C" }), canEditBom && boms.length > 0 && /* @__PURE__ */ React.createElement(Btn, { kind: "danger", onClick: () => {
      if (confirm(
        `\u26A0 \uB4F1\uB85D\uB41C BOM ${boms.length}\uAC1C\uB97C \uC804\uBD80 \uC0AD\uC81C\uD569\uB2C8\uB2E4.

\uC774 BOM\uB4E4\uC744 \uC0AC\uC6A9 \uC911\uC778 \uBC1C\uC8FC \uD488\uBAA9\uB3C4 \uD568\uAED8 \uC0AC\uB77C\uC9D1\uB2C8\uB2E4.
\uC774 \uB9C1\uD06C\uB97C \uACF5\uC720 \uC911\uC778 \uB2E4\uB978 \uAE30\uAE30\uC5D0\uC11C\uB3C4 \uD568\uAED8 \uC0AD\uC81C\uB418\uBA70, \uB0B4\uBCF4\uB0B4\uAE30(\uBC31\uC5C5) \uC5C6\uC774 \uC9C4\uD589\uD558\uBA74 \uBCF5\uAD6C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.

\uC815\uB9D0 \uC804\uCCB4 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`
      )) deleteAllBoms();
    } }, "\u{1F5D1} BOM \uC804\uCCB4 \uC0AD\uC81C"), canEditBom && /* @__PURE__ */ React.createElement(Btn, { onClick: () => setEditing("new") }, "+ \uC0C8 BOM \uB4F1\uB85D"))), boms.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px dashed #E0E4EB", borderRadius: 14, padding: 32, textAlign: "center", color: "#59657A", fontSize: 14 } }, "\uC81C\uD488 \uC774\uB984\uACFC \uBD80\uC790\uC7AC \uAD6C\uC131(1\uAC1C\uB2F9 \uC18C\uC694\uB7C9)\uC744 \uB4F1\uB85D\uD558\uBA74", /* @__PURE__ */ React.createElement("br", null), "\uBC1C\uC8FC \uC2DC\uBBAC\uB808\uC774\uC158\uC5D0\uC11C \uBC14\uB85C \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.") : boms.map((b) => /* @__PURE__ */ React.createElement("div", { key: b.id, style: { background: "#fff", border: "1px solid #E0E4EB", borderRadius: 14, padding: 16, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 } }, b.name, b.kernelCode && /* @__PURE__ */ React.createElement("span", { style: {
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
      background: kernelByCode[c.code] ? "#FBF3DE" : "#EFF1F7",
      color: kernelByCode[c.code] ? "#7A5500" : "#20273A"
    } }, kernelByCode[c.code] ? "\u{1F9E9} " : "", c.name, " \xD7 ", c.qty))))))), tab === "stock" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
      "input",
      {
        style: inp,
        placeholder: "\uBD80\uC790\uC7AC \uCF54\uB4DC \xB7 \uC774\uB984 \xB7 \uC2DC\uB9AC\uC5BC/\uB85C\uD2B8 No.\uB85C \uAC80\uC0C9\u2026",
        value: stockQ,
        onChange: (e) => setStockQ(e.target.value)
      }
    ), stockQ.trim() && /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", border: "1px solid #E0E4EB", borderRadius: 14, marginTop: 12, overflow: "hidden" } }, stockResults.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: 20, color: "#59657A", fontSize: 13 } }, "\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.") : stockResults.map((i) => {
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
            borderBottom: "1px solid #F6F7FA",
            gap: 12,
            cursor: "pointer"
          }
        },
        /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0, flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", width: 14, color: "#69768A" } }, expandedStk[i.code] ? "\u25BE" : "\u25B8"), i.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#59657A", fontFamily: "monospace", paddingLeft: 14 } }, i.code), i.matchedLotNos && i.matchedLotNos.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: "#7A5500", paddingLeft: 14, marginTop: 3, lineHeight: 1.5 } }, "\u{1F3F7} \uC77C\uCE58 \uB85C\uD2B8: ", /* @__PURE__ */ React.createElement("b", { style: { fontFamily: "monospace" } }, i.matchedLotNos.slice(0, 5).map((lot, index) => React.createElement(React.Fragment, {key: lot}, index > 0 ? ", " : "", lot, designButton(lot), React.createElement(FreezeLotBadge, {freeze: CalculatorPlan.freezeForLot(freezes, lot)}))), i.matchedLotNos.length > 5 ? ` \uC678 ${i.matchedLotNos.length - 5}\uAC74` : ""))),
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 18, textAlign: "right" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10.5, color: "#1D5C8A", fontWeight: 700 } }, "3PL \uC804\uC0B0"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" } }, fmt(i.t3))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10.5, color: "#4D56CB", fontWeight: 700 } }, "\uC774\uCE74\uC6B4\uD2B8"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" } }, fmt(i.te))), i.tc > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10.5, color: "#7B4D1E", fontWeight: 700 } }, "\uCE74\uD1A4\uBC15\uC2A4"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" } }, fmt(i.tc))))
      ), expandedStk[i.code] && /* @__PURE__ */ React.createElement("div", { style: { padding: "4px 16px 14px 30px", background: "#FAFAFD", borderBottom: "1px solid #F6F7FA" } }, s.lots.length ? /* @__PURE__ */ React.createElement(LotTable, { lots: s.lots, required: null, showSource: basis === "sum", frozenById, searchHighlight: stockQ.trim() }) : /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 0", fontSize: 12.5, color: "#69768A" } }, basisLabel, "\uC5D0 \uB85C\uD2B8 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. (\uAE30\uC900 \uC7AC\uACE0\uB97C \uBC14\uAFD4\uBCF4\uC138\uC694)"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#69768A", marginTop: 6 } }, "\uD45C\uC2DC \uAE30\uC900: ", basisLabel)));
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
    )), canEditStock ? /* @__PURE__ */ React.createElement(ManualStockAddForm, { onAdd: addManualLot }) : /* @__PURE__ */ React.createElement("div", { style: { marginTop: 18, maxWidth: 640 } }, /* @__PURE__ */ React.createElement(LockedNotice, { tier: 1, label: "\uC7AC\uACE0 \uC9C1\uC811 \uCD94\uAC00" })))), poMode === "history" ? /* @__PURE__ */ React.createElement(PurchaseOrderHistory, { records: poHistory, loading: poHistoryLoading, error: poHistoryError, onClose: () => setPoMode(null), onReorder: (record) => {
      setReorder(record);
      setPoMode("order");
    } }) : poMode && /* @__PURE__ */ React.createElement(PurchaseOrderDialog, { key: poMode + ":" + (reorder?.id || ""), shortages: calc?.totalShort || [], suppliers, itemSuppliers, freezes, onSaveSuppliers: persistSuppliers, onCreateOrders: persistPurchaseOrders, onClose: () => setPoMode(null), supplierOnly: poMode === "suppliers", reorder: poMode === "order" ? reorder : null }));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
})();
