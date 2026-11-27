// Storage holds only ciphertext. The GCM tag travels with its key and IV in the
// role-protected design document, so object.size remains the original file size.
export const fileCipher = 'aes-256-gcm-v1';
const tagLength = 16;

function associatedData(file) {
  return new TextEncoder().encode(JSON.stringify([fileCipher, file.path, file.name, file.mime, file.size]));
}

function encode(bytes) {
  // Only fixed-length key, IV and tag fields use base64.
  return btoa(String.fromCharCode(...bytes));
}

function decode(value, length) {
  if (typeof value !== 'string' || value.length !== Math.ceil(length / 3) * 4) throw Error();
  const bytes = Uint8Array.from(atob(value), ch => ch.charCodeAt(0));
  if (bytes.length !== length) throw Error();
  return bytes;
}

export async function sealFile(file, blob) {
  if (!globalThis.crypto?.subtle) throw Error('보안 연결(HTTPS)에서 첨부파일을 업로드해 주세요.');
  const key = await crypto.subtle.generateKey({name:'AES-GCM', length:256}, true, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const result = new Uint8Array(await crypto.subtle.encrypt(
    {name:'AES-GCM', iv, tagLength:128, additionalData:associatedData(file)}, key, await blob.arrayBuffer()));
  const boundary = result.length - tagLength;
  const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  return {
    ciphertext: new Blob([result.subarray(0,boundary)], {type:'application/octet-stream'}),
    protection: {format:fileCipher, key:encode(rawKey), iv:encode(iv), tag:encode(result.subarray(boundary))}
  };
}

export async function openFile(file, blob, protection) {
  try {
    if (protection?.format !== fileCipher || blob.size !== file.size) throw Error();
    const iv = decode(protection.iv,12), tag = decode(protection.tag,tagLength);
    const key = await crypto.subtle.importKey('raw',decode(protection.key,32),'AES-GCM',false,['decrypt']);
    const packed = await new Blob([blob, tag]).arrayBuffer();
    const plaintext = await crypto.subtle.decrypt(
      {name:'AES-GCM', iv, tagLength:128, additionalData:associatedData(file)}, key, packed);
    return new Blob([plaintext],{type:file.mime});
  } catch {
    throw Error('첨부파일의 원본을 확인할 수 없습니다. 디자인 등록 정보와 파일 상태를 확인해 주세요.');
  }
}
