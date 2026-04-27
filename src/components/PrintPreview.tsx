import React from 'react';
import { DocumentInfo, StockItem } from '../types';

interface Props {
  info: DocumentInfo;
  stockItems: StockItem[];
}

export function PrintPreview({ info, stockItems }: Props) {
  const ITEMS_PER_PAGE = 12;
  const pages: StockItem[][] = [];

  for (let i = 0; i < stockItems.length; i += ITEMS_PER_PAGE) {
    pages.push(stockItems.slice(i, i + ITEMS_PER_PAGE));
  }

  if (pages.length === 0) {
    pages.push([]);
  }

  return (
    <div className="print-area flex flex-col items-center bg-white font-sans text-black">
      {pages.map((pageItems, pageIndex) => (
        <div
          key={pageIndex}
          className="page relative my-8 box-border flex h-[210mm] w-[297mm] max-w-[297mm] shrink-0 flex-col border-2 border-black bg-white px-2.5 py-4 text-black shadow-2xl"
        >
          <div className="mb-3 grid min-w-0 shrink-0 grid-cols-5 gap-2 border-b-4 border-black pb-2 text-black">
            <div className="flex flex-col">
              <span className="mb-1 text-[10px] font-black tracking-wide text-black">平台</span>
              <span className="min-h-5 text-sm font-bold text-black">{info.platform}</span>
            </div>
            <div className="flex flex-col">
              <span className="mb-1 text-[10px] font-black tracking-wide text-black">店铺</span>
              <span className="min-h-5 text-sm font-bold text-black">{info.store}</span>
            </div>
            <div className="flex flex-col">
              <span className="mb-1 text-[10px] font-black tracking-wide text-black">负责人</span>
              <span className="min-h-5 text-sm font-bold text-black">{info.personInCharge}</span>
            </div>
            <div className="flex flex-col">
              <span className="mb-1 text-[10px] font-black tracking-wide text-black">发货方式</span>
              <span className="min-h-5 text-sm font-bold text-black">{info.shippingMethod}</span>
            </div>
            <div className="flex flex-col">
              <span className="mb-1 text-[10px] font-black tracking-wide text-black">日期</span>
              <span className="min-h-5 text-sm font-bold text-black">{info.date}</span>
            </div>
          </div>

          <div className="grid min-h-0 min-w-0 flex-1 grid-cols-3 gap-2 [align-content:start] text-black">
            {pageItems.map((item, idx) => {
              const total = item.sizes.reduce(
                (acc, curr) => acc + (curr.plannedQty ? Number(curr.plannedQty) : 0),
                0,
              );
              const hasAnyQtyInput = item.sizes.some((s) => s.plannedQty !== '' && s.plannedQty !== null);
              return (
                <div
                  key={item.id}
                  className="flex min-h-0 min-w-0 flex-col border-2 border-black p-1 text-black"
                >
                  <div className="mb-0.5 flex items-start justify-between overflow-hidden">
                    <h3 className="min-w-0 flex-1 truncate text-[13px] font-black leading-tight text-black" title={item.productName}>
                      {item.productName}
                    </h3>
                    <div className="ml-1 flex shrink-0 items-center gap-1">
                      {hasAnyQtyInput && (
                        <span className="bg-black px-1.5 py-0.5 text-[10px] font-black text-white">{total}</span>
                      )}
                      <span className="text-[11px] font-black text-black">
                        序号 {String(pageIndex * ITEMS_PER_PAGE + idx + 1).padStart(3, '0')}
                      </span>
                    </div>
                  </div>
                  {item.spu && <div className="mb-1 text-[10px] font-bold text-black">款号：{item.spu}</div>}

                  <table className="mt-auto w-full table-fixed border-collapse bg-white text-xs text-black">
                    <thead>
                      <tr className="h-6 bg-zinc-100">
                        <th className="w-10 border-2 border-black p-1 text-[11px] font-black text-black">尺码</th>
                        {item.sizes.map((s, i) => (
                          <th key={i} className="border-2 border-black p-1 text-[11px] font-black text-black">
                            {s.size}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="h-10">
                        <td className="border-2 border-black bg-zinc-100 p-1 text-center text-[11px] font-black text-black">
                          计划
                        </td>
                        {item.sizes.map((s, i) => (
                          <td key={i} className="border-2 border-black p-1 text-center text-sm font-bold text-black">
                            {s.plannedQty || ''}
                          </td>
                        ))}
                      </tr>
                      <tr className="h-10">
                        <td className="border-2 border-black bg-zinc-100 p-1 text-center text-[11px] font-black text-black">
                          实际
                        </td>
                        {item.sizes.map((s, i) => (
                          <td key={i} className="border-2 border-black p-1 text-black"></td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
