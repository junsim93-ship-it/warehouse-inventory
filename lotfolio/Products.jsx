import React, { useState } from 'react';
import { Plus, Search, Upload, Download, Pencil, Trash2, UploadCloud, PackageOpen } from 'lucide-react';
import { decodeProductCsv, previewProductRows } from './product-import.mjs';
import { useApp, Modal, PageTitle, SectionTitle, Field, Badge, spreadsheet } from './shared.jsx';

export function Products() {
  const { state, open, store, notify } = useApp(),
    [q, Q] = useState('');
  const rows = state.products.filter((p) =>
    [p.name, p.code, p.brand, p.memo].join(' ').toLowerCase().includes(q.toLowerCase().trim()),
  );
  async function del(p) {
    if (
      !confirm(
        '[' + p.code + '] ' + p.name + ' 제품을 마스터에서 삭제할까요? 연결된 디자인과 로트는 보관됩니다.',
      )
    )
      return;
    try {
      await store.deleteProduct(p.code, p);
      notify('제품을 삭제했습니다.');
    } catch (e) {
      notify(e.message);
    }
  }
  return (
    <>
      <PageTitle title="제품 마스터" desc="제품 고유번호와 제품명을 관리하고 디자인 연결 현황을 확인하세요.">
        <button className="btn" onClick={() => open('import')}>
          <Upload size={16} />
          일괄 등록
        </button>
        <button className="btn primary" onClick={() => open('product')}>
          <Plus size={16} />
          제품 추가
        </button>
      </PageTitle>
      <section className="panel">
        <SectionTitle icon={PackageOpen} title="등록 제품">
          <span className="muted">{state.products.length}개 제품</span>
        </SectionTitle>
        <div className="filters">
          <label className="searchfield">
            <Search size={15} />
            <input
              aria-label="제품 검색"
              placeholder="고유번호, 제품명, 브랜드 검색"
              value={q}
              onChange={(e) => Q(e.target.value)}
            />
          </label>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {['고유번호', '제품명', '브랜드', '메모', '디자인', '관리'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.code}>
                  <td>
                    <code>{p.code}</code>
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>{p.brand || '—'}</td>
                  <td className="muted">{p.memo || '—'}</td>
                  <td>{state.designs.filter((d) => d.code === p.code).length}개</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="iconbtn"
                        aria-label={p.name + ' 수정'}
                        onClick={() => open('product', { product: p })}
                      >
                        <Pencil size={14} />
                      </button>
                      <button className="iconbtn" aria-label={p.name + ' 삭제'} onClick={() => del(p)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <div className="empty">조건에 맞는 제품이 없습니다.</div>}
        </div>
      </section>
    </>
  );
}
export function ProductEditor({ product, code }) {
  const { close, store, notify } = useApp(),
    [form, U] = useState(product || { code: code || '', name: '', brand: '', memo: '' }),
    [err, E] = useState(''),
    [busy, B] = useState(false);
  async function save(e) {
    e.preventDefault();
    if (busy) return;
    B(true);
    try {
      await store.saveProduct(form, { create: !product, original: product });
      close();
      notify('제품을 저장했습니다.');
    } catch (e) {
      E(e.message);
    } finally {
      B(false);
    }
  }
  return (
    <Modal
      title={product ? '제품 수정' : '제품 추가'}
      close={() => {
        if (!busy) close();
      }}
    >
      <form className="modal-body editor" onSubmit={save}>
        {[
          ['code', '고유번호'],
          ['name', '제품명'],
          ['brand', '브랜드'],
          ['memo', '메모'],
        ].map(([k, n]) => (
          <Field key={k} name={n} extra={['brand', 'memo'].includes(k) ? <small>선택</small> : undefined}>
            <input
              aria-label={n}
              value={form[k]}
              onChange={(e) => U({ ...form, [k]: e.target.value })}
              disabled={busy || (k === 'code' && !!product)}
              required={['code', 'name'].includes(k)}
            />
          </Field>
        ))}
        {err && (
          <div className="error" role="alert">
            {err}
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="btn" disabled={busy} onClick={close}>
            취소
          </button>
          <button disabled={busy} className="btn primary">
            제품 저장
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function ProductImport() {
  const { state, close, notify, store } = useApp(),
    [rows, R] = useState(null),
    [name, N] = useState(''),
    [mode, M] = useState('skip'),
    [err, E] = useState(''),
    [busy, B] = useState(false);
  async function read(file) {
    if (!file || busy) return;
    B(true);
    E('');
    R(null);
    N(file.name);
    try {
      if (!/\.(xlsx|csv)$/i.test(file.name)) throw Error('XLSX 또는 CSV 파일을 선택해 주세요.');
      const x = await spreadsheet(),
        buf = await file.arrayBuffer();
      let book;
      if (/\.csv$/i.test(file.name)) {
        book = x.read(decodeProductCsv(buf), { type: 'string', raw: true });
      } else book = x.read(buf, { type: 'array' });
      const sheet = book.Sheets[book.SheetNames[0]],
        matrix = x.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '', blankrows: true });
      R(previewProductRows(matrix, state.products));
    } catch (e) {
      E(e.message);
    } finally {
      B(false);
    }
  }
  async function save() {
    if (busy) return;
    B(true);
    try {
      const result = await store.importProducts(
        rows.filter((r) => !r.error).map(({ code, name, brand, memo }) => ({ code, name, brand, memo })),
        mode,
      );
      close();
      notify(result.count + '개 제품 행을 반영했습니다.');
    } catch (e) {
      E(e.message);
    } finally {
      B(false);
    }
  }
  const valid = rows?.filter((r) => !r.error) || [];
  return (
    <Modal
      title="제품 일괄 등록"
      close={() => {
        if (!busy) close();
      }}
      wide
    >
      <div className="modal-body editor">
        <div className="import-intro">
          <p>양식 첫 행의 열 이름을 유지해 주세요.</p>
          <a
            className="btn compact"
            href="./assets/lot-products-template.xlsx"
            download="제품_등록_양식.xlsx"
          >
            <Download size={14} />
            엑셀 양식
          </a>
        </div>
        <label
          className="dropzone full"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            read(e.dataTransfer.files[0]);
          }}
        >
          <UploadCloud size={26} />
          <strong>{name || '엑셀 또는 CSV 파일 선택'}</strong>
          <small>{busy ? '처리 중…' : '파일을 여기에 끌어다 놓을 수 있습니다.'}</small>
          <input
            disabled={busy}
            type="file"
            accept=".xlsx,.csv"
            aria-label="제품 목록 파일"
            onChange={(e) => {
              read(e.target.files[0]);
              e.target.value = '';
            }}
          />
        </label>
        {rows && (
          <>
            <div className="import-counts">
              <Badge tone="good">신규 {valid.filter((r) => !r.duplicate).length}</Badge>
              <Badge tone="type-B">중복 {valid.filter((r) => r.duplicate).length}</Badge>
              <Badge>오류 {rows.length - valid.length}</Badge>
            </div>
            <Field name="중복 번호 처리">
              <select aria-label="중복 번호 처리" value={mode} onChange={(e) => M(e.target.value)}>
                <option value="skip">기존 항목 유지 (건너뛰기)</option>
                <option value="overwrite">기존 항목 업데이트</option>
              </select>
            </Field>
            <div className="import-table table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>행</th>
                    <th>고유번호</th>
                    <th>제품명</th>
                    <th>처리 결과</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.n}>
                      <td>{r.n}</td>
                      <td>
                        <code>{r.code}</code>
                      </td>
                      <td>{r.name}</td>
                      <td className={r.error ? 'error-text' : ''}>
                        {r.error || (!r.duplicate ? '신규 등록' : mode === 'skip' ? '건너뛰기' : '업데이트')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {err && (
          <div role="alert" className="error">
            {err}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn" onClick={close} disabled={busy}>
            취소
          </button>
          <button className="btn primary" disabled={busy || !valid.length} onClick={save}>
            유효한 행 반영
          </button>
        </div>
      </div>
    </Modal>
  );
}
