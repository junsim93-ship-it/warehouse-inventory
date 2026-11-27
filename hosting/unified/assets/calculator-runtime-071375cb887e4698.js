var LotfolioSheets=(()=>{var d=Object.defineProperty;var s=Object.getOwnPropertyDescriptor;var w=Object.getOwnPropertyNames;var a=Object.prototype.hasOwnProperty;var c=(e,o)=>{for(var n in o)d(e,n,{get:o[n],enumerable:!0})},S=(e,o,n,r)=>{if(o&&typeof o=="object"||typeof o=="function")for(let i of w(o))!a.call(e,i)&&i!==n&&d(e,i,{get:()=>o[i],enumerable:!(r=s(o,i))||r.enumerable});return e};var l=e=>S(d({},"__esModule",{value:!0}),e);var u={};c(u,{loadSpreadsheet:()=>m});var t;function m(){return window.XLSX?Promise.resolve(window.XLSX):(t||(t=new Promise((e,o)=>{let n=document.createElement("script");n.src="/vendor/xlsx.full.min.js",n.integrity="sha384-EnyY0/GSHQGSxSgMwaIPzSESbqoOLSexfnSMN2AP+39Ckmn92stwABZynq1JyzdT",n.crossOrigin="anonymous";function r(){n.remove(),o(new Error("\uC5D1\uC140 \uB3C4\uAD6C\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."))}n.onerror=r,n.onload=()=>window.XLSX?e(window.XLSX):r(),document.head.append(n)}).catch(e=>{throw t=void 0,e})),t)}return l(u);})();

;
var CalculatorPlan=(()=>{var I=Object.defineProperty;var W=Object.getOwnPropertyDescriptor;var X=Object.getOwnPropertyNames;var Y=Object.prototype.hasOwnProperty;var G=(r,n)=>{for(var i in n)I(r,i,{get:n[i],enumerable:!0})},J=(r,n,i,c)=>{if(n&&typeof n=="object"||typeof n=="function")for(let p of X(n))!Y.call(r,p)&&p!==i&&I(r,p,{get:()=>n[p],enumerable:!(c=W(n,p))||c.enumerable});return r};var ee=r=>J(I({},"__esModule",{value:!0}),r);var ae={};G(ae,{allocateLots:()=>ne,availableQuantity:()=>T,fefoSort:()=>L,freezeDescription:()=>$,freezeForLot:()=>_,freezeMap:()=>V,freezeReason:()=>N,frozenLotsById:()=>ie,planExclusions:()=>se,simulatePlan:()=>re});var te={A:"\uC778\uC1C4\uC6A9\uAE30",B:"\uB2E8\uC0C1\uC790",C:"\uB77C\uBCA8"};function oe(r){let n=String(r??"").trim().toUpperCase();if(!/^[A-Z0-9-]+$/.test(n))throw new Error("\uC81C\uD488\uBC88\uD638\uB294 \uC601\uBB38, \uC22B\uC790, \uD558\uC774\uD508\uC73C\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");return n}function P(r){let n=String(r??"").trim().toUpperCase().split("_");if(n.length!==4)throw new Error("\uBC11\uC904(_)\uB85C \uD655\uC815\uC6D4\xB7\uCC28\uC218, \uC81C\uD488\uBC88\uD638, \uBD80\uC790\uC7AC, \uC778\uD5C8\uAC00\uC758 \uB124 \uAD6C\uAC04\uC744 \uAD6C\uBD84\uD574 \uC8FC\uC138\uC694.");let[i,c,p,m]=n,h=/^(\d{2}(?:0[1-9]|1[0-2]))V(\d*)$/.exec(i);if(!h)throw new Error("\uCCAB \uAD6C\uAC04\uC740 \uD655\uC815 \uC5F0\uC6D4 \uB124 \uC790\uB9AC(\uC6D4 01~12), V, \uC120\uD0DD \uCC28\uC218 \uC21C\uC11C\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");let l=h[2].replace(/^0+/,"").padStart(h[2]?2:0,"0");if(l==="00")throw new Error("\uBC1C\uC8FC \uCC28\uC218\uB294 1 \uC774\uC0C1\uC758 \uC815\uC218\uB85C \uC785\uB825\uD558\uAC70\uB098 \uC0DD\uB7B5\uD574 \uC8FC\uC138\uC694.");let w=oe(c);if(!Object.hasOwn(te,p))throw new Error("\uBD80\uC790\uC7AC \uAD6C\uBD84\uC740 A, B, C \uC911 \uD558\uB098\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");if(m!=="KR"&&(!/^[NMC]+$/.test(m)||new Set(m).size!==m.length))throw new Error("\uC778\uD5C8\uAC00\uC5D0\uB294 N, M, C\uB97C \uD55C \uBC88\uC529 \uC0AC\uC6A9\uD558\uAC70\uB098 \uAD6D\uB0B4 \uC804\uC6A9 KR\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");let q=m==="KR"?m:[..."NMC"].filter(z=>m.includes(z)).join(""),C=h[1],R="_"+w+"_"+p+"_"+q;return{month:C,seq:l,code:w,type:p,reg:q,key:C+"V"+R,lot:C+"V"+l+R,corrected:m!==q}}var D=Object.freeze({discontinued:"\uAD6C\uB514\uC790\uC778 \xB7 \uC0AC\uC6A9\uC911\uB2E8",quality:"\uD488\uC9C8\uBCF4\uB958",reserved:"\uBB3C\uB7C9\uC608\uC57D",other:"\uAE30\uD0C0"});function N(r){return Object.hasOwn(D,r)?D[r]:D.other}function V(r){return Object.fromEntries(r.filter(n=>n.freeze?.active===!0).map(n=>[n.key,n.freeze]))}function _(r,n){if(!r||typeof n!="string"||!n.includes("_"))return null;try{let{key:i}=P(n);return Object.hasOwn(r,i)&&r[i]?.active===!0?r[i]:null}catch{return null}}function $(r){return[N(r.reason),r.memo,r.by,new Date(r.at).toLocaleString("ko-KR"),r.until&&"\uD574\uC81C \uC608\uC815 "+r.until].filter(Boolean).join(" \xB7 ")}var L=r=>[...r].sort((n,i)=>n.e&&i.e?n.e.localeCompare(i.e)||n.l.localeCompare(i.l):n.e?-1:i.e?1:n.l.localeCompare(i.l));function ne(r,n,i){let c=i||new Set,p=L(r.filter(l=>!c.has(l.id))),m=n,h=new Map;for(let l of p){let w=Math.min(l.q,Math.max(0,m));h.set(l.id,w),m-=w}return L(r).map(l=>{let w=c.has(l.id),q=h.get(l.id)??0;return{...l,use:w?null:q,left:w?null:l.q-q,excluded:w}})}function re({order:r,boms:n,getStock:i,excluded:c,manualAlloc:p,partMode:m,kernelByCode:h}){let l=r.map(e=>({...e,bom:n.find(t=>t.id===e.bomId)})).filter(e=>e.bom&&e.qty>0);if(!l.length)return null;let w={},q={},C=e=>{if(!w[e]){let t=L(i(e).lots);w[e]=t,q[e]={},t.forEach(a=>{q[e][a.id]=c.has(a.id)?0:a.q})}},R=5,z=l.map(e=>{let t=[],a=(o,g,y,x)=>{let f=t.find(u=>u.code===o&&!u.isKernel);if(f){f.required+=y,x&&!f.expandedFrom&&(f.expandedFrom=x);return}t.push({code:o,name:g,required:y,isKernel:!1,expandedFrom:x||null})},d=e.bom.components.map(o=>({code:o.code,name:o.name,required:o.qty*e.qty,depth:0,expandedFrom:null}));for(;d.length;){let o=d.shift(),g=h[o.code];if(!g||o.depth>=R){a(o.code,o.name,o.required,o.expandedFrom);continue}let y=m[e.id]?.[o.code]||"auto";if(y==="force_finished"){t.push({code:o.code,name:o.name,required:o.required,isKernel:!0,kernelMode:y,kernelFullRequired:o.required,kernelExpanded:!1,expandedFrom:o.expandedFrom});continue}let x=0,f;if(y==="force_expand")f=o.required;else{C(o.code);let u=o.required;for(let K of w[o.code]){if(u<=0)break;let O=q[o.code][K.id]??0;if(O<=0)continue;let F=Math.min(O,u);q[o.code][K.id]=O-F,x+=F,u-=F}f=u}(x>0||f>0)&&t.push({code:o.code,name:o.name,required:x,isKernel:!0,kernelMode:y,kernelFullRequired:o.required,kernelExpanded:f>0,expandedFrom:o.expandedFrom}),f>0&&g.components.forEach(u=>{d.push({code:u.code,name:u.name,required:u.qty*f,depth:o.depth+1,expandedFrom:{code:o.code,name:o.name}})})}return t}),j={};z.forEach(e=>e.forEach(t=>{j[t.code]||(j[t.code]={code:t.code,name:t.name,required:0}),j[t.code].required+=t.required}));let v=Object.values(j).map(e=>{let t=i(e.code),a=t.used-e.required;return{...e,t3:t.t3,te:t.te,stock:t.used,lots:t.lots,remain:a,short:a<0?-a:0}}).sort((e,t)=>(t.short>0?1:-1)-(e.short>0?1:-1)||e.code.localeCompare(t.code)),H=l.map(e=>{let t=1/0,a=1/0,d="";return e.bom.components.forEach(o=>{let g=i(o.code).used,x=(j[o.code]?.required??o.qty*e.qty)-o.qty*e.qty,f=Math.floor(g/o.qty),u=Math.floor(Math.max(0,g-x)/o.qty);f<t&&(t=f,d=o.name),u<a&&(a=u)}),{...e,solo:t,after:a,bottleneck:d,ok:a>=e.qty}}),U={},M={};Object.keys(j).forEach(e=>{let t=L(i(e).lots);U[e]=t,M[e]={},t.forEach(a=>{M[e][a.id]=c.has(a.id)?0:a.q})});let k={},A=l.map((e,t)=>{let a=z[t].map(d=>{let o=d.required,g=U[d.code]??[],y=p[e.id]?.[d.code]??{},x=o,f={},u=new Set(Object.keys(y));for(let s of g){if(c.has(s.id)||!u.has(s.id))continue;let E=Math.max(0,y[s.id]||0),b=Math.max(0,M[d.code][s.id]??0),B=Math.min(E,b);f[s.id]=B,E>b&&(k[s.id]=(k[s.id]??0)+(E-b)),M[d.code][s.id]=b-B,x-=B}for(let s of g){if(c.has(s.id)||u.has(s.id))continue;if(x<=0)break;let E=M[d.code][s.id]??0;if(E<=0)continue;let b=Math.min(E,x);f[s.id]=b,M[d.code][s.id]=E-b,x-=b}let K=g.map(s=>({...s,use:c.has(s.id)?null:f[s.id]??0,left:c.has(s.id)?null:M[d.code][s.id]??0,excluded:c.has(s.id),manual:u.has(s.id),manualWant:u.has(s.id)?Math.max(0,y[s.id]||0):null,conflictQty:u.has(s.id)&&k[s.id]?k[s.id]:0})),O=Object.values(f).reduce((s,E)=>s+E,0),F=T(g,c);return{code:d.code,name:d.name,perUnit:e.qty?o/e.qty:0,required:o,used:O,allocations:K,lots:g,shortage:Math.max(0,x),totalStock:F,isKernel:!!d.isKernel,kernelMode:d.kernelMode||null,kernelFullRequired:d.kernelFullRequired??null,kernelExpanded:!!d.kernelExpanded,expandedFrom:d.expandedFrom||null}});return{...e,components:a,hasShortage:a.some(d=>d.shortage>0)}}),S={};A.forEach(e=>e.components.forEach(t=>{S[t.code]||(S[t.code]={}),t.allocations.forEach(a=>{!a.excluded&&a.use>0&&(S[t.code][a.id]=(S[t.code][a.id]??0)+a.use)})})),v.forEach(e=>{e.aggAllocations=e.lots.map(t=>({...t,use:c.has(t.id)?null:S[e.code]?.[t.id]??0,left:c.has(t.id)?null:t.q-(S[e.code]?.[t.id]??0),excluded:c.has(t.id)}))});let Q=Object.keys(k).length,Z=Object.values(k).reduce((e,t)=>e+t,0);return{rows:v,perProduct:H,totalShort:v.filter(e=>e.short>0),lineDetails:A,totalConflicts:Q,totalConflictQty:Z}}function ie(r,n){let i=new Map;if(!n||Object.keys(n).length===0)return i;let c=new Map;for(let p of Object.values(r))for(let m of Object.values(p))for(let h of m.lots){c.has(h.l)||c.set(h.l,_(n,h.l));let l=c.get(h.l);l&&i.set(h.id,l)}return i}function se(r,n,i=!1){return i||!n.size?r:new Set([...r,...n.keys()])}function T(r,n){return r.reduce((i,c)=>i+(n.has(c.id)?0:c.q),0)}return ee(ae);})();

;
(() => {
  (function(root) {
    if (root.parent !== root && root.parent.UnifiedSession) {
      root.UnifiedSession = root.parent.UnifiedSession;
      return;
    }
    const peers = /* @__PURE__ */ new Set();
    let activeUser;
    function connect(adapter) {
      const peer = { adapter, seen: false, user: null, reloading: false };
      peers.add(peer);
      const unsubscribe = adapter.subscribe((user) => {
        const previous = peer.user;
        if (peer.seen && user === previous) return;
        peer.seen = true;
        peer.user = user;
        if (!user && !previous) {
          if (activeUser && !peer.reloading) {
            peer.reloading = true;
            adapter.reload();
          }
          return;
        }
        if (user === activeUser) return;
        if (!user && previous !== activeUser) return;
        activeUser = user;
        for (const other of peers) {
          if (other === peer || !other.seen) continue;
          if (user) {
            if (other.adapter.getUser() !== user && !other.reloading) {
              other.reloading = true;
              other.adapter.reload();
            }
          } else if (other.adapter.getUser()) {
            Promise.resolve(other.adapter.signOut()).then(() => other.adapter.reload(), () => other.adapter.reload());
          }
        }
      });
      const stop = () => {
        peers.delete(peer);
        unsubscribe?.();
      };
      return stop;
    }
    root.UnifiedSession = { connect };
  })(window);
})();

;
var LotfolioEngine=(()=>{var g=Object.defineProperty;var h=Object.getOwnPropertyDescriptor;var S=Object.getOwnPropertyNames;var C=Object.prototype.hasOwnProperty;var b=(e,t)=>{for(var r in t)g(e,r,{get:t[r],enumerable:!0})},j=(e,t,r,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of S(t))!C.call(e,o)&&o!==r&&g(e,o,{get:()=>t[o],enumerable:!(n=h(t,o))||n.enumerable});return e};var y=e=>j(g({},"__esModule",{value:!0}),e);var M={};b(M,{buildLot:()=>R,currentMonth:()=>_,nextSeq:()=>I,parseLot:()=>m,productCode:()=>l,randomId:()=>u,regulations:()=>E,types:()=>d});function u(e=globalThis.crypto){if(typeof e?.randomUUID=="function")return e.randomUUID();if(!e?.getRandomValues)throw Error("\uC774 \uBE0C\uB77C\uC6B0\uC800\uC5D0\uC11C \uC548\uC804\uD55C \uD30C\uC77C \uBC88\uD638\uB97C \uC0DD\uC131\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");let t=e.getRandomValues(new Uint8Array(16));t[6]=t[6]&15|64,t[8]=t[8]&63|128;let r=Array.from(t,n=>n.toString(16).padStart(2,"0")).join("");return[r.slice(0,8),r.slice(8,12),r.slice(12,16),r.slice(16,20),r.slice(20)].join("-")}var d={A:"\uC778\uC1C4\uC6A9\uAE30",B:"\uB2E8\uC0C1\uC790",C:"\uB77C\uBCA8"},E={N:"\uC704\uC0DD\uD5C8\uAC00",M:"\uBAA8\uD06C\uB77C",C:"CPNP"};function l(e){let t=String(e??"").trim().toUpperCase();if(!/^[A-Z0-9-]+$/.test(t))throw new Error("\uC81C\uD488\uBC88\uD638\uB294 \uC601\uBB38, \uC22B\uC790, \uD558\uC774\uD508\uC73C\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");return t}function m(e){let t=String(e??"").trim().toUpperCase().split("_");if(t.length!==4)throw new Error("\uBC11\uC904(_)\uB85C \uD655\uC815\uC6D4\xB7\uCC28\uC218, \uC81C\uD488\uBC88\uD638, \uBD80\uC790\uC7AC, \uC778\uD5C8\uAC00\uC758 \uB124 \uAD6C\uAC04\uC744 \uAD6C\uBD84\uD574 \uC8FC\uC138\uC694.");let[r,n,o,i]=t,c=/^(\d{2}(?:0[1-9]|1[0-2]))V(\d*)$/.exec(r);if(!c)throw new Error("\uCCAB \uAD6C\uAC04\uC740 \uD655\uC815 \uC5F0\uC6D4 \uB124 \uC790\uB9AC(\uC6D4 01~12), V, \uC120\uD0DD \uCC28\uC218 \uC21C\uC11C\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");let s=c[2].replace(/^0+/,"").padStart(c[2]?2:0,"0");if(s==="00")throw new Error("\uBC1C\uC8FC \uCC28\uC218\uB294 1 \uC774\uC0C1\uC758 \uC815\uC218\uB85C \uC785\uB825\uD558\uAC70\uB098 \uC0DD\uB7B5\uD574 \uC8FC\uC138\uC694.");let f=l(n);if(!Object.hasOwn(d,o))throw new Error("\uBD80\uC790\uC7AC \uAD6C\uBD84\uC740 A, B, C \uC911 \uD558\uB098\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");if(i!=="KR"&&(!/^[NMC]+$/.test(i)||new Set(i).size!==i.length))throw new Error("\uC778\uD5C8\uAC00\uC5D0\uB294 N, M, C\uB97C \uD55C \uBC88\uC529 \uC0AC\uC6A9\uD558\uAC70\uB098 \uAD6D\uB0B4 \uC804\uC6A9 KR\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");let p=i==="KR"?i:[..."NMC"].filter(x=>i.includes(x)).join(""),a=c[1],w="_"+f+"_"+o+"_"+p;return{month:a,seq:s,code:f,type:o,reg:p,key:a+"V"+w,lot:a+"V"+s+w,corrected:i!==p}}function R({month:e,seq:t="",code:r,type:n,reg:o="KR"}){if(!/^\d{2}(0[1-9]|1[0-2])$/.test(e))throw new Error("\uD655\uC815 \uC5F0\uC6D4\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.");if(t&&!/^\d+$/.test(t))throw new Error("\uBC1C\uC8FC \uCC28\uC218\uB294 1 \uC774\uC0C1\uC758 \uC815\uC218\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");return m(e+"V"+t+"_"+l(r)+"_"+n+"_"+(o||"KR"))}function _(e=new Date){return String(e.getFullYear()).slice(-2)+String(e.getMonth()+1).padStart(2,"0")}function I(e,t){return(e.filter(n=>n.key===t&&/^[0-9]+$/.test(n.seq)).reduce((n,o)=>{let i=BigInt(o.seq);return i>n?i:n},0n)+1n).toString().padStart(2,"0")}return y(M);})();

;
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
  function subscribeFreezes(uid, onChange) {
    function receive(event) {
      if (event.origin !== location.origin || event.source !== window.parent) return;
      const message = event.data;
      if (message?.type === 'lotfolio:freeze-state' && message.uid === uid &&
          (message.freezes === null || (typeof message.freezes === 'object' && !Array.isArray(message.freezes)))) {
        onChange(message.freezes);
      }
    }
    window.addEventListener('message', receive);
    send({type:'lotfolio:request-freezes'});
    return () => window.removeEventListener('message', receive);
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
  window.LotfolioFrame = {embedded, parse, view, generate, cancel, subscribeFreezes};
})();

