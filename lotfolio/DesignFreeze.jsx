import React, { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { freezeMemoLimit, freezeReason, freezeReasons } from './design-freeze.mjs';
import { Modal, useApp } from './shared.jsx';

const dateTime = (value) => new Date(value).toLocaleString('ko-KR');

export function FreezeBanner({ freeze, compact = false }) {
  if (freeze?.active !== true) return null;
  return (
    <section className="freeze-banner" aria-label="동결된 디자인">
      <strong><Lock size={15} /> 동결된 디자인 — {freezeReason(freeze.reason)}</strong>
      {freeze.memo && <p>{freeze.memo}</p>}
      {!compact && (
        <dl>
          <dt>동결자</dt><dd>{freeze.by}</dd>
          <dt>동결일</dt><dd>{dateTime(freeze.at)}</dd>
          {freeze.until && <><dt>해제 예정일</dt><dd>{freeze.until}</dd></>}
        </dl>
      )}
    </section>
  );
}

export function DesignFreezeControls({ design, showHistory = false }) {
  const { tier } = useApp();
  const [operation, setOperation] = useState(null);
  if (!design) return null;
  const history = design.freezeHistory ?? [];
  const active = design.freeze?.active === true;
  if (!active && tier !== 2 && !(showHistory && history.length)) return null;
  const action = active ? 'unfreeze' : 'freeze';
  const Icon = active ? Unlock : Lock;
  return (
    <div className="freeze-controls">
      <FreezeBanner freeze={design.freeze} />
      {showHistory && history.length > 0 && (
        <details className="freeze-history">
          <summary>동결 · 해제 이력 ({history.length}건)</summary>
          <ol>
            {history.map((event, index) => (
              <li key={event.at + ':' + index}>
                <strong>{event.action === 'unfreeze' ? '해제' : '동결'} · {freezeReason(event.reason)}</strong>
                {event.memo && <p>{event.memo}</p>}
                <small>{event.by} · {dateTime(event.at)}{event.until && ' · 해제 예정일 ' + event.until}</small>
              </li>
            ))}
          </ol>
        </details>
      )}
      {tier === 2 && (
        <button className="btn freeze-action" type="button" onClick={() => setOperation({ design, action })}>
          <Icon size={15} />{active ? '동결 해제' : '디자인 동결'}
        </button>
      )}
      {tier === 2 && operation && (
        <FreezeEditor {...operation} close={() => setOperation(null)} />
      )}
    </div>
  );
}

function FreezeEditor({ design, action, close }) {
  const { store, notify } = useApp();
  const [reason, setReason] = useState('');
  const [memo, setMemo] = useState('');
  const [until, setUntil] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const freezing = action === 'freeze';
  const title = freezing ? '디자인 동결' : '동결 해제';
  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await store.setDesignFreeze(design, action, { reason, memo, until });
      close();
      notify(freezing ? '디자인을 동결했습니다.' : '디자인 동결을 해제했습니다.');
    } catch (err) {
      setError(err.message);
      setPending(false);
    }
  }
  return (
    <Modal title={title} close={() => !pending && close()}>
      <form className="modal-body freeze-editor" onSubmit={submit}>
        <code>{design.key}</code>
        <p>{freezing ? '이 디자인 키의 모든 차수 로트를 발주 계산에서 기본 제외합니다.' : '이 디자인 키의 로트를 다시 발주 계산에 포함합니다.'}</p>
        {freezing && (
          <label>
            동결 사유 (필수)
            <select required value={reason} onChange={(event) => setReason(event.target.value)}>
              <option value="">사유 선택</option>
              {Object.entries(freezeReasons).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        )}
        <label>
          {freezing ? '한 줄 메모 (권장)' : '해제 메모 (선택)'}
          <input maxLength={freezeMemoLimit} value={memo} onChange={(event) => setMemo(event.target.value)} />
        </label>
        {freezing && (
          <label>
            해제 예정일 (선택)
            <input type="date" value={until} onChange={(event) => setUntil(event.target.value)} />
            <small>예정일이 지나도 관리자가 해제할 때까지 동결이 유지됩니다.</small>
          </label>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button className="btn" type="button" disabled={pending} onClick={close}>취소</button>
          <button className="btn primary" type="submit" disabled={pending || (freezing && !reason)}>
            {pending ? '저장 중…' : title + ' 확인'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
