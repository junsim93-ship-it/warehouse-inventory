import React, { useState } from 'react';
import {
  Check,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Link2,
  Maximize2,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { buildLot, currentMonth, parseLot } from './lot-engine.mjs';
import { fileKinds, fileMime, newId } from './attachments.mjs';
import { PdfReader } from './PdfReader.jsx';
import { FileDownload } from './file-access.jsx';
import {
  useApp,
  Art,
  PageTitle,
  Filters,
  Badge,
  TypeBadge,
  Modal,
  Field,
  ProductPicker,
  TypePicker,
  RegPicker,
  MonthField,
  dateText,
  nameOf,
  monthText,
  inputMonth,
  humanSize,
  regName,
  primaryImage,
} from './shared.jsx';

const fileIcons = { image: ImageIcon, pdf: FileText };

export function Designs() {
  const { state, open } = useApp();
  const [q, setQuery] = useState(''),
    [t, setType] = useState('');
  const [r, setReg] = useState(''),
    [m, setMonth] = useState('');
  const rows = state.designs.filter(
    (d) =>
      (!t || d.type === t) &&
      (!r || d.reg.includes(r)) &&
      (!m || d.month === inputMonth(m)) &&
      [d.key, nameOf(state.products, d.code), d.memo]
        .join(' ')
        .toLowerCase()
        .includes(q.toLowerCase().trim()),
  );
  return (
    <>
      <PageTitle title="디자인 라이브러리" desc="확정 시안과 인쇄용 PDF를 디자인 키로 관리하세요.">
        <button className="btn primary" onClick={() => open('design')}>
          <Plus size={17} />
          디자인 등록
        </button>
      </PageTitle>
      <div className="gallery-tools">
        <Filters
          query={q}
          setQuery={setQuery}
          type={t}
          setType={setType}
          reg={r}
          setReg={setReg}
          month={m}
          setMonth={setMonth}
          placeholder="디자인 키, 제품명, 메모 검색"
        />
        <span>{rows.length}개 디자인</span>
      </div>
      <div className="gallery">
        {rows.map((design) => {
          const files = state.files.filter((f) => f.design === design.id);
          return (
            <button key={design.id} className="design-card" onClick={() => open('viewer', { id: design.id })}>
              <Art design={design} />
              <div className="design-info">
                <div className="card-meta">
                  <TypeBadge type={design.type} />
                  <span>{monthText(design.month)}</span>
                </div>
                <h3>{nameOf(state.products, design.code)}</h3>
                <code>{design.key}</code>
                <div className="card-bottom">
                  <span>{regName(design.reg)}</span>
                  <div>
                    {Object.keys(fileKinds)
                      .filter((kind) => files.some((f) => f.kind === kind))
                      .map((kind) => (
                        <Badge key={kind}>{kind === 'pdf' ? 'PDF' : '이미지'}</Badge>
                      ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {!rows.length && <div className="empty panel">조건에 맞는 디자인이 없습니다.</div>}
    </>
  );
}

export function ParseInfo({ obj }) {
  const { state } = useApp();
  return (
    <div className="parse-info">
      <code>{obj.lot}</code>
      <div>
        <Badge>{monthText(obj.month)} 확정</Badge>
        <Badge>{obj.seq ? obj.seq + '차' : '차수 미지정'}</Badge>
        <Badge>
          {obj.code} · {nameOf(state.products, obj.code)}
        </Badge>
        <TypeBadge type={obj.type} />
        <Badge>{regName(obj.reg)}</Badge>
        {obj.corrected && <Badge tone="type-B">표준 표기 {obj.reg}</Badge>}
      </div>
    </div>
  );
}

export function DesignPreview({ design, parsed }) {
  const { open } = useApp();
  if (!design)
    return (
      <div className="empty-preview">
        <ImageIcon size={24} />
        <p>이 디자인 키에 등록된 시안이 없습니다.</p>
        {parsed && (
          <button className="btn" onClick={() => open('design', { initial: parsed })}>
            <Plus size={15} />이 코드로 디자인 등록
          </button>
        )}
      </div>
    );
  return <RegisteredPreview key={design.id} design={design} />;
}

function RegisteredPreview({ design }) {
  const { state } = useApp();
  const files = state.files.filter((f) => f.design === design.id);
  const images = files.filter((f) => f.kind === 'image'),
    pdfs = files.filter((f) => f.kind === 'pdf');
  const [tab, setTab] = useState('proof'),
    [selectedId, selectId] = useState('');
  const [zoomed, setZoomed] = useState(false),
    [scale, setScale] = useState(1);
  const isPdfTab = tab === 'pdf' && pdfs.length > 0;
  const selected = isPdfTab
    ? pdfs.find((f) => f.id === selectedId) || pdfs[0]
    : images.find((f) => f.id === selectedId) || primaryImage(images) || pdfs[0];
  function changeTab(next) {
    setTab(next);
    selectId('');
  }
  return (
    <div className="design-preview">
      <div className="proof-tabs">
        <button
          type="button"
          className={!isPdfTab ? 'active' : ''}
          aria-pressed={!isPdfTab}
          onClick={() => changeTab('proof')}
        >
          시안 미리보기
        </button>
        {pdfs.length > 0 && (
          <button
            type="button"
            className={isPdfTab ? 'active' : ''}
            aria-pressed={isPdfTab}
            onClick={() => changeTab('pdf')}
          >
            인쇄용 PDF <small>{pdfs.length}</small>
          </button>
        )}
      </div>
      {isPdfTab ? (
        <>
          <label className="pdf-select">
            열람할 PDF
            <select value={selected.id} onChange={(e) => selectId(e.target.value)}>
              {pdfs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <PdfReader key={selected.id} file={selected} />
        </>
      ) : (
        <>
          <div className="large-art">
            <Art design={design} selected={selected} />
            {selected && (
              <button type="button" className="expand" aria-label="시안 확대" onClick={() => setZoomed(true)}>
                <Maximize2 size={17} />
              </button>
            )}
          </div>
          {images.length > 1 && (
            <div className="thumbs">
              {images.map((f) => (
                <button
                  type="button"
                  key={f.id}
                  className={selected?.id === f.id ? 'active' : ''}
                  aria-label={f.name + ' 보기'}
                  aria-pressed={selected?.id === f.id}
                  onClick={() => selectId(f.id)}
                >
                  <Art design={design} selected={f} />
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {zoomed && selected && (
        <Modal
          title="시안 확대"
          close={() => {
            setZoomed(false);
            setScale(1);
          }}
          wide
        >
          {selected.kind === 'pdf' ? (
            <PdfReader key={selected.id} file={selected} />
          ) : (
            <>
              <div className="zoom-toolbar">
                <button
                  type="button"
                  aria-label="이미지 축소"
                  className="btn compact"
                  disabled={scale <= 1}
                  onClick={() => setScale((n) => n - 0.5)}
                >
                  <ZoomOut size={16} />
                </button>
                <span>{scale * 100}%</span>
                <button
                  type="button"
                  aria-label="이미지 확대"
                  className="btn compact"
                  disabled={scale >= 4}
                  onClick={() => setScale((n) => n + 0.5)}
                >
                  <ZoomIn size={16} />
                </button>
              </div>
              <div className="zoom-area" tabIndex={0}>
                <div style={{ width: scale * 100 + '%' }}>
                  <Art design={design} selected={selected} />
                </div>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

export function DesignViewer({ id, parsed }) {
  const { state, store, open, close, notify, useDesign } = useApp();
  const design = state.designs.find((d) => d.id === id);
  const [otherId, compare] = useState(''),
    [busy, setBusy] = useState(false);
  if (!design)
    return (
      <Modal title="디자인 상세" close={close}>
        <div className="modal-body">디자인을 찾을 수 없습니다.</div>
      </Modal>
    );
  const files = state.files.filter((f) => f.design === id);
  const versions = state.designs
    .filter((v) => v.id !== id && v.code === design.code && v.type === design.type)
    .sort((a, b) => b.month.localeCompare(a.month));
  const other = versions.find((d) => d.id === otherId);
  const orders = state.lots.filter((l) => l.key === design.key);
  async function remove() {
    if (busy || !confirm('디자인과 첨부파일을 삭제할까요? 발주 이력은 보관됩니다.')) return;
    setBusy(true);
    try {
      const { pendingCleanup } = await store.deleteDesign(design);
      close();
      notify(
        pendingCleanup
          ? '디자인 삭제 완료 · 이전 첨부파일 ' + pendingCleanup + '개 정리 대기'
          : '디자인을 삭제했습니다.',
      );
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="디자인 상세"
      close={() => {
        if (!busy) close();
      }}
      wide
    >
      <div className="modal-body">
        <div className="detail-heading">
          <div>
            <TypeBadge type={design.type} />
            <h2>{nameOf(state.products, design.code)}</h2>
            <code>{design.key}</code>
          </div>
          <button type="button" className="btn primary" onClick={() => useDesign(design)}>
            <Plus size={15} />새 로트 생성
          </button>
        </div>
        {parsed && <ParseInfo obj={parsed} />}
        {versions.length > 0 && (
          <label className="compare-select">
            버전 비교
            <select value={other?.id || ''} onChange={(e) => compare(e.target.value)}>
              <option value="">비교할 디자인 선택</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.key} · {monthText(v.month)}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className={other ? 'version-compare' : ''}>
          <section>
            {other && (
              <h3>
                {monthText(design.month)} <code>{design.key}</code>
              </h3>
            )}
            <DesignPreview design={design} />
          </section>
          {other && (
            <section>
              <h3>
                {monthText(other.month)} <code>{other.key}</code>
              </h3>
              <DesignPreview design={other} />
            </section>
          )}
        </div>
        {design.memo && <p className="memo-line">{design.memo}</p>}
        <div className="detail-meta">
          <span>
            확정월 <b>{monthText(design.month)}</b>
          </span>
          <span>
            인허가 <b>{regName(design.reg)}</b>
          </span>
          {design.author && (
            <span>
              등록자 <b>{design.author}</b>
            </span>
          )}
        </div>
        <h3 className="subhead">
          첨부파일 <small>{files.length}</small>
        </h3>
        <div className="file-list">
          {files.map((f) => {
            const Icon = fileIcons[f.kind];
            return (
              <FileDownload key={f.id} file={f} store={store} onError={notify}>
                <Icon size={16} />
                <span>{f.name}</span>
                <small>{humanSize(f.size)}</small>
              </FileDownload>
            );
          })}
          {!files.length && <p className="muted">등록된 파일이 없습니다.</p>}
        </div>
        <div className="detail-columns">
          <div>
            <h3 className="subhead">다른 디자인 버전</h3>
            {versions.map((v) => (
              <button className="version-line" key={v.id} onClick={() => open('viewer', { id: v.id })}>
                <code>{v.key}</code>
                <ChevronRight size={14} />
              </button>
            ))}
            {!versions.length && <small className="muted">다른 버전이 없습니다.</small>}
          </div>
          <div>
            <h3 className="subhead">
              연결된 발주 이력 <small>{orders.length}</small>
            </h3>
            {orders.map((l) => (
              <button className="version-line" key={l.id} onClick={() => open('lookup', { parsed: l })}>
                <code>{l.lot}</code>
                <small>{dateText(l.created)}</small>
              </button>
            ))}
            {!orders.length && <small className="muted">저장된 이력이 없습니다.</small>}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn danger" disabled={busy} onClick={remove}>
            <Trash2 size={15} />
            삭제
          </button>
          <button className="btn" disabled={busy} onClick={() => open('design', { id })}>
            <Pencil size={15} />
            디자인 수정
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function DesignEditor({ id, initial }) {
  const { state, store, open, close, notify, user } = useApp();
  // Freeze the base revision and attachments together for optimistic concurrency checks.
  const [original] = useState(() => state.designs.find((d) => d.id === id));
  const [files, setFiles] = useState(() => state.files.filter((f) => f.design === id));
  const [form, setForm] = useState(() => ({
    code: '',
    month: currentMonth(),
    reg: 'KR',
    type: 'B',
    memo: '',
    author: user?.email || '',
    ...original,
    ...initial,
  }));
  const [uploads, setUploads] = useState([]),
    [primary, setPrimary] = useState(() => primaryImage(files)?.id);
  const [paste, setPaste] = useState(''),
    [error, setError] = useState(''),
    [otherId, setOtherId] = useState('');
  const [busy, setBusy] = useState(false),
    [normalized, setNormalized] = useState('');
  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  let generated;
  try {
    generated = buildLot({ ...form, seq: '' });
  } catch {}
  const renamed = original && generated && generated.key !== original.key;
  const linked = renamed ? state.lots.filter((l) => l.key === original.key).length : 0;
  const allFiles = [...files, ...uploads];
  const primaryId =
    allFiles.find((f) => f.kind === 'image' && f.id === primary)?.id ||
    allFiles.find((f) => f.kind === 'image')?.id;
  function add(kind, items) {
    const accepted = [],
      errors = [];
    for (const file of items) {
      try {
        fileMime(kind, file.name, file.size);
        accepted.push({ id: newId(), kind, file });
      } catch (e) {
        errors.push(file.name + ' · ' + e.message);
      }
    }
    setUploads((old) => [...old, ...accepted]);
    setError(errors.join(' '));
  }
  function parse() {
    try {
      const { code, type, reg, month, key, corrected } = parseLot(paste);
      setForm((f) => ({ ...f, code, type, reg, month }));
      setPaste('');
      setError('');
      setNormalized(corrected ? '표준 디자인 키 ' + key : '');
    } catch (e) {
      setError(e.message);
    }
  }
  async function save(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setOtherId('');
    try {
      if (id && !original) throw Error('수정할 디자인을 찾을 수 없습니다.');
      const obj = buildLot({ ...form, seq: '' });
      const result = await store.saveDesign({
        ...obj,
        id,
        original,
        memo: form.memo,
        author: form.author,
        files: files.map((f) => ({ ...f, primary: f.id === primaryId })),
        uploads: uploads.map((f) => ({ ...f, primary: f.id === primaryId })),
      });
      notify(
        result.pendingCleanup
          ? '디자인 저장 완료 · 이전 첨부파일 ' + result.pendingCleanup + '개 정리 대기'
          : '디자인을 저장했습니다.',
      );
      open('viewer', { id: result.id });
    } catch (e) {
      setError(e.message);
      setOtherId(e.existingId || '');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={id ? '디자인 수정' : '디자인 등록'}
      close={() => {
        if (!busy) close();
      }}
      wide
    >
      <form onSubmit={save}>
        <fieldset disabled={busy} className="modal-body editor">
          <Field name="로트 코드로 자동 입력">
            <div className="inline-input">
              <input
                aria-label="붙여넣을 로트 코드"
                value={paste}
                placeholder="예: 2601V03_138_B_NMC"
                onChange={(e) => setPaste(e.target.value)}
              />
              <button type="button" className="btn" disabled={!paste} onClick={parse}>
                분해
              </button>
            </div>
          </Field>
          {normalized && (
            <div role="status" className="key-strip">
              {normalized}
            </div>
          )}
          <div className="editor-grid">
            <Field name="제품">
              <ProductPicker value={form.code} onChange={(v) => update('code', v)} />
            </Field>
            <Field name="디자인 확정 연월">
              <MonthField value={form.month} onChange={(v) => update('month', v)} />
            </Field>
          </div>
          <Field name="부자재 구분">
            <TypePicker value={form.type} onChange={(v) => update('type', v)} />
          </Field>
          <Field name="해외 인허가">
            <RegPicker value={form.reg} onChange={(v) => update('reg', v)} />
          </Field>
          <div className="key-strip">
            <Link2 size={15} />
            디자인 키 <code>{generated?.key || '제품번호와 확정월을 입력해 주세요.'}</code>
          </div>
          {renamed && (
            <div className="key-change" role="status">
              <strong>기존 키에 연결된 발주 이력 {linked}건</strong>
              <code>{original.key}</code>
              <span>저장하면 디자인은 새 키로 조회됩니다. 발주 이력은 발주 당시 키로 보관됩니다.</span>
            </div>
          )}
          <div className="drop-grid">
            {Object.entries(fileKinds).map(([kind, spec]) => {
              const Icon = fileIcons[kind];
              return (
                <label
                  key={kind}
                  className="dropzone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!busy) add(kind, e.dataTransfer.files);
                  }}
                >
                  <Icon size={22} />
                  <strong>{spec.label}</strong>
                  <small>
                    {spec.accept.replaceAll('.', '').toUpperCase().replaceAll(',', ', ')} · 파일당 {spec.max}{' '}
                    MB
                  </small>
                  <span>파일 선택 또는 드롭</span>
                  <input
                    aria-label={spec.label + ' 첨부'}
                    type="file"
                    multiple
                    accept={spec.accept}
                    onChange={(e) => {
                      add(kind, e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              );
            })}
          </div>
          {!!allFiles.length && (
            <div className="file-list">
              {allFiles.map((f) => (
                <div key={f.id}>
                  <span>{f.file?.name || f.name}</span>
                  {f.file && <small>저장 대기</small>}
                  {f.kind === 'image' && (
                    <button
                      type="button"
                      className="textbtn"
                      disabled={f.id === primaryId}
                      onClick={() => setPrimary(f.id)}
                    >
                      <Star size={13} />
                      {f.id === primaryId ? '대표 이미지' : '대표 설정'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="iconbtn"
                    aria-label={(f.file?.name || f.name) + ' 첨부 제외'}
                    onClick={() => {
                      setUploads((xs) => xs.filter((x) => x.id !== f.id));
                      setFiles((xs) => xs.filter((x) => x.id !== f.id));
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="editor-grid">
            <Field name="변경사항 메모">
              <input
                aria-label="변경사항 메모"
                value={form.memo}
                onChange={(e) => update('memo', e.target.value)}
              />
            </Field>
            <Field name="등록자">
              <input
                aria-label="등록자"
                value={form.author}
                onChange={(e) => update('author', e.target.value)}
              />
            </Field>
          </div>
          {error && (
            <div className="error" role="alert">
              {error}
              {otherId && (
                <button type="button" className="textbtn" onClick={() => open('design', { id: otherId })}>
                  기존 디자인 수정
                </button>
              )}
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn" onClick={close}>
              닫기
            </button>
            <button type="submit" className="btn primary">
              <Check size={16} />
              {busy ? '저장 중…' : '디자인 저장'}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
