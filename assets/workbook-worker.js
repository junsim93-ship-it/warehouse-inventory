(() => {
  importScripts("../vendor/xlsx.full.min.js");
  self.onmessage = function(event) {
    try {
      const bytes = event.data;
      if (!(bytes instanceof ArrayBuffer) || bytes.byteLength > 10 * 1024 * 1024) throw new Error("\uD30C\uC77C\uC740 10MB \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4.");
      const wb = XLSX.read(bytes, { type: "array", sheetRows: 20001, cellHTML: false, cellFormula: false, bookVBA: false });
      if (wb.SheetNames.length > 40) throw new Error("\uC2DC\uD2B8\uB294 40\uAC1C \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4.");
      let count = 0;
      for (const name of wb.SheetNames) {
        const sheet = wb.Sheets[name];
        const range = XLSX.utils.decode_range(sheet["!fullref"] || sheet["!ref"] || "A1");
        if (range.e.r >= 2e4 || range.e.c >= 200) throw new Error("\uC2DC\uD2B8\uB294 20,000\uD589, 200\uC5F4 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4.");
        count += Object.keys(sheet).length;
        if (count > 5e5) throw new Error("\uC804\uCCB4 \uC140 \uC218\uAC00 \uB108\uBB34 \uB9CE\uC2B5\uB2C8\uB2E4.");
      }
      self.postMessage({ workbook: wb });
    } catch (e) {
      self.postMessage({ error: e.message || "\uD30C\uC77C\uC744 \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." });
    }
  };
})();
