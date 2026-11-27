import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, ExternalLink } from 'lucide-react';
import { openPdf } from './pdf.mjs';
import { useFileUrl } from './file-access.jsx';
import { useApp } from './shared.jsx';

export function PdfReader({ file }) {
  const { store } = useApp(),
    { url, error } = useFileUrl(store, file);
  if (error)
    return (
      <p className="error" role="alert">
        {error}
      </p>
    );
  if (!url)
    return (
      <p className="pdf-message" role="status">
        PDF 불러오는 중…
      </p>
    );
  return <DocumentReader key={url} file={file} url={url} />;
}
function DocumentReader({ file, url }) {
  const scroll = useRef(null),
    paper = useRef(null);
  const [doc, setDoc] = useState(null),
    [number, setNumber] = useState(1),
    [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0),
    [status, setStatus] = useState('PDF 여는 중…'),
    [error, setError] = useState('');
  useLayoutEffect(() => {
    const element = scroll.current;
    const measure = () => setWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let disposed = false,
      task;
    setDoc(null);
    setNumber(1);
    setError('');
    setStatus('PDF 여는 중…');
    (async () => {
      task = await openPdf(url);
      if (disposed) {
        await task.destroy();
        return;
      }
      const opened = await task.promise;
      if (!disposed) setDoc(opened);
    })().catch(() => {
      if (!disposed) {
        setError('PDF를 열 수 없습니다. 원본 파일을 확인해 주세요.');
        setStatus('');
      }
    });
    return () => {
      disposed = true;
      task?.destroy().catch(() => {});
    };
  }, [url]);
  useEffect(() => {
    if (!doc || !width) return;
    let disposed = false,
      render;
    setError('');
    setStatus('페이지 그리는 중…');
    (async () => {
      const page = await doc.getPage(number);
      if (disposed) return;
      const original = page.getViewport({ scale: 1 });
      const cssWidth = Math.max(1, Math.floor(width * zoom));
      const cssHeight = (cssWidth * original.height) / original.width;
      // Bound the backing bitmap on very tall artwork and high-DPI screens.
      const density = Math.min(
        window.devicePixelRatio || 1,
        Math.sqrt(24000000 / (cssWidth * cssHeight)),
        16384 / Math.max(cssWidth, cssHeight),
      );
      const viewport = page.getViewport({ scale: (cssWidth * density) / original.width });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      canvas.style.width = cssWidth + 'px';
      canvas.style.height = cssHeight + 'px';
      canvas.setAttribute('aria-label', file.name + ' ' + number + '페이지 ' + zoom * 100 + '%');
      render = page.render({ canvasContext: canvas.getContext('2d'), viewport });
      await render.promise;
      if (disposed) return;
      paper.current.replaceChildren(canvas);
      setStatus('');
    })().catch(() => {
      if (!disposed) {
        paper.current.replaceChildren();
        setError('이 페이지를 그릴 수 없습니다. 원본 PDF를 다운로드해 확인해 주세요.');
        setStatus('');
      }
    });
    return () => {
      disposed = true;
      render?.cancel();
    };
  }, [doc, number, width, zoom, file.name]);
  function move(delta) {
    setNumber((n) => n + delta);
    scroll.current.scrollTo(0, 0);
  }
  return (
    <section className="pdf-reader" aria-label="PDF 뷰어">
      <div className="pdf-tools">
        <div className="pdf-control">
          <button
            type="button"
            className="iconbtn"
            aria-label="이전 페이지"
            disabled={!doc || number <= 1}
            onClick={() => move(-1)}
          >
            <ChevronLeft size={17} />
          </button>
          <span aria-live="polite">{doc ? number + ' / ' + doc.numPages : '— / —'}</span>
          <button
            type="button"
            className="iconbtn"
            aria-label="다음 페이지"
            disabled={!doc || number >= doc.numPages}
            onClick={() => move(1)}
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <div className="pdf-control">
          <button
            type="button"
            className="iconbtn"
            aria-label="PDF 축소"
            disabled={!doc || zoom <= 1}
            onClick={() => setZoom((v) => v - 0.5)}
          >
            <ZoomOut size={16} />
          </button>
          <span>{zoom * 100}%</span>
          <button
            type="button"
            className="iconbtn"
            aria-label="PDF 확대"
            disabled={!doc || zoom >= 4}
            onClick={() => setZoom((v) => v + 0.5)}
          >
            <ZoomIn size={16} />
          </button>
        </div>
        <a className="btn compact" href={url} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={14} />새 탭 열기
        </a>
        <a className="btn compact" href={url} download={file.name}>
          <Download size={14} />
          원본 다운로드
        </a>
      </div>
      <div className="pdf-scroll" ref={scroll} tabIndex={0} aria-label="PDF 페이지">
        <div className="pdf-paper" ref={paper} />
      </div>
      {status && (
        <small className="pdf-message" role="status">
          {status}
        </small>
      )}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
