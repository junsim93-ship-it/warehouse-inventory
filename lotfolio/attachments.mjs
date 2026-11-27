export const fileKinds = {
  image: { label: '미리보기 이미지', accept: '.jpg,.jpeg,.png,.webp', max: 30 },
  pdf: { label: '인쇄용 PDF', accept: '.pdf', max: 100 },
};

const mimeTypes = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

export function fileMime(kind, name, size) {
  const extension = String(name).toLowerCase().split('.').at(-1);
  const spec = Object.hasOwn(fileKinds, kind) && fileKinds[kind];
  if (
    !spec ||
    !/\./.test(name) ||
    !spec.accept.split(',').includes('.' + extension) ||
    !Number.isSafeInteger(size) ||
    size <= 0 ||
    size > spec.max * 1024 * 1024
  ) {
    throw Error('첨부파일 종류와 용량을 확인해 주세요.');
  }
  return mimeTypes[extension];
}

export function newId(provider = globalThis.crypto) {
  if (typeof provider?.randomUUID === 'function') return provider.randomUUID();
  if (!provider?.getRandomValues) throw Error('이 브라우저에서 안전한 파일 번호를 생성할 수 없습니다.');
  const bytes = provider.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}
