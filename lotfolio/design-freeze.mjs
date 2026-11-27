import { parseLot } from './lot-engine.mjs';

export const freezeReasons = Object.freeze({
  discontinued: '구디자인 · 사용중단',
  quality: '품질보류',
  reserved: '물량예약',
  other: '기타',
});
export const freezeHistoryLimit = 20;
export const freezeMemoLimit = 300;

export function freezeReason(reason) {
  return Object.hasOwn(freezeReasons, reason) ? freezeReasons[reason] : freezeReasons.other;
}

export function freezeMap(designs) {
  return Object.fromEntries(designs.filter((design) => design.freeze?.active === true)
    .map((design) => [design.key, design.freeze]));
}

export function freezeForLot(freezes, value) {
  if (!freezes || typeof value !== 'string' || !value.includes('_')) return null;
  try {
    const {key} = parseLot(value);
    return Object.hasOwn(freezes, key) && freezes[key]?.active === true ? freezes[key] : null;
  } catch {
    return null;
  }
}

export function freezeDescription(freeze) {
  return [freezeReason(freeze.reason), freeze.memo, freeze.by, new Date(freeze.at).toLocaleString('ko-KR'),
    freeze.until && '해제 예정 ' + freeze.until].filter(Boolean).join(' · ');
}

export function buildFreezeChange(current, action, input, by, at = Date.now()) {
  const active = current.freeze?.active === true;
  if (active !== (action === 'unfreeze') || !['freeze', 'unfreeze'].includes(action))
    throw new Error('동결 상태가 변경되었습니다. 다시 확인해 주세요.');
  const reason = active ? current.freeze.reason : input.reason;
  if (!Object.hasOwn(freezeReasons, reason)) throw new Error('동결 사유를 선택해 주세요.');
  const memo = String(input.memo ?? '').trim();
  if (memo.length > freezeMemoLimit || /[\r\n]/.test(memo))
    throw new Error('메모는 300자 이내로 한 줄로 입력해 주세요.');
  const until = active ? current.freeze.until : String(input.until ?? '');
  if (until) {
    const date = new Date(until + 'T00:00:00Z');
    if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(until) ||
        Number.isNaN(date.getTime()) || date.toISOString().slice(0,10) !== until)
      throw new Error('해제 예정일을 확인해 주세요.');
  }
  const details = {reason, memo, until, by, at};
  return {
    freeze: active ? null : {active: true, ...details},
    freezeHistory: [{action, ...details}, ...(current.freezeHistory ?? [])].slice(0, freezeHistoryLimit),
  };
}
