import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const [mode = 'test', basePath = 'firestore.rules'] = process.argv.slice(2);
if (!['test','start','prepare'].includes(mode)) throw Error('Use test, start or prepare.');
const base = readFileSync(basePath, 'utf8');
const end = /\}\s*\}\s*$/.exec(base);
if (!end || !base.includes('function approved()')) throw Error('Expected the reviewed Firestore rules with approved() and closing database/service blocks.');
const snippet = readFileSync('rules/firestore-lotfolio.rules.snippet','utf8');
mkdirSync('.firebase/lotfolio', {recursive:true});
writeFileSync('.firebase/lotfolio/combined.rules', base.slice(0,end.index) + '\n' + snippet + '\n' + base.slice(end.index));
if (mode !== 'prepare') {
  const args = [mode === 'start' ? 'emulators:start' : 'emulators:exec',
    '--project','demo-lotfolio','--config','firebase.lotfolio-emulator.json',
    '--only','firestore,storage,auth'];
  if (mode === 'test') args.push('node --test tests/lotfolio-emulator/access.mjs');
  const run = spawnSync(process.execPath,['node_modules/firebase-tools/lib/bin/firebase.js', ...args],{stdio:'inherit'});
  process.exitCode = run.status ?? 1;
}
