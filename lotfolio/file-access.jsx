import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

// Only mounted previews share a blob URL. Each store represents one authenticated session.
const previewCache = new WeakMap();
function acquire(store, file) {
  const cache = previewCache.get(store) || new Map();
  previewCache.set(store, cache);
  const key = file.path;
  let entry = cache.get(key);
  if (!entry) {
    entry = { refs: 0, url: '', promise: null };
    cache.set(key, entry);
    entry.promise = Promise.resolve()
      .then(() => store.getFileBlob(file))
      .then((blob) => {
        if (entry.refs) entry.url = URL.createObjectURL(blob);
        return entry.url;
      });
  }
  entry.refs += 1;
  return {
    promise: entry.promise,
    release() {
      entry.refs -= 1;
      if (!entry.refs) {
        if (entry.url) URL.revokeObjectURL(entry.url);
        cache.delete(key);
      }
    },
  };
}

export function useFileUrl(store, file, visible = true) {
  const path = visible && file?.path;
  const [preview, setPreview] = useState({});
  useEffect(() => {
    if (!path || !store) return;
    let active = true;
    const lease = acquire(store, file);
    lease.promise.then(
      (url) => {
        if (active) setPreview({ store, path, url });
      },
      () => {
        if (active)
          setPreview({
            store,
            path,
            error: '첨부파일을 열 수 없습니다. 연결 상태와 열람 권한을 확인해 주세요.',
          });
      },
    );
    return () => {
      active = false;
      lease.release();
    };
  }, [store, path]);
  return path && preview.path === path && preview.store === store ? preview : {};
}

export function FileDownload({ file, store, onError, children }) {
  const [busy, setBusy] = useState(false);
  async function download() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await store.getFileBlob(file);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.name;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      onError(error.message || '원본 파일을 다운로드할 수 없습니다.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <button type="button" className="download-row" disabled={busy} onClick={download}>
      {children}
      <Download size={14} aria-hidden="true" />
    </button>
  );
}
