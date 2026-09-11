import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { transform } from 'esbuild';

await fs.mkdir('assets',{recursive:true});
for(const name of ['calculator','warehouse','security-client','workbook-client','workbook-worker']){
  const filename=`src/${name}.${name==='calculator'?'jsx':'js'}`;
  const result=await transform(await fs.readFile(filename,'utf8'),{sourcefile:filename,loader:name==='calculator'?'jsx':'js',
    format:'iife',target:'es2020',jsx:'transform',minify:false,legalComments:'inline'});
  await fs.writeFile(`assets/${name}.js`,result.code);
}
const csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://asia-northeast3-warehouse-inventory-84fef.cloudfunctions.net; frame-src https://warehouse-inventory-84fef.firebaseapp.com; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'";
const headers=[
  {key:'Content-Security-Policy',value:csp+"; frame-ancestors 'none'"},
  {key:'X-Frame-Options',value:'DENY'},
  {key:'X-Content-Type-Options',value:'nosniff'},
  {key:'Referrer-Policy',value:'no-referrer'},
  {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
  {key:'Cache-Control',value:'no-store'}
];
await fs.mkdir('dist',{recursive:true});
for(const name of ['index.html','calculator.html']){
  let html=await fs.readFile(path.join('src/pages',name),'utf8');
  html=html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\s*/g,'');
  html=html.replace('<head>',`<head><meta http-equiv="Content-Security-Policy" content="${csp}">`);
  html=html.replace(/<script src="([^"]+)"(?: integrity="[^"]+")?(?: crossorigin="[^"]+")?><\/script>/g,(tag,src)=>`<script src="${src}"></script>`);
  // Add SRI to every executable local asset, not just third-party vendor files.
  const sources=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)];
  for(const [,src] of sources){
    const bytes=await fs.readFile(src);
    const hash=crypto.createHash('sha384').update(bytes).digest('base64');
    html=html.replace(`<script src="${src}"></script>`,`<script src="${src}" integrity="sha384-${hash}" crossorigin="anonymous"></script>`);
  }
  if(/INIT_3PL|INIT_ECOUNT|xlsx\/0\.18\.5|text\/babel/.test(html))throw new Error('Unsafe legacy build content');
  await fs.writeFile(path.join('dist',name),html);
  const destination='https://warehouse-inventory-84fef.web.app/'+(name==='index.html'?'':name);
  await fs.writeFile(name,`<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; form-action 'none'"><meta http-equiv="refresh" content="0;url=${destination}"><title>새 재고 관리 사이트로 이동</title></head><body><p>재고 관리 사이트가 이전되었습니다.</p><a href="${destination}" target="_top" rel="noreferrer">새 사이트 열기</a></body></html>\n`);
}
await fs.mkdir('dist',{recursive:true});
for(const dir of ['assets','vendor'])await fs.cp(dir,path.join('dist',dir),{recursive:true});
const config={firestore:{rules:'firestore.rules'},functions:[{source:'functions',codebase:'inventory',runtime:'nodejs22',ignore:['node_modules','.git','*.log']}],
  hosting:{public:'dist',ignore:['firebase.json','**/.*','**/node_modules/**'],headers:[{source:'**',headers}]},
  emulators:{firestore:{port:8087},ui:{enabled:false},singleProjectMode:true}};
await fs.writeFile('firebase.json',JSON.stringify(config,null,2)+'\n');
console.log('Built both pages with CSP, SRI and no embedded stock.');
