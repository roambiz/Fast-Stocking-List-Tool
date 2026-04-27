import React, { useState } from 'react';
import { Product, StockItem } from '../types';
import { generateId } from '../lib/utils';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
  products: Product[];
  stockItems: StockItem[];
  setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
}

export function StockList({ products, stockItems, setStockItems }: Props) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const handleAddStockItem = () => {
    if (!selectedProductId) return;
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const newItem: StockItem = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      spu: product.spu,
      sizes: product.sizes.map(size => ({ size, plannedQty: '' }))
    };

    setStockItems([...stockItems, newItem]);
    setSelectedProductId(''); // reset selection
  };

  const handleDeleteItem = (id: string) => {
    setStockItems(stockItems.filter(item => item.id !== id));
  };

  const handleQtyChange = (itemId: string, sizeIndex: number, val: string) => {
    const num = val === '' ? '' : parseInt(val, 10);
    if (val !== '' && isNaN(num as number)) return;

    setStockItems(stockItems.map(item => {
      if (item.id === itemId) {
        const newSizes = [...item.sizes];
        newSizes[sizeIndex] = { ...newSizes[sizeIndex], plannedQty: num };
        return { ...item, sizes: newSizes };
      }
      return item;
    }));
  };

  const handleSpuChange = (itemId: string, newSpu: string) => {
    setStockItems(stockItems.map(item => {
      if (item.id === itemId) {
        return { ...item, spu: newSpu };
      }
      return item;
    }));
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
    <div className="rounded-2xl border border-zinc-200/80 bg-white/95 p-6 shadow-sm backdrop-blur">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-black text-zinc-900 tracking-wide">当前备货清单（{stockItems.length} 款）</h2>
      </div>

      <div className="mb-6 flex gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-bold focus:border-zinc-900 focus:outline-none"
        >
          <option value="">请选择款式并添加到清单</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name} {p.spu ? `(${p.spu})` : ''} (包含 {p.sizes.length} 个尺码)</option>
          ))}
        </select>
        <button
          onClick={handleAddStockItem}
          disabled={!selectedProductId}
          className="flex items-center rounded-xl bg-zinc-900 px-6 py-2 font-bold text-white transition-colors hover:bg-black disabled:bg-zinc-300"
        >
          <Plus size={16} className="mr-1" /> 加入清单
        </button>
      </div>

      {stockItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 py-10 text-center font-medium text-zinc-500">
          清单为空，请先从上方选择款式加入
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {stockItems.map((item, index) => (
            <div key={item.id} className="group relative overflow-hidden rounded-2xl border border-zinc-300 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100/80 px-4 py-2">
                <div className="font-black text-zinc-900 flex items-center gap-2">
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600">序号 {index + 1}</span>
                  {item.productName}
                  <input
                    type="text"
                    value={item.spu || ''}
                    onChange={(e) => handleSpuChange(item.id, e.target.value)}
                    placeholder="款号（可选）"
                    className="ml-1 w-20 rounded-lg border-none bg-zinc-200 px-1.5 py-0.5 text-xs font-bold text-zinc-500 transition-colors focus:bg-zinc-300 focus:text-zinc-900 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="rounded-lg p-1 text-zinc-600 transition-colors hover:bg-zinc-200 disabled:opacity-30"
                    title="上移"
                  ><ArrowUp size={16} /></button>
                  <button 
                    onClick={() => handleMoveDown(index)}
                    disabled={index === stockItems.length - 1}
                    className="rounded-lg p-1 text-zinc-600 transition-colors hover:bg-zinc-200 disabled:opacity-30"
                    title="下移"
                  ><ArrowDown size={16} /></button>
                  <div className="mx-1 h-4 w-px bg-zinc-300"></div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-black"
                    title="移除此项"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="bg-white p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {item.sizes.map((s, idx) => (
                    <div key={idx} className="flex flex-col rounded-xl border border-zinc-200 transition-colors hover:border-zinc-400">
                      <label className="mb-0 border-b border-zinc-200 bg-zinc-100 py-1 text-center text-xs font-bold text-zinc-500">{s.size}</label>
                      <input
                        type="text"
                        value={s.plannedQty}
                        onChange={(e) => handleQtyChange(item.id, idx, e.target.value)}
                        placeholder="数量"
                        className="w-full rounded-b-xl px-2 py-2 text-center text-sm font-bold focus:bg-zinc-50 focus:outline-none"
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
