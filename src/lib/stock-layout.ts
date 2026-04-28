import type { StockItem } from '../types';

export const SLOTS_PER_PAGE = 12;

export function maxSlotInSheet(items: StockItem[], sheet: number, excludeId?: string): number {
  let m = 0;
  for (const it of items) {
    if ((it.printSheet ?? 0) !== sheet) continue;
    if (excludeId && it.id === excludeId) continue;
    if (typeof it.printSlot === 'number' && it.printSlot >= 1) {
      m = Math.max(m, Math.floor(it.printSlot));
    }
  }
  return m;
}

/** 为缺省 printSlot 的款式按清单顺序填入「同组内最小可用正整数」；已填则保留并取整。 */
export function normalizeStockItems(items: StockItem[]): StockItem[] {
  const withSheet = items.map((it) => ({ ...it, printSheet: it.printSheet ?? 0 }));
  const occupiedBySheet = new Map<number, Set<number>>();
  for (const it of withSheet) {
    if (typeof it.printSlot === 'number' && it.printSlot >= 1) {
      const sh = it.printSheet!;
      if (!occupiedBySheet.has(sh)) occupiedBySheet.set(sh, new Set());
      occupiedBySheet.get(sh)!.add(Math.floor(it.printSlot));
    }
  }
  const nextFree = (sh: number) => {
    const occ = occupiedBySheet.get(sh) ?? new Set();
    let p = 1;
    while (occ.has(p)) p += 1;
    occ.add(p);
    return p;
  };
  return withSheet.map((it) => {
    const sh = it.printSheet!;
    if (typeof it.printSlot === 'number' && it.printSlot >= 1) {
      return { ...it, printSheet: sh, printSlot: Math.floor(it.printSlot) };
    }
    const slot = nextFree(sh);
    return { ...it, printSheet: sh, printSlot: slot };
  });
}

export function nextFreeSlot(items: StockItem[], sheet: number, excludeId?: string): number {
  const occ = new Set<number>();
  for (const it of items) {
    if ((it.printSheet ?? 0) !== sheet) continue;
    if (excludeId && it.id === excludeId) continue;
    if (typeof it.printSlot === 'number' && it.printSlot >= 1) {
      occ.add(Math.floor(it.printSlot));
    }
  }
  let p = 1;
  while (occ.has(p)) p += 1;
  return p;
}

export function sheetKeysFromItems(items: StockItem[]): number[] {
  const s = new Set(items.map((i) => i.printSheet ?? 0));
  return [...s].sort((a, b) => a - b);
}
