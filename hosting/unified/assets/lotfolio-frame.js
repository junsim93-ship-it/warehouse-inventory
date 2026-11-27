(() => {
  'use strict';
  const embedded = window.parent !== window;
  let pending = null;
  function send(message) {
    if (embedded) window.parent.postMessage(message, location.origin);
  }
  function parse(value) {
    if (typeof value !== 'string' || !value.includes('_')) return null;
    try { return window.LotfolioEngine.parseLot(value); } catch { return null; }
  }
  function cancel() {
    if (!pending) return;
    const {requestId} = pending;
    pending = null;
    send({type:'lotfolio:cancel', requestId});
  }
  function generate(row, onConfirm) {
    if (!embedded) return;
    cancel();
    const requestId = window.LotfolioEngine.randomId();
    pending = {requestId, onConfirm};
    send({type:'lotfolio:generate', requestId, itemCode:row.code, itemName:row.name, lotCode:row.lot});
  }
  function view(lotCode) {
    send({type:'lotfolio:view-design', lotCode});
  }
  if (embedded) {
    document.documentElement.setAttribute('data-workspace-frame','');
    window.addEventListener('message', event => {
      if (event.origin !== location.origin || event.source !== window.parent || !pending) return;
      const data = event.data;
      if (!data || pending.requestId !== data.requestId) return;
      if (data.type === 'lotfolio:cancel') {
        pending = null;
      } else if (data.type === 'lotfolio:generated') {
        const parsed = parse(data.lotCode);
        if (!parsed) return;
        const {onConfirm} = pending;
        pending = null;
        onConfirm(parsed.lot);
      }
    });
    document.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        send({type:'lotfolio:search'});
      }
    });
    window.addEventListener('pagehide',cancel);
  }
  window.LotfolioFrame = {embedded, parse, view, generate, cancel};
})();
