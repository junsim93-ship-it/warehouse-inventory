(() => {
  (function(root) {
    const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
    function group(items, suppliers) {
      const byId = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
      const orders = /* @__PURE__ */ new Map();
      for (const item of items) {
        const entered = String(item.qty ?? "").trim();
        if (!entered) continue;
        if (!/^[1-9]\d*$/.test(entered) || !Number.isSafeInteger(Number(entered)) || Number(entered) > 1e9)
          throw new Error(`${item.code} \uBC1C\uC8FC \uC218\uB7C9\uC740 1 \uC774\uC0C1\uC758 \uC815\uC218\uB85C \uC785\uB825\uD558\uC138\uC694.`);
        const supplier = byId.get(item.supplierId);
        if (!supplier) throw new Error(`${item.code}\uC758 \uACF5\uAE09\uCC98\uB97C \uC120\uD0DD\uD558\uC138\uC694.`);
        if (!orders.has(supplier.id)) orders.set(supplier.id, { supplier, lines: [], total: 0 });
        const order = orders.get(supplier.id);
        const qty = Number(entered);
        order.lines.push({ code: item.code, name: item.name, qty, detail: item.detail || "", lot: item.lot || "" });
        order.total += qty;
      }
      if (!orders.size) throw new Error("\uBC1C\uC8FC \uC218\uB7C9\uC744 \uC785\uB825\uD55C \uD488\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.");
      return [...orders.values()];
    }
    function render(order, fields) {
      const e = escapeHtml;
      const logoUrl = `${root.location?.origin || ""}/assets/po-coiz-logo.png`;
      const page = (lines) => {
        const filled = Array.from({ length: 3 }, (_, i) => lines[i] || null);
        const rows = filled.map((line) => `<tr class="item"><td>${e(line?.code)}</td><td>${e(line?.name)}</td><td class="qty">${line ? `${line.qty.toLocaleString("ko-KR")}\uC218[EA]` : ""}</td><td>${e(line?.detail)}</td><td>${e(line?.lot)}</td></tr><tr class="spacer"><td colspan="4"></td><td></td></tr>`).join("");
        return `<section class="sheet"><h1>\uBC1C \uC8FC \uC11C</h1>
        <table class="head"><colgroup><col style="width:61.5pt"><col style="width:134.3pt"><col style="width:93pt"><col style="width:114.7pt"><col style="width:116.5pt"></colgroup><tbody>
          <tr><th>\uC77C\uB828\uBC88\uD638</th><td>${e(fields.number)}</td><td class="logo" colspan="3" rowspan="2"><img src="${e(logoUrl)}" alt="coiz CO.,LTD."></td></tr>
          <tr><th>\uC218 \uC2E0</th><td>${e(order.supplier.name)}</td></tr>
          <tr><th>Email</th><td>${e(order.supplier.email)}</td><th>\uC0AC\uC5C5\uC790\uB4F1\uB85D\uBC88\uD638</th><td colspan="2">107-86-40966</td></tr>
          <tr><th>TEL</th><td>${e(order.supplier.tel)}</td><th>\uD68C\uC0AC\uBA85/\uB300\uD45C</th><td colspan="2">(\uC8FC)\uCF54\uC774\uC988&nbsp; / &nbsp;\uC774\uC815\uBBFC</td></tr>
          <tr><th>FAX</th><td>${e(order.supplier.fax)}</td><th>\uC8FC \uC18C</th><td colspan="2">\uC11C\uC6B8\uD2B9\uBCC4\uC2DC \uAC15\uC11C\uAD6C \uD654\uACE1\uB85C59\uAE3837-4 (\uD654\uACE1\uB3D9)</td></tr>
          <tr><td colspan="2">\uB0A9\uAE30\uC77C\uC790 : ${e(fields.deliveryDate)}</td><th>\uB2F4\uB2F9/\uC5F0\uB77D\uCC98</th><td colspan="2">\uC2E0\uC81C\uD638\uD300\uC7A5010-5393-4714</td></tr>
          <tr><td colspan="5">\uC138\uAE08\uACC4\uC0B0\uC11C/\uB9C8\uAC10\uB0B4\uC5ED\uC11C \uBA54\uC77C : \uC774\uC815\uBBFC \uC2E4\uC7A5 : sales@coiz.com</td></tr>
          <tr><td colspan="5">\uB9C8\uAC10\uB0B4\uC5ED\uC11C \uCC38\uC870 \uBA54\uC77C : \uC2E0\uC81C\uD638 \uD300\uC7A5 : coiz1129@naver.com</td></tr>
          <tr><td colspan="5">\uB9C8\uAC10\uB0B4\uC5ED\uC11C \uCC38\uC870 \uBA54\uC77C : \uBC18\uB0A8\uC219 \uC0C1\uBB34 : coo2@oxyfacial.com</td></tr>
          <tr><td colspan="5">\uB0A9\uD488\uCC98 \uC8FC\uC18C : ${e(fields.deliveryAddress)}</td></tr>
        </tbody></table>
        <div class="request">\uB0A9\uD488 \uC694\uCCAD\uC0AC\uD56D : ${e(fields.request).replace(/\n/g, "<br>")}</div>
        <div class="items-block"><table class="items"><colgroup><col style="width:64.5pt"><col style="width:207.8pt"><col style="width:63pt"><col style="width:108pt"><col style="width:81.7pt"></colgroup>
          <thead><tr><th>\uD488\uBAA9\uCF54\uB4DC</th><th>\uD488\uBAA9\uBA85[\uADDC\uACA9]</th><th>\uC218\uB7C9(\uB2E8\uC704\uD3EC\uD568)</th><th>\uC138\uBD80\uC0AC\uD56D</th><th>\uC2DC\uB9AC\uC5BC/\uB85C\uD2B8No.</th></tr></thead>
          <tbody>${rows}<tr class="sum"><th colspan="4">\uCD1D\uD569\uACC4</th><td></td></tr></tbody></table>
          <table class="total"><tr><th>\uC218\uB7C9</th><td>${order.total.toLocaleString("ko-KR")}</td></tr></table>
        </div>
      </section>`;
      };
      const pages = [];
      for (let i = 0; i < order.lines.length; i += 3) pages.push(page(order.lines.slice(i, i + 3)));
      return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>\uBC1C\uC8FC\uC11C_${e(order.supplier.name)}_${e(fields.issueDate)}</title><style>
      @page{size:A4;margin:0}*{box-sizing:border-box}body{font-family:"\uB3CB\uC6C0",Dotum,"MS Gothic",sans-serif;color:#111;margin:0;background:#e9ecef;font-size:9pt}
      .toolbar{padding:12px 20px;background:#173f82;color:#fff;display:flex;align-items:center;gap:14px;font-family:"Malgun Gothic",sans-serif;font-size:13px}.toolbar button{padding:9px 16px;border:0;border-radius:6px;font-weight:700;cursor:pointer}
      .sheet{position:relative;width:595.92pt;height:841.92pt;margin:20px auto;background:#fff;box-shadow:0 3px 20px #0002;overflow:hidden}
      h1{position:absolute;top:36pt;left:62pt;width:520pt;margin:0;text-align:center;font-size:17pt;line-height:24pt;letter-spacing:.03em}
      table{border-collapse:collapse;table-layout:fixed}th,td{border:.6pt solid #999;padding:1.5pt 3pt;vertical-align:middle;overflow-wrap:anywhere;line-height:1.2}
      .head{position:absolute;left:62.2pt;top:64.5pt;width:519.8pt;font-size:9pt}.head tr{height:18.75pt}.head th{text-align:center;font-weight:700;white-space:nowrap}.head td{text-align:left}.head tr:nth-child(n+3):nth-child(-n+6) td:last-child{text-align:center}.head .logo{text-align:center;padding:0}.logo img{display:block;width:117pt;height:28.5pt;object-fit:contain;margin:auto;transform:translate(12pt,3pt)}
      .request{position:absolute;left:61.9pt;top:255.4pt;width:519pt;min-height:29.2pt;border:.6pt solid #999;padding:2pt 2.5pt;line-height:10.5pt;overflow-wrap:anywhere}
      .items-block{position:absolute;left:57.7pt;top:288.7pt;width:525pt}.items{width:525pt;font-size:8pt}.items thead tr{height:30.7pt}.items th{text-align:center;font-size:8pt;font-weight:700;white-space:nowrap;letter-spacing:-.04em}.items .item{height:25pt;line-height:1}.items .item:first-child{height:30pt}.items .spacer{height:24.75pt}.items .sum{height:26.2pt}.items td{padding:1pt 2pt}.items .qty{text-align:center;white-space:nowrap}
      .total{margin:48pt 0 0 4.2pt;width:210pt;height:20pt;font-size:9pt}.total th{width:105pt;text-align:center;font-weight:400;background:#f8f8f8}.total td{text-align:right;padding-right:5pt}
      @media print{body{background:#fff}.toolbar{display:none}.sheet{margin:0;box-shadow:none;break-after:page}.sheet:last-child{break-after:auto}}
    </style></head><body><div class="toolbar"><button id="printOrder" type="button">PDF \uC800\uC7A5 / \uC778\uC1C4</button><span>\uC778\uC1C4 \uCC3D\uC5D0\uC11C \u2018PDF\uB85C \uC800\uC7A5\u2019\uC744 \uC120\uD0DD\uD558\uC138\uC694.</span></div>${pages.join("")}</body></html>`;
    }
    function records(orders, fields, sourceId = "", now = Date.now(), makeId = () => root.crypto.randomUUID()) {
      if (!fields.issueDate) throw new Error("\uBC1C\uC8FC\uC77C\uC744 \uC785\uB825\uD558\uC138\uC694.");
      if (orders.length > 29) throw new Error("\uD55C \uBC88\uC5D0 \uCD5C\uB300 29\uAC1C \uACF5\uAE09\uCC98\uAE4C\uC9C0 \uBC1C\uC8FC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB098\uB204\uC5B4 \uC0DD\uC131\uD558\uC138\uC694.");
      return orders.map((order) => {
        const id = makeId();
        return {
          id,
          createdAt: now,
          number: `${fields.issueDate.replaceAll("-", "/")} -${id.split("-")[0].toUpperCase()}`,
          ...fields,
          deliveryAddress: fields.deliveryAddress.trim() || order.supplier.deliveryAddress,
          sourceId,
          order: { supplier: { ...order.supplier }, lines: order.lines.map((line) => ({ ...line })), total: order.total }
        };
      });
    }
    root.PurchaseOrder = { group, render, records };
  })(typeof window === "undefined" ? globalThis : window);
})();
