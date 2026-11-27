import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { buildLot, parseLot, nextSeq, productCode, randomId } from '../lotfolio/lot-engine.mjs';
import { decodeProductCsv, previewProductRows } from '../lotfolio/product-import.mjs';
import { fileMime } from '../lotfolio/attachments.mjs';

test('order numbers share a design key and preserve leading product zeros', () => {
  const expected = '2601V_005_B_NMC';
  for (const [raw, padded] of [
    ['', ''],
    ['1', '01'],
    ['03', '03'],
    ['100', '100'],
    ['0007', '07'],
  ]) {
    const result = buildLot({ month: '2601', seq: raw, code: '005', type: 'B', reg: 'NMC' });
    assert.equal(result.key, expected);
    assert.equal(result.lot, '2601V' + padded + '_005_B_NMC');
    assert.deepEqual(parseLot(result.lot), result);
  }
  assert.equal(productCode(' 00a-01 '), '00A-01');
  assert.equal(buildLot({ month: '2601', code: '005', type: 'C', reg: '' }).reg, 'KR');
});

test('lookup canonicalizes every regulatory permutation and identifies corrections', () => {
  for (const reg of ['KR', 'N', 'M', 'C', 'NM', 'NC', 'MC', 'NMC']) {
    assert.equal(parseLot('2601V_138_A_' + reg).corrected, false);
  }
  for (const raw of ['CNM', 'CMN', 'MCN', 'MNC', 'NCM']) {
    const parsed = parseLot(' 2601v3_138_b_' + raw.toLowerCase() + ' ');
    assert.equal(parsed.lot, '2601V03_138_B_NMC');
    assert.equal(parsed.corrected, true);
  }
  assert.equal(parseLot('2612V_X-1_C_CN').reg, 'NC');
});

test('invalid month, sequence, segments and regulatory codes are rejected', () => {
  for (const value of [
    '2600V_005_A_N',
    '2613V_005_B_KR',
    '2601V0_138_B_N',
    '2601V000_005_C_KR',
    '2601X03_138_B_N',
    '2601V_005_D_N',
    '2601V__A_KR',
    '2601V_005_B_',
    '2601V_005_B_NN',
    '2601V_005_B_NKR',
    '2601V_005_B_N_X',
    '2601V_00/5_B_N',
    '2601V-1_005_A_KR',
    '2601V1.5_005_B_N',
    '240101',
    'A100-22',
  ])
    assert.throws(() => parseLot(value), value);
  assert.throws(() => buildLot({ month: '2601', seq: 0, code: '005', type: 'B' }));
});

test('next sequence is scoped to design key and works beyond two digits and safe integer range', () => {
  const key = '2601V_005_C_KR';
  const list = [
    { key, seq: '' },
    { key, seq: '99' },
    { key: 'other', seq: '320' },
  ];
  assert.equal(nextSeq(list, key), '100');
  assert.equal(nextSeq([], key), '01');
  assert.equal(nextSeq([{ key, seq: '9007199254740993' }], key), '9007199254740994');
});

test('secure UUID v4 fallback works without crypto.randomUUID', () => {
  const id = randomId({
    getRandomValues(array) {
      array.fill(0x1f);
      return array;
    },
  });
  assert.equal(id, '1f1f1f1f-1f1f-4f1f-9f1f-1f1f1f1f1f1f');
  assert.throws(() => randomId({}), /안전한/);
});

test('attachment limits allow the exact image and PDF boundaries', () => {
  for (const extension of ['jpg', 'JPEG', 'webp', 'png'])
    assert.ok(fileMime('image', '최종 시안.' + extension, 30 * 1024 * 1024).startsWith('image/'));
  assert.equal(fileMime('pdf', '인쇄.pdf', 100 * 1024 * 1024), 'application/pdf');
  for (const input of [
    ['pdf', '인쇄.pdf', 100 * 1024 * 1024 + 1],
    ['image', 'a.png', 30 * 1024 * 1024 + 1],
    ['pdf', 'source.ai', 1024],
    ['image', 'empty.jpg', 0],
    ['image', 'png', 200],
    ['pdf', '파일.pdf.exe', 1],
  ]) {
    assert.throws(() => fileMime(...input));
  }
});

const ctx = vm.createContext({});
vm.runInContext(
  readFileSync(new URL('../hosting/unified/vendor/xlsx.full.min.js', import.meta.url), 'utf8'),
  ctx,
);
const x = ctx.XLSX;
test('UTF-8 (including BOM) and EUC-KR imports keep Korean text and string codes', () => {
  const csv = '고유번호,제품명\r\n005,제품';
  const korean = Buffer.from('b0edc0afb9f8c8a32cc1a6c7b0b8ed0d0a3030352cc1a6c7b0', 'hex');
  for (const bytes of [new TextEncoder().encode(csv), new TextEncoder().encode('\uFEFF' + csv), korean]) {
    const text = decodeProductCsv(bytes);
    assert.equal(text, csv);
    const book = x.read(text, { type: 'string', raw: true });
    const matrix = x.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { header: 1, raw: false });
    const [row] = previewProductRows(matrix, []);
    assert.equal(row.code, '005');
    assert.equal(row.name, '제품');
  }
});
test('import preview checks existing products, duplicates within a file and invalid rows', () => {
  const rows = previewProductRows(
    [
      ['제품명', '고유번호'],
      ['기존', '005'],
      ['첫 행', 'ab-2'],
      ['두번째', 'AB-2'],
      ['빈 번호', ''],
      ['', '12'],
      ['', ''],
      ['메모', '5/2'],
    ],
    [{ code: '005' }],
  );
  assert.deepEqual(
    rows.map((r) => r.n),
    [2, 3, 4, 5, 6, 8],
  );
  assert.deepEqual(
    rows.slice(0, 3).map((r) => r.duplicate),
    [true, false, true],
  );
  assert.equal(rows[1].code, 'AB-2');
  assert.ok(rows.slice(3).every((r) => r.error));
  assert.throws(() => previewProductRows([['고유번호']], []));
  assert.throws(() => previewProductRows([['고유번호', '제품명']], []));
});
test('template uses Excel text format @ for column A at every row', () => {
  const bytes = readFileSync(
    new URL('../hosting/unified/assets/lot-products-template.xlsx', import.meta.url),
  );
  const book = x.read(bytes, { type: 'array', cellNF: true }),
    sheet = book.Sheets['제품 마스터'];
  assert.equal(sheet.A1.v, '고유번호');
  assert.equal(sheet.B1.v, '제품명');
  assert.equal(sheet.A1.z, '@');
  const archive = x.CFB.read(bytes, { type: 'array' });
  const xml = (name) => new TextDecoder().decode(x.CFB.find(archive, '/xl/' + name).content);
  const style = xml('worksheets/sheet1.xml').match(/<col\b[^>]*min="1"[^>]*max="1"[^>]*style="(\d+)"/);
  assert.ok(style);
  const formats = xml('styles.xml').match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/)[1];
  assert.match([...formats.matchAll(/<xf\b[^>]+/g)][Number(style[1])][0], /numFmtId="49"/);
});
