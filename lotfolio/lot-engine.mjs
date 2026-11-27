export { newId as randomId } from './attachments.mjs';

export const types = { A: '인쇄용기', B: '단상자', C: '라벨' };
export const regulations = { N: '위생허가', M: '모크라', C: 'CPNP' };

export function productCode(input) {
  const code = String(input ?? '')
    .trim()
    .toUpperCase();
  if (!/^[A-Z0-9-]+$/.test(code)) throw new Error('제품번호는 영문, 숫자, 하이픈으로 입력해 주세요.');
  return code;
}
export function parseLot(input) {
  const parts = String(input ?? '')
    .trim()
    .toUpperCase()
    .split('_');
  if (parts.length !== 4)
    throw new Error('밑줄(_)로 확정월·차수, 제품번호, 부자재, 인허가의 네 구간을 구분해 주세요.');
  const [prefix, rawCode, type, rawReg] = parts;
  const match = /^(\d{2}(?:0[1-9]|1[0-2]))V(\d*)$/.exec(prefix);
  if (!match) throw new Error('첫 구간은 확정 연월 네 자리(월 01~12), V, 선택 차수 순서로 입력해 주세요.');
  const seq = match[2].replace(/^0+/, '').padStart(match[2] ? 2 : 0, '0');
  if (seq === '00') throw new Error('발주 차수는 1 이상의 정수로 입력하거나 생략해 주세요.');
  const code = productCode(rawCode);
  if (!Object.hasOwn(types, type)) throw new Error('부자재 구분은 A, B, C 중 하나를 입력해 주세요.');
  if (rawReg !== 'KR' && (!/^[NMC]+$/.test(rawReg) || new Set(rawReg).size !== rawReg.length))
    throw new Error('인허가에는 N, M, C를 한 번씩 사용하거나 국내 전용 KR을 입력해 주세요.');
  const reg = rawReg === 'KR' ? rawReg : [...'NMC'].filter((ch) => rawReg.includes(ch)).join('');
  const month = match[1],
    tail = '_' + code + '_' + type + '_' + reg;
  return {
    month,
    seq,
    code,
    type,
    reg,
    key: month + 'V' + tail,
    lot: month + 'V' + seq + tail,
    corrected: rawReg !== reg,
  };
}
export function buildLot({ month, seq = '', code, type, reg = 'KR' }) {
  if (!/^\d{2}(0[1-9]|1[0-2])$/.test(month)) throw new Error('확정 연월을 선택해 주세요.');
  if (seq && !/^\d+$/.test(seq)) throw new Error('발주 차수는 1 이상의 정수로 입력해 주세요.');
  return parseLot(month + 'V' + seq + '_' + productCode(code) + '_' + type + '_' + (reg || 'KR'));
}
export function currentMonth(date = new Date()) {
  return String(date.getFullYear()).slice(-2) + String(date.getMonth() + 1).padStart(2, '0');
}
export function nextSeq(records, key) {
  const max = records
    .filter((row) => row.key === key && /^[0-9]+$/.test(row.seq))
    .reduce((max, row) => {
      const n = BigInt(row.seq);
      return n > max ? n : max;
    }, 0n);
  return (max + 1n).toString().padStart(2, '0');
}
