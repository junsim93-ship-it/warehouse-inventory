import React, { useState } from 'react';
import {
  SlidersHorizontal,
  History,
  Plus,
  Copy,
  ClipboardCheck,
  ScanLine,
  Link2,
  ArrowUpRight,
  ChevronDown,
  Image as ImageIcon,
  Maximize2,
  Download,
  Trash2,
  Check,
  FolderSearch,
  NotebookPen,
} from 'lucide-react';
import { DesignPreview } from './Designs.jsx';
import { FreezeBanner } from './DesignFreeze.jsx';
import { buildLot, nextSeq, types, currentMonth } from './lot-engine.mjs';
import {
  useApp,
  Badge,
  Field,
  ProductPicker,
  TypePicker,
  RegPicker,
  MonthField,
  PageTitle,
  SectionTitle,
  Art,
  TypeBadge,
  Filters,
  dateText,
  nameOf,
  regName,
  copyCode,
  monthText,
  exportSheet,
} from './shared.jsx';

export function initialLotForm(user, seed = {}) {
  return {
    month: currentMonth(),
    seq: '01',
    omit: false,
    code: '',
    type: 'B',
    memo: '',
    author: user?.email || '',
    ...seed,
    reg: seed.reg || 'KR',
  };
}
export function Generator({ form, setForm, onConfirm }) {
  const { state, open, notify, store } = useApp(),
    [notes, setNotes] = useState(false),
    [busy, setBusy] = useState(false),
    [productDraft, setProductDraft] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  let result, error;
  if (productDraft === 'invalid') {
    error = '제품번호는 영문, 숫자, 하이픈으로 입력해 주세요.';
  } else if (!productDraft && form.code.trim()) {
    try {
      result = buildLot({ ...form, seq: form.omit ? '' : form.seq });
    } catch (e) {
      error = e.message;
    }
  }
  const design = state.designs.find((d) => d.key === result?.key),
    p = state.products.find((p) => p.code === form.code);
  const related = state.designs.filter(
    (d) => d.code === form.code && d.type === form.type && d.reg === form.reg,
  );
  const existing = state.lots.some((l) => l.lot === result?.lot),
    next = nextSeq(state.lots, result?.key);
  const hasOrders = state.lots.some((l) => l.key === result?.key && l.seq);
  async function copy() {
    try {
      await copyCode(result.lot);
      notify('로트 코드를 복사했습니다.');
    } catch (e) {
      notify(e.message);
    }
  }
  async function save() {
    if (busy || !result) return;
    if (design?.freeze?.active && !confirm('동결된 디자인의 로트입니다. 그래도 발주 이력에 저장할까요?')) return;
    setBusy(true);
    try {
      let confirmed = false;
      if (existing) {
        if (!confirm('같은 코드가 이미 있습니다. 새 발주 이력으로 한 건 더 저장할까요?')) return;
        confirmed = true;
      }
      const payload = { ...result, memo: form.memo, author: form.author, confirmDuplicate: confirmed };
      try {
        await store.saveLot(payload);
      } catch (e) {
        if (e.status !== 409 || confirmed) throw e;
        if (!confirm(e.message + ' 한 건 더 저장할까요?')) return;
        await store.saveLot({ ...payload, confirmDuplicate: true });
      }
      try {
        await copyCode(result.lot);
        notify('코드를 복사하고 발주 이력에 저장했습니다.');
      } catch {
        notify('발주 이력을 저장했습니다. 클립보드 접근을 확인해 주세요.');
      }
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }
  function history() {
    document.getElementById('history')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return (
    <>
      <PageTitle title="로트 생성기" desc="부자재 사양을 조합하고, 연결된 디자인을 확인하세요.">
        {!onConfirm && (
          <button className="btn" onClick={history}>
            <History size={16} />
            발주 이력 보기
          </button>
        )}
      </PageTitle>
      <div className="generator-grid">
        <section className="panel builder">
          <SectionTitle icon={SlidersHorizontal} title="로트 구성" />
          <div className="builder-fields">
            <Field
              name="제품"
              extra={
                !productDraft &&
                !p &&
                form.code && (
                  <button
                    type="button"
                    className="textbtn"
                    onClick={() => open('product', { code: form.code })}
                  >
                    미등록 제품 · 등록
                  </button>
                )
              }
            >
              <ProductPicker
                value={form.code}
                onChange={(v) => set('code', v)}
                onDraftStatus={setProductDraft}
              />
            </Field>
            <Field name="부자재 구분">
              <TypePicker value={form.type} onChange={(v) => set('type', v)} />
            </Field>
            <Field name="해외 인허가" extra={<small>복수 선택</small>}>
              <RegPicker value={form.reg} onChange={(v) => set('reg', v)} />
            </Field>
            <div className="form-pair">
              <Field name="디자인 확정 연월">
                <MonthField value={form.month} onChange={(v) => set('month', v)} />
              </Field>
              <Field
                name="발주 차수"
                extra={
                  <label className="inline-check">
                    <input
                      type="checkbox"
                      checked={form.omit}
                      onChange={(e) => set('omit', e.target.checked)}
                    />
                    생략
                  </label>
                }
              >
                <div className={'numberbox ' + (form.omit ? 'disabled' : '')}>
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label="발주 차수"
                    value={form.omit ? '' : form.seq}
                    placeholder={form.omit ? '미지정' : '예: 03'}
                    onChange={(e) => set('seq', e.target.value)}
                    onBlur={() => {
                      if (/^0*[1-9]\d*$/.test(form.seq))
                        set('seq', form.seq.replace(/^0+/, '').padStart(2, '0'));
                    }}
                    disabled={form.omit}
                  />
                  <span>차</span>
                </div>
              </Field>
            </div>
            <div className="hints">
              {related.length > 0 && (
                <label className="design-hint">
                  <Link2 size={13} />
                  <select
                    aria-label="등록된 디자인 불러오기"
                    value=""
                    onChange={(e) => set('month', e.target.value)}
                  >
                    <option value="">등록된 디자인 불러오기</option>
                    {related.map((d) => (
                      <option key={d.key} value={d.month}>
                        {d.freeze?.active && '[동결] '}{monthText(d.month)} · {d.key}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {hasOrders && (
                <button
                  className="textbtn numeric"
                  onClick={() => {
                    setForm((f) => ({ ...f, omit: false, seq: next }));
                  }}
                >
                  다음 차수 {next}
                </button>
              )}
            </div>
            {!onConfirm && (
              <div className="notes-wrap">
                <button className="notes-toggle" aria-expanded={notes} onClick={() => setNotes(!notes)}>
                  <NotebookPen size={15} />
                  발주 메모 · 작성자 <small>선택</small>
                  <ChevronDown size={15} className={notes ? 'rotated' : ''} />
                </button>
                {notes && (
                  <div className="notes-inputs">
                    <input
                      aria-label="발주 메모"
                      placeholder="발주처, 수량 등"
                      value={form.memo}
                      onChange={(e) => set('memo', e.target.value)}
                    />
                    <input
                      aria-label="작성자"
                      placeholder="작성자"
                      value={form.author}
                      onChange={(e) => set('author', e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
        <div className="result-col">
          <section className="result-card">
            <div className="result-bar">
              <div>
                <ScanLine size={17} />
                <h2>생성된 로트 코드</h2>
              </div>
              {existing && <span className="duplicate">중복 코드</span>}
            </div>
            <div className="lot-result" aria-live="polite">
              {result ? (
                result.lot
              ) : error ? (
                <small>{error}</small>
              ) : (
                <small className="lot-result-hint">제품을 선택하거나 고유번호를 입력해 주세요.</small>
              )}
            </div>
            <FreezeBanner freeze={design?.freeze} compact />
            <div className="result-actions">
              <button disabled={!result} onClick={copy}>
                <Copy size={15} />
                코드 복사
              </button>
              {onConfirm ? (
                <button className="save" disabled={!result} onClick={() => onConfirm(result.lot)}>
                  <Check size={16} />
                  발주서에 적용
                </button>
              ) : (
                <button className="save" disabled={!result || busy} onClick={save}>
                  <ClipboardCheck size={16} />
                  {busy ? '저장 중…' : '복사 + 이력 저장'}
                </button>
              )}
            </div>
          </section>
          <section className="panel linked">
            <SectionTitle icon={ImageIcon} title="연결된 디자인">
              {design ? (
                <span className="match">
                  <i />
                  매칭됨
                </span>
              ) : (
                <Badge>미등록</Badge>
              )}
            </SectionTitle>
            <FreezeBanner freeze={design?.freeze} compact />
            {design && onConfirm ? (
              <div className="popup-proof">
                <DesignPreview design={design} />
              </div>
            ) : design ? (
              <>
                <button
                  className="art-link"
                  aria-label="연결된 디자인 확대 보기"
                  onClick={() => open('viewer', { id: design.id })}
                >
                  <Art design={design}>
                    <span className="expand">
                      <Maximize2 size={14} />
                    </span>
                  </Art>
                </button>
                <button className="art-caption" onClick={() => open('viewer', { id: design.id })}>
                  <div>
                    <strong>{nameOf(state.products, design.code)}</strong>
                    <small>
                      {types[design.type]} · {regName(design.reg)}
                    </small>
                  </div>
                  <ArrowUpRight size={18} />
                </button>
              </>
            ) : (
              <div className="empty-preview">
                <FolderSearch size={28} />
                <strong>연결된 디자인이 없습니다</strong>
                {result && (
                  <button className="textbtn" onClick={() => open('design', { initial: result })}>
                    이 코드로 디자인 등록 <Plus size={13} />
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
      {!onConfirm && <HistoryPanel />}
    </>
  );
}
function HistoryPanel() {
  const { state, open, notify, store } = useApp(),
    [query, Q] = useState(''),
    [type, T] = useState(''),
    [reg, R] = useState('');
  const rows = state.lots.filter(
    (l) =>
      (!type || l.type === type) &&
      (!reg || l.reg.includes(reg)) &&
      [l.lot, nameOf(state.products, l.code), l.memo, l.author]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  function view(l) {
    open('lookup', { parsed: l });
  }
  async function remove(row) {
    if (confirm(row.lot + ' 발주 이력을 삭제할까요?'))
      try {
        await store.deleteLot(row.id);
        notify('발주 이력을 삭제했습니다.');
      } catch (e) {
        notify(e.message);
      }
  }
  async function excel() {
    try {
      await exportSheet(
        [
          [
            '로트 코드',
            '디자인 키',
            '제품번호',
            '제품명',
            '부자재',
            '인허가',
            '발주 차수',
            '작성자',
            '메모',
            '생성일',
          ],
          ...rows.map((l) => [
            l.lot,
            l.key,
            l.code,
            nameOf(state.products, l.code),
            types[l.type],
            l.reg,
            l.seq,
            l.author,
            l.memo,
            dateText(l.created),
          ]),
        ],
        '발주 이력',
        '발주_로트_이력.xlsx',
      );
    } catch (e) {
      notify(e.message);
    }
  }
  return (
    <section className="panel history" id="history">
      <SectionTitle icon={History} title="발주 이력">
        <button className="btn compact" onClick={excel}>
          <Download size={14} />
          엑셀 내보내기
        </button>
      </SectionTitle>
      <Filters
        query={query}
        setQuery={Q}
        type={type}
        setType={T}
        reg={reg}
        setReg={R}
        placeholder="로트 코드, 제품명 검색"
      />
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>로트 코드</th>
              <th>제품명</th>
              <th>부자재</th>
              <th>인허가</th>
              <th>발주 메모</th>
              <th>작성자</th>
              <th>생성일</th>
              <th aria-label="작업" />
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} className="clickrow" onClick={() => view(l)}>
                <td>
                  <button
                    className="rowlink code"
                    onClick={(e) => {
                      e.stopPropagation();
                      view(l);
                    }}
                  >
                    {l.lot}
                  </button>
                </td>
                <td>{nameOf(state.products, l.code)}</td>
                <td>
                  <TypeBadge type={l.type} />
                </td>
                <td>
                  <code>{l.reg}</code>
                </td>
                <td className="order-memo">{l.memo || '—'}</td>
                <td className="order-author">{l.author || '—'}</td>
                <td className="muted nowrap">{dateText(l.created)}</td>
                <td>
                  <div className="row-actions">
                    <button
                      className="iconbtn"
                      aria-label="로트 코드 복사"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await copyCode(l.lot);
                          notify('코드를 복사했습니다.');
                        } catch (e) {
                          notify(e.message);
                        }
                      }}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      className="iconbtn"
                      aria-label="발주 이력 삭제"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(l);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="empty">표시할 발주 이력이 없습니다.</div>}
      </div>
    </section>
  );
}
