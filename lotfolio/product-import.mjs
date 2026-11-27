import { productCode } from './lot-engine.mjs';

export const productHeaders = ['고유번호', '제품명', '브랜드', '메모'];

export function decodeProductCsv(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('euc-kr', { fatal: true }).decode(bytes);
  }
}

export function previewProductRows(matrix, products) {
  const titles = (matrix[0] || []).map((cell) => String(cell).trim());
  const columns = productHeaders.map((header) => titles.indexOf(header));
  if (columns[0] < 0 || columns[1] < 0) throw Error('첫 행에 고유번호와 제품명 열이 필요합니다.');
  const seen = new Set(products.map((product) => product.code));
  const rows = [];
  matrix.slice(1).forEach((cells, index) => {
    if (!cells?.some((cell) => String(cell ?? '').trim())) return;
    const [raw, name, brand, memo] = columns.map((column) => String(cells[column] ?? '').trim());
    let code = raw,
      error = '';
    try {
      if (!raw) throw Error('고유번호 누락');
      code = productCode(raw);
      if (!name) throw Error('제품명 누락');
    } catch (exception) {
      error = exception.message;
    }
    const duplicate = !error && seen.has(code);
    if (!error) seen.add(code);
    rows.push({ n: index + 2, code, name, brand, memo, error, duplicate });
  });
  if (!rows.length) throw Error('등록할 제품 행이 없습니다.');
  return rows;
}
