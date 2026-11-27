import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const [mode = 'test', basePath = 'firestore.rules'] = process.argv.slice(2);
if (!['test','start','prepare'].includes(mode)) throw Error('Use test, start or prepare.');
const base = readFileSync(basePath, 'utf8');
const end = /\}\s*\}\s*$/.exec(base);
if (!end || !base.includes('function approved()') || !base.includes('function tier2()'))
  throw Error('Expected the reviewed Firestore rules with approved(), tier2(), and closing database/service blocks.');
const snippet = readFileSync('rules/firestore-lotfolio.rules.snippet','utf8').trimEnd();
const markers = /^[ \t]*\/\/ BEGIN LOTFOLIO RULES[ \t]*\r?\n[\s\S]*?^[ \t]*\/\/ END LOTFOLIO RULES[^\S\r\n]*/m;
const legacy = /^[ \t]*(?:\/\/ Insert inside match .*?\r?\n[ \t]*)?function lotApproved\(\) \{[\s\S]*?^[ \t]*match \/lotRecords\/\{id\} \{[^\n]*\n[\s\S]*?^[ \t]*\}[ \t]*(?=\r?$)/m;
const existing = markers.exec(base) || legacy.exec(base);
const containsLotfolio = /function lotApproved\(|match \/lot(?:Designs|Products|Records)\/|LOTFOLIO RULES/.test(base);
if (containsLotfolio && (!existing || !['lotProducts','lotDesigns','lotRecords'].every(name => existing[0].includes('match /'+name+'/'))))
  throw Error('Could not identify the existing Lotfolio block. Replace that block using the deployment guide before testing.');
const merged = existing
  ? base.slice(0,existing.index) + snippet + base.slice(existing.index + existing[0].length)
  : base.slice(0,end.index) + '\n' + snippet + '\n' + base.slice(end.index);
mkdirSync('.firebase/lotfolio', {recursive:true});
writeFileSync('.firebase/lotfolio/combined.rules', merged);
if (mode !== 'prepare') {
  const args = [mode === 'start' ? 'emulators:start' : 'emulators:exec',
    '--project','demo-lotfolio','--config','firebase.lotfolio-emulator.json',
    '--only','firestore,storage,auth'];
  if (mode === 'test') args.push('node --test tests/lotfolio-emulator/access.mjs');
  const run = spawnSync(process.execPath,['node_modules/firebase-tools/lib/bin/firebase.js', ...args],{stdio:'inherit'});
  process.exitCode = run.status ?? 1;
}
