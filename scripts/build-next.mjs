import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {transform} from 'esbuild';
await fs.mkdir('dist-next/assets',{recursive:true});
for(const name of ['warehouse-next','product-picker','security-client']) {
  const source=await fs.readFile(`src/${name}.js`,'utf8');
  const result=await transform(source,{loader:'js',format:'iife',target:'es2020'});
  await fs.writeFile(`dist-next/assets/${name}.js`,result.code);
}
await fs.copyFile('src/warehouse-next.css','dist-next/assets/warehouse-next.css');
await fs.cp('vendor','dist-next/vendor',{recursive:true});
let html=await fs.readFile('src/pages/warehouse-next.html','utf8');
html=html.replace(/<script src="([^"]+)"[^>]*><\/script>/g,(_,src)=>`<script src="${src}"></script>`);
for(const [,src] of [...html.matchAll(/<script src="([^"]+)"><\/script>/g)]) {
  const hash=crypto.createHash('sha384').update(await fs.readFile('dist-next/'+src)).digest('base64');
  html=html.replace(`<script src="${src}"></script>`,`<script src="${src}" integrity="sha384-${hash}" crossorigin="anonymous"></script>`);
}
await fs.writeFile('dist-next/index.html',html);
console.log('Built separate Firebase site in dist-next. Original pages are unchanged.');
