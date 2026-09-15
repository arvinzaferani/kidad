export interface SplitShare {
  memberId: string;
  value: number;
}

export interface SplitShareInput {
  memberId: string;
  value: number;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function fixRoundingDelta(
  items: SplitShare[],
  amount: number,
): SplitShare[] {
  if (!items.length) return [];
  const total = round2(items.reduce((sum, item) => sum + item.value, 0));
  const delta = round2(amount - total);
  if (Math.abs(delta) > 0.0001) {
    items[items.length - 1].value = round2(items[items.length - 1].value + delta);
  }
  return items;
}

export function distributeEvenly(
  memberIds: string[],
  amount: number,
): SplitShare[] {
  if (memberIds.length === 0) return [];
  const base = round2(amount / memberIds.length);
  const result = memberIds.map((memberId) => ({ memberId, value: base }));
  return fixRoundingDelta(result, amount);
}

export function exactSplits(items: SplitShareInput[]): SplitShare[] {
  return items.map((item) => ({
    memberId: item.memberId,
    value: round2(Number(item.value)),
  }));
}

export function percentSplits(
  items: SplitShareInput[],
  amount: number,
): SplitShare[] {
  const result = items.map((item) => ({
    memberId: item.memberId,
    value: round2((amount * Number(item.value)) / 100),
  }));
  return fixRoundingDelta(result, amount);
}

export function shareSplits(
  items: SplitShareInput[],
  amount: number,
): SplitShare[] {
  const shareTotal = items.reduce((sum, item) => sum + Number(item.value), 0);
  const result = items.map((item) => ({
    memberId: item.memberId,
    value: round2((amount * Number(item.value)) / shareTotal),
  }));
  return fixRoundingDelta(result, amount);
}

export function splitAmountEqually(
  memberIds: string[],
  amount: number,
): SplitShare[] {
  return distributeEvenly([...new Set(memberIds)], amount);
}