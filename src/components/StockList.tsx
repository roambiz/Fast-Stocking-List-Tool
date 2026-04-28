import React, { useState } from 'react';
import { Product, StockItem } from '../types';
import { generateId } from '../lib/utils';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { nextFreeSlot } from '../lib/stock-layout';

interface Props {
  products: Product[];
  stockItems: StockItem[];
  setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
}

export function StockList({ products, stockItems, setStockItems }: Props) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const handleAddStockItem = () => {
    if (!selectedProductId) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const lastSheet =
      stockItems.length > 0 ? (stockItems[stockItems.length - 1].printSheet ?? 0) : 0;
    const slot = nextFreeSlot(stockItems, lastSheet);

    const newItem: StockItem = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      spu: product.spu,
      printSheet: lastSheet,
      printSlot: slot,
      sizes: product.sizes.map((size) => ({ size, plannedQty: '' })),
    };

    setStockItems([...stockItems, newItem]);
    setSelectedProductId('');
  };

  const handleDeleteItem = (id: string) => {
    setStockItems(stockItems.filter((item) => item.id !== id));
  };

  const handleQtyChange = (itemId: string, sizeIndex: number, val: string) => {
    const num = val === '' ? '' : parseInt(val, 10);
    if (val !== '' && isNaN(num as number)) return;

    setStockItems(
      stockItems.map((item) => {
        if (item.id === itemId) {
          const newSizes = [...item.sizes];
          newSizes[sizeIndex] = { ...newSizes[sizeIndex], plannedQty: num };
          return { ...item, sizes: newSizes };
        }
        return item;
      }),
    );
  };

  const handleSpuChange = (itemId: string, newSpu: string) => {
    setStockItems(
      stockItems.map((item) => {
        if (item.id === itemId) {
          return { ...item, spu: newSpu };
        }
        return item;
      }),
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...stockItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setStockItems(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === stockItems.length - 1) return;
    const newItems = [...stockItems];
    [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    setStockItems(newItems);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-black tracking-wide text-zinc-900">
        STEP3 · 清单（{stockItems.length}）
      </h2>

      <p className="text-sm text-zinc-500">
        版面在 <strong className="text-zinc-800">STEP4</strong>；打印装饰在 <strong className="text-zinc-800">STEP5</strong>。
      </p>

      <div className="flex flex-col gap-3 rounded-[var(--radius-bento)] border border-zinc-200/90 bg-zinc-50/80 p-4 shadow-sm ring-1 ring-zinc-200/40 sm:flex-row sm:items-stretch">
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="min-h-[44px] flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-bold transition-colors focus:border-accent-500 focus:outline-none"
        >
          <option value="">选择款式…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.spu ? ` · ${p.spu}` : ''} · {p.sizes.length} 码
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAddStockItem}
          disabled={!selectedProductId}
          className="flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-zinc-900 px-6 font-bold text-white transition-colors hover:bg-zinc-950 disabled:bg-zinc-300"
        >
          <Plus size={16} className="mr-1" /> 加入
        </button>
      </div>

      {stockItems.length === 0 ? (
        <div className="rounded-[var(--radius-bento)] border border-dashed border-zinc-300 bg-zinc-50/40 py-10 text-center font-medium text-zinc-500">
          暂无条目，请上方选择后加入
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {stockItems.map((item, index) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-[var(--radius-bento)] border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-900/[0.03]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/90 bg-zinc-100/90 px-4 py-2.5">
                <div className="flex min-w-0 flex-wrap items-center gap-2 font-black text-zinc-900">
                  <span className="shrink-0 rounded-full bg-zinc-200/90 px-2 py-0.5 text-xs text-zinc-600">
                    #{index + 1}
                  </span>
                  <span className="truncate">{item.productName}</span>
                  <input
                    type="text"
                    value={item.spu || ''}
                    onChange={(e) => handleSpuChange(item.id, e.target.value)}
                    placeholder="款号（可选）"
                    className="w-24 shrink-0 rounded-lg border-none bg-zinc-200/80 px-1.5 py-0.5 text-xs font-bold text-zinc-500 transition-colors focus:bg-zinc-300 focus:text-zinc-900 focus:outline-none"
                  />
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="rounded-lg p-1 text-zinc-600 transition-colors hover:bg-zinc-200 disabled:opacity-30"
                    title="上移"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === stockItems.length - 1}
                    className="rounded-lg p-1 text-zinc-600 transition-colors hover:bg-zinc-200 disabled:opacity-30"
                    title="下移"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <div className="mx-1 h-4 w-px bg-zinc-300"></div>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-black"
                    title="移除此项"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="bg-white/80 p-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {item.sizes.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-zinc-50/30 transition-colors hover:border-accent-200/80 hover:bg-white"
                    >
                      <label className="mb-0 border-b border-zinc-200/80 bg-zinc-100/80 py-1 text-center text-xs font-bold text-zinc-500">
                        {s.size}
                      </label>
                      <input
                        type="text"
                        value={s.plannedQty}
                        onChange={(e) => handleQtyChange(item.id, idx, e.target.value)}
                        placeholder="数量"
                        className="w-full rounded-b-xl bg-transparent px-2 py-2 text-center text-sm font-bold focus:bg-accent-50/50 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