;
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(){'use strict';(function(c,x){"object"===typeof exports&&"undefined"!==typeof module?x(exports):"function"===typeof define&&define.amd?define(["exports"],x):(c=c||self,x(c.React={}))})(this,function(c){function x(a){if(null===a||"object"!==typeof a)return null;a=V&&a[V]||a["@@iterator"];return"function"===typeof a?a:null}function w(a,b,e){this.props=a;this.context=b;this.refs=W;this.updater=e||X}function Y(){}function K(a,b,e){this.props=a;this.context=b;this.refs=W;this.updater=e||X}function Z(a,b,
e){var m,d={},c=null,h=null;if(null!=b)for(m in void 0!==b.ref&&(h=b.ref),void 0!==b.key&&(c=""+b.key),b)aa.call(b,m)&&!ba.hasOwnProperty(m)&&(d[m]=b[m]);var l=arguments.length-2;if(1===l)d.children=e;else if(1<l){for(var f=Array(l),k=0;k<l;k++)f[k]=arguments[k+2];d.children=f}if(a&&a.defaultProps)for(m in l=a.defaultProps,l)void 0===d[m]&&(d[m]=l[m]);return{$$typeof:y,type:a,key:c,ref:h,props:d,_owner:L.current}}function oa(a,b){return{$$typeof:y,type:a.type,key:b,ref:a.ref,props:a.props,_owner:a._owner}}
function M(a){return"object"===typeof a&&null!==a&&a.$$typeof===y}function pa(a){var b={"=":"=0",":":"=2"};return"$"+a.replace(/[=:]/g,function(a){return b[a]})}function N(a,b){return"object"===typeof a&&null!==a&&null!=a.key?pa(""+a.key):b.toString(36)}function B(a,b,e,m,d){var c=typeof a;if("undefined"===c||"boolean"===c)a=null;var h=!1;if(null===a)h=!0;else switch(c){case "string":case "number":h=!0;break;case "object":switch(a.$$typeof){case y:case qa:h=!0}}if(h)return h=a,d=d(h),a=""===m?"."+
N(h,0):m,ca(d)?(e="",null!=a&&(e=a.replace(da,"$&/")+"/"),B(d,b,e,"",function(a){return a})):null!=d&&(M(d)&&(d=oa(d,e+(!d.key||h&&h.key===d.key?"":(""+d.key).replace(da,"$&/")+"/")+a)),b.push(d)),1;h=0;m=""===m?".":m+":";if(ca(a))for(var l=0;l<a.length;l++){c=a[l];var f=m+N(c,l);h+=B(c,b,e,f,d)}else if(f=x(a),"function"===typeof f)for(a=f.call(a),l=0;!(c=a.next()).done;)c=c.value,f=m+N(c,l++),h+=B(c,b,e,f,d);else if("object"===c)throw b=String(a),Error("Objects are not valid as a React child (found: "+
("[object Object]"===b?"object with keys {"+Object.keys(a).join(", ")+"}":b)+"). If you meant to render a collection of children, use an array instead.");return h}function C(a,b,e){if(null==a)return a;var c=[],d=0;B(a,c,"","",function(a){return b.call(e,a,d++)});return c}function ra(a){if(-1===a._status){var b=a._result;b=b();b.then(function(b){if(0===a._status||-1===a._status)a._status=1,a._result=b},function(b){if(0===a._status||-1===a._status)a._status=2,a._result=b});-1===a._status&&(a._status=
0,a._result=b)}if(1===a._status)return a._result.default;throw a._result;}function O(a,b){var e=a.length;a.push(b);a:for(;0<e;){var c=e-1>>>1,d=a[c];if(0<D(d,b))a[c]=b,a[e]=d,e=c;else break a}}function p(a){return 0===a.length?null:a[0]}function E(a){if(0===a.length)return null;var b=a[0],e=a.pop();if(e!==b){a[0]=e;a:for(var c=0,d=a.length,k=d>>>1;c<k;){var h=2*(c+1)-1,l=a[h],f=h+1,g=a[f];if(0>D(l,e))f<d&&0>D(g,l)?(a[c]=g,a[f]=e,c=f):(a[c]=l,a[h]=e,c=h);else if(f<d&&0>D(g,e))a[c]=g,a[f]=e,c=f;else break a}}return b}
function D(a,b){var c=a.sortIndex-b.sortIndex;return 0!==c?c:a.id-b.id}function P(a){for(var b=p(r);null!==b;){if(null===b.callback)E(r);else if(b.startTime<=a)E(r),b.sortIndex=b.expirationTime,O(q,b);else break;b=p(r)}}function Q(a){z=!1;P(a);if(!u)if(null!==p(q))u=!0,R(S);else{var b=p(r);null!==b&&T(Q,b.startTime-a)}}function S(a,b){u=!1;z&&(z=!1,ea(A),A=-1);F=!0;var c=k;try{P(b);for(n=p(q);null!==n&&(!(n.expirationTime>b)||a&&!fa());){var m=n.callback;if("function"===typeof m){n.callback=null;
k=n.priorityLevel;var d=m(n.expirationTime<=b);b=v();"function"===typeof d?n.callback=d:n===p(q)&&E(q);P(b)}else E(q);n=p(q)}if(null!==n)var g=!0;else{var h=p(r);null!==h&&T(Q,h.startTime-b);g=!1}return g}finally{n=null,k=c,F=!1}}function fa(){return v()-ha<ia?!1:!0}function R(a){G=a;H||(H=!0,I())}function T(a,b){A=ja(function(){a(v())},b)}function ka(a){throw Error("act(...) is not supported in production builds of React.");}var y=Symbol.for("react.element"),qa=Symbol.for("react.portal"),sa=Symbol.for("react.fragment"),
ta=Symbol.for("react.strict_mode"),ua=Symbol.for("react.profiler"),va=Symbol.for("react.provider"),wa=Symbol.for("react.context"),xa=Symbol.for("react.forward_ref"),ya=Symbol.for("react.suspense"),za=Symbol.for("react.memo"),Aa=Symbol.for("react.lazy"),V=Symbol.iterator,X={isMounted:function(a){return!1},enqueueForceUpdate:function(a,b,c){},enqueueReplaceState:function(a,b,c,m){},enqueueSetState:function(a,b,c,m){}},la=Object.assign,W={};w.prototype.isReactComponent={};w.prototype.setState=function(a,
b){if("object"!==typeof a&&"function"!==typeof a&&null!=a)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,a,b,"setState")};w.prototype.forceUpdate=function(a){this.updater.enqueueForceUpdate(this,a,"forceUpdate")};Y.prototype=w.prototype;var t=K.prototype=new Y;t.constructor=K;la(t,w.prototype);t.isPureReactComponent=!0;var ca=Array.isArray,aa=Object.prototype.hasOwnProperty,L={current:null},
ba={key:!0,ref:!0,__self:!0,__source:!0},da=/\/+/g,g={current:null},J={transition:null};if("object"===typeof performance&&"function"===typeof performance.now){var Ba=performance;var v=function(){return Ba.now()}}else{var ma=Date,Ca=ma.now();v=function(){return ma.now()-Ca}}var q=[],r=[],Da=1,n=null,k=3,F=!1,u=!1,z=!1,ja="function"===typeof setTimeout?setTimeout:null,ea="function"===typeof clearTimeout?clearTimeout:null,na="undefined"!==typeof setImmediate?setImmediate:null;"undefined"!==typeof navigator&&
void 0!==navigator.scheduling&&void 0!==navigator.scheduling.isInputPending&&navigator.scheduling.isInputPending.bind(navigator.scheduling);var H=!1,G=null,A=-1,ia=5,ha=-1,U=function(){if(null!==G){var a=v();ha=a;var b=!0;try{b=G(!0,a)}finally{b?I():(H=!1,G=null)}}else H=!1};if("function"===typeof na)var I=function(){na(U)};else if("undefined"!==typeof MessageChannel){t=new MessageChannel;var Ea=t.port2;t.port1.onmessage=U;I=function(){Ea.postMessage(null)}}else I=function(){ja(U,0)};t={ReactCurrentDispatcher:g,
ReactCurrentOwner:L,ReactCurrentBatchConfig:J,Scheduler:{__proto__:null,unstable_ImmediatePriority:1,unstable_UserBlockingPriority:2,unstable_NormalPriority:3,unstable_IdlePriority:5,unstable_LowPriority:4,unstable_runWithPriority:function(a,b){switch(a){case 1:case 2:case 3:case 4:case 5:break;default:a=3}var c=k;k=a;try{return b()}finally{k=c}},unstable_next:function(a){switch(k){case 1:case 2:case 3:var b=3;break;default:b=k}var c=k;k=b;try{return a()}finally{k=c}},unstable_scheduleCallback:function(a,
b,c){var e=v();"object"===typeof c&&null!==c?(c=c.delay,c="number"===typeof c&&0<c?e+c:e):c=e;switch(a){case 1:var d=-1;break;case 2:d=250;break;case 5:d=1073741823;break;case 4:d=1E4;break;default:d=5E3}d=c+d;a={id:Da++,callback:b,priorityLevel:a,startTime:c,expirationTime:d,sortIndex:-1};c>e?(a.sortIndex=c,O(r,a),null===p(q)&&a===p(r)&&(z?(ea(A),A=-1):z=!0,T(Q,c-e))):(a.sortIndex=d,O(q,a),u||F||(u=!0,R(S)));return a},unstable_cancelCallback:function(a){a.callback=null},unstable_wrapCallback:function(a){var b=
k;return function(){var c=k;k=b;try{return a.apply(this,arguments)}finally{k=c}}},unstable_getCurrentPriorityLevel:function(){return k},unstable_shouldYield:fa,unstable_requestPaint:function(){},unstable_continueExecution:function(){u||F||(u=!0,R(S))},unstable_pauseExecution:function(){},unstable_getFirstCallbackNode:function(){return p(q)},get unstable_now(){return v},unstable_forceFrameRate:function(a){0>a||125<a?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):
ia=0<a?Math.floor(1E3/a):5},unstable_Profiling:null}};c.Children={map:C,forEach:function(a,b,c){C(a,function(){b.apply(this,arguments)},c)},count:function(a){var b=0;C(a,function(){b++});return b},toArray:function(a){return C(a,function(a){return a})||[]},only:function(a){if(!M(a))throw Error("React.Children.only expected to receive a single React element child.");return a}};c.Component=w;c.Fragment=sa;c.Profiler=ua;c.PureComponent=K;c.StrictMode=ta;c.Suspense=ya;c.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=
t;c.act=ka;c.cloneElement=function(a,b,c){if(null===a||void 0===a)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+a+".");var e=la({},a.props),d=a.key,k=a.ref,h=a._owner;if(null!=b){void 0!==b.ref&&(k=b.ref,h=L.current);void 0!==b.key&&(d=""+b.key);if(a.type&&a.type.defaultProps)var l=a.type.defaultProps;for(f in b)aa.call(b,f)&&!ba.hasOwnProperty(f)&&(e[f]=void 0===b[f]&&void 0!==l?l[f]:b[f])}var f=arguments.length-2;if(1===f)e.children=c;else if(1<f){l=
Array(f);for(var g=0;g<f;g++)l[g]=arguments[g+2];e.children=l}return{$$typeof:y,type:a.type,key:d,ref:k,props:e,_owner:h}};c.createContext=function(a){a={$$typeof:wa,_currentValue:a,_currentValue2:a,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null};a.Provider={$$typeof:va,_context:a};return a.Consumer=a};c.createElement=Z;c.createFactory=function(a){var b=Z.bind(null,a);b.type=a;return b};c.createRef=function(){return{current:null}};c.forwardRef=function(a){return{$$typeof:xa,
render:a}};c.isValidElement=M;c.lazy=function(a){return{$$typeof:Aa,_payload:{_status:-1,_result:a},_init:ra}};c.memo=function(a,b){return{$$typeof:za,type:a,compare:void 0===b?null:b}};c.startTransition=function(a,b){b=J.transition;J.transition={};try{a()}finally{J.transition=b}};c.unstable_act=ka;c.useCallback=function(a,b){return g.current.useCallback(a,b)};c.useContext=function(a){return g.current.useContext(a)};c.useDebugValue=function(a,b){};c.useDeferredValue=function(a){return g.current.useDeferredValue(a)};
c.useEffect=function(a,b){return g.current.useEffect(a,b)};c.useId=function(){return g.current.useId()};c.useImperativeHandle=function(a,b,c){return g.current.useImperativeHandle(a,b,c)};c.useInsertionEffect=function(a,b){return g.current.useInsertionEffect(a,b)};c.useLayoutEffect=function(a,b){return g.current.useLayoutEffect(a,b)};c.useMemo=function(a,b){return g.current.useMemo(a,b)};c.useReducer=function(a,b,c){return g.current.useReducer(a,b,c)};c.useRef=function(a){return g.current.useRef(a)};
c.useState=function(a){return g.current.useState(a)};c.useSyncExternalStore=function(a,b,c){return g.current.useSyncExternalStore(a,b,c)};c.useTransition=function(){return g.current.useTransition()};c.version="18.3.1"});
})();

