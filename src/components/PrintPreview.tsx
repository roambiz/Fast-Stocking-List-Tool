import React from 'react';
import { DocumentInfo, StockItem } from '../types';
import { SLOTS_PER_PAGE, sheetKeysFromItems } from '../lib/stock-layout';

interface Props {
  info: DocumentInfo;
  stockItems: StockItem[];
  strikeEmptyQtyOnPreview: boolean;
  showEmptySlotDetailOnPreview: boolean;
  /** 为导出截图/PDF 渲染：空位为实线空白格，不占序、无虚线装饰 */
  forExportCapture?: boolean;
}

type PageBlock = {
  key: string;
  printSheet: number;
  pageIndexInSheet: number;
  /** 12 格，与 slot 一一对应；无款为 null */
  cells: (StockItem | null)[];
  /** 每格对应的版面序号 */
  slots: number[];
};

function buildPageBlocks(stockItems: StockItem[]): PageBlock[] {
  if (stockItems.length === 0) {
    return [
      {
        key: 'empty-0',
        printSheet: 0,
        pageIndexInSheet: 0,
        cells: Array.from({ length: SLOTS_PER_PAGE }, () => null),
        slots: Array.from({ length: SLOTS_PER_PAGE }, (_, i) => i + 1),
      },
    ];
  }

  const sheets = sheetKeysFromItems(stockItems);
  const blocks: PageBlock[] = [];

  for (const sheet of sheets) {
    const groupItems = stockItems.filter((i) => (i.printSheet ?? 0) === sheet);
    const bySlot = new Map<number, StockItem>();
    for (const it of groupItems) {
      const sl = typeof it.printSlot === 'number' && it.printSlot >= 1 ? Math.floor(it.printSlot) : 1;
      bySlot.set(sl, it);
    }
    const maxSlot = Math.max(1, ...[...bySlot.keys()]);
    const numPages = Math.ceil(maxSlot / SLOTS_PER_PAGE);

    for (let p = 0; p < numPages; p++) {
      const cells: (StockItem | null)[] = [];
      const slots: number[] = [];
      for (let c = 0; c < SLOTS_PER_PAGE; c++) {
        const slot = p * SLOTS_PER_PAGE + c + 1;
        slots.push(slot);
        cells.push(slot <= maxSlot ? (bySlot.get(slot) ?? null) : null);
      }
      blocks.push({
        key: `s${sheet}-p${p}`,
        printSheet: sheet,
        pageIndexInSheet: p,
        cells,
        slots,
      });
    }
  }

  return blocks;
}

function isPlannedQtyEmpty(plannedQty: number | '' | null | undefined): boolean {
  return plannedQty === '' || plannedQty === null || plannedQty === undefined;
}

