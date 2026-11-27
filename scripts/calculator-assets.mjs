import {createHash} from 'node:crypto';
import {readFile, readdir, unlink, writeFile} from 'node:fs/promises';
import {build} from 'esbuild';

// The legacy scripts expose browser globals. Concatenate in dependency order
// without wrapping them in a new scope or changing their business logic.
export async function buildCalculatorAssets(site) {
  const read = name => readFile(site+'/'+name, 'utf8');
  async function bundle(prefix, parts) {
    const body = (await Promise.all(parts)).join('\n;\n');
    const hash = createHash('sha256').update(body).digest('hex').slice(0,16);
    const name = 'assets/'+prefix+'-'+hash+'.js';
    await writeFile(site+'/'+name,body);
    return name;
  }
  const sdk = await bundle('firebase-sdk', [
    'firebase-app-compat.js','firebase-auth-compat.js','firebase-firestore-compat.js','firebase-functions-compat.js'
  ].map(name=>read('vendor/'+name)));
  const sheets = await build({entryPoints:['lotfolio/spreadsheet.mjs'],absWorkingDir:process.cwd(),
    bundle:true,format:'iife',globalName:'LotfolioSheets',minify:true,write:false,target:'es2022'});
  const plan = await build({entryPoints:['lotfolio/calculator-plan.mjs'],absWorkingDir:process.cwd(),
    bundle:true,format:'iife',globalName:'CalculatorPlan',minify:true,write:false,target:'es2022'});
  const runtime = await bundle('calculator-runtime', [
    sheets.outputFiles[0].text, plan.outputFiles[0].text,
    ...['assets/unified-session.js','assets/lot-engine.js','assets/lotfolio-frame.js',
      'vendor/react.production.min.js','vendor/react-dom.production.min.js',
      'assets/workbook-client.js','assets/purchase-order.js','assets/calculation-state.js','assets/calculator.js'].map(read),
  ]);
  return {sdk,runtime};
}

export async function removeSupersededBundles(site, current) {
  for (const name of await readdir(site+'/assets')) {
    if (/^(firebase-sdk|calculator-runtime)-[a-f0-9]{16}\.js$/.test(name)
        && !Object.values(current).includes('assets/'+name)) await unlink(site+'/assets/'+name);
  }
}