;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(){/*
 Modernizr 3.0.0pre (Custom Build) | MIT
*/
'use strict';(function(Q,zb){"object"===typeof exports&&"undefined"!==typeof module?zb(exports,require("react")):"function"===typeof define&&define.amd?define(["exports","react"],zb):(Q=Q||self,zb(Q.ReactDOM={},Q.React))})(this,function(Q,zb){function m(a){for(var b="https://reactjs.org/docs/error-decoder.html?invariant="+a,c=1;c<arguments.length;c++)b+="&args[]="+encodeURIComponent(arguments[c]);return"Minified React error #"+a+"; visit "+b+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}
function mb(a,b){Ab(a,b);Ab(a+"Capture",b)}function Ab(a,b){$b[a]=b;for(a=0;a<b.length;a++)cg.add(b[a])}function bj(a){if(Zd.call(dg,a))return!0;if(Zd.call(eg,a))return!1;if(cj.test(a))return dg[a]=!0;eg[a]=!0;return!1}function dj(a,b,c,d){if(null!==c&&0===c.type)return!1;switch(typeof b){case "function":case "symbol":return!0;case "boolean":if(d)return!1;if(null!==c)return!c.acceptsBooleans;a=a.toLowerCase().slice(0,5);return"data-"!==a&&"aria-"!==a;default:return!1}}function ej(a,b,c,d){if(null===
b||"undefined"===typeof b||dj(a,b,c,d))return!0;if(d)return!1;if(null!==c)switch(c.type){case 3:return!b;case 4:return!1===b;case 5:return isNaN(b);case 6:return isNaN(b)||1>b}return!1}function Y(a,b,c,d,e,f,g){this.acceptsBooleans=2===b||3===b||4===b;this.attributeName=d;this.attributeNamespace=e;this.mustUseProperty=c;this.propertyName=a;this.type=b;this.sanitizeURL=f;this.removeEmptyString=g}function $d(a,b,c,d){var e=R.hasOwnProperty(b)?R[b]:null;if(null!==e?0!==e.type:d||!(2<b.length)||"o"!==
b[0]&&"O"!==b[0]||"n"!==b[1]&&"N"!==b[1])ej(b,c,e,d)&&(c=null),d||null===e?bj(b)&&(null===c?a.removeAttribute(b):a.setAttribute(b,""+c)):e.mustUseProperty?a[e.propertyName]=null===c?3===e.type?!1:"":c:(b=e.attributeName,d=e.attributeNamespace,null===c?a.removeAttribute(b):(e=e.type,c=3===e||4===e&&!0===c?"":""+c,d?a.setAttributeNS(d,b,c):a.setAttribute(b,c)))}function ac(a){if(null===a||"object"!==typeof a)return null;a=fg&&a[fg]||a["@@iterator"];return"function"===typeof a?a:null}function bc(a,b,
c){if(void 0===ae)try{throw Error();}catch(d){ae=(b=d.stack.trim().match(/\n( *(at )?)/))&&b[1]||""}return"\n"+ae+a}function be(a,b){if(!a||ce)return"";ce=!0;var c=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(b)if(b=function(){throw Error();},Object.defineProperty(b.prototype,"props",{set:function(){throw Error();}}),"object"===typeof Reflect&&Reflect.construct){try{Reflect.construct(b,[])}catch(n){var d=n}Reflect.construct(a,[],b)}else{try{b.call()}catch(n){d=n}a.call(b.prototype)}else{try{throw Error();
}catch(n){d=n}a()}}catch(n){if(n&&d&&"string"===typeof n.stack){for(var e=n.stack.split("\n"),f=d.stack.split("\n"),g=e.length-1,h=f.length-1;1<=g&&0<=h&&e[g]!==f[h];)h--;for(;1<=g&&0<=h;g--,h--)if(e[g]!==f[h]){if(1!==g||1!==h){do if(g--,h--,0>h||e[g]!==f[h]){var k="\n"+e[g].replace(" at new "," at ");a.displayName&&k.includes("<anonymous>")&&(k=k.replace("<anonymous>",a.displayName));return k}while(1<=g&&0<=h)}break}}}finally{ce=!1,Error.prepareStackTrace=c}return(a=a?a.displayName||a.name:"")?bc(a):
""}function fj(a){switch(a.tag){case 5:return bc(a.type);case 16:return bc("Lazy");case 13:return bc("Suspense");case 19:return bc("SuspenseList");case 0:case 2:case 15:return a=be(a.type,!1),a;case 11:return a=be(a.type.render,!1),a;case 1:return a=be(a.type,!0),a;default:return""}}function de(a){if(null==a)return null;if("function"===typeof a)return a.displayName||a.name||null;if("string"===typeof a)return a;switch(a){case Bb:return"Fragment";case Cb:return"Portal";case ee:return"Profiler";case fe:return"StrictMode";
case ge:return"Suspense";case he:return"SuspenseList"}if("object"===typeof a)switch(a.$$typeof){case gg:return(a.displayName||"Context")+".Consumer";case hg:return(a._context.displayName||"Context")+".Provider";case ie:var b=a.render;a=a.displayName;a||(a=b.displayName||b.name||"",a=""!==a?"ForwardRef("+a+")":"ForwardRef");return a;case je:return b=a.displayName||null,null!==b?b:de(a.type)||"Memo";case Ta:b=a._payload;a=a._init;try{return de(a(b))}catch(c){}}return null}function gj(a){var b=a.type;
switch(a.tag){case 24:return"Cache";case 9:return(b.displayName||"Context")+".Consumer";case 10:return(b._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return a=b.render,a=a.displayName||a.name||"",b.displayName||(""!==a?"ForwardRef("+a+")":"ForwardRef");case 7:return"Fragment";case 5:return b;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return de(b);case 8:return b===fe?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";
case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if("function"===typeof b)return b.displayName||b.name||null;if("string"===typeof b)return b}return null}function Ua(a){switch(typeof a){case "boolean":case "number":case "string":case "undefined":return a;case "object":return a;default:return""}}function ig(a){var b=a.type;return(a=a.nodeName)&&"input"===a.toLowerCase()&&("checkbox"===b||"radio"===
b)}function hj(a){var b=ig(a)?"checked":"value",c=Object.getOwnPropertyDescriptor(a.constructor.prototype,b),d=""+a[b];if(!a.hasOwnProperty(b)&&"undefined"!==typeof c&&"function"===typeof c.get&&"function"===typeof c.set){var e=c.get,f=c.set;Object.defineProperty(a,b,{configurable:!0,get:function(){return e.call(this)},set:function(a){d=""+a;f.call(this,a)}});Object.defineProperty(a,b,{enumerable:c.enumerable});return{getValue:function(){return d},setValue:function(a){d=""+a},stopTracking:function(){a._valueTracker=
null;delete a[b]}}}}function Pc(a){a._valueTracker||(a._valueTracker=hj(a))}function jg(a){if(!a)return!1;var b=a._valueTracker;if(!b)return!0;var c=b.getValue();var d="";a&&(d=ig(a)?a.checked?"true":"false":a.value);a=d;return a!==c?(b.setValue(a),!0):!1}function Qc(a){a=a||("undefined"!==typeof document?document:void 0);if("undefined"===typeof a)return null;try{return a.activeElement||a.body}catch(b){return a.body}}function ke(a,b){var c=b.checked;return E({},b,{defaultChecked:void 0,defaultValue:void 0,
value:void 0,checked:null!=c?c:a._wrapperState.initialChecked})}function kg(a,b){var c=null==b.defaultValue?"":b.defaultValue,d=null!=b.checked?b.checked:b.defaultChecked;c=Ua(null!=b.value?b.value:c);a._wrapperState={initialChecked:d,initialValue:c,controlled:"checkbox"===b.type||"radio"===b.type?null!=b.checked:null!=b.value}}function lg(a,b){b=b.checked;null!=b&&$d(a,"checked",b,!1)}function le(a,b){lg(a,b);var c=Ua(b.value),d=b.type;if(null!=c)if("number"===d){if(0===c&&""===a.value||a.value!=
c)a.value=""+c}else a.value!==""+c&&(a.value=""+c);else if("submit"===d||"reset"===d){a.removeAttribute("value");return}b.hasOwnProperty("value")?me(a,b.type,c):b.hasOwnProperty("defaultValue")&&me(a,b.type,Ua(b.defaultValue));null==b.checked&&null!=b.defaultChecked&&(a.defaultChecked=!!b.defaultChecked)}function mg(a,b,c){if(b.hasOwnProperty("value")||b.hasOwnProperty("defaultValue")){var d=b.type;if(!("submit"!==d&&"reset"!==d||void 0!==b.value&&null!==b.value))return;b=""+a._wrapperState.initialValue;
c||b===a.value||(a.value=b);a.defaultValue=b}c=a.name;""!==c&&(a.name="");a.defaultChecked=!!a._wrapperState.initialChecked;""!==c&&(a.name=c)}function me(a,b,c){if("number"!==b||Qc(a.ownerDocument)!==a)null==c?a.defaultValue=""+a._wrapperState.initialValue:a.defaultValue!==""+c&&(a.defaultValue=""+c)}function Db(a,b,c,d){a=a.options;if(b){b={};for(var e=0;e<c.length;e++)b["$"+c[e]]=!0;for(c=0;c<a.length;c++)e=b.hasOwnProperty("$"+a[c].value),a[c].selected!==e&&(a[c].selected=e),e&&d&&(a[c].defaultSelected=
!0)}else{c=""+Ua(c);b=null;for(e=0;e<a.length;e++){if(a[e].value===c){a[e].selected=!0;d&&(a[e].defaultSelected=!0);return}null!==b||a[e].disabled||(b=a[e])}null!==b&&(b.selected=!0)}}function ne(a,b){if(null!=b.dangerouslySetInnerHTML)throw Error(m(91));return E({},b,{value:void 0,defaultValue:void 0,children:""+a._wrapperState.initialValue})}function ng(a,b){var c=b.value;if(null==c){c=b.children;b=b.defaultValue;if(null!=c){if(null!=b)throw Error(m(92));if(cc(c)){if(1<c.length)throw Error(m(93));
c=c[0]}b=c}null==b&&(b="");c=b}a._wrapperState={initialValue:Ua(c)}}function og(a,b){var c=Ua(b.value),d=Ua(b.defaultValue);null!=c&&(c=""+c,c!==a.value&&(a.value=c),null==b.defaultValue&&a.defaultValue!==c&&(a.defaultValue=c));null!=d&&(a.defaultValue=""+d)}function pg(a,b){b=a.textContent;b===a._wrapperState.initialValue&&""!==b&&null!==b&&(a.value=b)}function qg(a){switch(a){case "svg":return"http://www.w3.org/2000/svg";case "math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}
function oe(a,b){return null==a||"http://www.w3.org/1999/xhtml"===a?qg(b):"http://www.w3.org/2000/svg"===a&&"foreignObject"===b?"http://www.w3.org/1999/xhtml":a}function rg(a,b,c){return null==b||"boolean"===typeof b||""===b?"":c||"number"!==typeof b||0===b||dc.hasOwnProperty(a)&&dc[a]?(""+b).trim():b+"px"}function sg(a,b){a=a.style;for(var c in b)if(b.hasOwnProperty(c)){var d=0===c.indexOf("--"),e=rg(c,b[c],d);"float"===c&&(c="cssFloat");d?a.setProperty(c,e):a[c]=e}}function pe(a,b){if(b){if(ij[a]&&
(null!=b.children||null!=b.dangerouslySetInnerHTML))throw Error(m(137,a));if(null!=b.dangerouslySetInnerHTML){if(null!=b.children)throw Error(m(60));if("object"!==typeof b.dangerouslySetInnerHTML||!("__html"in b.dangerouslySetInnerHTML))throw Error(m(61));}if(null!=b.style&&"object"!==typeof b.style)throw Error(m(62));}}function qe(a,b){if(-1===a.indexOf("-"))return"string"===typeof b.is;switch(a){case "annotation-xml":case "color-profile":case "font-face":case "font-face-src":case "font-face-uri":case "font-face-format":case "font-face-name":case "missing-glyph":return!1;
default:return!0}}function re(a){a=a.target||a.srcElement||window;a.correspondingUseElement&&(a=a.correspondingUseElement);return 3===a.nodeType?a.parentNode:a}function tg(a){if(a=ec(a)){if("function"!==typeof se)throw Error(m(280));var b=a.stateNode;b&&(b=Rc(b),se(a.stateNode,a.type,b))}}function ug(a){Eb?Fb?Fb.push(a):Fb=[a]:Eb=a}function vg(){if(Eb){var a=Eb,b=Fb;Fb=Eb=null;tg(a);if(b)for(a=0;a<b.length;a++)tg(b[a])}}function wg(a,b,c){if(te)return a(b,c);te=!0;try{return xg(a,b,c)}finally{if(te=
!1,null!==Eb||null!==Fb)yg(),vg()}}function fc(a,b){var c=a.stateNode;if(null===c)return null;var d=Rc(c);if(null===d)return null;c=d[b];a:switch(b){case "onClick":case "onClickCapture":case "onDoubleClick":case "onDoubleClickCapture":case "onMouseDown":case "onMouseDownCapture":case "onMouseMove":case "onMouseMoveCapture":case "onMouseUp":case "onMouseUpCapture":case "onMouseEnter":(d=!d.disabled)||(a=a.type,d=!("button"===a||"input"===a||"select"===a||"textarea"===a));a=!d;break a;default:a=!1}if(a)return null;
if(c&&"function"!==typeof c)throw Error(m(231,b,typeof c));return c}function jj(a,b,c,d,e,f,g,h,k){gc=!1;Sc=null;kj.apply(lj,arguments)}function mj(a,b,c,d,e,f,g,h,k){jj.apply(this,arguments);if(gc){if(gc){var n=Sc;gc=!1;Sc=null}else throw Error(m(198));Tc||(Tc=!0,ue=n)}}function nb(a){var b=a,c=a;if(a.alternate)for(;b.return;)b=b.return;else{a=b;do b=a,0!==(b.flags&4098)&&(c=b.return),a=b.return;while(a)}return 3===b.tag?c:null}function zg(a){if(13===a.tag){var b=a.memoizedState;null===b&&(a=a.alternate,
null!==a&&(b=a.memoizedState));if(null!==b)return b.dehydrated}return null}function Ag(a){if(nb(a)!==a)throw Error(m(188));}function nj(a){var b=a.alternate;if(!b){b=nb(a);if(null===b)throw Error(m(188));return b!==a?null:a}for(var c=a,d=b;;){var e=c.return;if(null===e)break;var f=e.alternate;if(null===f){d=e.return;if(null!==d){c=d;continue}break}if(e.child===f.child){for(f=e.child;f;){if(f===c)return Ag(e),a;if(f===d)return Ag(e),b;f=f.sibling}throw Error(m(188));}if(c.return!==d.return)c=e,d=f;
else{for(var g=!1,h=e.child;h;){if(h===c){g=!0;c=e;d=f;break}if(h===d){g=!0;d=e;c=f;break}h=h.sibling}if(!g){for(h=f.child;h;){if(h===c){g=!0;c=f;d=e;break}if(h===d){g=!0;d=f;c=e;break}h=h.sibling}if(!g)throw Error(m(189));}}if(c.alternate!==d)throw Error(m(190));}if(3!==c.tag)throw Error(m(188));return c.stateNode.current===c?a:b}function Bg(a){a=nj(a);return null!==a?Cg(a):null}function Cg(a){if(5===a.tag||6===a.tag)return a;for(a=a.child;null!==a;){var b=Cg(a);if(null!==b)return b;a=a.sibling}return null}
function oj(a,b){if(Ca&&"function"===typeof Ca.onCommitFiberRoot)try{Ca.onCommitFiberRoot(Uc,a,void 0,128===(a.current.flags&128))}catch(c){}}function pj(a){a>>>=0;return 0===a?32:31-(qj(a)/rj|0)|0}function hc(a){switch(a&-a){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return a&
4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return a&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return a}}function Vc(a,b){var c=a.pendingLanes;if(0===c)return 0;var d=0,e=a.suspendedLanes,f=a.pingedLanes,g=c&268435455;if(0!==g){var h=g&~e;0!==h?d=hc(h):(f&=g,0!==f&&(d=hc(f)))}else g=c&~e,0!==g?d=hc(g):0!==f&&(d=hc(f));if(0===d)return 0;if(0!==b&&b!==d&&0===(b&e)&&
(e=d&-d,f=b&-b,e>=f||16===e&&0!==(f&4194240)))return b;0!==(d&4)&&(d|=c&16);b=a.entangledLanes;if(0!==b)for(a=a.entanglements,b&=d;0<b;)c=31-ta(b),e=1<<c,d|=a[c],b&=~e;return d}function sj(a,b){switch(a){case 1:case 2:case 4:return b+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return b+5E3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;
case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function tj(a,b){for(var c=a.suspendedLanes,d=a.pingedLanes,e=a.expirationTimes,f=a.pendingLanes;0<f;){var g=31-ta(f),h=1<<g,k=e[g];if(-1===k){if(0===(h&c)||0!==(h&d))e[g]=sj(h,b)}else k<=b&&(a.expiredLanes|=h);f&=~h}}function ve(a){a=a.pendingLanes&-1073741825;return 0!==a?a:a&1073741824?1073741824:0}function Dg(){var a=Wc;Wc<<=1;0===(Wc&4194240)&&(Wc=64);return a}function we(a){for(var b=[],c=0;31>c;c++)b.push(a);
return b}function ic(a,b,c){a.pendingLanes|=b;536870912!==b&&(a.suspendedLanes=0,a.pingedLanes=0);a=a.eventTimes;b=31-ta(b);a[b]=c}function uj(a,b){var c=a.pendingLanes&~b;a.pendingLanes=b;a.suspendedLanes=0;a.pingedLanes=0;a.expiredLanes&=b;a.mutableReadLanes&=b;a.entangledLanes&=b;b=a.entanglements;var d=a.eventTimes;for(a=a.expirationTimes;0<c;){var e=31-ta(c),f=1<<e;b[e]=0;d[e]=-1;a[e]=-1;c&=~f}}function xe(a,b){var c=a.entangledLanes|=b;for(a=a.entanglements;c;){var d=31-ta(c),e=1<<d;e&b|a[d]&
b&&(a[d]|=b);c&=~e}}function Eg(a){a&=-a;return 1<a?4<a?0!==(a&268435455)?16:536870912:4:1}function Fg(a,b){switch(a){case "focusin":case "focusout":Va=null;break;case "dragenter":case "dragleave":Wa=null;break;case "mouseover":case "mouseout":Xa=null;break;case "pointerover":case "pointerout":jc.delete(b.pointerId);break;case "gotpointercapture":case "lostpointercapture":kc.delete(b.pointerId)}}function lc(a,b,c,d,e,f){if(null===a||a.nativeEvent!==f)return a={blockedOn:b,domEventName:c,eventSystemFlags:d,
nativeEvent:f,targetContainers:[e]},null!==b&&(b=ec(b),null!==b&&Gg(b)),a;a.eventSystemFlags|=d;b=a.targetContainers;null!==e&&-1===b.indexOf(e)&&b.push(e);return a}function vj(a,b,c,d,e){switch(b){case "focusin":return Va=lc(Va,a,b,c,d,e),!0;case "dragenter":return Wa=lc(Wa,a,b,c,d,e),!0;case "mouseover":return Xa=lc(Xa,a,b,c,d,e),!0;case "pointerover":var f=e.pointerId;jc.set(f,lc(jc.get(f)||null,a,b,c,d,e));return!0;case "gotpointercapture":return f=e.pointerId,kc.set(f,lc(kc.get(f)||null,a,b,
c,d,e)),!0}return!1}function Hg(a){var b=ob(a.target);if(null!==b){var c=nb(b);if(null!==c)if(b=c.tag,13===b){if(b=zg(c),null!==b){a.blockedOn=b;wj(a.priority,function(){xj(c)});return}}else if(3===b&&c.stateNode.current.memoizedState.isDehydrated){a.blockedOn=3===c.tag?c.stateNode.containerInfo:null;return}}a.blockedOn=null}function Xc(a){if(null!==a.blockedOn)return!1;for(var b=a.targetContainers;0<b.length;){var c=ye(a.domEventName,a.eventSystemFlags,b[0],a.nativeEvent);if(null===c){c=a.nativeEvent;
var d=new c.constructor(c.type,c);ze=d;c.target.dispatchEvent(d);ze=null}else return b=ec(c),null!==b&&Gg(b),a.blockedOn=c,!1;b.shift()}return!0}function Ig(a,b,c){Xc(a)&&c.delete(b)}function yj(){Ae=!1;null!==Va&&Xc(Va)&&(Va=null);null!==Wa&&Xc(Wa)&&(Wa=null);null!==Xa&&Xc(Xa)&&(Xa=null);jc.forEach(Ig);kc.forEach(Ig)}function mc(a,b){a.blockedOn===b&&(a.blockedOn=null,Ae||(Ae=!0,Jg(Kg,yj)))}function nc(a){if(0<Yc.length){mc(Yc[0],a);for(var b=1;b<Yc.length;b++){var c=Yc[b];c.blockedOn===a&&(c.blockedOn=
null)}}null!==Va&&mc(Va,a);null!==Wa&&mc(Wa,a);null!==Xa&&mc(Xa,a);b=function(b){return mc(b,a)};jc.forEach(b);kc.forEach(b);for(b=0;b<Ya.length;b++)c=Ya[b],c.blockedOn===a&&(c.blockedOn=null);for(;0<Ya.length&&(b=Ya[0],null===b.blockedOn);)Hg(b),null===b.blockedOn&&Ya.shift()}function zj(a,b,c,d){var e=z,f=Gb.transition;Gb.transition=null;try{z=1,Be(a,b,c,d)}finally{z=e,Gb.transition=f}}function Aj(a,b,c,d){var e=z,f=Gb.transition;Gb.transition=null;try{z=4,Be(a,b,c,d)}finally{z=e,Gb.transition=
f}}function Be(a,b,c,d){if(Zc){var e=ye(a,b,c,d);if(null===e)Ce(a,b,d,$c,c),Fg(a,d);else if(vj(e,a,b,c,d))d.stopPropagation();else if(Fg(a,d),b&4&&-1<Bj.indexOf(a)){for(;null!==e;){var f=ec(e);null!==f&&Cj(f);f=ye(a,b,c,d);null===f&&Ce(a,b,d,$c,c);if(f===e)break;e=f}null!==e&&d.stopPropagation()}else Ce(a,b,d,null,c)}}function ye(a,b,c,d){$c=null;a=re(d);a=ob(a);if(null!==a)if(b=nb(a),null===b)a=null;else if(c=b.tag,13===c){a=zg(b);if(null!==a)return a;a=null}else if(3===c){if(b.stateNode.current.memoizedState.isDehydrated)return 3===
b.tag?b.stateNode.containerInfo:null;a=null}else b!==a&&(a=null);$c=a;return null}function Lg(a){switch(a){case "cancel":case "click":case "close":case "contextmenu":case "copy":case "cut":case "auxclick":case "dblclick":case "dragend":case "dragstart":case "drop":case "focusin":case "focusout":case "input":case "invalid":case "keydown":case "keypress":case "keyup":case "mousedown":case "mouseup":case "paste":case "pause":case "play":case "pointercancel":case "pointerdown":case "pointerup":case "ratechange":case "reset":case "resize":case "seeked":case "submit":case "touchcancel":case "touchend":case "touchstart":case "volumechange":case "change":case "selectionchange":case "textInput":case "compositionstart":case "compositionend":case "compositionupdate":case "beforeblur":case "afterblur":case "beforeinput":case "blur":case "fullscreenchange":case "focus":case "hashchange":case "popstate":case "select":case "selectstart":return 1;
case "drag":case "dragenter":case "dragexit":case "dragleave":case "dragover":case "mousemove":case "mouseout":case "mouseover":case "pointermove":case "pointerout":case "pointerover":case "scroll":case "toggle":case "touchmove":case "wheel":case "mouseenter":case "mouseleave":case "pointerenter":case "pointerleave":return 4;case "message":switch(Dj()){case De:return 1;case Mg:return 4;case ad:case Ej:return 16;case Ng:return 536870912;default:return 16}default:return 16}}function Og(){if(bd)return bd;
var a,b=Ee,c=b.length,d,e="value"in Za?Za.value:Za.textContent,f=e.length;for(a=0;a<c&&b[a]===e[a];a++);var g=c-a;for(d=1;d<=g&&b[c-d]===e[f-d];d++);return bd=e.slice(a,1<d?1-d:void 0)}function cd(a){var b=a.keyCode;"charCode"in a?(a=a.charCode,0===a&&13===b&&(a=13)):a=b;10===a&&(a=13);return 32<=a||13===a?a:0}function dd(){return!0}function Pg(){return!1}function ka(a){function b(b,d,e,f,g){this._reactName=b;this._targetInst=e;this.type=d;this.nativeEvent=f;this.target=g;this.currentTarget=null;
for(var c in a)a.hasOwnProperty(c)&&(b=a[c],this[c]=b?b(f):f[c]);this.isDefaultPrevented=(null!=f.defaultPrevented?f.defaultPrevented:!1===f.returnValue)?dd:Pg;this.isPropagationStopped=Pg;return this}E(b.prototype,{preventDefault:function(){this.defaultPrevented=!0;var a=this.nativeEvent;a&&(a.preventDefault?a.preventDefault():"unknown"!==typeof a.returnValue&&(a.returnValue=!1),this.isDefaultPrevented=dd)},stopPropagation:function(){var a=this.nativeEvent;a&&(a.stopPropagation?a.stopPropagation():
"unknown"!==typeof a.cancelBubble&&(a.cancelBubble=!0),this.isPropagationStopped=dd)},persist:function(){},isPersistent:dd});return b}function Fj(a){var b=this.nativeEvent;return b.getModifierState?b.getModifierState(a):(a=Gj[a])?!!b[a]:!1}function Fe(a){return Fj}function Qg(a,b){switch(a){case "keyup":return-1!==Hj.indexOf(b.keyCode);case "keydown":return 229!==b.keyCode;case "keypress":case "mousedown":case "focusout":return!0;default:return!1}}function Rg(a){a=a.detail;return"object"===typeof a&&
"data"in a?a.data:null}function Ij(a,b){switch(a){case "compositionend":return Rg(b);case "keypress":if(32!==b.which)return null;Sg=!0;return Tg;case "textInput":return a=b.data,a===Tg&&Sg?null:a;default:return null}}function Jj(a,b){if(Hb)return"compositionend"===a||!Ge&&Qg(a,b)?(a=Og(),bd=Ee=Za=null,Hb=!1,a):null;switch(a){case "paste":return null;case "keypress":if(!(b.ctrlKey||b.altKey||b.metaKey)||b.ctrlKey&&b.altKey){if(b.char&&1<b.char.length)return b.char;if(b.which)return String.fromCharCode(b.which)}return null;
case "compositionend":return Ug&&"ko"!==b.locale?null:b.data;default:return null}}function Vg(a){var b=a&&a.nodeName&&a.nodeName.toLowerCase();return"input"===b?!!Kj[a.type]:"textarea"===b?!0:!1}function Lj(a){if(!Ia)return!1;a="on"+a;var b=a in document;b||(b=document.createElement("div"),b.setAttribute(a,"return;"),b="function"===typeof b[a]);return b}function Wg(a,b,c,d){ug(d);b=ed(b,"onChange");0<b.length&&(c=new He("onChange","change",null,c,d),a.push({event:c,listeners:b}))}function Mj(a){Xg(a,
0)}function fd(a){var b=Ib(a);if(jg(b))return a}function Nj(a,b){if("change"===a)return b}function Yg(){oc&&(oc.detachEvent("onpropertychange",Zg),pc=oc=null)}function Zg(a){if("value"===a.propertyName&&fd(pc)){var b=[];Wg(b,pc,a,re(a));wg(Mj,b)}}function Oj(a,b,c){"focusin"===a?(Yg(),oc=b,pc=c,oc.attachEvent("onpropertychange",Zg)):"focusout"===a&&Yg()}function Pj(a,b){if("selectionchange"===a||"keyup"===a||"keydown"===a)return fd(pc)}function Qj(a,b){if("click"===a)return fd(b)}function Rj(a,b){if("input"===
a||"change"===a)return fd(b)}function Sj(a,b){return a===b&&(0!==a||1/a===1/b)||a!==a&&b!==b}function qc(a,b){if(ua(a,b))return!0;if("object"!==typeof a||null===a||"object"!==typeof b||null===b)return!1;var c=Object.keys(a),d=Object.keys(b);if(c.length!==d.length)return!1;for(d=0;d<c.length;d++){var e=c[d];if(!Zd.call(b,e)||!ua(a[e],b[e]))return!1}return!0}function $g(a){for(;a&&a.firstChild;)a=a.firstChild;return a}function ah(a,b){var c=$g(a);a=0;for(var d;c;){if(3===c.nodeType){d=a+c.textContent.length;
if(a<=b&&d>=b)return{node:c,offset:b-a};a=d}a:{for(;c;){if(c.nextSibling){c=c.nextSibling;break a}c=c.parentNode}c=void 0}c=$g(c)}}function bh(a,b){return a&&b?a===b?!0:a&&3===a.nodeType?!1:b&&3===b.nodeType?bh(a,b.parentNode):"contains"in a?a.contains(b):a.compareDocumentPosition?!!(a.compareDocumentPosition(b)&16):!1:!1}function ch(){for(var a=window,b=Qc();b instanceof a.HTMLIFrameElement;){try{var c="string"===typeof b.contentWindow.location.href}catch(d){c=!1}if(c)a=b.contentWindow;else break;
b=Qc(a.document)}return b}function Ie(a){var b=a&&a.nodeName&&a.nodeName.toLowerCase();return b&&("input"===b&&("text"===a.type||"search"===a.type||"tel"===a.type||"url"===a.type||"password"===a.type)||"textarea"===b||"true"===a.contentEditable)}function Tj(a){var b=ch(),c=a.focusedElem,d=a.selectionRange;if(b!==c&&c&&c.ownerDocument&&bh(c.ownerDocument.documentElement,c)){if(null!==d&&Ie(c))if(b=d.start,a=d.end,void 0===a&&(a=b),"selectionStart"in c)c.selectionStart=b,c.selectionEnd=Math.min(a,c.value.length);
else if(a=(b=c.ownerDocument||document)&&b.defaultView||window,a.getSelection){a=a.getSelection();var e=c.textContent.length,f=Math.min(d.start,e);d=void 0===d.end?f:Math.min(d.end,e);!a.extend&&f>d&&(e=d,d=f,f=e);e=ah(c,f);var g=ah(c,d);e&&g&&(1!==a.rangeCount||a.anchorNode!==e.node||a.anchorOffset!==e.offset||a.focusNode!==g.node||a.focusOffset!==g.offset)&&(b=b.createRange(),b.setStart(e.node,e.offset),a.removeAllRanges(),f>d?(a.addRange(b),a.extend(g.node,g.offset)):(b.setEnd(g.node,g.offset),
a.addRange(b)))}b=[];for(a=c;a=a.parentNode;)1===a.nodeType&&b.push({element:a,left:a.scrollLeft,top:a.scrollTop});"function"===typeof c.focus&&c.focus();for(c=0;c<b.length;c++)a=b[c],a.element.scrollLeft=a.left,a.element.scrollTop=a.top}}function dh(a,b,c){var d=c.window===c?c.document:9===c.nodeType?c:c.ownerDocument;Je||null==Jb||Jb!==Qc(d)||(d=Jb,"selectionStart"in d&&Ie(d)?d={start:d.selectionStart,end:d.selectionEnd}:(d=(d.ownerDocument&&d.ownerDocument.defaultView||window).getSelection(),d=
{anchorNode:d.anchorNode,anchorOffset:d.anchorOffset,focusNode:d.focusNode,focusOffset:d.focusOffset}),rc&&qc(rc,d)||(rc=d,d=ed(Ke,"onSelect"),0<d.length&&(b=new He("onSelect","select",null,b,c),a.push({event:b,listeners:d}),b.target=Jb)))}function gd(a,b){var c={};c[a.toLowerCase()]=b.toLowerCase();c["Webkit"+a]="webkit"+b;c["Moz"+a]="moz"+b;return c}function hd(a){if(Le[a])return Le[a];if(!Kb[a])return a;var b=Kb[a],c;for(c in b)if(b.hasOwnProperty(c)&&c in eh)return Le[a]=b[c];return a}function $a(a,
b){fh.set(a,b);mb(b,[a])}function gh(a,b,c){var d=a.type||"unknown-event";a.currentTarget=c;mj(d,b,void 0,a);a.currentTarget=null}function Xg(a,b){b=0!==(b&4);for(var c=0;c<a.length;c++){var d=a[c],e=d.event;d=d.listeners;a:{var f=void 0;if(b)for(var g=d.length-1;0<=g;g--){var h=d[g],k=h.instance,n=h.currentTarget;h=h.listener;if(k!==f&&e.isPropagationStopped())break a;gh(e,h,n);f=k}else for(g=0;g<d.length;g++){h=d[g];k=h.instance;n=h.currentTarget;h=h.listener;if(k!==f&&e.isPropagationStopped())break a;
gh(e,h,n);f=k}}}if(Tc)throw a=ue,Tc=!1,ue=null,a;}function B(a,b){var c=b[Me];void 0===c&&(c=b[Me]=new Set);var d=a+"__bubble";c.has(d)||(hh(b,a,2,!1),c.add(d))}function Ne(a,b,c){var d=0;b&&(d|=4);hh(c,a,d,b)}function sc(a){if(!a[id]){a[id]=!0;cg.forEach(function(b){"selectionchange"!==b&&(Uj.has(b)||Ne(b,!1,a),Ne(b,!0,a))});var b=9===a.nodeType?a:a.ownerDocument;null===b||b[id]||(b[id]=!0,Ne("selectionchange",!1,b))}}function hh(a,b,c,d,e){switch(Lg(b)){case 1:e=zj;break;case 4:e=Aj;break;default:e=
Be}c=e.bind(null,b,c,a);e=void 0;!Oe||"touchstart"!==b&&"touchmove"!==b&&"wheel"!==b||(e=!0);d?void 0!==e?a.addEventListener(b,c,{capture:!0,passive:e}):a.addEventListener(b,c,!0):void 0!==e?a.addEventListener(b,c,{passive:e}):a.addEventListener(b,c,!1)}function Ce(a,b,c,d,e){var f=d;if(0===(b&1)&&0===(b&2)&&null!==d)a:for(;;){if(null===d)return;var g=d.tag;if(3===g||4===g){var h=d.stateNode.containerInfo;if(h===e||8===h.nodeType&&h.parentNode===e)break;if(4===g)for(g=d.return;null!==g;){var k=g.tag;
if(3===k||4===k)if(k=g.stateNode.containerInfo,k===e||8===k.nodeType&&k.parentNode===e)return;g=g.return}for(;null!==h;){g=ob(h);if(null===g)return;k=g.tag;if(5===k||6===k){d=f=g;continue a}h=h.parentNode}}d=d.return}wg(function(){var d=f,e=re(c),g=[];a:{var h=fh.get(a);if(void 0!==h){var k=He,m=a;switch(a){case "keypress":if(0===cd(c))break a;case "keydown":case "keyup":k=Vj;break;case "focusin":m="focus";k=Pe;break;case "focusout":m="blur";k=Pe;break;case "beforeblur":case "afterblur":k=Pe;break;
case "click":if(2===c.button)break a;case "auxclick":case "dblclick":case "mousedown":case "mousemove":case "mouseup":case "mouseout":case "mouseover":case "contextmenu":k=ih;break;case "drag":case "dragend":case "dragenter":case "dragexit":case "dragleave":case "dragover":case "dragstart":case "drop":k=Wj;break;case "touchcancel":case "touchend":case "touchmove":case "touchstart":k=Xj;break;case jh:case kh:case lh:k=Yj;break;case mh:k=Zj;break;case "scroll":k=ak;break;case "wheel":k=bk;break;case "copy":case "cut":case "paste":k=
ck;break;case "gotpointercapture":case "lostpointercapture":case "pointercancel":case "pointerdown":case "pointermove":case "pointerout":case "pointerover":case "pointerup":k=nh}var l=0!==(b&4),p=!l&&"scroll"===a,w=l?null!==h?h+"Capture":null:h;l=[];for(var A=d,t;null!==A;){t=A;var M=t.stateNode;5===t.tag&&null!==M&&(t=M,null!==w&&(M=fc(A,w),null!=M&&l.push(tc(A,M,t))));if(p)break;A=A.return}0<l.length&&(h=new k(h,m,null,c,e),g.push({event:h,listeners:l}))}}if(0===(b&7)){a:{h="mouseover"===a||"pointerover"===
a;k="mouseout"===a||"pointerout"===a;if(h&&c!==ze&&(m=c.relatedTarget||c.fromElement)&&(ob(m)||m[Ja]))break a;if(k||h){h=e.window===e?e:(h=e.ownerDocument)?h.defaultView||h.parentWindow:window;if(k){if(m=c.relatedTarget||c.toElement,k=d,m=m?ob(m):null,null!==m&&(p=nb(m),m!==p||5!==m.tag&&6!==m.tag))m=null}else k=null,m=d;if(k!==m){l=ih;M="onMouseLeave";w="onMouseEnter";A="mouse";if("pointerout"===a||"pointerover"===a)l=nh,M="onPointerLeave",w="onPointerEnter",A="pointer";p=null==k?h:Ib(k);t=null==
m?h:Ib(m);h=new l(M,A+"leave",k,c,e);h.target=p;h.relatedTarget=t;M=null;ob(e)===d&&(l=new l(w,A+"enter",m,c,e),l.target=t,l.relatedTarget=p,M=l);p=M;if(k&&m)b:{l=k;w=m;A=0;for(t=l;t;t=Lb(t))A++;t=0;for(M=w;M;M=Lb(M))t++;for(;0<A-t;)l=Lb(l),A--;for(;0<t-A;)w=Lb(w),t--;for(;A--;){if(l===w||null!==w&&l===w.alternate)break b;l=Lb(l);w=Lb(w)}l=null}else l=null;null!==k&&oh(g,h,k,l,!1);null!==m&&null!==p&&oh(g,p,m,l,!0)}}}a:{h=d?Ib(d):window;k=h.nodeName&&h.nodeName.toLowerCase();if("select"===k||"input"===
k&&"file"===h.type)var ma=Nj;else if(Vg(h))if(ph)ma=Rj;else{ma=Pj;var va=Oj}else(k=h.nodeName)&&"input"===k.toLowerCase()&&("checkbox"===h.type||"radio"===h.type)&&(ma=Qj);if(ma&&(ma=ma(a,d))){Wg(g,ma,c,e);break a}va&&va(a,h,d);"focusout"===a&&(va=h._wrapperState)&&va.controlled&&"number"===h.type&&me(h,"number",h.value)}va=d?Ib(d):window;switch(a){case "focusin":if(Vg(va)||"true"===va.contentEditable)Jb=va,Ke=d,rc=null;break;case "focusout":rc=Ke=Jb=null;break;case "mousedown":Je=!0;break;case "contextmenu":case "mouseup":case "dragend":Je=
!1;dh(g,c,e);break;case "selectionchange":if(dk)break;case "keydown":case "keyup":dh(g,c,e)}var ab;if(Ge)b:{switch(a){case "compositionstart":var da="onCompositionStart";break b;case "compositionend":da="onCompositionEnd";break b;case "compositionupdate":da="onCompositionUpdate";break b}da=void 0}else Hb?Qg(a,c)&&(da="onCompositionEnd"):"keydown"===a&&229===c.keyCode&&(da="onCompositionStart");da&&(Ug&&"ko"!==c.locale&&(Hb||"onCompositionStart"!==da?"onCompositionEnd"===da&&Hb&&(ab=Og()):(Za=e,Ee=
"value"in Za?Za.value:Za.textContent,Hb=!0)),va=ed(d,da),0<va.length&&(da=new qh(da,a,null,c,e),g.push({event:da,listeners:va}),ab?da.data=ab:(ab=Rg(c),null!==ab&&(da.data=ab))));if(ab=ek?Ij(a,c):Jj(a,c))d=ed(d,"onBeforeInput"),0<d.length&&(e=new fk("onBeforeInput","beforeinput",null,c,e),g.push({event:e,listeners:d}),e.data=ab)}Xg(g,b)})}function tc(a,b,c){return{instance:a,listener:b,currentTarget:c}}function ed(a,b){for(var c=b+"Capture",d=[];null!==a;){var e=a,f=e.stateNode;5===e.tag&&null!==
f&&(e=f,f=fc(a,c),null!=f&&d.unshift(tc(a,f,e)),f=fc(a,b),null!=f&&d.push(tc(a,f,e)));a=a.return}return d}function Lb(a){if(null===a)return null;do a=a.return;while(a&&5!==a.tag);return a?a:null}function oh(a,b,c,d,e){for(var f=b._reactName,g=[];null!==c&&c!==d;){var h=c,k=h.alternate,n=h.stateNode;if(null!==k&&k===d)break;5===h.tag&&null!==n&&(h=n,e?(k=fc(c,f),null!=k&&g.unshift(tc(c,k,h))):e||(k=fc(c,f),null!=k&&g.push(tc(c,k,h))));c=c.return}0!==g.length&&a.push({event:b,listeners:g})}function rh(a){return("string"===
typeof a?a:""+a).replace(gk,"\n").replace(hk,"")}function jd(a,b,c,d){b=rh(b);if(rh(a)!==b&&c)throw Error(m(425));}function kd(){}function Qe(a,b){return"textarea"===a||"noscript"===a||"string"===typeof b.children||"number"===typeof b.children||"object"===typeof b.dangerouslySetInnerHTML&&null!==b.dangerouslySetInnerHTML&&null!=b.dangerouslySetInnerHTML.__html}function ik(a){setTimeout(function(){throw a;})}function Re(a,b){var c=b,d=0;do{var e=c.nextSibling;a.removeChild(c);if(e&&8===e.nodeType)if(c=
e.data,"/$"===c){if(0===d){a.removeChild(e);nc(b);return}d--}else"$"!==c&&"$?"!==c&&"$!"!==c||d++;c=e}while(c);nc(b)}function Ka(a){for(;null!=a;a=a.nextSibling){var b=a.nodeType;if(1===b||3===b)break;if(8===b){b=a.data;if("$"===b||"$!"===b||"$?"===b)break;if("/$"===b)return null}}return a}function sh(a){a=a.previousSibling;for(var b=0;a;){if(8===a.nodeType){var c=a.data;if("$"===c||"$!"===c||"$?"===c){if(0===b)return a;b--}else"/$"===c&&b++}a=a.previousSibling}return null}function ob(a){var b=a[Da];
if(b)return b;for(var c=a.parentNode;c;){if(b=c[Ja]||c[Da]){c=b.alternate;if(null!==b.child||null!==c&&null!==c.child)for(a=sh(a);null!==a;){if(c=a[Da])return c;a=sh(a)}return b}a=c;c=a.parentNode}return null}function ec(a){a=a[Da]||a[Ja];return!a||5!==a.tag&&6!==a.tag&&13!==a.tag&&3!==a.tag?null:a}function Ib(a){if(5===a.tag||6===a.tag)return a.stateNode;throw Error(m(33));}function Rc(a){return a[uc]||null}function bb(a){return{current:a}}function v(a,b){0>Mb||(a.current=Se[Mb],Se[Mb]=null,Mb--)}
function y(a,b,c){Mb++;Se[Mb]=a.current;a.current=b}function Nb(a,b){var c=a.type.contextTypes;if(!c)return cb;var d=a.stateNode;if(d&&d.__reactInternalMemoizedUnmaskedChildContext===b)return d.__reactInternalMemoizedMaskedChildContext;var e={},f;for(f in c)e[f]=b[f];d&&(a=a.stateNode,a.__reactInternalMemoizedUnmaskedChildContext=b,a.__reactInternalMemoizedMaskedChildContext=e);return e}function ea(a){a=a.childContextTypes;return null!==a&&void 0!==a}function th(a,b,c){if(J.current!==cb)throw Error(m(168));
y(J,b);y(S,c)}function uh(a,b,c){var d=a.stateNode;b=b.childContextTypes;if("function"!==typeof d.getChildContext)return c;d=d.getChildContext();for(var e in d)if(!(e in b))throw Error(m(108,gj(a)||"Unknown",e));return E({},c,d)}function ld(a){a=(a=a.stateNode)&&a.__reactInternalMemoizedMergedChildContext||cb;pb=J.current;y(J,a);y(S,S.current);return!0}function vh(a,b,c){var d=a.stateNode;if(!d)throw Error(m(169));c?(a=uh(a,b,pb),d.__reactInternalMemoizedMergedChildContext=a,v(S),v(J),y(J,a)):v(S);
y(S,c)}function wh(a){null===La?La=[a]:La.push(a)}function jk(a){md=!0;wh(a)}function db(){if(!Te&&null!==La){Te=!0;var a=0,b=z;try{var c=La;for(z=1;a<c.length;a++){var d=c[a];do d=d(!0);while(null!==d)}La=null;md=!1}catch(e){throw null!==La&&(La=La.slice(a+1)),xh(De,db),e;}finally{z=b,Te=!1}}return null}function qb(a,b){Ob[Pb++]=nd;Ob[Pb++]=od;od=a;nd=b}function yh(a,b,c){na[oa++]=Ma;na[oa++]=Na;na[oa++]=rb;rb=a;var d=Ma;a=Na;var e=32-ta(d)-1;d&=~(1<<e);c+=1;var f=32-ta(b)+e;if(30<f){var g=e-e%5;
f=(d&(1<<g)-1).toString(32);d>>=g;e-=g;Ma=1<<32-ta(b)+e|c<<e|d;Na=f+a}else Ma=1<<f|c<<e|d,Na=a}function Ue(a){null!==a.return&&(qb(a,1),yh(a,1,0))}function Ve(a){for(;a===od;)od=Ob[--Pb],Ob[Pb]=null,nd=Ob[--Pb],Ob[Pb]=null;for(;a===rb;)rb=na[--oa],na[oa]=null,Na=na[--oa],na[oa]=null,Ma=na[--oa],na[oa]=null}function zh(a,b){var c=pa(5,null,null,0);c.elementType="DELETED";c.stateNode=b;c.return=a;b=a.deletions;null===b?(a.deletions=[c],a.flags|=16):b.push(c)}function Ah(a,b){switch(a.tag){case 5:var c=
a.type;b=1!==b.nodeType||c.toLowerCase()!==b.nodeName.toLowerCase()?null:b;return null!==b?(a.stateNode=b,la=a,fa=Ka(b.firstChild),!0):!1;case 6:return b=""===a.pendingProps||3!==b.nodeType?null:b,null!==b?(a.stateNode=b,la=a,fa=null,!0):!1;case 13:return b=8!==b.nodeType?null:b,null!==b?(c=null!==rb?{id:Ma,overflow:Na}:null,a.memoizedState={dehydrated:b,treeContext:c,retryLane:1073741824},c=pa(18,null,null,0),c.stateNode=b,c.return=a,a.child=c,la=a,fa=null,!0):!1;default:return!1}}function We(a){return 0!==
(a.mode&1)&&0===(a.flags&128)}function Xe(a){if(D){var b=fa;if(b){var c=b;if(!Ah(a,b)){if(We(a))throw Error(m(418));b=Ka(c.nextSibling);var d=la;b&&Ah(a,b)?zh(d,c):(a.flags=a.flags&-4097|2,D=!1,la=a)}}else{if(We(a))throw Error(m(418));a.flags=a.flags&-4097|2;D=!1;la=a}}}function Bh(a){for(a=a.return;null!==a&&5!==a.tag&&3!==a.tag&&13!==a.tag;)a=a.return;la=a}function pd(a){if(a!==la)return!1;if(!D)return Bh(a),D=!0,!1;var b;(b=3!==a.tag)&&!(b=5!==a.tag)&&(b=a.type,b="head"!==b&&"body"!==b&&!Qe(a.type,
a.memoizedProps));if(b&&(b=fa)){if(We(a)){for(a=fa;a;)a=Ka(a.nextSibling);throw Error(m(418));}for(;b;)zh(a,b),b=Ka(b.nextSibling)}Bh(a);if(13===a.tag){a=a.memoizedState;a=null!==a?a.dehydrated:null;if(!a)throw Error(m(317));a:{a=a.nextSibling;for(b=0;a;){if(8===a.nodeType){var c=a.data;if("/$"===c){if(0===b){fa=Ka(a.nextSibling);break a}b--}else"$"!==c&&"$!"!==c&&"$?"!==c||b++}a=a.nextSibling}fa=null}}else fa=la?Ka(a.stateNode.nextSibling):null;return!0}function Qb(){fa=la=null;D=!1}function Ye(a){null===
wa?wa=[a]:wa.push(a)}function vc(a,b,c){a=c.ref;if(null!==a&&"function"!==typeof a&&"object"!==typeof a){if(c._owner){c=c._owner;if(c){if(1!==c.tag)throw Error(m(309));var d=c.stateNode}if(!d)throw Error(m(147,a));var e=d,f=""+a;if(null!==b&&null!==b.ref&&"function"===typeof b.ref&&b.ref._stringRef===f)return b.ref;b=function(a){var b=e.refs;null===a?delete b[f]:b[f]=a};b._stringRef=f;return b}if("string"!==typeof a)throw Error(m(284));if(!c._owner)throw Error(m(290,a));}return a}function qd(a,b){a=
Object.prototype.toString.call(b);throw Error(m(31,"[object Object]"===a?"object with keys {"+Object.keys(b).join(", ")+"}":a));}function Ch(a){var b=a._init;return b(a._payload)}function Dh(a){function b(b,c){if(a){var d=b.deletions;null===d?(b.deletions=[c],b.flags|=16):d.push(c)}}function c(c,d){if(!a)return null;for(;null!==d;)b(c,d),d=d.sibling;return null}function d(a,b){for(a=new Map;null!==b;)null!==b.key?a.set(b.key,b):a.set(b.index,b),b=b.sibling;return a}function e(a,b){a=eb(a,b);a.index=
0;a.sibling=null;return a}function f(b,c,d){b.index=d;if(!a)return b.flags|=1048576,c;d=b.alternate;if(null!==d)return d=d.index,d<c?(b.flags|=2,c):d;b.flags|=2;return c}function g(b){a&&null===b.alternate&&(b.flags|=2);return b}function h(a,b,c,d){if(null===b||6!==b.tag)return b=Ze(c,a.mode,d),b.return=a,b;b=e(b,c);b.return=a;return b}function k(a,b,c,d){var f=c.type;if(f===Bb)return l(a,b,c.props.children,d,c.key);if(null!==b&&(b.elementType===f||"object"===typeof f&&null!==f&&f.$$typeof===Ta&&
Ch(f)===b.type))return d=e(b,c.props),d.ref=vc(a,b,c),d.return=a,d;d=rd(c.type,c.key,c.props,null,a.mode,d);d.ref=vc(a,b,c);d.return=a;return d}function n(a,b,c,d){if(null===b||4!==b.tag||b.stateNode.containerInfo!==c.containerInfo||b.stateNode.implementation!==c.implementation)return b=$e(c,a.mode,d),b.return=a,b;b=e(b,c.children||[]);b.return=a;return b}function l(a,b,c,d,f){if(null===b||7!==b.tag)return b=sb(c,a.mode,d,f),b.return=a,b;b=e(b,c);b.return=a;return b}function u(a,b,c){if("string"===
typeof b&&""!==b||"number"===typeof b)return b=Ze(""+b,a.mode,c),b.return=a,b;if("object"===typeof b&&null!==b){switch(b.$$typeof){case sd:return c=rd(b.type,b.key,b.props,null,a.mode,c),c.ref=vc(a,null,b),c.return=a,c;case Cb:return b=$e(b,a.mode,c),b.return=a,b;case Ta:var d=b._init;return u(a,d(b._payload),c)}if(cc(b)||ac(b))return b=sb(b,a.mode,c,null),b.return=a,b;qd(a,b)}return null}function r(a,b,c,d){var e=null!==b?b.key:null;if("string"===typeof c&&""!==c||"number"===typeof c)return null!==
e?null:h(a,b,""+c,d);if("object"===typeof c&&null!==c){switch(c.$$typeof){case sd:return c.key===e?k(a,b,c,d):null;case Cb:return c.key===e?n(a,b,c,d):null;case Ta:return e=c._init,r(a,b,e(c._payload),d)}if(cc(c)||ac(c))return null!==e?null:l(a,b,c,d,null);qd(a,c)}return null}function p(a,b,c,d,e){if("string"===typeof d&&""!==d||"number"===typeof d)return a=a.get(c)||null,h(b,a,""+d,e);if("object"===typeof d&&null!==d){switch(d.$$typeof){case sd:return a=a.get(null===d.key?c:d.key)||null,k(b,a,d,
e);case Cb:return a=a.get(null===d.key?c:d.key)||null,n(b,a,d,e);case Ta:var f=d._init;return p(a,b,c,f(d._payload),e)}if(cc(d)||ac(d))return a=a.get(c)||null,l(b,a,d,e,null);qd(b,d)}return null}function x(e,g,h,k){for(var n=null,m=null,l=g,t=g=0,q=null;null!==l&&t<h.length;t++){l.index>t?(q=l,l=null):q=l.sibling;var A=r(e,l,h[t],k);if(null===A){null===l&&(l=q);break}a&&l&&null===A.alternate&&b(e,l);g=f(A,g,t);null===m?n=A:m.sibling=A;m=A;l=q}if(t===h.length)return c(e,l),D&&qb(e,t),n;if(null===l){for(;t<
h.length;t++)l=u(e,h[t],k),null!==l&&(g=f(l,g,t),null===m?n=l:m.sibling=l,m=l);D&&qb(e,t);return n}for(l=d(e,l);t<h.length;t++)q=p(l,e,t,h[t],k),null!==q&&(a&&null!==q.alternate&&l.delete(null===q.key?t:q.key),g=f(q,g,t),null===m?n=q:m.sibling=q,m=q);a&&l.forEach(function(a){return b(e,a)});D&&qb(e,t);return n}function I(e,g,h,k){var n=ac(h);if("function"!==typeof n)throw Error(m(150));h=n.call(h);if(null==h)throw Error(m(151));for(var l=n=null,q=g,t=g=0,A=null,w=h.next();null!==q&&!w.done;t++,w=
h.next()){q.index>t?(A=q,q=null):A=q.sibling;var x=r(e,q,w.value,k);if(null===x){null===q&&(q=A);break}a&&q&&null===x.alternate&&b(e,q);g=f(x,g,t);null===l?n=x:l.sibling=x;l=x;q=A}if(w.done)return c(e,q),D&&qb(e,t),n;if(null===q){for(;!w.done;t++,w=h.next())w=u(e,w.value,k),null!==w&&(g=f(w,g,t),null===l?n=w:l.sibling=w,l=w);D&&qb(e,t);return n}for(q=d(e,q);!w.done;t++,w=h.next())w=p(q,e,t,w.value,k),null!==w&&(a&&null!==w.alternate&&q.delete(null===w.key?t:w.key),g=f(w,g,t),null===l?n=w:l.sibling=
w,l=w);a&&q.forEach(function(a){return b(e,a)});D&&qb(e,t);return n}function v(a,d,f,h){"object"===typeof f&&null!==f&&f.type===Bb&&null===f.key&&(f=f.props.children);if("object"===typeof f&&null!==f){switch(f.$$typeof){case sd:a:{for(var k=f.key,n=d;null!==n;){if(n.key===k){k=f.type;if(k===Bb){if(7===n.tag){c(a,n.sibling);d=e(n,f.props.children);d.return=a;a=d;break a}}else if(n.elementType===k||"object"===typeof k&&null!==k&&k.$$typeof===Ta&&Ch(k)===n.type){c(a,n.sibling);d=e(n,f.props);d.ref=vc(a,
n,f);d.return=a;a=d;break a}c(a,n);break}else b(a,n);n=n.sibling}f.type===Bb?(d=sb(f.props.children,a.mode,h,f.key),d.return=a,a=d):(h=rd(f.type,f.key,f.props,null,a.mode,h),h.ref=vc(a,d,f),h.return=a,a=h)}return g(a);case Cb:a:{for(n=f.key;null!==d;){if(d.key===n)if(4===d.tag&&d.stateNode.containerInfo===f.containerInfo&&d.stateNode.implementation===f.implementation){c(a,d.sibling);d=e(d,f.children||[]);d.return=a;a=d;break a}else{c(a,d);break}else b(a,d);d=d.sibling}d=$e(f,a.mode,h);d.return=a;
a=d}return g(a);case Ta:return n=f._init,v(a,d,n(f._payload),h)}if(cc(f))return x(a,d,f,h);if(ac(f))return I(a,d,f,h);qd(a,f)}return"string"===typeof f&&""!==f||"number"===typeof f?(f=""+f,null!==d&&6===d.tag?(c(a,d.sibling),d=e(d,f),d.return=a,a=d):(c(a,d),d=Ze(f,a.mode,h),d.return=a,a=d),g(a)):c(a,d)}return v}function af(){bf=Rb=td=null}function cf(a,b){b=ud.current;v(ud);a._currentValue=b}function df(a,b,c){for(;null!==a;){var d=a.alternate;(a.childLanes&b)!==b?(a.childLanes|=b,null!==d&&(d.childLanes|=
b)):null!==d&&(d.childLanes&b)!==b&&(d.childLanes|=b);if(a===c)break;a=a.return}}function Sb(a,b){td=a;bf=Rb=null;a=a.dependencies;null!==a&&null!==a.firstContext&&(0!==(a.lanes&b)&&(ha=!0),a.firstContext=null)}function qa(a){var b=a._currentValue;if(bf!==a)if(a={context:a,memoizedValue:b,next:null},null===Rb){if(null===td)throw Error(m(308));Rb=a;td.dependencies={lanes:0,firstContext:a}}else Rb=Rb.next=a;return b}function ef(a){null===tb?tb=[a]:tb.push(a)}function Eh(a,b,c,d){var e=b.interleaved;
null===e?(c.next=c,ef(b)):(c.next=e.next,e.next=c);b.interleaved=c;return Oa(a,d)}function Oa(a,b){a.lanes|=b;var c=a.alternate;null!==c&&(c.lanes|=b);c=a;for(a=a.return;null!==a;)a.childLanes|=b,c=a.alternate,null!==c&&(c.childLanes|=b),c=a,a=a.return;return 3===c.tag?c.stateNode:null}function ff(a){a.updateQueue={baseState:a.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function Fh(a,b){a=a.updateQueue;b.updateQueue===a&&(b.updateQueue=
{baseState:a.baseState,firstBaseUpdate:a.firstBaseUpdate,lastBaseUpdate:a.lastBaseUpdate,shared:a.shared,effects:a.effects})}function Pa(a,b){return{eventTime:a,lane:b,tag:0,payload:null,callback:null,next:null}}function fb(a,b,c){var d=a.updateQueue;if(null===d)return null;d=d.shared;if(0!==(p&2)){var e=d.pending;null===e?b.next=b:(b.next=e.next,e.next=b);d.pending=b;return kk(a,c)}e=d.interleaved;null===e?(b.next=b,ef(d)):(b.next=e.next,e.next=b);d.interleaved=b;return Oa(a,c)}function vd(a,b,c){b=
b.updateQueue;if(null!==b&&(b=b.shared,0!==(c&4194240))){var d=b.lanes;d&=a.pendingLanes;c|=d;b.lanes=c;xe(a,c)}}function Gh(a,b){var c=a.updateQueue,d=a.alternate;if(null!==d&&(d=d.updateQueue,c===d)){var e=null,f=null;c=c.firstBaseUpdate;if(null!==c){do{var g={eventTime:c.eventTime,lane:c.lane,tag:c.tag,payload:c.payload,callback:c.callback,next:null};null===f?e=f=g:f=f.next=g;c=c.next}while(null!==c);null===f?e=f=b:f=f.next=b}else e=f=b;c={baseState:d.baseState,firstBaseUpdate:e,lastBaseUpdate:f,
shared:d.shared,effects:d.effects};a.updateQueue=c;return}a=c.lastBaseUpdate;null===a?c.firstBaseUpdate=b:a.next=b;c.lastBaseUpdate=b}function wd(a,b,c,d){var e=a.updateQueue;gb=!1;var f=e.firstBaseUpdate,g=e.lastBaseUpdate,h=e.shared.pending;if(null!==h){e.shared.pending=null;var k=h,n=k.next;k.next=null;null===g?f=n:g.next=n;g=k;var l=a.alternate;null!==l&&(l=l.updateQueue,h=l.lastBaseUpdate,h!==g&&(null===h?l.firstBaseUpdate=n:h.next=n,l.lastBaseUpdate=k))}if(null!==f){var m=e.baseState;g=0;l=
n=k=null;h=f;do{var r=h.lane,p=h.eventTime;if((d&r)===r){null!==l&&(l=l.next={eventTime:p,lane:0,tag:h.tag,payload:h.payload,callback:h.callback,next:null});a:{var x=a,v=h;r=b;p=c;switch(v.tag){case 1:x=v.payload;if("function"===typeof x){m=x.call(p,m,r);break a}m=x;break a;case 3:x.flags=x.flags&-65537|128;case 0:x=v.payload;r="function"===typeof x?x.call(p,m,r):x;if(null===r||void 0===r)break a;m=E({},m,r);break a;case 2:gb=!0}}null!==h.callback&&0!==h.lane&&(a.flags|=64,r=e.effects,null===r?e.effects=
[h]:r.push(h))}else p={eventTime:p,lane:r,tag:h.tag,payload:h.payload,callback:h.callback,next:null},null===l?(n=l=p,k=m):l=l.next=p,g|=r;h=h.next;if(null===h)if(h=e.shared.pending,null===h)break;else r=h,h=r.next,r.next=null,e.lastBaseUpdate=r,e.shared.pending=null}while(1);null===l&&(k=m);e.baseState=k;e.firstBaseUpdate=n;e.lastBaseUpdate=l;b=e.shared.interleaved;if(null!==b){e=b;do g|=e.lane,e=e.next;while(e!==b)}else null===f&&(e.shared.lanes=0);ra|=g;a.lanes=g;a.memoizedState=m}}function Hh(a,
b,c){a=b.effects;b.effects=null;if(null!==a)for(b=0;b<a.length;b++){var d=a[b],e=d.callback;if(null!==e){d.callback=null;d=c;if("function"!==typeof e)throw Error(m(191,e));e.call(d)}}}function ub(a){if(a===wc)throw Error(m(174));return a}function gf(a,b){y(xc,b);y(yc,a);y(Ea,wc);a=b.nodeType;switch(a){case 9:case 11:b=(b=b.documentElement)?b.namespaceURI:oe(null,"");break;default:a=8===a?b.parentNode:b,b=a.namespaceURI||null,a=a.tagName,b=oe(b,a)}v(Ea);y(Ea,b)}function Tb(a){v(Ea);v(yc);v(xc)}function Ih(a){ub(xc.current);
var b=ub(Ea.current);var c=oe(b,a.type);b!==c&&(y(yc,a),y(Ea,c))}function hf(a){yc.current===a&&(v(Ea),v(yc))}function xd(a){for(var b=a;null!==b;){if(13===b.tag){var c=b.memoizedState;if(null!==c&&(c=c.dehydrated,null===c||"$?"===c.data||"$!"===c.data))return b}else if(19===b.tag&&void 0!==b.memoizedProps.revealOrder){if(0!==(b.flags&128))return b}else if(null!==b.child){b.child.return=b;b=b.child;continue}if(b===a)break;for(;null===b.sibling;){if(null===b.return||b.return===a)return null;b=b.return}b.sibling.return=
b.return;b=b.sibling}return null}function jf(){for(var a=0;a<kf.length;a++)kf[a]._workInProgressVersionPrimary=null;kf.length=0}function V(){throw Error(m(321));}function lf(a,b){if(null===b)return!1;for(var c=0;c<b.length&&c<a.length;c++)if(!ua(a[c],b[c]))return!1;return!0}function mf(a,b,c,d,e,f){vb=f;C=b;b.memoizedState=null;b.updateQueue=null;b.lanes=0;yd.current=null===a||null===a.memoizedState?lk:mk;a=c(d,e);if(zc){f=0;do{zc=!1;Ac=0;if(25<=f)throw Error(m(301));f+=1;N=K=null;b.updateQueue=null;
yd.current=nk;a=c(d,e)}while(zc)}yd.current=zd;b=null!==K&&null!==K.next;vb=0;N=K=C=null;Ad=!1;if(b)throw Error(m(300));return a}function nf(){var a=0!==Ac;Ac=0;return a}function Fa(){var a={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};null===N?C.memoizedState=N=a:N=N.next=a;return N}function sa(){if(null===K){var a=C.alternate;a=null!==a?a.memoizedState:null}else a=K.next;var b=null===N?C.memoizedState:N.next;if(null!==b)N=b,K=a;else{if(null===a)throw Error(m(310));K=a;
a={memoizedState:K.memoizedState,baseState:K.baseState,baseQueue:K.baseQueue,queue:K.queue,next:null};null===N?C.memoizedState=N=a:N=N.next=a}return N}function Bc(a,b){return"function"===typeof b?b(a):b}function of(a,b,c){b=sa();c=b.queue;if(null===c)throw Error(m(311));c.lastRenderedReducer=a;var d=K,e=d.baseQueue,f=c.pending;if(null!==f){if(null!==e){var g=e.next;e.next=f.next;f.next=g}d.baseQueue=e=f;c.pending=null}if(null!==e){f=e.next;d=d.baseState;var h=g=null,k=null,n=f;do{var l=n.lane;if((vb&
l)===l)null!==k&&(k=k.next={lane:0,action:n.action,hasEagerState:n.hasEagerState,eagerState:n.eagerState,next:null}),d=n.hasEagerState?n.eagerState:a(d,n.action);else{var u={lane:l,action:n.action,hasEagerState:n.hasEagerState,eagerState:n.eagerState,next:null};null===k?(h=k=u,g=d):k=k.next=u;C.lanes|=l;ra|=l}n=n.next}while(null!==n&&n!==f);null===k?g=d:k.next=h;ua(d,b.memoizedState)||(ha=!0);b.memoizedState=d;b.baseState=g;b.baseQueue=k;c.lastRenderedState=d}a=c.interleaved;if(null!==a){e=a;do f=
e.lane,C.lanes|=f,ra|=f,e=e.next;while(e!==a)}else null===e&&(c.lanes=0);return[b.memoizedState,c.dispatch]}function pf(a,b,c){b=sa();c=b.queue;if(null===c)throw Error(m(311));c.lastRenderedReducer=a;var d=c.dispatch,e=c.pending,f=b.memoizedState;if(null!==e){c.pending=null;var g=e=e.next;do f=a(f,g.action),g=g.next;while(g!==e);ua(f,b.memoizedState)||(ha=!0);b.memoizedState=f;null===b.baseQueue&&(b.baseState=f);c.lastRenderedState=f}return[f,d]}function Jh(a,b,c){}function Kh(a,b,c){c=C;var d=sa(),
e=b(),f=!ua(d.memoizedState,e);f&&(d.memoizedState=e,ha=!0);d=d.queue;qf(Lh.bind(null,c,d,a),[a]);if(d.getSnapshot!==b||f||null!==N&&N.memoizedState.tag&1){c.flags|=2048;Cc(9,Mh.bind(null,c,d,e,b),void 0,null);if(null===O)throw Error(m(349));0!==(vb&30)||Nh(c,b,e)}return e}function Nh(a,b,c){a.flags|=16384;a={getSnapshot:b,value:c};b=C.updateQueue;null===b?(b={lastEffect:null,stores:null},C.updateQueue=b,b.stores=[a]):(c=b.stores,null===c?b.stores=[a]:c.push(a))}function Mh(a,b,c,d){b.value=c;b.getSnapshot=
d;Oh(b)&&Ph(a)}function Lh(a,b,c){return c(function(){Oh(b)&&Ph(a)})}function Oh(a){var b=a.getSnapshot;a=a.value;try{var c=b();return!ua(a,c)}catch(d){return!0}}function Ph(a){var b=Oa(a,1);null!==b&&xa(b,a,1,-1)}function Qh(a){var b=Fa();"function"===typeof a&&(a=a());b.memoizedState=b.baseState=a;a={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:Bc,lastRenderedState:a};b.queue=a;a=a.dispatch=ok.bind(null,C,a);return[b.memoizedState,a]}function Cc(a,b,c,d){a={tag:a,create:b,
destroy:c,deps:d,next:null};b=C.updateQueue;null===b?(b={lastEffect:null,stores:null},C.updateQueue=b,b.lastEffect=a.next=a):(c=b.lastEffect,null===c?b.lastEffect=a.next=a:(d=c.next,c.next=a,a.next=d,b.lastEffect=a));return a}function Rh(a){return sa().memoizedState}function Bd(a,b,c,d){var e=Fa();C.flags|=a;e.memoizedState=Cc(1|b,c,void 0,void 0===d?null:d)}function Cd(a,b,c,d){var e=sa();d=void 0===d?null:d;var f=void 0;if(null!==K){var g=K.memoizedState;f=g.destroy;if(null!==d&&lf(d,g.deps)){e.memoizedState=
Cc(b,c,f,d);return}}C.flags|=a;e.memoizedState=Cc(1|b,c,f,d)}function Sh(a,b){return Bd(8390656,8,a,b)}function qf(a,b){return Cd(2048,8,a,b)}function Th(a,b){return Cd(4,2,a,b)}function Uh(a,b){return Cd(4,4,a,b)}function Vh(a,b){if("function"===typeof b)return a=a(),b(a),function(){b(null)};if(null!==b&&void 0!==b)return a=a(),b.current=a,function(){b.current=null}}function Wh(a,b,c){c=null!==c&&void 0!==c?c.concat([a]):null;return Cd(4,4,Vh.bind(null,b,a),c)}function rf(a,b){}function Xh(a,b){var c=
sa();b=void 0===b?null:b;var d=c.memoizedState;if(null!==d&&null!==b&&lf(b,d[1]))return d[0];c.memoizedState=[a,b];return a}function Yh(a,b){var c=sa();b=void 0===b?null:b;var d=c.memoizedState;if(null!==d&&null!==b&&lf(b,d[1]))return d[0];a=a();c.memoizedState=[a,b];return a}function Zh(a,b,c){if(0===(vb&21))return a.baseState&&(a.baseState=!1,ha=!0),a.memoizedState=c;ua(c,b)||(c=Dg(),C.lanes|=c,ra|=c,a.baseState=!0);return b}function pk(a,b,c){c=z;z=0!==c&&4>c?c:4;a(!0);var d=sf.transition;sf.transition=
{};try{a(!1),b()}finally{z=c,sf.transition=d}}function $h(){return sa().memoizedState}function qk(a,b,c){var d=hb(a);c={lane:d,action:c,hasEagerState:!1,eagerState:null,next:null};if(ai(a))bi(b,c);else if(c=Eh(a,b,c,d),null!==c){var e=Z();xa(c,a,d,e);ci(c,b,d)}}function ok(a,b,c){var d=hb(a),e={lane:d,action:c,hasEagerState:!1,eagerState:null,next:null};if(ai(a))bi(b,e);else{var f=a.alternate;if(0===a.lanes&&(null===f||0===f.lanes)&&(f=b.lastRenderedReducer,null!==f))try{var g=b.lastRenderedState,
h=f(g,c);e.hasEagerState=!0;e.eagerState=h;if(ua(h,g)){var k=b.interleaved;null===k?(e.next=e,ef(b)):(e.next=k.next,k.next=e);b.interleaved=e;return}}catch(n){}finally{}c=Eh(a,b,e,d);null!==c&&(e=Z(),xa(c,a,d,e),ci(c,b,d))}}function ai(a){var b=a.alternate;return a===C||null!==b&&b===C}function bi(a,b){zc=Ad=!0;var c=a.pending;null===c?b.next=b:(b.next=c.next,c.next=b);a.pending=b}function ci(a,b,c){if(0!==(c&4194240)){var d=b.lanes;d&=a.pendingLanes;c|=d;b.lanes=c;xe(a,c)}}function ya(a,b){if(a&&
a.defaultProps){b=E({},b);a=a.defaultProps;for(var c in a)void 0===b[c]&&(b[c]=a[c]);return b}return b}function tf(a,b,c,d){b=a.memoizedState;c=c(d,b);c=null===c||void 0===c?b:E({},b,c);a.memoizedState=c;0===a.lanes&&(a.updateQueue.baseState=c)}function di(a,b,c,d,e,f,g){a=a.stateNode;return"function"===typeof a.shouldComponentUpdate?a.shouldComponentUpdate(d,f,g):b.prototype&&b.prototype.isPureReactComponent?!qc(c,d)||!qc(e,f):!0}function ei(a,b,c){var d=!1,e=cb;var f=b.contextType;"object"===typeof f&&
null!==f?f=qa(f):(e=ea(b)?pb:J.current,d=b.contextTypes,f=(d=null!==d&&void 0!==d)?Nb(a,e):cb);b=new b(c,f);a.memoizedState=null!==b.state&&void 0!==b.state?b.state:null;b.updater=Dd;a.stateNode=b;b._reactInternals=a;d&&(a=a.stateNode,a.__reactInternalMemoizedUnmaskedChildContext=e,a.__reactInternalMemoizedMaskedChildContext=f);return b}function fi(a,b,c,d){a=b.state;"function"===typeof b.componentWillReceiveProps&&b.componentWillReceiveProps(c,d);"function"===typeof b.UNSAFE_componentWillReceiveProps&&
b.UNSAFE_componentWillReceiveProps(c,d);b.state!==a&&Dd.enqueueReplaceState(b,b.state,null)}function uf(a,b,c,d){var e=a.stateNode;e.props=c;e.state=a.memoizedState;e.refs={};ff(a);var f=b.contextType;"object"===typeof f&&null!==f?e.context=qa(f):(f=ea(b)?pb:J.current,e.context=Nb(a,f));e.state=a.memoizedState;f=b.getDerivedStateFromProps;"function"===typeof f&&(tf(a,b,f,c),e.state=a.memoizedState);"function"===typeof b.getDerivedStateFromProps||"function"===typeof e.getSnapshotBeforeUpdate||"function"!==
typeof e.UNSAFE_componentWillMount&&"function"!==typeof e.componentWillMount||(b=e.state,"function"===typeof e.componentWillMount&&e.componentWillMount(),"function"===typeof e.UNSAFE_componentWillMount&&e.UNSAFE_componentWillMount(),b!==e.state&&Dd.enqueueReplaceState(e,e.state,null),wd(a,c,e,d),e.state=a.memoizedState);"function"===typeof e.componentDidMount&&(a.flags|=4194308)}function Ub(a,b){try{var c="",d=b;do c+=fj(d),d=d.return;while(d);var e=c}catch(f){e="\nError generating stack: "+f.message+
"\n"+f.stack}return{value:a,source:b,stack:e,digest:null}}function vf(a,b,c){return{value:a,source:null,stack:null!=c?c:null,digest:null!=b?b:null}}function wf(a,b){try{console.error(b.value)}catch(c){setTimeout(function(){throw c;})}}function gi(a,b,c){c=Pa(-1,c);c.tag=3;c.payload={element:null};var d=b.value;c.callback=function(){Ed||(Ed=!0,xf=d);wf(a,b)};return c}function hi(a,b,c){c=Pa(-1,c);c.tag=3;var d=a.type.getDerivedStateFromError;if("function"===typeof d){var e=b.value;c.payload=function(){return d(e)};
c.callback=function(){wf(a,b)}}var f=a.stateNode;null!==f&&"function"===typeof f.componentDidCatch&&(c.callback=function(){wf(a,b);"function"!==typeof d&&(null===ib?ib=new Set([this]):ib.add(this));var c=b.stack;this.componentDidCatch(b.value,{componentStack:null!==c?c:""})});return c}function ii(a,b,c){var d=a.pingCache;if(null===d){d=a.pingCache=new rk;var e=new Set;d.set(b,e)}else e=d.get(b),void 0===e&&(e=new Set,d.set(b,e));e.has(c)||(e.add(c),a=sk.bind(null,a,b,c),b.then(a,a))}function ji(a){do{var b;
if(b=13===a.tag)b=a.memoizedState,b=null!==b?null!==b.dehydrated?!0:!1:!0;if(b)return a;a=a.return}while(null!==a);return null}function ki(a,b,c,d,e){if(0===(a.mode&1))return a===b?a.flags|=65536:(a.flags|=128,c.flags|=131072,c.flags&=-52805,1===c.tag&&(null===c.alternate?c.tag=17:(b=Pa(-1,1),b.tag=2,fb(c,b,1))),c.lanes|=1),a;a.flags|=65536;a.lanes=e;return a}function aa(a,b,c,d){b.child=null===a?li(b,null,c,d):Vb(b,a.child,c,d)}function mi(a,b,c,d,e){c=c.render;var f=b.ref;Sb(b,e);d=mf(a,b,c,d,f,
e);c=nf();if(null!==a&&!ha)return b.updateQueue=a.updateQueue,b.flags&=-2053,a.lanes&=~e,Qa(a,b,e);D&&c&&Ue(b);b.flags|=1;aa(a,b,d,e);return b.child}function ni(a,b,c,d,e){if(null===a){var f=c.type;if("function"===typeof f&&!yf(f)&&void 0===f.defaultProps&&null===c.compare&&void 0===c.defaultProps)return b.tag=15,b.type=f,oi(a,b,f,d,e);a=rd(c.type,null,d,b,b.mode,e);a.ref=b.ref;a.return=b;return b.child=a}f=a.child;if(0===(a.lanes&e)){var g=f.memoizedProps;c=c.compare;c=null!==c?c:qc;if(c(g,d)&&a.ref===
b.ref)return Qa(a,b,e)}b.flags|=1;a=eb(f,d);a.ref=b.ref;a.return=b;return b.child=a}function oi(a,b,c,d,e){if(null!==a){var f=a.memoizedProps;if(qc(f,d)&&a.ref===b.ref)if(ha=!1,b.pendingProps=d=f,0!==(a.lanes&e))0!==(a.flags&131072)&&(ha=!0);else return b.lanes=a.lanes,Qa(a,b,e)}return zf(a,b,c,d,e)}function pi(a,b,c){var d=b.pendingProps,e=d.children,f=null!==a?a.memoizedState:null;if("hidden"===d.mode)if(0===(b.mode&1))b.memoizedState={baseLanes:0,cachePool:null,transitions:null},y(Ga,ba),ba|=c;
else{if(0===(c&1073741824))return a=null!==f?f.baseLanes|c:c,b.lanes=b.childLanes=1073741824,b.memoizedState={baseLanes:a,cachePool:null,transitions:null},b.updateQueue=null,y(Ga,ba),ba|=a,null;b.memoizedState={baseLanes:0,cachePool:null,transitions:null};d=null!==f?f.baseLanes:c;y(Ga,ba);ba|=d}else null!==f?(d=f.baseLanes|c,b.memoizedState=null):d=c,y(Ga,ba),ba|=d;aa(a,b,e,c);return b.child}function qi(a,b){var c=b.ref;if(null===a&&null!==c||null!==a&&a.ref!==c)b.flags|=512,b.flags|=2097152}function zf(a,
b,c,d,e){var f=ea(c)?pb:J.current;f=Nb(b,f);Sb(b,e);c=mf(a,b,c,d,f,e);d=nf();if(null!==a&&!ha)return b.updateQueue=a.updateQueue,b.flags&=-2053,a.lanes&=~e,Qa(a,b,e);D&&d&&Ue(b);b.flags|=1;aa(a,b,c,e);return b.child}function ri(a,b,c,d,e){if(ea(c)){var f=!0;ld(b)}else f=!1;Sb(b,e);if(null===b.stateNode)Fd(a,b),ei(b,c,d),uf(b,c,d,e),d=!0;else if(null===a){var g=b.stateNode,h=b.memoizedProps;g.props=h;var k=g.context,n=c.contextType;"object"===typeof n&&null!==n?n=qa(n):(n=ea(c)?pb:J.current,n=Nb(b,
n));var l=c.getDerivedStateFromProps,m="function"===typeof l||"function"===typeof g.getSnapshotBeforeUpdate;m||"function"!==typeof g.UNSAFE_componentWillReceiveProps&&"function"!==typeof g.componentWillReceiveProps||(h!==d||k!==n)&&fi(b,g,d,n);gb=!1;var r=b.memoizedState;g.state=r;wd(b,d,g,e);k=b.memoizedState;h!==d||r!==k||S.current||gb?("function"===typeof l&&(tf(b,c,l,d),k=b.memoizedState),(h=gb||di(b,c,h,d,r,k,n))?(m||"function"!==typeof g.UNSAFE_componentWillMount&&"function"!==typeof g.componentWillMount||
("function"===typeof g.componentWillMount&&g.componentWillMount(),"function"===typeof g.UNSAFE_componentWillMount&&g.UNSAFE_componentWillMount()),"function"===typeof g.componentDidMount&&(b.flags|=4194308)):("function"===typeof g.componentDidMount&&(b.flags|=4194308),b.memoizedProps=d,b.memoizedState=k),g.props=d,g.state=k,g.context=n,d=h):("function"===typeof g.componentDidMount&&(b.flags|=4194308),d=!1)}else{g=b.stateNode;Fh(a,b);h=b.memoizedProps;n=b.type===b.elementType?h:ya(b.type,h);g.props=
n;m=b.pendingProps;r=g.context;k=c.contextType;"object"===typeof k&&null!==k?k=qa(k):(k=ea(c)?pb:J.current,k=Nb(b,k));var p=c.getDerivedStateFromProps;(l="function"===typeof p||"function"===typeof g.getSnapshotBeforeUpdate)||"function"!==typeof g.UNSAFE_componentWillReceiveProps&&"function"!==typeof g.componentWillReceiveProps||(h!==m||r!==k)&&fi(b,g,d,k);gb=!1;r=b.memoizedState;g.state=r;wd(b,d,g,e);var x=b.memoizedState;h!==m||r!==x||S.current||gb?("function"===typeof p&&(tf(b,c,p,d),x=b.memoizedState),
(n=gb||di(b,c,n,d,r,x,k)||!1)?(l||"function"!==typeof g.UNSAFE_componentWillUpdate&&"function"!==typeof g.componentWillUpdate||("function"===typeof g.componentWillUpdate&&g.componentWillUpdate(d,x,k),"function"===typeof g.UNSAFE_componentWillUpdate&&g.UNSAFE_componentWillUpdate(d,x,k)),"function"===typeof g.componentDidUpdate&&(b.flags|=4),"function"===typeof g.getSnapshotBeforeUpdate&&(b.flags|=1024)):("function"!==typeof g.componentDidUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=
4),"function"!==typeof g.getSnapshotBeforeUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=1024),b.memoizedProps=d,b.memoizedState=x),g.props=d,g.state=x,g.context=k,d=n):("function"!==typeof g.componentDidUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=4),"function"!==typeof g.getSnapshotBeforeUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=1024),d=!1)}return Af(a,b,c,d,f,e)}function Af(a,b,c,d,e,f){qi(a,b);var g=0!==(b.flags&128);if(!d&&!g)return e&&vh(b,c,!1),
Qa(a,b,f);d=b.stateNode;tk.current=b;var h=g&&"function"!==typeof c.getDerivedStateFromError?null:d.render();b.flags|=1;null!==a&&g?(b.child=Vb(b,a.child,null,f),b.child=Vb(b,null,h,f)):aa(a,b,h,f);b.memoizedState=d.state;e&&vh(b,c,!0);return b.child}function si(a){var b=a.stateNode;b.pendingContext?th(a,b.pendingContext,b.pendingContext!==b.context):b.context&&th(a,b.context,!1);gf(a,b.containerInfo)}function ti(a,b,c,d,e){Qb();Ye(e);b.flags|=256;aa(a,b,c,d);return b.child}function Bf(a){return{baseLanes:a,
cachePool:null,transitions:null}}function ui(a,b,c){var d=b.pendingProps,e=F.current,f=!1,g=0!==(b.flags&128),h;(h=g)||(h=null!==a&&null===a.memoizedState?!1:0!==(e&2));if(h)f=!0,b.flags&=-129;else if(null===a||null!==a.memoizedState)e|=1;y(F,e&1);if(null===a){Xe(b);a=b.memoizedState;if(null!==a&&(a=a.dehydrated,null!==a))return 0===(b.mode&1)?b.lanes=1:"$!"===a.data?b.lanes=8:b.lanes=1073741824,null;g=d.children;a=d.fallback;return f?(d=b.mode,f=b.child,g={mode:"hidden",children:g},0===(d&1)&&null!==
f?(f.childLanes=0,f.pendingProps=g):f=Gd(g,d,0,null),a=sb(a,d,c,null),f.return=b,a.return=b,f.sibling=a,b.child=f,b.child.memoizedState=Bf(c),b.memoizedState=Cf,a):Df(b,g)}e=a.memoizedState;if(null!==e&&(h=e.dehydrated,null!==h))return uk(a,b,g,d,h,e,c);if(f){f=d.fallback;g=b.mode;e=a.child;h=e.sibling;var k={mode:"hidden",children:d.children};0===(g&1)&&b.child!==e?(d=b.child,d.childLanes=0,d.pendingProps=k,b.deletions=null):(d=eb(e,k),d.subtreeFlags=e.subtreeFlags&14680064);null!==h?f=eb(h,f):(f=
sb(f,g,c,null),f.flags|=2);f.return=b;d.return=b;d.sibling=f;b.child=d;d=f;f=b.child;g=a.child.memoizedState;g=null===g?Bf(c):{baseLanes:g.baseLanes|c,cachePool:null,transitions:g.transitions};f.memoizedState=g;f.childLanes=a.childLanes&~c;b.memoizedState=Cf;return d}f=a.child;a=f.sibling;d=eb(f,{mode:"visible",children:d.children});0===(b.mode&1)&&(d.lanes=c);d.return=b;d.sibling=null;null!==a&&(c=b.deletions,null===c?(b.deletions=[a],b.flags|=16):c.push(a));b.child=d;b.memoizedState=null;return d}
function Df(a,b,c){b=Gd({mode:"visible",children:b},a.mode,0,null);b.return=a;return a.child=b}function Hd(a,b,c,d){null!==d&&Ye(d);Vb(b,a.child,null,c);a=Df(b,b.pendingProps.children);a.flags|=2;b.memoizedState=null;return a}function uk(a,b,c,d,e,f,g){if(c){if(b.flags&256)return b.flags&=-257,d=vf(Error(m(422))),Hd(a,b,g,d);if(null!==b.memoizedState)return b.child=a.child,b.flags|=128,null;f=d.fallback;e=b.mode;d=Gd({mode:"visible",children:d.children},e,0,null);f=sb(f,e,g,null);f.flags|=2;d.return=
b;f.return=b;d.sibling=f;b.child=d;0!==(b.mode&1)&&Vb(b,a.child,null,g);b.child.memoizedState=Bf(g);b.memoizedState=Cf;return f}if(0===(b.mode&1))return Hd(a,b,g,null);if("$!"===e.data){d=e.nextSibling&&e.nextSibling.dataset;if(d)var h=d.dgst;d=h;f=Error(m(419));d=vf(f,d,void 0);return Hd(a,b,g,d)}h=0!==(g&a.childLanes);if(ha||h){d=O;if(null!==d){switch(g&-g){case 4:e=2;break;case 16:e=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:e=
32;break;case 536870912:e=268435456;break;default:e=0}e=0!==(e&(d.suspendedLanes|g))?0:e;0!==e&&e!==f.retryLane&&(f.retryLane=e,Oa(a,e),xa(d,a,e,-1))}Ef();d=vf(Error(m(421)));return Hd(a,b,g,d)}if("$?"===e.data)return b.flags|=128,b.child=a.child,b=vk.bind(null,a),e._reactRetry=b,null;a=f.treeContext;fa=Ka(e.nextSibling);la=b;D=!0;wa=null;null!==a&&(na[oa++]=Ma,na[oa++]=Na,na[oa++]=rb,Ma=a.id,Na=a.overflow,rb=b);b=Df(b,d.children);b.flags|=4096;return b}function vi(a,b,c){a.lanes|=b;var d=a.alternate;
null!==d&&(d.lanes|=b);df(a.return,b,c)}function Ff(a,b,c,d,e){var f=a.memoizedState;null===f?a.memoizedState={isBackwards:b,rendering:null,renderingStartTime:0,last:d,tail:c,tailMode:e}:(f.isBackwards=b,f.rendering=null,f.renderingStartTime=0,f.last=d,f.tail=c,f.tailMode=e)}function wi(a,b,c){var d=b.pendingProps,e=d.revealOrder,f=d.tail;aa(a,b,d.children,c);d=F.current;if(0!==(d&2))d=d&1|2,b.flags|=128;else{if(null!==a&&0!==(a.flags&128))a:for(a=b.child;null!==a;){if(13===a.tag)null!==a.memoizedState&&
vi(a,c,b);else if(19===a.tag)vi(a,c,b);else if(null!==a.child){a.child.return=a;a=a.child;continue}if(a===b)break a;for(;null===a.sibling;){if(null===a.return||a.return===b)break a;a=a.return}a.sibling.return=a.return;a=a.sibling}d&=1}y(F,d);if(0===(b.mode&1))b.memoizedState=null;else switch(e){case "forwards":c=b.child;for(e=null;null!==c;)a=c.alternate,null!==a&&null===xd(a)&&(e=c),c=c.sibling;c=e;null===c?(e=b.child,b.child=null):(e=c.sibling,c.sibling=null);Ff(b,!1,e,c,f);break;case "backwards":c=
null;e=b.child;for(b.child=null;null!==e;){a=e.alternate;if(null!==a&&null===xd(a)){b.child=e;break}a=e.sibling;e.sibling=c;c=e;e=a}Ff(b,!0,c,null,f);break;case "together":Ff(b,!1,null,null,void 0);break;default:b.memoizedState=null}return b.child}function Fd(a,b){0===(b.mode&1)&&null!==a&&(a.alternate=null,b.alternate=null,b.flags|=2)}function Qa(a,b,c){null!==a&&(b.dependencies=a.dependencies);ra|=b.lanes;if(0===(c&b.childLanes))return null;if(null!==a&&b.child!==a.child)throw Error(m(153));if(null!==
b.child){a=b.child;c=eb(a,a.pendingProps);b.child=c;for(c.return=b;null!==a.sibling;)a=a.sibling,c=c.sibling=eb(a,a.pendingProps),c.return=b;c.sibling=null}return b.child}function wk(a,b,c){switch(b.tag){case 3:si(b);Qb();break;case 5:Ih(b);break;case 1:ea(b.type)&&ld(b);break;case 4:gf(b,b.stateNode.containerInfo);break;case 10:var d=b.type._context,e=b.memoizedProps.value;y(ud,d._currentValue);d._currentValue=e;break;case 13:d=b.memoizedState;if(null!==d){if(null!==d.dehydrated)return y(F,F.current&
1),b.flags|=128,null;if(0!==(c&b.child.childLanes))return ui(a,b,c);y(F,F.current&1);a=Qa(a,b,c);return null!==a?a.sibling:null}y(F,F.current&1);break;case 19:d=0!==(c&b.childLanes);if(0!==(a.flags&128)){if(d)return wi(a,b,c);b.flags|=128}e=b.memoizedState;null!==e&&(e.rendering=null,e.tail=null,e.lastEffect=null);y(F,F.current);if(d)break;else return null;case 22:case 23:return b.lanes=0,pi(a,b,c)}return Qa(a,b,c)}function Dc(a,b){if(!D)switch(a.tailMode){case "hidden":b=a.tail;for(var c=null;null!==
b;)null!==b.alternate&&(c=b),b=b.sibling;null===c?a.tail=null:c.sibling=null;break;case "collapsed":c=a.tail;for(var d=null;null!==c;)null!==c.alternate&&(d=c),c=c.sibling;null===d?b||null===a.tail?a.tail=null:a.tail.sibling=null:d.sibling=null}}function W(a){var b=null!==a.alternate&&a.alternate.child===a.child,c=0,d=0;if(b)for(var e=a.child;null!==e;)c|=e.lanes|e.childLanes,d|=e.subtreeFlags&14680064,d|=e.flags&14680064,e.return=a,e=e.sibling;else for(e=a.child;null!==e;)c|=e.lanes|e.childLanes,
d|=e.subtreeFlags,d|=e.flags,e.return=a,e=e.sibling;a.subtreeFlags|=d;a.childLanes=c;return b}function xk(a,b,c){var d=b.pendingProps;Ve(b);switch(b.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return W(b),null;case 1:return ea(b.type)&&(v(S),v(J)),W(b),null;case 3:d=b.stateNode;Tb();v(S);v(J);jf();d.pendingContext&&(d.context=d.pendingContext,d.pendingContext=null);if(null===a||null===a.child)pd(b)?b.flags|=4:null===a||a.memoizedState.isDehydrated&&0===(b.flags&
256)||(b.flags|=1024,null!==wa&&(Gf(wa),wa=null));xi(a,b);W(b);return null;case 5:hf(b);var e=ub(xc.current);c=b.type;if(null!==a&&null!=b.stateNode)yk(a,b,c,d,e),a.ref!==b.ref&&(b.flags|=512,b.flags|=2097152);else{if(!d){if(null===b.stateNode)throw Error(m(166));W(b);return null}a=ub(Ea.current);if(pd(b)){d=b.stateNode;c=b.type;var f=b.memoizedProps;d[Da]=b;d[uc]=f;a=0!==(b.mode&1);switch(c){case "dialog":B("cancel",d);B("close",d);break;case "iframe":case "object":case "embed":B("load",d);break;
case "video":case "audio":for(e=0;e<Ec.length;e++)B(Ec[e],d);break;case "source":B("error",d);break;case "img":case "image":case "link":B("error",d);B("load",d);break;case "details":B("toggle",d);break;case "input":kg(d,f);B("invalid",d);break;case "select":d._wrapperState={wasMultiple:!!f.multiple};B("invalid",d);break;case "textarea":ng(d,f),B("invalid",d)}pe(c,f);e=null;for(var g in f)if(f.hasOwnProperty(g)){var h=f[g];"children"===g?"string"===typeof h?d.textContent!==h&&(!0!==f.suppressHydrationWarning&&
jd(d.textContent,h,a),e=["children",h]):"number"===typeof h&&d.textContent!==""+h&&(!0!==f.suppressHydrationWarning&&jd(d.textContent,h,a),e=["children",""+h]):$b.hasOwnProperty(g)&&null!=h&&"onScroll"===g&&B("scroll",d)}switch(c){case "input":Pc(d);mg(d,f,!0);break;case "textarea":Pc(d);pg(d);break;case "select":case "option":break;default:"function"===typeof f.onClick&&(d.onclick=kd)}d=e;b.updateQueue=d;null!==d&&(b.flags|=4)}else{g=9===e.nodeType?e:e.ownerDocument;"http://www.w3.org/1999/xhtml"===
a&&(a=qg(c));"http://www.w3.org/1999/xhtml"===a?"script"===c?(a=g.createElement("div"),a.innerHTML="<script>\x3c/script>",a=a.removeChild(a.firstChild)):"string"===typeof d.is?a=g.createElement(c,{is:d.is}):(a=g.createElement(c),"select"===c&&(g=a,d.multiple?g.multiple=!0:d.size&&(g.size=d.size))):a=g.createElementNS(a,c);a[Da]=b;a[uc]=d;zk(a,b,!1,!1);b.stateNode=a;a:{g=qe(c,d);switch(c){case "dialog":B("cancel",a);B("close",a);e=d;break;case "iframe":case "object":case "embed":B("load",a);e=d;break;
case "video":case "audio":for(e=0;e<Ec.length;e++)B(Ec[e],a);e=d;break;case "source":B("error",a);e=d;break;case "img":case "image":case "link":B("error",a);B("load",a);e=d;break;case "details":B("toggle",a);e=d;break;case "input":kg(a,d);e=ke(a,d);B("invalid",a);break;case "option":e=d;break;case "select":a._wrapperState={wasMultiple:!!d.multiple};e=E({},d,{value:void 0});B("invalid",a);break;case "textarea":ng(a,d);e=ne(a,d);B("invalid",a);break;default:e=d}pe(c,e);h=e;for(f in h)if(h.hasOwnProperty(f)){var k=
h[f];"style"===f?sg(a,k):"dangerouslySetInnerHTML"===f?(k=k?k.__html:void 0,null!=k&&yi(a,k)):"children"===f?"string"===typeof k?("textarea"!==c||""!==k)&&Fc(a,k):"number"===typeof k&&Fc(a,""+k):"suppressContentEditableWarning"!==f&&"suppressHydrationWarning"!==f&&"autoFocus"!==f&&($b.hasOwnProperty(f)?null!=k&&"onScroll"===f&&B("scroll",a):null!=k&&$d(a,f,k,g))}switch(c){case "input":Pc(a);mg(a,d,!1);break;case "textarea":Pc(a);pg(a);break;case "option":null!=d.value&&a.setAttribute("value",""+Ua(d.value));
break;case "select":a.multiple=!!d.multiple;f=d.value;null!=f?Db(a,!!d.multiple,f,!1):null!=d.defaultValue&&Db(a,!!d.multiple,d.defaultValue,!0);break;default:"function"===typeof e.onClick&&(a.onclick=kd)}switch(c){case "button":case "input":case "select":case "textarea":d=!!d.autoFocus;break a;case "img":d=!0;break a;default:d=!1}}d&&(b.flags|=4)}null!==b.ref&&(b.flags|=512,b.flags|=2097152)}W(b);return null;case 6:if(a&&null!=b.stateNode)Ak(a,b,a.memoizedProps,d);else{if("string"!==typeof d&&null===
b.stateNode)throw Error(m(166));c=ub(xc.current);ub(Ea.current);if(pd(b)){d=b.stateNode;c=b.memoizedProps;d[Da]=b;if(f=d.nodeValue!==c)if(a=la,null!==a)switch(a.tag){case 3:jd(d.nodeValue,c,0!==(a.mode&1));break;case 5:!0!==a.memoizedProps.suppressHydrationWarning&&jd(d.nodeValue,c,0!==(a.mode&1))}f&&(b.flags|=4)}else d=(9===c.nodeType?c:c.ownerDocument).createTextNode(d),d[Da]=b,b.stateNode=d}W(b);return null;case 13:v(F);d=b.memoizedState;if(null===a||null!==a.memoizedState&&null!==a.memoizedState.dehydrated){if(D&&
null!==fa&&0!==(b.mode&1)&&0===(b.flags&128)){for(f=fa;f;)f=Ka(f.nextSibling);Qb();b.flags|=98560;f=!1}else if(f=pd(b),null!==d&&null!==d.dehydrated){if(null===a){if(!f)throw Error(m(318));f=b.memoizedState;f=null!==f?f.dehydrated:null;if(!f)throw Error(m(317));f[Da]=b}else Qb(),0===(b.flags&128)&&(b.memoizedState=null),b.flags|=4;W(b);f=!1}else null!==wa&&(Gf(wa),wa=null),f=!0;if(!f)return b.flags&65536?b:null}if(0!==(b.flags&128))return b.lanes=c,b;d=null!==d;d!==(null!==a&&null!==a.memoizedState)&&
d&&(b.child.flags|=8192,0!==(b.mode&1)&&(null===a||0!==(F.current&1)?0===L&&(L=3):Ef()));null!==b.updateQueue&&(b.flags|=4);W(b);return null;case 4:return Tb(),xi(a,b),null===a&&sc(b.stateNode.containerInfo),W(b),null;case 10:return cf(b.type._context),W(b),null;case 17:return ea(b.type)&&(v(S),v(J)),W(b),null;case 19:v(F);f=b.memoizedState;if(null===f)return W(b),null;d=0!==(b.flags&128);g=f.rendering;if(null===g)if(d)Dc(f,!1);else{if(0!==L||null!==a&&0!==(a.flags&128))for(a=b.child;null!==a;){g=
xd(a);if(null!==g){b.flags|=128;Dc(f,!1);d=g.updateQueue;null!==d&&(b.updateQueue=d,b.flags|=4);b.subtreeFlags=0;d=c;for(c=b.child;null!==c;)f=c,a=d,f.flags&=14680066,g=f.alternate,null===g?(f.childLanes=0,f.lanes=a,f.child=null,f.subtreeFlags=0,f.memoizedProps=null,f.memoizedState=null,f.updateQueue=null,f.dependencies=null,f.stateNode=null):(f.childLanes=g.childLanes,f.lanes=g.lanes,f.child=g.child,f.subtreeFlags=0,f.deletions=null,f.memoizedProps=g.memoizedProps,f.memoizedState=g.memoizedState,
f.updateQueue=g.updateQueue,f.type=g.type,a=g.dependencies,f.dependencies=null===a?null:{lanes:a.lanes,firstContext:a.firstContext}),c=c.sibling;y(F,F.current&1|2);return b.child}a=a.sibling}null!==f.tail&&P()>Hf&&(b.flags|=128,d=!0,Dc(f,!1),b.lanes=4194304)}else{if(!d)if(a=xd(g),null!==a){if(b.flags|=128,d=!0,c=a.updateQueue,null!==c&&(b.updateQueue=c,b.flags|=4),Dc(f,!0),null===f.tail&&"hidden"===f.tailMode&&!g.alternate&&!D)return W(b),null}else 2*P()-f.renderingStartTime>Hf&&1073741824!==c&&(b.flags|=
128,d=!0,Dc(f,!1),b.lanes=4194304);f.isBackwards?(g.sibling=b.child,b.child=g):(c=f.last,null!==c?c.sibling=g:b.child=g,f.last=g)}if(null!==f.tail)return b=f.tail,f.rendering=b,f.tail=b.sibling,f.renderingStartTime=P(),b.sibling=null,c=F.current,y(F,d?c&1|2:c&1),b;W(b);return null;case 22:case 23:return ba=Ga.current,v(Ga),d=null!==b.memoizedState,null!==a&&null!==a.memoizedState!==d&&(b.flags|=8192),d&&0!==(b.mode&1)?0!==(ba&1073741824)&&(W(b),b.subtreeFlags&6&&(b.flags|=8192)):W(b),null;case 24:return null;
case 25:return null}throw Error(m(156,b.tag));}function Bk(a,b,c){Ve(b);switch(b.tag){case 1:return ea(b.type)&&(v(S),v(J)),a=b.flags,a&65536?(b.flags=a&-65537|128,b):null;case 3:return Tb(),v(S),v(J),jf(),a=b.flags,0!==(a&65536)&&0===(a&128)?(b.flags=a&-65537|128,b):null;case 5:return hf(b),null;case 13:v(F);a=b.memoizedState;if(null!==a&&null!==a.dehydrated){if(null===b.alternate)throw Error(m(340));Qb()}a=b.flags;return a&65536?(b.flags=a&-65537|128,b):null;case 19:return v(F),null;case 4:return Tb(),
null;case 10:return cf(b.type._context),null;case 22:case 23:return ba=Ga.current,v(Ga),null;case 24:return null;default:return null}}function Wb(a,b){var c=a.ref;if(null!==c)if("function"===typeof c)try{c(null)}catch(d){G(a,b,d)}else c.current=null}function If(a,b,c){try{c()}catch(d){G(a,b,d)}}function Ck(a,b){Jf=Zc;a=ch();if(Ie(a)){if("selectionStart"in a)var c={start:a.selectionStart,end:a.selectionEnd};else a:{c=(c=a.ownerDocument)&&c.defaultView||window;var d=c.getSelection&&c.getSelection();
if(d&&0!==d.rangeCount){c=d.anchorNode;var e=d.anchorOffset,f=d.focusNode;d=d.focusOffset;try{c.nodeType,f.nodeType}catch(M){c=null;break a}var g=0,h=-1,k=-1,n=0,q=0,u=a,r=null;b:for(;;){for(var p;;){u!==c||0!==e&&3!==u.nodeType||(h=g+e);u!==f||0!==d&&3!==u.nodeType||(k=g+d);3===u.nodeType&&(g+=u.nodeValue.length);if(null===(p=u.firstChild))break;r=u;u=p}for(;;){if(u===a)break b;r===c&&++n===e&&(h=g);r===f&&++q===d&&(k=g);if(null!==(p=u.nextSibling))break;u=r;r=u.parentNode}u=p}c=-1===h||-1===k?null:
{start:h,end:k}}else c=null}c=c||{start:0,end:0}}else c=null;Kf={focusedElem:a,selectionRange:c};Zc=!1;for(l=b;null!==l;)if(b=l,a=b.child,0!==(b.subtreeFlags&1028)&&null!==a)a.return=b,l=a;else for(;null!==l;){b=l;try{var x=b.alternate;if(0!==(b.flags&1024))switch(b.tag){case 0:case 11:case 15:break;case 1:if(null!==x){var v=x.memoizedProps,z=x.memoizedState,w=b.stateNode,A=w.getSnapshotBeforeUpdate(b.elementType===b.type?v:ya(b.type,v),z);w.__reactInternalSnapshotBeforeUpdate=A}break;case 3:var t=
b.stateNode.containerInfo;1===t.nodeType?t.textContent="":9===t.nodeType&&t.documentElement&&t.removeChild(t.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(m(163));}}catch(M){G(b,b.return,M)}a=b.sibling;if(null!==a){a.return=b.return;l=a;break}l=b.return}x=zi;zi=!1;return x}function Gc(a,b,c){var d=b.updateQueue;d=null!==d?d.lastEffect:null;if(null!==d){var e=d=d.next;do{if((e.tag&a)===a){var f=e.destroy;e.destroy=void 0;void 0!==f&&If(b,c,f)}e=e.next}while(e!==d)}}
function Id(a,b){b=b.updateQueue;b=null!==b?b.lastEffect:null;if(null!==b){var c=b=b.next;do{if((c.tag&a)===a){var d=c.create;c.destroy=d()}c=c.next}while(c!==b)}}function Lf(a){var b=a.ref;if(null!==b){var c=a.stateNode;switch(a.tag){case 5:a=c;break;default:a=c}"function"===typeof b?b(a):b.current=a}}function Ai(a){var b=a.alternate;null!==b&&(a.alternate=null,Ai(b));a.child=null;a.deletions=null;a.sibling=null;5===a.tag&&(b=a.stateNode,null!==b&&(delete b[Da],delete b[uc],delete b[Me],delete b[Dk],
delete b[Ek]));a.stateNode=null;a.return=null;a.dependencies=null;a.memoizedProps=null;a.memoizedState=null;a.pendingProps=null;a.stateNode=null;a.updateQueue=null}function Bi(a){return 5===a.tag||3===a.tag||4===a.tag}function Ci(a){a:for(;;){for(;null===a.sibling;){if(null===a.return||Bi(a.return))return null;a=a.return}a.sibling.return=a.return;for(a=a.sibling;5!==a.tag&&6!==a.tag&&18!==a.tag;){if(a.flags&2)continue a;if(null===a.child||4===a.tag)continue a;else a.child.return=a,a=a.child}if(!(a.flags&
2))return a.stateNode}}function Mf(a,b,c){var d=a.tag;if(5===d||6===d)a=a.stateNode,b?8===c.nodeType?c.parentNode.insertBefore(a,b):c.insertBefore(a,b):(8===c.nodeType?(b=c.parentNode,b.insertBefore(a,c)):(b=c,b.appendChild(a)),c=c._reactRootContainer,null!==c&&void 0!==c||null!==b.onclick||(b.onclick=kd));else if(4!==d&&(a=a.child,null!==a))for(Mf(a,b,c),a=a.sibling;null!==a;)Mf(a,b,c),a=a.sibling}function Nf(a,b,c){var d=a.tag;if(5===d||6===d)a=a.stateNode,b?c.insertBefore(a,b):c.appendChild(a);
else if(4!==d&&(a=a.child,null!==a))for(Nf(a,b,c),a=a.sibling;null!==a;)Nf(a,b,c),a=a.sibling}function jb(a,b,c){for(c=c.child;null!==c;)Di(a,b,c),c=c.sibling}function Di(a,b,c){if(Ca&&"function"===typeof Ca.onCommitFiberUnmount)try{Ca.onCommitFiberUnmount(Uc,c)}catch(h){}switch(c.tag){case 5:X||Wb(c,b);case 6:var d=T,e=za;T=null;jb(a,b,c);T=d;za=e;null!==T&&(za?(a=T,c=c.stateNode,8===a.nodeType?a.parentNode.removeChild(c):a.removeChild(c)):T.removeChild(c.stateNode));break;case 18:null!==T&&(za?
(a=T,c=c.stateNode,8===a.nodeType?Re(a.parentNode,c):1===a.nodeType&&Re(a,c),nc(a)):Re(T,c.stateNode));break;case 4:d=T;e=za;T=c.stateNode.containerInfo;za=!0;jb(a,b,c);T=d;za=e;break;case 0:case 11:case 14:case 15:if(!X&&(d=c.updateQueue,null!==d&&(d=d.lastEffect,null!==d))){e=d=d.next;do{var f=e,g=f.destroy;f=f.tag;void 0!==g&&(0!==(f&2)?If(c,b,g):0!==(f&4)&&If(c,b,g));e=e.next}while(e!==d)}jb(a,b,c);break;case 1:if(!X&&(Wb(c,b),d=c.stateNode,"function"===typeof d.componentWillUnmount))try{d.props=
c.memoizedProps,d.state=c.memoizedState,d.componentWillUnmount()}catch(h){G(c,b,h)}jb(a,b,c);break;case 21:jb(a,b,c);break;case 22:c.mode&1?(X=(d=X)||null!==c.memoizedState,jb(a,b,c),X=d):jb(a,b,c);break;default:jb(a,b,c)}}function Ei(a){var b=a.updateQueue;if(null!==b){a.updateQueue=null;var c=a.stateNode;null===c&&(c=a.stateNode=new Fk);b.forEach(function(b){var d=Gk.bind(null,a,b);c.has(b)||(c.add(b),b.then(d,d))})}}function Aa(a,b,c){c=b.deletions;if(null!==c)for(var d=0;d<c.length;d++){var e=
c[d];try{var f=a,g=b,h=g;a:for(;null!==h;){switch(h.tag){case 5:T=h.stateNode;za=!1;break a;case 3:T=h.stateNode.containerInfo;za=!0;break a;case 4:T=h.stateNode.containerInfo;za=!0;break a}h=h.return}if(null===T)throw Error(m(160));Di(f,g,e);T=null;za=!1;var k=e.alternate;null!==k&&(k.return=null);e.return=null}catch(n){G(e,b,n)}}if(b.subtreeFlags&12854)for(b=b.child;null!==b;)Fi(b,a),b=b.sibling}function Fi(a,b,c){var d=a.alternate;c=a.flags;switch(a.tag){case 0:case 11:case 14:case 15:Aa(b,a);
Ha(a);if(c&4){try{Gc(3,a,a.return),Id(3,a)}catch(I){G(a,a.return,I)}try{Gc(5,a,a.return)}catch(I){G(a,a.return,I)}}break;case 1:Aa(b,a);Ha(a);c&512&&null!==d&&Wb(d,d.return);break;case 5:Aa(b,a);Ha(a);c&512&&null!==d&&Wb(d,d.return);if(a.flags&32){var e=a.stateNode;try{Fc(e,"")}catch(I){G(a,a.return,I)}}if(c&4&&(e=a.stateNode,null!=e)){var f=a.memoizedProps,g=null!==d?d.memoizedProps:f,h=a.type,k=a.updateQueue;a.updateQueue=null;if(null!==k)try{"input"===h&&"radio"===f.type&&null!=f.name&&lg(e,f);
qe(h,g);var n=qe(h,f);for(g=0;g<k.length;g+=2){var q=k[g],u=k[g+1];"style"===q?sg(e,u):"dangerouslySetInnerHTML"===q?yi(e,u):"children"===q?Fc(e,u):$d(e,q,u,n)}switch(h){case "input":le(e,f);break;case "textarea":og(e,f);break;case "select":var r=e._wrapperState.wasMultiple;e._wrapperState.wasMultiple=!!f.multiple;var p=f.value;null!=p?Db(e,!!f.multiple,p,!1):r!==!!f.multiple&&(null!=f.defaultValue?Db(e,!!f.multiple,f.defaultValue,!0):Db(e,!!f.multiple,f.multiple?[]:"",!1))}e[uc]=f}catch(I){G(a,a.return,
I)}}break;case 6:Aa(b,a);Ha(a);if(c&4){if(null===a.stateNode)throw Error(m(162));e=a.stateNode;f=a.memoizedProps;try{e.nodeValue=f}catch(I){G(a,a.return,I)}}break;case 3:Aa(b,a);Ha(a);if(c&4&&null!==d&&d.memoizedState.isDehydrated)try{nc(b.containerInfo)}catch(I){G(a,a.return,I)}break;case 4:Aa(b,a);Ha(a);break;case 13:Aa(b,a);Ha(a);e=a.child;e.flags&8192&&(f=null!==e.memoizedState,e.stateNode.isHidden=f,!f||null!==e.alternate&&null!==e.alternate.memoizedState||(Of=P()));c&4&&Ei(a);break;case 22:q=
null!==d&&null!==d.memoizedState;a.mode&1?(X=(n=X)||q,Aa(b,a),X=n):Aa(b,a);Ha(a);if(c&8192){n=null!==a.memoizedState;if((a.stateNode.isHidden=n)&&!q&&0!==(a.mode&1))for(l=a,q=a.child;null!==q;){for(u=l=q;null!==l;){r=l;p=r.child;switch(r.tag){case 0:case 11:case 14:case 15:Gc(4,r,r.return);break;case 1:Wb(r,r.return);var x=r.stateNode;if("function"===typeof x.componentWillUnmount){c=r;b=r.return;try{d=c,x.props=d.memoizedProps,x.state=d.memoizedState,x.componentWillUnmount()}catch(I){G(c,b,I)}}break;
case 5:Wb(r,r.return);break;case 22:if(null!==r.memoizedState){Gi(u);continue}}null!==p?(p.return=r,l=p):Gi(u)}q=q.sibling}a:for(q=null,u=a;;){if(5===u.tag){if(null===q){q=u;try{e=u.stateNode,n?(f=e.style,"function"===typeof f.setProperty?f.setProperty("display","none","important"):f.display="none"):(h=u.stateNode,k=u.memoizedProps.style,g=void 0!==k&&null!==k&&k.hasOwnProperty("display")?k.display:null,h.style.display=rg("display",g))}catch(I){G(a,a.return,I)}}}else if(6===u.tag){if(null===q)try{u.stateNode.nodeValue=
n?"":u.memoizedProps}catch(I){G(a,a.return,I)}}else if((22!==u.tag&&23!==u.tag||null===u.memoizedState||u===a)&&null!==u.child){u.child.return=u;u=u.child;continue}if(u===a)break a;for(;null===u.sibling;){if(null===u.return||u.return===a)break a;q===u&&(q=null);u=u.return}q===u&&(q=null);u.sibling.return=u.return;u=u.sibling}}break;case 19:Aa(b,a);Ha(a);c&4&&Ei(a);break;case 21:break;default:Aa(b,a),Ha(a)}}function Ha(a){var b=a.flags;if(b&2){try{a:{for(var c=a.return;null!==c;){if(Bi(c)){var d=c;
break a}c=c.return}throw Error(m(160));}switch(d.tag){case 5:var e=d.stateNode;d.flags&32&&(Fc(e,""),d.flags&=-33);var f=Ci(a);Nf(a,f,e);break;case 3:case 4:var g=d.stateNode.containerInfo,h=Ci(a);Mf(a,h,g);break;default:throw Error(m(161));}}catch(k){G(a,a.return,k)}a.flags&=-3}b&4096&&(a.flags&=-4097)}function Hk(a,b,c){l=a;Hi(a,b,c)}function Hi(a,b,c){for(var d=0!==(a.mode&1);null!==l;){var e=l,f=e.child;if(22===e.tag&&d){var g=null!==e.memoizedState||Jd;if(!g){var h=e.alternate,k=null!==h&&null!==
h.memoizedState||X;h=Jd;var n=X;Jd=g;if((X=k)&&!n)for(l=e;null!==l;)g=l,k=g.child,22===g.tag&&null!==g.memoizedState?Ii(e):null!==k?(k.return=g,l=k):Ii(e);for(;null!==f;)l=f,Hi(f,b,c),f=f.sibling;l=e;Jd=h;X=n}Ji(a,b,c)}else 0!==(e.subtreeFlags&8772)&&null!==f?(f.return=e,l=f):Ji(a,b,c)}}function Ji(a,b,c){for(;null!==l;){b=l;if(0!==(b.flags&8772)){c=b.alternate;try{if(0!==(b.flags&8772))switch(b.tag){case 0:case 11:case 15:X||Id(5,b);break;case 1:var d=b.stateNode;if(b.flags&4&&!X)if(null===c)d.componentDidMount();
else{var e=b.elementType===b.type?c.memoizedProps:ya(b.type,c.memoizedProps);d.componentDidUpdate(e,c.memoizedState,d.__reactInternalSnapshotBeforeUpdate)}var f=b.updateQueue;null!==f&&Hh(b,f,d);break;case 3:var g=b.updateQueue;if(null!==g){c=null;if(null!==b.child)switch(b.child.tag){case 5:c=b.child.stateNode;break;case 1:c=b.child.stateNode}Hh(b,g,c)}break;case 5:var h=b.stateNode;if(null===c&&b.flags&4){c=h;var k=b.memoizedProps;switch(b.type){case "button":case "input":case "select":case "textarea":k.autoFocus&&
c.focus();break;case "img":k.src&&(c.src=k.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(null===b.memoizedState){var n=b.alternate;if(null!==n){var q=n.memoizedState;if(null!==q){var p=q.dehydrated;null!==p&&nc(p)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(m(163));}X||b.flags&512&&Lf(b)}catch(r){G(b,b.return,r)}}if(b===a){l=null;break}c=b.sibling;if(null!==c){c.return=b.return;l=c;break}l=b.return}}function Gi(a){for(;null!==l;){var b=l;if(b===
a){l=null;break}var c=b.sibling;if(null!==c){c.return=b.return;l=c;break}l=b.return}}function Ii(a){for(;null!==l;){var b=l;try{switch(b.tag){case 0:case 11:case 15:var c=b.return;try{Id(4,b)}catch(k){G(b,c,k)}break;case 1:var d=b.stateNode;if("function"===typeof d.componentDidMount){var e=b.return;try{d.componentDidMount()}catch(k){G(b,e,k)}}var f=b.return;try{Lf(b)}catch(k){G(b,f,k)}break;case 5:var g=b.return;try{Lf(b)}catch(k){G(b,g,k)}}}catch(k){G(b,b.return,k)}if(b===a){l=null;break}var h=b.sibling;
if(null!==h){h.return=b.return;l=h;break}l=b.return}}function Hc(){Hf=P()+500}function Z(){return 0!==(p&6)?P():-1!==Kd?Kd:Kd=P()}function hb(a){if(0===(a.mode&1))return 1;if(0!==(p&2)&&0!==U)return U&-U;if(null!==Ik.transition)return 0===Ld&&(Ld=Dg()),Ld;a=z;if(0!==a)return a;a=window.event;a=void 0===a?16:Lg(a.type);return a}function xa(a,b,c,d){if(50<Ic)throw Ic=0,Pf=null,Error(m(185));ic(a,c,d);if(0===(p&2)||a!==O)a===O&&(0===(p&2)&&(Md|=c),4===L&&kb(a,U)),ia(a,d),1===c&&0===p&&0===(b.mode&1)&&
(Hc(),md&&db())}function ia(a,b){var c=a.callbackNode;tj(a,b);var d=Vc(a,a===O?U:0);if(0===d)null!==c&&Ki(c),a.callbackNode=null,a.callbackPriority=0;else if(b=d&-d,a.callbackPriority!==b){null!=c&&Ki(c);if(1===b)0===a.tag?jk(Li.bind(null,a)):wh(Li.bind(null,a)),Jk(function(){0===(p&6)&&db()}),c=null;else{switch(Eg(d)){case 1:c=De;break;case 4:c=Mg;break;case 16:c=ad;break;case 536870912:c=Ng;break;default:c=ad}c=Mi(c,Ni.bind(null,a))}a.callbackPriority=b;a.callbackNode=c}}function Ni(a,b){Kd=-1;
Ld=0;if(0!==(p&6))throw Error(m(327));var c=a.callbackNode;if(Xb()&&a.callbackNode!==c)return null;var d=Vc(a,a===O?U:0);if(0===d)return null;if(0!==(d&30)||0!==(d&a.expiredLanes)||b)b=Nd(a,d);else{b=d;var e=p;p|=2;var f=Oi();if(O!==a||U!==b)Ra=null,Hc(),wb(a,b);do try{Kk();break}catch(h){Pi(a,h)}while(1);af();Od.current=f;p=e;null!==H?b=0:(O=null,U=0,b=L)}if(0!==b){2===b&&(e=ve(a),0!==e&&(d=e,b=Qf(a,e)));if(1===b)throw c=Jc,wb(a,0),kb(a,d),ia(a,P()),c;if(6===b)kb(a,d);else{e=a.current.alternate;
if(0===(d&30)&&!Lk(e)&&(b=Nd(a,d),2===b&&(f=ve(a),0!==f&&(d=f,b=Qf(a,f))),1===b))throw c=Jc,wb(a,0),kb(a,d),ia(a,P()),c;a.finishedWork=e;a.finishedLanes=d;switch(b){case 0:case 1:throw Error(m(345));case 2:xb(a,ja,Ra);break;case 3:kb(a,d);if((d&130023424)===d&&(b=Of+500-P(),10<b)){if(0!==Vc(a,0))break;e=a.suspendedLanes;if((e&d)!==d){Z();a.pingedLanes|=a.suspendedLanes&e;break}a.timeoutHandle=Rf(xb.bind(null,a,ja,Ra),b);break}xb(a,ja,Ra);break;case 4:kb(a,d);if((d&4194240)===d)break;b=a.eventTimes;
for(e=-1;0<d;){var g=31-ta(d);f=1<<g;g=b[g];g>e&&(e=g);d&=~f}d=e;d=P()-d;d=(120>d?120:480>d?480:1080>d?1080:1920>d?1920:3E3>d?3E3:4320>d?4320:1960*Mk(d/1960))-d;if(10<d){a.timeoutHandle=Rf(xb.bind(null,a,ja,Ra),d);break}xb(a,ja,Ra);break;case 5:xb(a,ja,Ra);break;default:throw Error(m(329));}}}ia(a,P());return a.callbackNode===c?Ni.bind(null,a):null}function Qf(a,b){var c=Kc;a.current.memoizedState.isDehydrated&&(wb(a,b).flags|=256);a=Nd(a,b);2!==a&&(b=ja,ja=c,null!==b&&Gf(b));return a}function Gf(a){null===
ja?ja=a:ja.push.apply(ja,a)}function Lk(a){for(var b=a;;){if(b.flags&16384){var c=b.updateQueue;if(null!==c&&(c=c.stores,null!==c))for(var d=0;d<c.length;d++){var e=c[d],f=e.getSnapshot;e=e.value;try{if(!ua(f(),e))return!1}catch(g){return!1}}}c=b.child;if(b.subtreeFlags&16384&&null!==c)c.return=b,b=c;else{if(b===a)break;for(;null===b.sibling;){if(null===b.return||b.return===a)return!0;b=b.return}b.sibling.return=b.return;b=b.sibling}}return!0}function kb(a,b){b&=~Sf;b&=~Md;a.suspendedLanes|=b;a.pingedLanes&=
~b;for(a=a.expirationTimes;0<b;){var c=31-ta(b),d=1<<c;a[c]=-1;b&=~d}}function Li(a){if(0!==(p&6))throw Error(m(327));Xb();var b=Vc(a,0);if(0===(b&1))return ia(a,P()),null;var c=Nd(a,b);if(0!==a.tag&&2===c){var d=ve(a);0!==d&&(b=d,c=Qf(a,d))}if(1===c)throw c=Jc,wb(a,0),kb(a,b),ia(a,P()),c;if(6===c)throw Error(m(345));a.finishedWork=a.current.alternate;a.finishedLanes=b;xb(a,ja,Ra);ia(a,P());return null}function Tf(a,b){var c=p;p|=1;try{return a(b)}finally{p=c,0===p&&(Hc(),md&&db())}}function yb(a){null!==
lb&&0===lb.tag&&0===(p&6)&&Xb();var b=p;p|=1;var c=ca.transition,d=z;try{if(ca.transition=null,z=1,a)return a()}finally{z=d,ca.transition=c,p=b,0===(p&6)&&db()}}function wb(a,b){a.finishedWork=null;a.finishedLanes=0;var c=a.timeoutHandle;-1!==c&&(a.timeoutHandle=-1,Nk(c));if(null!==H)for(c=H.return;null!==c;){var d=c;Ve(d);switch(d.tag){case 1:d=d.type.childContextTypes;null!==d&&void 0!==d&&(v(S),v(J));break;case 3:Tb();v(S);v(J);jf();break;case 5:hf(d);break;case 4:Tb();break;case 13:v(F);break;
case 19:v(F);break;case 10:cf(d.type._context);break;case 22:case 23:ba=Ga.current,v(Ga)}c=c.return}O=a;H=a=eb(a.current,null);U=ba=b;L=0;Jc=null;Sf=Md=ra=0;ja=Kc=null;if(null!==tb){for(b=0;b<tb.length;b++)if(c=tb[b],d=c.interleaved,null!==d){c.interleaved=null;var e=d.next,f=c.pending;if(null!==f){var g=f.next;f.next=e;d.next=g}c.pending=d}tb=null}return a}function Pi(a,b){do{var c=H;try{af();yd.current=zd;if(Ad){for(var d=C.memoizedState;null!==d;){var e=d.queue;null!==e&&(e.pending=null);d=d.next}Ad=
!1}vb=0;N=K=C=null;zc=!1;Ac=0;Uf.current=null;if(null===c||null===c.return){L=1;Jc=b;H=null;break}a:{var f=a,g=c.return,h=c,k=b;b=U;h.flags|=32768;if(null!==k&&"object"===typeof k&&"function"===typeof k.then){var n=k,l=h,p=l.tag;if(0===(l.mode&1)&&(0===p||11===p||15===p)){var r=l.alternate;r?(l.updateQueue=r.updateQueue,l.memoizedState=r.memoizedState,l.lanes=r.lanes):(l.updateQueue=null,l.memoizedState=null)}var v=ji(g);if(null!==v){v.flags&=-257;ki(v,g,h,f,b);v.mode&1&&ii(f,n,b);b=v;k=n;var x=b.updateQueue;
if(null===x){var z=new Set;z.add(k);b.updateQueue=z}else x.add(k);break a}else{if(0===(b&1)){ii(f,n,b);Ef();break a}k=Error(m(426))}}else if(D&&h.mode&1){var y=ji(g);if(null!==y){0===(y.flags&65536)&&(y.flags|=256);ki(y,g,h,f,b);Ye(Ub(k,h));break a}}f=k=Ub(k,h);4!==L&&(L=2);null===Kc?Kc=[f]:Kc.push(f);f=g;do{switch(f.tag){case 3:f.flags|=65536;b&=-b;f.lanes|=b;var w=gi(f,k,b);Gh(f,w);break a;case 1:h=k;var A=f.type,t=f.stateNode;if(0===(f.flags&128)&&("function"===typeof A.getDerivedStateFromError||
null!==t&&"function"===typeof t.componentDidCatch&&(null===ib||!ib.has(t)))){f.flags|=65536;b&=-b;f.lanes|=b;var B=hi(f,h,b);Gh(f,B);break a}}f=f.return}while(null!==f)}Qi(c)}catch(ma){b=ma;H===c&&null!==c&&(H=c=c.return);continue}break}while(1)}function Oi(){var a=Od.current;Od.current=zd;return null===a?zd:a}function Ef(){if(0===L||3===L||2===L)L=4;null===O||0===(ra&268435455)&&0===(Md&268435455)||kb(O,U)}function Nd(a,b){var c=p;p|=2;var d=Oi();if(O!==a||U!==b)Ra=null,wb(a,b);do try{Ok();break}catch(e){Pi(a,
e)}while(1);af();p=c;Od.current=d;if(null!==H)throw Error(m(261));O=null;U=0;return L}function Ok(){for(;null!==H;)Ri(H)}function Kk(){for(;null!==H&&!Pk();)Ri(H)}function Ri(a){var b=Qk(a.alternate,a,ba);a.memoizedProps=a.pendingProps;null===b?Qi(a):H=b;Uf.current=null}function Qi(a){var b=a;do{var c=b.alternate;a=b.return;if(0===(b.flags&32768)){if(c=xk(c,b,ba),null!==c){H=c;return}}else{c=Bk(c,b);if(null!==c){c.flags&=32767;H=c;return}if(null!==a)a.flags|=32768,a.subtreeFlags=0,a.deletions=null;
else{L=6;H=null;return}}b=b.sibling;if(null!==b){H=b;return}H=b=a}while(null!==b);0===L&&(L=5)}function xb(a,b,c){var d=z,e=ca.transition;try{ca.transition=null,z=1,Rk(a,b,c,d)}finally{ca.transition=e,z=d}return null}function Rk(a,b,c,d){do Xb();while(null!==lb);if(0!==(p&6))throw Error(m(327));c=a.finishedWork;var e=a.finishedLanes;if(null===c)return null;a.finishedWork=null;a.finishedLanes=0;if(c===a.current)throw Error(m(177));a.callbackNode=null;a.callbackPriority=0;var f=c.lanes|c.childLanes;
uj(a,f);a===O&&(H=O=null,U=0);0===(c.subtreeFlags&2064)&&0===(c.flags&2064)||Pd||(Pd=!0,Mi(ad,function(){Xb();return null}));f=0!==(c.flags&15990);if(0!==(c.subtreeFlags&15990)||f){f=ca.transition;ca.transition=null;var g=z;z=1;var h=p;p|=4;Uf.current=null;Ck(a,c);Fi(c,a);Tj(Kf);Zc=!!Jf;Kf=Jf=null;a.current=c;Hk(c,a,e);Sk();p=h;z=g;ca.transition=f}else a.current=c;Pd&&(Pd=!1,lb=a,Qd=e);f=a.pendingLanes;0===f&&(ib=null);oj(c.stateNode,d);ia(a,P());if(null!==b)for(d=a.onRecoverableError,c=0;c<b.length;c++)e=
b[c],d(e.value,{componentStack:e.stack,digest:e.digest});if(Ed)throw Ed=!1,a=xf,xf=null,a;0!==(Qd&1)&&0!==a.tag&&Xb();f=a.pendingLanes;0!==(f&1)?a===Pf?Ic++:(Ic=0,Pf=a):Ic=0;db();return null}function Xb(){if(null!==lb){var a=Eg(Qd),b=ca.transition,c=z;try{ca.transition=null;z=16>a?16:a;if(null===lb)var d=!1;else{a=lb;lb=null;Qd=0;if(0!==(p&6))throw Error(m(331));var e=p;p|=4;for(l=a.current;null!==l;){var f=l,g=f.child;if(0!==(l.flags&16)){var h=f.deletions;if(null!==h){for(var k=0;k<h.length;k++){var n=
h[k];for(l=n;null!==l;){var q=l;switch(q.tag){case 0:case 11:case 15:Gc(8,q,f)}var u=q.child;if(null!==u)u.return=q,l=u;else for(;null!==l;){q=l;var r=q.sibling,v=q.return;Ai(q);if(q===n){l=null;break}if(null!==r){r.return=v;l=r;break}l=v}}}var x=f.alternate;if(null!==x){var y=x.child;if(null!==y){x.child=null;do{var C=y.sibling;y.sibling=null;y=C}while(null!==y)}}l=f}}if(0!==(f.subtreeFlags&2064)&&null!==g)g.return=f,l=g;else b:for(;null!==l;){f=l;if(0!==(f.flags&2048))switch(f.tag){case 0:case 11:case 15:Gc(9,
f,f.return)}var w=f.sibling;if(null!==w){w.return=f.return;l=w;break b}l=f.return}}var A=a.current;for(l=A;null!==l;){g=l;var t=g.child;if(0!==(g.subtreeFlags&2064)&&null!==t)t.return=g,l=t;else b:for(g=A;null!==l;){h=l;if(0!==(h.flags&2048))try{switch(h.tag){case 0:case 11:case 15:Id(9,h)}}catch(ma){G(h,h.return,ma)}if(h===g){l=null;break b}var B=h.sibling;if(null!==B){B.return=h.return;l=B;break b}l=h.return}}p=e;db();if(Ca&&"function"===typeof Ca.onPostCommitFiberRoot)try{Ca.onPostCommitFiberRoot(Uc,
a)}catch(ma){}d=!0}return d}finally{z=c,ca.transition=b}}return!1}function Si(a,b,c){b=Ub(c,b);b=gi(a,b,1);a=fb(a,b,1);b=Z();null!==a&&(ic(a,1,b),ia(a,b))}function G(a,b,c){if(3===a.tag)Si(a,a,c);else for(;null!==b;){if(3===b.tag){Si(b,a,c);break}else if(1===b.tag){var d=b.stateNode;if("function"===typeof b.type.getDerivedStateFromError||"function"===typeof d.componentDidCatch&&(null===ib||!ib.has(d))){a=Ub(c,a);a=hi(b,a,1);b=fb(b,a,1);a=Z();null!==b&&(ic(b,1,a),ia(b,a));break}}b=b.return}}function sk(a,
b,c){var d=a.pingCache;null!==d&&d.delete(b);b=Z();a.pingedLanes|=a.suspendedLanes&c;O===a&&(U&c)===c&&(4===L||3===L&&(U&130023424)===U&&500>P()-Of?wb(a,0):Sf|=c);ia(a,b)}function Ti(a,b){0===b&&(0===(a.mode&1)?b=1:(b=Rd,Rd<<=1,0===(Rd&130023424)&&(Rd=4194304)));var c=Z();a=Oa(a,b);null!==a&&(ic(a,b,c),ia(a,c))}function vk(a){var b=a.memoizedState,c=0;null!==b&&(c=b.retryLane);Ti(a,c)}function Gk(a,b){var c=0;switch(a.tag){case 13:var d=a.stateNode;var e=a.memoizedState;null!==e&&(c=e.retryLane);
break;case 19:d=a.stateNode;break;default:throw Error(m(314));}null!==d&&d.delete(b);Ti(a,c)}function Mi(a,b){return xh(a,b)}function Tk(a,b,c,d){this.tag=a;this.key=c;this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null;this.index=0;this.ref=null;this.pendingProps=b;this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null;this.mode=d;this.subtreeFlags=this.flags=0;this.deletions=null;this.childLanes=this.lanes=0;this.alternate=null}function yf(a){a=
a.prototype;return!(!a||!a.isReactComponent)}function Uk(a){if("function"===typeof a)return yf(a)?1:0;if(void 0!==a&&null!==a){a=a.$$typeof;if(a===ie)return 11;if(a===je)return 14}return 2}function eb(a,b){var c=a.alternate;null===c?(c=pa(a.tag,b,a.key,a.mode),c.elementType=a.elementType,c.type=a.type,c.stateNode=a.stateNode,c.alternate=a,a.alternate=c):(c.pendingProps=b,c.type=a.type,c.flags=0,c.subtreeFlags=0,c.deletions=null);c.flags=a.flags&14680064;c.childLanes=a.childLanes;c.lanes=a.lanes;c.child=
a.child;c.memoizedProps=a.memoizedProps;c.memoizedState=a.memoizedState;c.updateQueue=a.updateQueue;b=a.dependencies;c.dependencies=null===b?null:{lanes:b.lanes,firstContext:b.firstContext};c.sibling=a.sibling;c.index=a.index;c.ref=a.ref;return c}function rd(a,b,c,d,e,f){var g=2;d=a;if("function"===typeof a)yf(a)&&(g=1);else if("string"===typeof a)g=5;else a:switch(a){case Bb:return sb(c.children,e,f,b);case fe:g=8;e|=8;break;case ee:return a=pa(12,c,b,e|2),a.elementType=ee,a.lanes=f,a;case ge:return a=
pa(13,c,b,e),a.elementType=ge,a.lanes=f,a;case he:return a=pa(19,c,b,e),a.elementType=he,a.lanes=f,a;case Ui:return Gd(c,e,f,b);default:if("object"===typeof a&&null!==a)switch(a.$$typeof){case hg:g=10;break a;case gg:g=9;break a;case ie:g=11;break a;case je:g=14;break a;case Ta:g=16;d=null;break a}throw Error(m(130,null==a?a:typeof a,""));}b=pa(g,c,b,e);b.elementType=a;b.type=d;b.lanes=f;return b}function sb(a,b,c,d){a=pa(7,a,d,b);a.lanes=c;return a}function Gd(a,b,c,d){a=pa(22,a,d,b);a.elementType=
Ui;a.lanes=c;a.stateNode={isHidden:!1};return a}function Ze(a,b,c){a=pa(6,a,null,b);a.lanes=c;return a}function $e(a,b,c){b=pa(4,null!==a.children?a.children:[],a.key,b);b.lanes=c;b.stateNode={containerInfo:a.containerInfo,pendingChildren:null,implementation:a.implementation};return b}function Vk(a,b,c,d,e){this.tag=b;this.containerInfo=a;this.finishedWork=this.pingCache=this.current=this.pendingChildren=null;this.timeoutHandle=-1;this.callbackNode=this.pendingContext=this.context=null;this.callbackPriority=
0;this.eventTimes=we(0);this.expirationTimes=we(-1);this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0;this.entanglements=we(0);this.identifierPrefix=d;this.onRecoverableError=e;this.mutableSourceEagerHydrationData=null}function Vf(a,b,c,d,e,f,g,h,k,l){a=new Vk(a,b,c,h,k);1===b?(b=1,!0===f&&(b|=8)):b=0;f=pa(3,null,null,b);a.current=f;f.stateNode=a;f.memoizedState={element:d,isDehydrated:c,cache:null,transitions:null,
pendingSuspenseBoundaries:null};ff(f);return a}function Wk(a,b,c){var d=3<arguments.length&&void 0!==arguments[3]?arguments[3]:null;return{$$typeof:Cb,key:null==d?null:""+d,children:a,containerInfo:b,implementation:c}}function Vi(a){if(!a)return cb;a=a._reactInternals;a:{if(nb(a)!==a||1!==a.tag)throw Error(m(170));var b=a;do{switch(b.tag){case 3:b=b.stateNode.context;break a;case 1:if(ea(b.type)){b=b.stateNode.__reactInternalMemoizedMergedChildContext;break a}}b=b.return}while(null!==b);throw Error(m(171));
}if(1===a.tag){var c=a.type;if(ea(c))return uh(a,c,b)}return b}function Wi(a,b,c,d,e,f,g,h,k,l){a=Vf(c,d,!0,a,e,f,g,h,k);a.context=Vi(null);c=a.current;d=Z();e=hb(c);f=Pa(d,e);f.callback=void 0!==b&&null!==b?b:null;fb(c,f,e);a.current.lanes=e;ic(a,e,d);ia(a,d);return a}function Sd(a,b,c,d){var e=b.current,f=Z(),g=hb(e);c=Vi(c);null===b.context?b.context=c:b.pendingContext=c;b=Pa(f,g);b.payload={element:a};d=void 0===d?null:d;null!==d&&(b.callback=d);a=fb(e,b,g);null!==a&&(xa(a,e,g,f),vd(a,e,g));return g}
function Td(a){a=a.current;if(!a.child)return null;switch(a.child.tag){case 5:return a.child.stateNode;default:return a.child.stateNode}}function Xi(a,b){a=a.memoizedState;if(null!==a&&null!==a.dehydrated){var c=a.retryLane;a.retryLane=0!==c&&c<b?c:b}}function Wf(a,b){Xi(a,b);(a=a.alternate)&&Xi(a,b)}function Xk(a){a=Bg(a);return null===a?null:a.stateNode}function Yk(a){return null}function Xf(a){this._internalRoot=a}function Ud(a){this._internalRoot=a}function Yf(a){return!(!a||1!==a.nodeType&&9!==
a.nodeType&&11!==a.nodeType)}function Vd(a){return!(!a||1!==a.nodeType&&9!==a.nodeType&&11!==a.nodeType&&(8!==a.nodeType||" react-mount-point-unstable "!==a.nodeValue))}function Yi(){}function Zk(a,b,c,d,e){if(e){if("function"===typeof d){var f=d;d=function(){var a=Td(g);f.call(a)}}var g=Wi(b,d,a,0,null,!1,!1,"",Yi);a._reactRootContainer=g;a[Ja]=g.current;sc(8===a.nodeType?a.parentNode:a);yb();return g}for(;e=a.lastChild;)a.removeChild(e);if("function"===typeof d){var h=d;d=function(){var a=Td(k);
h.call(a)}}var k=Vf(a,0,!1,null,null,!1,!1,"",Yi);a._reactRootContainer=k;a[Ja]=k.current;sc(8===a.nodeType?a.parentNode:a);yb(function(){Sd(b,k,c,d)});return k}function Wd(a,b,c,d,e){var f=c._reactRootContainer;if(f){var g=f;if("function"===typeof e){var h=e;e=function(){var a=Td(g);h.call(a)}}Sd(b,g,a,e)}else g=Zk(c,b,a,e,d);return Td(g)}var cg=new Set,$b={},Ia=!("undefined"===typeof window||"undefined"===typeof window.document||"undefined"===typeof window.document.createElement),Zd=Object.prototype.hasOwnProperty,
cj=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,eg={},dg={},R={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a){R[a]=
new Y(a,0,!1,a,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(a){var b=a[0];R[b]=new Y(b,1,!1,a[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(a){R[a]=new Y(a,2,!1,a.toLowerCase(),null,!1,!1)});["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(a){R[a]=new Y(a,2,!1,a,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a){R[a]=
new Y(a,3,!1,a.toLowerCase(),null,!1,!1)});["checked","multiple","muted","selected"].forEach(function(a){R[a]=new Y(a,3,!0,a,null,!1,!1)});["capture","download"].forEach(function(a){R[a]=new Y(a,4,!1,a,null,!1,!1)});["cols","rows","size","span"].forEach(function(a){R[a]=new Y(a,6,!1,a,null,!1,!1)});["rowSpan","start"].forEach(function(a){R[a]=new Y(a,5,!1,a.toLowerCase(),null,!1,!1)});var Zf=/[\-:]([a-z])/g,$f=function(a){return a[1].toUpperCase()};"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a){var b=
a.replace(Zf,$f);R[b]=new Y(b,1,!1,a,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a){var b=a.replace(Zf,$f);R[b]=new Y(b,1,!1,a,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(a){var b=a.replace(Zf,$f);R[b]=new Y(b,1,!1,a,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(a){R[a]=new Y(a,1,!1,a.toLowerCase(),null,!1,!1)});R.xlinkHref=new Y("xlinkHref",
1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(a){R[a]=new Y(a,1,!1,a.toLowerCase(),null,!0,!0)});var Sa=zb.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,sd=Symbol.for("react.element"),Cb=Symbol.for("react.portal"),Bb=Symbol.for("react.fragment"),fe=Symbol.for("react.strict_mode"),ee=Symbol.for("react.profiler"),hg=Symbol.for("react.provider"),gg=Symbol.for("react.context"),ie=Symbol.for("react.forward_ref"),ge=Symbol.for("react.suspense"),
he=Symbol.for("react.suspense_list"),je=Symbol.for("react.memo"),Ta=Symbol.for("react.lazy");Symbol.for("react.scope");Symbol.for("react.debug_trace_mode");var Ui=Symbol.for("react.offscreen");Symbol.for("react.legacy_hidden");Symbol.for("react.cache");Symbol.for("react.tracing_marker");var fg=Symbol.iterator,E=Object.assign,ae,ce=!1,cc=Array.isArray,Xd,yi=function(a){return"undefined"!==typeof MSApp&&MSApp.execUnsafeLocalFunction?function(b,c,d,e){MSApp.execUnsafeLocalFunction(function(){return a(b,
c,d,e)})}:a}(function(a,b){if("http://www.w3.org/2000/svg"!==a.namespaceURI||"innerHTML"in a)a.innerHTML=b;else{Xd=Xd||document.createElement("div");Xd.innerHTML="<svg>"+b.valueOf().toString()+"</svg>";for(b=Xd.firstChild;a.firstChild;)a.removeChild(a.firstChild);for(;b.firstChild;)a.appendChild(b.firstChild)}}),Fc=function(a,b){if(b){var c=a.firstChild;if(c&&c===a.lastChild&&3===c.nodeType){c.nodeValue=b;return}}a.textContent=b},dc={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,
borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,
strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},$k=["Webkit","ms","Moz","O"];Object.keys(dc).forEach(function(a){$k.forEach(function(b){b=b+a.charAt(0).toUpperCase()+a.substring(1);dc[b]=dc[a]})});var ij=E({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0}),ze=null,se=null,Eb=null,Fb=null,xg=function(a,b){return a(b)},yg=function(){},te=!1,Oe=!1;if(Ia)try{var Lc={};Object.defineProperty(Lc,
"passive",{get:function(){Oe=!0}});window.addEventListener("test",Lc,Lc);window.removeEventListener("test",Lc,Lc)}catch(a){Oe=!1}var kj=function(a,b,c,d,e,f,g,h,k){var l=Array.prototype.slice.call(arguments,3);try{b.apply(c,l)}catch(q){this.onError(q)}},gc=!1,Sc=null,Tc=!1,ue=null,lj={onError:function(a){gc=!0;Sc=a}},Ba=zb.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Scheduler,Jg=Ba.unstable_scheduleCallback,Kg=Ba.unstable_NormalPriority,xh=Jg,Ki=Ba.unstable_cancelCallback,Pk=Ba.unstable_shouldYield,
Sk=Ba.unstable_requestPaint,P=Ba.unstable_now,Dj=Ba.unstable_getCurrentPriorityLevel,De=Ba.unstable_ImmediatePriority,Mg=Ba.unstable_UserBlockingPriority,ad=Kg,Ej=Ba.unstable_LowPriority,Ng=Ba.unstable_IdlePriority,Uc=null,Ca=null,ta=Math.clz32?Math.clz32:pj,qj=Math.log,rj=Math.LN2,Wc=64,Rd=4194304,z=0,Ae=!1,Yc=[],Va=null,Wa=null,Xa=null,jc=new Map,kc=new Map,Ya=[],Bj="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" "),
Gb=Sa.ReactCurrentBatchConfig,Zc=!0,$c=null,Za=null,Ee=null,bd=null,Yb={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(a){return a.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},He=ka(Yb),Mc=E({},Yb,{view:0,detail:0}),ak=ka(Mc),ag,bg,Nc,Yd=E({},Mc,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Fe,button:0,buttons:0,relatedTarget:function(a){return void 0===a.relatedTarget?a.fromElement===a.srcElement?a.toElement:a.fromElement:
a.relatedTarget},movementX:function(a){if("movementX"in a)return a.movementX;a!==Nc&&(Nc&&"mousemove"===a.type?(ag=a.screenX-Nc.screenX,bg=a.screenY-Nc.screenY):bg=ag=0,Nc=a);return ag},movementY:function(a){return"movementY"in a?a.movementY:bg}}),ih=ka(Yd),al=E({},Yd,{dataTransfer:0}),Wj=ka(al),bl=E({},Mc,{relatedTarget:0}),Pe=ka(bl),cl=E({},Yb,{animationName:0,elapsedTime:0,pseudoElement:0}),Yj=ka(cl),dl=E({},Yb,{clipboardData:function(a){return"clipboardData"in a?a.clipboardData:window.clipboardData}}),
ck=ka(dl),el=E({},Yb,{data:0}),qh=ka(el),fk=qh,fl={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},gl={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",
112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},Gj={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"},hl=E({},Mc,{key:function(a){if(a.key){var b=fl[a.key]||a.key;if("Unidentified"!==b)return b}return"keypress"===a.type?(a=cd(a),13===a?"Enter":String.fromCharCode(a)):"keydown"===a.type||"keyup"===a.type?gl[a.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,
metaKey:0,repeat:0,locale:0,getModifierState:Fe,charCode:function(a){return"keypress"===a.type?cd(a):0},keyCode:function(a){return"keydown"===a.type||"keyup"===a.type?a.keyCode:0},which:function(a){return"keypress"===a.type?cd(a):"keydown"===a.type||"keyup"===a.type?a.keyCode:0}}),Vj=ka(hl),il=E({},Yd,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),nh=ka(il),jl=E({},Mc,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,
ctrlKey:0,shiftKey:0,getModifierState:Fe}),Xj=ka(jl),kl=E({},Yb,{propertyName:0,elapsedTime:0,pseudoElement:0}),Zj=ka(kl),ll=E({},Yd,{deltaX:function(a){return"deltaX"in a?a.deltaX:"wheelDeltaX"in a?-a.wheelDeltaX:0},deltaY:function(a){return"deltaY"in a?a.deltaY:"wheelDeltaY"in a?-a.wheelDeltaY:"wheelDelta"in a?-a.wheelDelta:0},deltaZ:0,deltaMode:0}),bk=ka(ll),Hj=[9,13,27,32],Ge=Ia&&"CompositionEvent"in window,Oc=null;Ia&&"documentMode"in document&&(Oc=document.documentMode);var ek=Ia&&"TextEvent"in
window&&!Oc,Ug=Ia&&(!Ge||Oc&&8<Oc&&11>=Oc),Tg=String.fromCharCode(32),Sg=!1,Hb=!1,Kj={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0},oc=null,pc=null,ph=!1;Ia&&(ph=Lj("input")&&(!document.documentMode||9<document.documentMode));var ua="function"===typeof Object.is?Object.is:Sj,dk=Ia&&"documentMode"in document&&11>=document.documentMode,Jb=null,Ke=null,rc=null,Je=!1,Kb={animationend:gd("Animation","AnimationEnd"),
animationiteration:gd("Animation","AnimationIteration"),animationstart:gd("Animation","AnimationStart"),transitionend:gd("Transition","TransitionEnd")},Le={},eh={};Ia&&(eh=document.createElement("div").style,"AnimationEvent"in window||(delete Kb.animationend.animation,delete Kb.animationiteration.animation,delete Kb.animationstart.animation),"TransitionEvent"in window||delete Kb.transitionend.transition);var jh=hd("animationend"),kh=hd("animationiteration"),lh=hd("animationstart"),mh=hd("transitionend"),
fh=new Map,Zi="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
(function(){for(var a=0;a<Zi.length;a++){var b=Zi[a],c=b.toLowerCase();b=b[0].toUpperCase()+b.slice(1);$a(c,"on"+b)}$a(jh,"onAnimationEnd");$a(kh,"onAnimationIteration");$a(lh,"onAnimationStart");$a("dblclick","onDoubleClick");$a("focusin","onFocus");$a("focusout","onBlur");$a(mh,"onTransitionEnd")})();Ab("onMouseEnter",["mouseout","mouseover"]);Ab("onMouseLeave",["mouseout","mouseover"]);Ab("onPointerEnter",["pointerout","pointerover"]);Ab("onPointerLeave",["pointerout","pointerover"]);mb("onChange",
"change click focusin focusout input keydown keyup selectionchange".split(" "));mb("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));mb("onBeforeInput",["compositionend","keypress","textInput","paste"]);mb("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));mb("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));mb("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var Ec="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Uj=new Set("cancel close invalid load scroll toggle".split(" ").concat(Ec)),id="_reactListening"+Math.random().toString(36).slice(2),gk=/\r\n?/g,hk=/\u0000|\uFFFD/g,Jf=null,Kf=null,Rf="function"===typeof setTimeout?setTimeout:void 0,Nk="function"===typeof clearTimeout?
clearTimeout:void 0,$i="function"===typeof Promise?Promise:void 0,Jk="function"===typeof queueMicrotask?queueMicrotask:"undefined"!==typeof $i?function(a){return $i.resolve(null).then(a).catch(ik)}:Rf,Zb=Math.random().toString(36).slice(2),Da="__reactFiber$"+Zb,uc="__reactProps$"+Zb,Ja="__reactContainer$"+Zb,Me="__reactEvents$"+Zb,Dk="__reactListeners$"+Zb,Ek="__reactHandles$"+Zb,Se=[],Mb=-1,cb={},J=bb(cb),S=bb(!1),pb=cb,La=null,md=!1,Te=!1,Ob=[],Pb=0,od=null,nd=0,na=[],oa=0,rb=null,Ma=1,Na="",la=
null,fa=null,D=!1,wa=null,Ik=Sa.ReactCurrentBatchConfig,Vb=Dh(!0),li=Dh(!1),ud=bb(null),td=null,Rb=null,bf=null,tb=null,kk=Oa,gb=!1,wc={},Ea=bb(wc),yc=bb(wc),xc=bb(wc),F=bb(0),kf=[],yd=Sa.ReactCurrentDispatcher,sf=Sa.ReactCurrentBatchConfig,vb=0,C=null,K=null,N=null,Ad=!1,zc=!1,Ac=0,ml=0,zd={readContext:qa,useCallback:V,useContext:V,useEffect:V,useImperativeHandle:V,useInsertionEffect:V,useLayoutEffect:V,useMemo:V,useReducer:V,useRef:V,useState:V,useDebugValue:V,useDeferredValue:V,useTransition:V,
useMutableSource:V,useSyncExternalStore:V,useId:V,unstable_isNewReconciler:!1},lk={readContext:qa,useCallback:function(a,b){Fa().memoizedState=[a,void 0===b?null:b];return a},useContext:qa,useEffect:Sh,useImperativeHandle:function(a,b,c){c=null!==c&&void 0!==c?c.concat([a]):null;return Bd(4194308,4,Vh.bind(null,b,a),c)},useLayoutEffect:function(a,b){return Bd(4194308,4,a,b)},useInsertionEffect:function(a,b){return Bd(4,2,a,b)},useMemo:function(a,b){var c=Fa();b=void 0===b?null:b;a=a();c.memoizedState=
[a,b];return a},useReducer:function(a,b,c){var d=Fa();b=void 0!==c?c(b):b;d.memoizedState=d.baseState=b;a={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:a,lastRenderedState:b};d.queue=a;a=a.dispatch=qk.bind(null,C,a);return[d.memoizedState,a]},useRef:function(a){var b=Fa();a={current:a};return b.memoizedState=a},useState:Qh,useDebugValue:rf,useDeferredValue:function(a){return Fa().memoizedState=a},useTransition:function(){var a=Qh(!1),b=a[0];a=pk.bind(null,a[1]);Fa().memoizedState=
a;return[b,a]},useMutableSource:function(a,b,c){},useSyncExternalStore:function(a,b,c){var d=C,e=Fa();if(D){if(void 0===c)throw Error(m(407));c=c()}else{c=b();if(null===O)throw Error(m(349));0!==(vb&30)||Nh(d,b,c)}e.memoizedState=c;var f={value:c,getSnapshot:b};e.queue=f;Sh(Lh.bind(null,d,f,a),[a]);d.flags|=2048;Cc(9,Mh.bind(null,d,f,c,b),void 0,null);return c},useId:function(){var a=Fa(),b=O.identifierPrefix;if(D){var c=Na;var d=Ma;c=(d&~(1<<32-ta(d)-1)).toString(32)+c;b=":"+b+"R"+c;c=Ac++;0<c&&
(b+="H"+c.toString(32));b+=":"}else c=ml++,b=":"+b+"r"+c.toString(32)+":";return a.memoizedState=b},unstable_isNewReconciler:!1},mk={readContext:qa,useCallback:Xh,useContext:qa,useEffect:qf,useImperativeHandle:Wh,useInsertionEffect:Th,useLayoutEffect:Uh,useMemo:Yh,useReducer:of,useRef:Rh,useState:function(a){return of(Bc)},useDebugValue:rf,useDeferredValue:function(a){var b=sa();return Zh(b,K.memoizedState,a)},useTransition:function(){var a=of(Bc)[0],b=sa().memoizedState;return[a,b]},useMutableSource:Jh,
useSyncExternalStore:Kh,useId:$h,unstable_isNewReconciler:!1},nk={readContext:qa,useCallback:Xh,useContext:qa,useEffect:qf,useImperativeHandle:Wh,useInsertionEffect:Th,useLayoutEffect:Uh,useMemo:Yh,useReducer:pf,useRef:Rh,useState:function(a){return pf(Bc)},useDebugValue:rf,useDeferredValue:function(a){var b=sa();return null===K?b.memoizedState=a:Zh(b,K.memoizedState,a)},useTransition:function(){var a=pf(Bc)[0],b=sa().memoizedState;return[a,b]},useMutableSource:Jh,useSyncExternalStore:Kh,useId:$h,
unstable_isNewReconciler:!1},Dd={isMounted:function(a){return(a=a._reactInternals)?nb(a)===a:!1},enqueueSetState:function(a,b,c){a=a._reactInternals;var d=Z(),e=hb(a),f=Pa(d,e);f.payload=b;void 0!==c&&null!==c&&(f.callback=c);b=fb(a,f,e);null!==b&&(xa(b,a,e,d),vd(b,a,e))},enqueueReplaceState:function(a,b,c){a=a._reactInternals;var d=Z(),e=hb(a),f=Pa(d,e);f.tag=1;f.payload=b;void 0!==c&&null!==c&&(f.callback=c);b=fb(a,f,e);null!==b&&(xa(b,a,e,d),vd(b,a,e))},enqueueForceUpdate:function(a,b){a=a._reactInternals;
var c=Z(),d=hb(a),e=Pa(c,d);e.tag=2;void 0!==b&&null!==b&&(e.callback=b);b=fb(a,e,d);null!==b&&(xa(b,a,d,c),vd(b,a,d))}},rk="function"===typeof WeakMap?WeakMap:Map,tk=Sa.ReactCurrentOwner,ha=!1,Cf={dehydrated:null,treeContext:null,retryLane:0};var zk=function(a,b,c,d){for(c=b.child;null!==c;){if(5===c.tag||6===c.tag)a.appendChild(c.stateNode);else if(4!==c.tag&&null!==c.child){c.child.return=c;c=c.child;continue}if(c===b)break;for(;null===c.sibling;){if(null===c.return||c.return===b)return;c=c.return}c.sibling.return=
c.return;c=c.sibling}};var xi=function(a,b){};var yk=function(a,b,c,d,e){var f=a.memoizedProps;if(f!==d){a=b.stateNode;ub(Ea.current);e=null;switch(c){case "input":f=ke(a,f);d=ke(a,d);e=[];break;case "select":f=E({},f,{value:void 0});d=E({},d,{value:void 0});e=[];break;case "textarea":f=ne(a,f);d=ne(a,d);e=[];break;default:"function"!==typeof f.onClick&&"function"===typeof d.onClick&&(a.onclick=kd)}pe(c,d);var g;c=null;for(l in f)if(!d.hasOwnProperty(l)&&f.hasOwnProperty(l)&&null!=f[l])if("style"===
l){var h=f[l];for(g in h)h.hasOwnProperty(g)&&(c||(c={}),c[g]="")}else"dangerouslySetInnerHTML"!==l&&"children"!==l&&"suppressContentEditableWarning"!==l&&"suppressHydrationWarning"!==l&&"autoFocus"!==l&&($b.hasOwnProperty(l)?e||(e=[]):(e=e||[]).push(l,null));for(l in d){var k=d[l];h=null!=f?f[l]:void 0;if(d.hasOwnProperty(l)&&k!==h&&(null!=k||null!=h))if("style"===l)if(h){for(g in h)!h.hasOwnProperty(g)||k&&k.hasOwnProperty(g)||(c||(c={}),c[g]="");for(g in k)k.hasOwnProperty(g)&&h[g]!==k[g]&&(c||
(c={}),c[g]=k[g])}else c||(e||(e=[]),e.push(l,c)),c=k;else"dangerouslySetInnerHTML"===l?(k=k?k.__html:void 0,h=h?h.__html:void 0,null!=k&&h!==k&&(e=e||[]).push(l,k)):"children"===l?"string"!==typeof k&&"number"!==typeof k||(e=e||[]).push(l,""+k):"suppressContentEditableWarning"!==l&&"suppressHydrationWarning"!==l&&($b.hasOwnProperty(l)?(null!=k&&"onScroll"===l&&B("scroll",a),e||h===k||(e=[])):(e=e||[]).push(l,k))}c&&(e=e||[]).push("style",c);var l=e;if(b.updateQueue=l)b.flags|=4}};var Ak=function(a,
b,c,d){c!==d&&(b.flags|=4)};var Jd=!1,X=!1,Fk="function"===typeof WeakSet?WeakSet:Set,l=null,zi=!1,T=null,za=!1,Mk=Math.ceil,Od=Sa.ReactCurrentDispatcher,Uf=Sa.ReactCurrentOwner,ca=Sa.ReactCurrentBatchConfig,p=0,O=null,H=null,U=0,ba=0,Ga=bb(0),L=0,Jc=null,ra=0,Md=0,Sf=0,Kc=null,ja=null,Of=0,Hf=Infinity,Ra=null,Ed=!1,xf=null,ib=null,Pd=!1,lb=null,Qd=0,Ic=0,Pf=null,Kd=-1,Ld=0;var Qk=function(a,b,c){if(null!==a)if(a.memoizedProps!==b.pendingProps||S.current)ha=!0;else{if(0===(a.lanes&c)&&0===(b.flags&
128))return ha=!1,wk(a,b,c);ha=0!==(a.flags&131072)?!0:!1}else ha=!1,D&&0!==(b.flags&1048576)&&yh(b,nd,b.index);b.lanes=0;switch(b.tag){case 2:var d=b.type;Fd(a,b);a=b.pendingProps;var e=Nb(b,J.current);Sb(b,c);e=mf(null,b,d,a,e,c);var f=nf();b.flags|=1;"object"===typeof e&&null!==e&&"function"===typeof e.render&&void 0===e.$$typeof?(b.tag=1,b.memoizedState=null,b.updateQueue=null,ea(d)?(f=!0,ld(b)):f=!1,b.memoizedState=null!==e.state&&void 0!==e.state?e.state:null,ff(b),e.updater=Dd,b.stateNode=
e,e._reactInternals=b,uf(b,d,a,c),b=Af(null,b,d,!0,f,c)):(b.tag=0,D&&f&&Ue(b),aa(null,b,e,c),b=b.child);return b;case 16:d=b.elementType;a:{Fd(a,b);a=b.pendingProps;e=d._init;d=e(d._payload);b.type=d;e=b.tag=Uk(d);a=ya(d,a);switch(e){case 0:b=zf(null,b,d,a,c);break a;case 1:b=ri(null,b,d,a,c);break a;case 11:b=mi(null,b,d,a,c);break a;case 14:b=ni(null,b,d,ya(d.type,a),c);break a}throw Error(m(306,d,""));}return b;case 0:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:ya(d,e),zf(a,b,d,e,c);
case 1:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:ya(d,e),ri(a,b,d,e,c);case 3:a:{si(b);if(null===a)throw Error(m(387));d=b.pendingProps;f=b.memoizedState;e=f.element;Fh(a,b);wd(b,d,null,c);var g=b.memoizedState;d=g.element;if(f.isDehydrated)if(f={element:d,isDehydrated:!1,cache:g.cache,pendingSuspenseBoundaries:g.pendingSuspenseBoundaries,transitions:g.transitions},b.updateQueue.baseState=f,b.memoizedState=f,b.flags&256){e=Ub(Error(m(423)),b);b=ti(a,b,d,c,e);break a}else if(d!==e){e=
Ub(Error(m(424)),b);b=ti(a,b,d,c,e);break a}else for(fa=Ka(b.stateNode.containerInfo.firstChild),la=b,D=!0,wa=null,c=li(b,null,d,c),b.child=c;c;)c.flags=c.flags&-3|4096,c=c.sibling;else{Qb();if(d===e){b=Qa(a,b,c);break a}aa(a,b,d,c)}b=b.child}return b;case 5:return Ih(b),null===a&&Xe(b),d=b.type,e=b.pendingProps,f=null!==a?a.memoizedProps:null,g=e.children,Qe(d,e)?g=null:null!==f&&Qe(d,f)&&(b.flags|=32),qi(a,b),aa(a,b,g,c),b.child;case 6:return null===a&&Xe(b),null;case 13:return ui(a,b,c);case 4:return gf(b,
b.stateNode.containerInfo),d=b.pendingProps,null===a?b.child=Vb(b,null,d,c):aa(a,b,d,c),b.child;case 11:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:ya(d,e),mi(a,b,d,e,c);case 7:return aa(a,b,b.pendingProps,c),b.child;case 8:return aa(a,b,b.pendingProps.children,c),b.child;case 12:return aa(a,b,b.pendingProps.children,c),b.child;case 10:a:{d=b.type._context;e=b.pendingProps;f=b.memoizedProps;g=e.value;y(ud,d._currentValue);d._currentValue=g;if(null!==f)if(ua(f.value,g)){if(f.children===
e.children&&!S.current){b=Qa(a,b,c);break a}}else for(f=b.child,null!==f&&(f.return=b);null!==f;){var h=f.dependencies;if(null!==h){g=f.child;for(var k=h.firstContext;null!==k;){if(k.context===d){if(1===f.tag){k=Pa(-1,c&-c);k.tag=2;var l=f.updateQueue;if(null!==l){l=l.shared;var p=l.pending;null===p?k.next=k:(k.next=p.next,p.next=k);l.pending=k}}f.lanes|=c;k=f.alternate;null!==k&&(k.lanes|=c);df(f.return,c,b);h.lanes|=c;break}k=k.next}}else if(10===f.tag)g=f.type===b.type?null:f.child;else if(18===
f.tag){g=f.return;if(null===g)throw Error(m(341));g.lanes|=c;h=g.alternate;null!==h&&(h.lanes|=c);df(g,c,b);g=f.sibling}else g=f.child;if(null!==g)g.return=f;else for(g=f;null!==g;){if(g===b){g=null;break}f=g.sibling;if(null!==f){f.return=g.return;g=f;break}g=g.return}f=g}aa(a,b,e.children,c);b=b.child}return b;case 9:return e=b.type,d=b.pendingProps.children,Sb(b,c),e=qa(e),d=d(e),b.flags|=1,aa(a,b,d,c),b.child;case 14:return d=b.type,e=ya(d,b.pendingProps),e=ya(d.type,e),ni(a,b,d,e,c);case 15:return oi(a,
b,b.type,b.pendingProps,c);case 17:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:ya(d,e),Fd(a,b),b.tag=1,ea(d)?(a=!0,ld(b)):a=!1,Sb(b,c),ei(b,d,e),uf(b,d,e,c),Af(null,b,d,!0,a,c);case 19:return wi(a,b,c);case 22:return pi(a,b,c)}throw Error(m(156,b.tag));};var pa=function(a,b,c,d){return new Tk(a,b,c,d)},aj="function"===typeof reportError?reportError:function(a){console.error(a)};Ud.prototype.render=Xf.prototype.render=function(a){var b=this._internalRoot;if(null===b)throw Error(m(409));
Sd(a,b,null,null)};Ud.prototype.unmount=Xf.prototype.unmount=function(){var a=this._internalRoot;if(null!==a){this._internalRoot=null;var b=a.containerInfo;yb(function(){Sd(null,a,null,null)});b[Ja]=null}};Ud.prototype.unstable_scheduleHydration=function(a){if(a){var b=nl();a={blockedOn:null,target:a,priority:b};for(var c=0;c<Ya.length&&0!==b&&b<Ya[c].priority;c++);Ya.splice(c,0,a);0===c&&Hg(a)}};var Cj=function(a){switch(a.tag){case 3:var b=a.stateNode;if(b.current.memoizedState.isDehydrated){var c=
hc(b.pendingLanes);0!==c&&(xe(b,c|1),ia(b,P()),0===(p&6)&&(Hc(),db()))}break;case 13:yb(function(){var b=Oa(a,1);if(null!==b){var c=Z();xa(b,a,1,c)}}),Wf(a,1)}};var Gg=function(a){if(13===a.tag){var b=Oa(a,134217728);if(null!==b){var c=Z();xa(b,a,134217728,c)}Wf(a,134217728)}};var xj=function(a){if(13===a.tag){var b=hb(a),c=Oa(a,b);if(null!==c){var d=Z();xa(c,a,b,d)}Wf(a,b)}};var nl=function(){return z};var wj=function(a,b){var c=z;try{return z=a,b()}finally{z=c}};se=function(a,b,c){switch(b){case "input":le(a,
c);b=c.name;if("radio"===c.type&&null!=b){for(c=a;c.parentNode;)c=c.parentNode;c=c.querySelectorAll("input[name="+JSON.stringify(""+b)+'][type="radio"]');for(b=0;b<c.length;b++){var d=c[b];if(d!==a&&d.form===a.form){var e=Rc(d);if(!e)throw Error(m(90));jg(d);le(d,e)}}}break;case "textarea":og(a,c);break;case "select":b=c.value,null!=b&&Db(a,!!c.multiple,b,!1)}};(function(a,b,c){xg=a;yg=c})(Tf,function(a,b,c,d,e){var f=z,g=ca.transition;try{return ca.transition=null,z=1,a(b,c,d,e)}finally{z=f,ca.transition=
g,0===p&&Hc()}},yb);var ol={usingClientEntryPoint:!1,Events:[ec,Ib,Rc,ug,vg,Tf]};(function(a){a={bundleType:a.bundleType,version:a.version,rendererPackageName:a.rendererPackageName,rendererConfig:a.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:Sa.ReactCurrentDispatcher,findHostInstanceByFiber:Xk,
findFiberByHostInstance:a.findFiberByHostInstance||Yk,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1"};if("undefined"===typeof __REACT_DEVTOOLS_GLOBAL_HOOK__)a=!1;else{var b=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(b.isDisabled||!b.supportsFiber)a=!0;else{try{Uc=b.inject(a),Ca=b}catch(c){}a=b.checkDCE?!0:!1}}return a})({findFiberByHostInstance:ob,bundleType:0,version:"18.3.1-next-f1338f8080-20240426",
rendererPackageName:"react-dom"});Q.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=ol;Q.createPortal=function(a,b){var c=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null;if(!Yf(b))throw Error(m(200));return Wk(a,b,null,c)};Q.createRoot=function(a,b){if(!Yf(a))throw Error(m(299));var c=!1,d="",e=aj;null!==b&&void 0!==b&&(!0===b.unstable_strictMode&&(c=!0),void 0!==b.identifierPrefix&&(d=b.identifierPrefix),void 0!==b.onRecoverableError&&(e=b.onRecoverableError));b=Vf(a,1,!1,null,null,
c,!1,d,e);a[Ja]=b.current;sc(8===a.nodeType?a.parentNode:a);return new Xf(b)};Q.findDOMNode=function(a){if(null==a)return null;if(1===a.nodeType)return a;var b=a._reactInternals;if(void 0===b){if("function"===typeof a.render)throw Error(m(188));a=Object.keys(a).join(",");throw Error(m(268,a));}a=Bg(b);a=null===a?null:a.stateNode;return a};Q.flushSync=function(a){return yb(a)};Q.hydrate=function(a,b,c){if(!Vd(b))throw Error(m(200));return Wd(null,a,b,!0,c)};Q.hydrateRoot=function(a,b,c){if(!Yf(a))throw Error(m(405));
var d=null!=c&&c.hydratedSources||null,e=!1,f="",g=aj;null!==c&&void 0!==c&&(!0===c.unstable_strictMode&&(e=!0),void 0!==c.identifierPrefix&&(f=c.identifierPrefix),void 0!==c.onRecoverableError&&(g=c.onRecoverableError));b=Wi(b,null,a,1,null!=c?c:null,e,!1,f,g);a[Ja]=b.current;sc(a);if(d)for(a=0;a<d.length;a++)c=d[a],e=c._getVersion,e=e(c._source),null==b.mutableSourceEagerHydrationData?b.mutableSourceEagerHydrationData=[c,e]:b.mutableSourceEagerHydrationData.push(c,e);return new Ud(b)};Q.render=
function(a,b,c){if(!Vd(b))throw Error(m(200));return Wd(null,a,b,!1,c)};Q.unmountComponentAtNode=function(a){if(!Vd(a))throw Error(m(40));return a._reactRootContainer?(yb(function(){Wd(null,null,a,!1,function(){a._reactRootContainer=null;a[Ja]=null})}),!0):!1};Q.unstable_batchedUpdates=Tf;Q.unstable_renderSubtreeIntoContainer=function(a,b,c,d){if(!Vd(c))throw Error(m(200));if(null==a||void 0===a._reactInternals)throw Error(m(38));return Wd(a,b,c,!1,d)};Q.version="18.3.1-next-f1338f8080-20240426"});
})();

;
(() => {
  window.readWorkbookSafely = function(buffer) {
    return new Promise(function(resolve, reject) {
      if (!(buffer instanceof ArrayBuffer) || buffer.byteLength > 10 * 1024 * 1024) {
        reject(new Error("\uD30C\uC77C\uC740 10MB \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4."));
        return;
      }
      var worker = new Worker(new URL("assets/workbook-worker.js", document.baseURI));
      var timer = setTimeout(function() {
        worker.terminate();
        reject(new Error("\uD30C\uC77C \uCC98\uB9AC \uC2DC\uAC04\uC774 \uCD08\uACFC\uB418\uC5C8\uC2B5\uB2C8\uB2E4."));
      }, 15e3);
      function finish() {
        clearTimeout(timer);
        worker.terminate();
      }
      worker.onmessage = function(e) {
        finish();
        if (e.data.error) reject(new Error(e.data.error));
        else resolve(e.data.workbook);
      };
      worker.onerror = function() {
        finish();
        reject(new Error("\uD30C\uC77C\uC744 \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."));
      };
      worker.postMessage(buffer, [buffer]);
    });
  };
})();

;
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

;
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

;
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
