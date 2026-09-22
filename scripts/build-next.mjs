import fs from 'node:fs/promises';
import {build} from 'esbuild';
await fs.mkdir('dist-next/assets',{recursive:true});
const result=await build({entryPoints:['ui/main.jsx'],bundle:true,minify:true,format:'esm',target:'es2022',outdir:'dist-next/assets',entryNames:'app-[hash]',assetNames:'[name]-[hash]',metafile:true,define:{'process.env.NODE_ENV':'"production"'},legalComments:'none'});
const outputs=Object.keys(result.metafile.outputs);
const script=outputs.find(p=>p.endsWith('.js')).replace('dist-next/','');
const css=outputs.find(p=>p.endsWith('.css')).replace('dist-next/','');
await fs.writeFile('dist-next/index.html',`<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#f5f5f7"><title>창고 재고관리</title><link rel="stylesheet" href="/${css}"><script type="module" src="/${script}"></script></head><body><div id="root"></div></body></html>`);
console.log('Built the original React warehouse UI for the separate Firebase site.');