function ProductCard({
  item,
  strikeEmptyQtyOnPreview,
}: {
  item: StockItem;
  strikeEmptyQtyOnPreview: boolean;
}) {
  const total = item.sizes.reduce(
    (acc, curr) => acc + (curr.plannedQty ? Number(curr.plannedQty) : 0),
    0,
  );
  const hasAnyQtyInput = item.sizes.some((s) => !isPlannedQtyEmpty(s.plannedQty));
  const slotLabel = String(item.printSlot ?? 0).padStart(3, '0');

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col border-2 border-black p-1.5 text-black">
      <div className="mb-0.5 flex shrink-0 items-start justify-between gap-1 overflow-hidden">
        <h3 className="min-w-0 flex-1 truncate text-[13px] font-black leading-tight text-black" title={item.productName}>
          {item.productName}
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          {hasAnyQtyInput && (
            <span className="bg-black px-1.5 py-0.5 text-[10px] font-black text-white">{total}</span>
          )}
          <span className="text-[13px] font-black leading-tight text-black tabular-nums">序号 {slotLabel}</span>
        </div>
      </div>
      <div className="mb-1 shrink-0 truncate text-[13px] font-black leading-tight text-black">
        款号：{item.spu?.trim() ? item.spu : '\u3000'}
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col border-2 border-black">
        <div className="flex shrink-0 border-b-2 border-black bg-zinc-100">
          <div className="flex w-10 shrink-0 items-center justify-center border-r-2 border-black p-1 text-[11px] font-black text-black">
            尺码
          </div>
          <div
            className="grid min-w-0 flex-1"
            style={{ gridTemplateColumns: `repeat(${item.sizes.length}, minmax(0, 1fr))` }}
          >
            {item.sizes.map((s, i) => (
              <div
                key={i}
                className={`flex items-center justify-center border-black p-1 text-center text-[11px] font-black text-black ${
                  i > 0 ? 'border-l-2' : ''
                }`}
              >
                {s.size}
              </div>
            ))}
          </div>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1">
          <div className="flex w-10 shrink-0 flex-col border-r-2 border-black bg-zinc-100">
            <div className="flex flex-1 items-center justify-center border-b-2 border-black p-1 text-center text-[11px] font-black text-black">
              计划
            </div>
            <div className="flex flex-1 items-center justify-center p-1 text-center text-[11px] font-black text-black">实际</div>
          </div>
          <div
            className="grid min-h-0 min-w-0 flex-1"
            style={{ gridTemplateColumns: `repeat(${item.sizes.length}, minmax(0, 1fr))` }}
          >
            {item.sizes.map((s, i) => {
              const strikeCol = strikeEmptyQtyOnPreview && isPlannedQtyEmpty(s.plannedQty);
              return (
                <div
                  key={i}
                  className={`relative flex min-h-0 min-w-0 flex-col border-black ${i > 0 ? 'border-l-2' : ''}`}
                >
                  <div className="flex min-h-0 flex-1 items-center justify-center border-b-2 border-black px-1 py-1 text-center text-[12px] font-bold leading-none text-black">
                    {isPlannedQtyEmpty(s.plannedQty) ? '' : s.plannedQty}
                  </div>
                  <div className="flex min-h-0 flex-1 items-center justify-center px-1 py-1"></div>
                  {strikeCol && (
                    <svg
                      className="pointer-events-none absolute inset-0 h-full w-full text-black"
                      aria-hidden
                      preserveAspectRatio="none"
                    >
                      <line
                        x1="0"
                        y1="100%"
                        x2="100%"
                        y2="0"
                        stroke="currentColor"
                        strokeWidth="1.25"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptySlotCard({
  slot,
  showDetail,
  forExport,
}: {
  slot: number;
  showDetail: boolean;
  forExport: boolean;
}) {
  if (forExport) {
    return (
      <div
        className="flex h-full min-h-0 min-w-0 flex-col border-2 border-black bg-white"
        aria-hidden
      />
    );
  }

  return (
    <div
      className="flex h-full min-h-0 min-w-0 flex-col items-center justify-center border-2 border-dashed border-zinc-400 bg-white p-1 text-zinc-500"
      aria-label={showDetail ? `空位 ${slot}` : `版面空位 ${slot}`}
    >
      {showDetail ? (
        <>
          <span className="text-[10px] font-black">空位</span>
          <span className="text-[11px] font-black text-black">{String(slot).padStart(3, '0')}</span>
        </>
      ) : null}
    </div>
  );
}

export function PrintPreview({
  info,
  stockItems,
  strikeEmptyQtyOnPreview,
  showEmptySlotDetailOnPreview,
  forExportCapture = false,
}: Props) {
  const pages = buildPageBlocks(stockItems);
  const totalSheets =
    stockItems.length === 0 ? 1 : Math.max(1, ...stockItems.map((i) => (i.printSheet ?? 0) + 1));

  return (
    <div className="print-area flex flex-col items-center bg-white font-sans text-black">
      {pages.map((page) => (
        <div
          key={page.key}
          className="page relative my-8 box-border flex h-[210mm] w-[297mm] max-w-[297mm] shrink-0 flex-col border-2 border-black bg-white px-2.5 py-4 text-black shadow-2xl"
        >
          <div className="mb-2 grid min-w-0 shrink-0 grid-cols-6 gap-1 border-b-4 border-black pb-1.5 text-black">
            <div className="flex min-w-0 flex-col">
              <span className="mb-0.5 text-[9px] font-black leading-none tracking-wide text-black">平台</span>
              <span className="min-h-[1.1rem] truncate text-[10px] font-bold leading-tight text-black">{info.platform}</span>
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="mb-0.5 text-[9px] font-black leading-none tracking-wide text-black">店铺</span>
              <span className="min-h-[1.1rem] truncate text-[10px] font-bold leading-tight text-black">{info.store}</span>
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="mb-0.5 text-[9px] font-black leading-none tracking-wide text-black">负责人</span>
              <span className="min-h-[1.1rem] truncate text-[10px] font-bold leading-tight text-black">{info.personInCharge}</span>
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="mb-0.5 text-[9px] font-black leading-none tracking-wide text-black">发货方式</span>
              <span className="min-h-[1.1rem] truncate text-[10px] font-bold leading-tight text-black">{info.shippingMethod}</span>
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="mb-0.5 text-[9px] font-black leading-none tracking-wide text-black">日期</span>
              <span className="min-h-[1.1rem] truncate text-[10px] font-bold leading-tight text-black">{info.date}</span>
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="mb-0.5 text-[9px] font-black leading-none tracking-wide text-black">页组</span>
              <span className="min-h-[1.1rem] truncate text-[10px] font-bold tabular-nums leading-tight text-black">
                {page.printSheet + 1} / {totalSheets}
              </span>
            </div>
          </div>

          <div className="grid min-h-0 min-w-0 flex-1 grid-cols-3 grid-rows-[repeat(4,minmax(0,1fr))] gap-2 text-black">
            {page.cells.map((cell, idx) => {
              const slot = page.slots[idx] ?? idx + 1;
              if (cell) {
                return (
                  <div key={cell.id} className="h-full min-h-0 min-w-0">
                    <ProductCard item={cell} strikeEmptyQtyOnPreview={strikeEmptyQtyOnPreview} />
                  </div>
                );
              }
              return (
                <div key={`empty-${page.key}-${slot}`} className="h-full min-h-0 min-w-0">
                  <EmptySlotCard
                    slot={slot}
                    showDetail={showEmptySlotDetailOnPreview}
                    forExport={forExportCapture}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
