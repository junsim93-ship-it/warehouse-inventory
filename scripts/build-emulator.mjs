// Local browser verification only. This bundle cannot connect to the production project.
import fs from 'node:fs/promises';
import {build} from 'esbuild';
await fs.mkdir('dist-emulator',{recursive:true});
await build({entryPoints:['ui/main.jsx'],bundle:true,format:'esm',outdir:'dist-emulator',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'local-firebase',setup(builder){
  builder.onLoad({filter:/firebase-api\.mjs$/},async args=>{
    let source=await fs.readFile(args.path,'utf8');
    source=source.replace(/initializeApp\(\{[^}]+\}\)/,"initializeApp({apiKey:'demo-key',projectId:'demo-react-warehouse',authDomain:'localhost'})");
    source=source.replace('const initialized=',"connectAuthEmulator(auth,'http://127.0.0.1:9099');connectFirestoreEmulator(db,'127.0.0.1',8087);connectFunctionsEmulator(getFunctions(app,'asia-northeast3'),'127.0.0.1',5001);const initialized=");
    return {contents:"import {connectAuthEmulator} from 'firebase/auth';import {connectFirestoreEmulator} from 'firebase/firestore';import {connectFunctionsEmulator} from 'firebase/functions';"+source,loader:'js'};
  });
}}]});
await fs.writeFile('dist-emulator/index.html','<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/main.css"><div id="root"></div><script type="module" src="/main.js"></script></html>');
