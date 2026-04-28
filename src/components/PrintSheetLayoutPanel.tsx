import React, { useEffect, useMemo, useState } from 'react';
import type { StockItem } from '../types';
import { maxSlotInSheet, SLOTS_PER_PAGE } from '../lib/stock-layout';

function maxSheetIndexInData(items: StockItem[]): number {
  if (items.length === 0) return 0;
  return Math.max(0, ...items.map((i) => i.printSheet ?? 0));
}

interface Props {
  stockItems: StockItem[];
  setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
}

export function PrintSheetLayoutPanel({ stockItems, setStockItems }: Props) {
  const dataMaxSheet = maxSheetIndexInData(stockItems);
  const [sheetTabCount, setSheetTabCount] = useState(1);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [paperIndex, setPaperIndex] = useState(0);
  const [pickedId, setPickedId] = useState<string | null>(null);

  useEffect(() => {
    setSheetTabCount((c) => Math.max(c, dataMaxSheet + 1));
  }, [dataMaxSheet]);

  useEffect(() => {
    setSelectedSheet((s) => (s >= sheetTabCount ? sheetTabCount - 1 : s));
  }, [sheetTabCount]);

  const maxSlot = maxSlotInSheet(stockItems, selectedSheet);
  const pageCount = Math.max(1, Math.ceil(maxSlot / SLOTS_PER_PAGE));
  const effectivePaper = Math.min(paperIndex, pageCount - 1);
  const slotBase = effectivePaper * SLOTS_PER_PAGE + 1;

  useEffect(() => {
    setPaperIndex((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount, selectedSheet]);

  const itemsInSheet = useMemo(
    () => stockItems.filter((i) => (i.printSheet ?? 0) === selectedSheet),
    [stockItems, selectedSheet],
  );

  const byAbsoluteSlot = useMemo(() => {
    const m = new Map<number, StockItem>();
    for (const it of itemsInSheet) {
      const sl = Math.floor(it.printSlot ?? 1);
      m.set(sl, it);
    }
    return m;
  }, [itemsInSheet]);

  const handleAddSheet = () => {
    setSheetTabCount((c) => {
      const next = c + 1;
      setTimeout(() => setSelectedSheet(next - 1), 0);
      return next;
    });
    setPaperIndex(0);
    setPickedId(null);
  };

  const handleCellClick = (localIndex: number) => {
    const absoluteSlot = slotBase + localIndex;
    if (pickedId === null) {
      const at = byAbsoluteSlot.get(absoluteSlot);
      if (at) setPickedId(at.id);
      return;
    }

    const moving = stockItems.find((i) => i.id === pickedId);
    if (!moving) {
      setPickedId(null);
      return;
    }

    const occupant = stockItems.find(
      (i) =>
        i.id !== pickedId &&
        (i.printSheet ?? 0) === selectedSheet &&
        Math.floor(i.printSlot ?? 0) === absoluteSlot,
    );

    if (!occupant) {
      setStockItems(
        stockItems.map((i) =>
          i.id === pickedId ? { ...i, printSheet: selectedSheet, printSlot: absoluteSlot } : i,
        ),
      );
      setPickedId(null);
      return;
    }

    const msg = `位置 ${absoluteSlot} 已有「${occupant.productName}」，是否与「${moving.productName}」对调版面位置？`;
    if (!window.confirm(msg)) return;

    const oldMovingSheet = moving.printSheet ?? 0;
    const oldMovingSlot = Math.floor(moving.printSlot ?? 1);

    setStockItems(
      stockItems.map((i) => {
        if (i.id === moving.id) {
          return { ...i, printSheet: selectedSheet, printSlot: absoluteSlot };
        }
        if (i.id === occupant.id) {
          return { ...i, printSheet: oldMovingSheet, printSlot: oldMovingSlot };
        }
        return i;
      }),
    );
    setPickedId(null);
  };

  const tileClass = 'rounded-[var(--radius-bento)] border border-zinc-200/80 bg-zinc-50/70 p-4 shadow-sm';

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-black tracking-wide text-zinc-900">STEP4 · 页组</h2>
      <p className="text-sm text-zinc-500">
        每组 12 格对应一页 A4。下方列表<strong className="text-blue-700">点选高亮</strong>后，点上方格放入；占格时可<strong>对调</strong>。
      </p>

      <div className={tileClass}>
        <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-zinc-500">页组 · 分页</p>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-zinc-500">页组</span>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: sheetTabCount }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSelectedSheet(i);
                  setPaperIndex(0);
                  setPickedId(null);
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                  selectedSheet === i
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-accent-400'
                }`}
              >
                页组 {i + 1}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddSheet}
            className="rounded-lg border border-dashed border-zinc-400 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 hover:border-accent-400 hover:bg-accent-50/40"
          >
            新增页组
          </button>
        </div>

        {pageCount > 1 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200/80 pt-3">
            <span className="text-xs font-bold text-zinc-500">本组多页</span>
            <button
              type="button"
              disabled={effectivePaper <= 0}
              onClick={() => setPaperIndex((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-bold disabled:opacity-40"
            >
              上一张
            </button>
            <span className="text-xs font-bold text-zinc-600">
              第 {effectivePaper + 1} / {pageCount} 张（序号 {slotBase}–{slotBase + SLOTS_PER_PAGE - 1}）
            </span>
            <button
              type="button"
              disabled={effectivePaper >= pageCount - 1}
              onClick={() => setPaperIndex((p) => Math.min(pageCount - 1, p + 1))}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-bold disabled:opacity-40"
            >
              下一张
            </button>
          </div>
        )}
      </div>

      <div className={`${tileClass} bg-white/90`}>
        <div className="mb-3 text-xs font-bold text-zinc-600">
          当前版面序号：{slotBase}–{slotBase + SLOTS_PER_PAGE - 1}
          {pickedId && (
            <span className="ml-3 font-bold text-blue-800">
              已选：{stockItems.find((i) => i.id === pickedId)?.productName ?? ''}
              <button
                type="button"
                onClick={() => setPickedId(null)}
                className="ml-2 font-bold text-red-600 underline"
              >
                取消选择
              </button>
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {Array.from({ length: SLOTS_PER_PAGE }, (_, localIndex) => {
            const abs = slotBase + localIndex;
            const item = byAbsoluteSlot.get(abs);
            const isPicked = item && pickedId === item.id;
            return (
              <button
                key={abs}
                type="button"
                onClick={() => handleCellClick(localIndex)}
                className={`flex min-h-[88px] flex-col items-center justify-center rounded-xl border-2 p-2 text-center transition-colors ${
                  isPicked
                    ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-200'
                    : item
                      ? 'border-zinc-300 bg-white hover:border-accent-400'
                      : 'border-dashed border-zinc-300 bg-zinc-50/80 hover:border-accent-300'
                }`}
              >
                <span className="text-[10px] font-black text-zinc-400">#{abs}</span>
                {item ? (
                  <span className="mt-1 line-clamp-3 text-xs font-black text-zinc-900">{item.productName}</span>
                ) : (
                  <span className="mt-1 text-[10px] font-bold text-zinc-400">空位</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={tileClass}>
        <h3 className="mb-2 text-sm font-black text-zinc-900">先选款式（蓝），再点格摆放</h3>
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-zinc-200/80 bg-white/90 p-2">
          {stockItems.map((it) => {
            const sh = it.printSheet ?? 0;
            const sl = Math.floor(it.printSlot ?? 1);
            const active = pickedId === it.id;
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => setPickedId(active ? null : it.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-bold transition-colors ${
                    active
                      ? 'border border-blue-400 bg-blue-100 text-blue-950 shadow-sm ring-2 ring-blue-200'
                      : 'border border-transparent bg-white hover:border-accent-200 hover:bg-accent-50/50'
                  }`}
                >
                  {it.productName}
                  <span className="ml-2 text-xs font-medium text-zinc-500">
                    页组 {sh + 1} · 位 {sl}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {stockItems.length === 0 && (
          <p className="py-4 text-center text-sm text-zinc-500">请先在 STEP3 添加款式</p>
        )}
      </div>
    </div>
  );
}
