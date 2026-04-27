import React, { useState } from 'react';
import { Product, DEFAULT_SIZES } from '../types';
import { generateId } from '../lib/utils';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export function ProductLibrary({ products, setProducts }: Props) {
  const [newProductName, setNewProductName] = useState('');
  const [newProductSpu, setNewProductSpu] = useState('');
  const [newProductSizes, setNewProductSizes] = useState(DEFAULT_SIZES.join(', '));

  const handleAdd = () => {
    if (!newProductName.trim()) return;
    
    // Parse sizes
    const sizes = newProductSizes
      .split(/[,，\s\\/]+/) // Split by comma, space, slash
      .map(s => s.trim())
      .filter(Boolean);

    if (sizes.length === 0) {
      alert('请至少输入一个尺码');
      return;
    }

    const newProduct: Product = {
      id: generateId(),
      name: newProductName.trim(),
      spu: newProductSpu.trim(),
      sizes,
    };

    setProducts([...products, newProduct]);
    setNewProductName('');
    setNewProductSpu('');
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...products];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setProducts(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === products.length - 1) return;
    const newItems = [...products];
    [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    setProducts(newItems);
  };

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/95 p-6 shadow-sm backdrop-blur">
      <h2 className="text-lg font-black mb-4 text-zinc-900 tracking-wide">商品与尺码库</h2>
      
      <div className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
        <h3 className="text-sm font-bold text-zinc-900 mb-3">添加新商品模板</h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-zinc-500 mb-1">款式／商品名称</label>
            <input
              type="text"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium focus:border-zinc-900 focus:outline-none"
              placeholder="例如: 巴西短袜"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-zinc-500 mb-1">款号（可选）</label>
            <input
              type="text"
              value={newProductSpu}
              onChange={(e) => setNewProductSpu(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium focus:border-zinc-900 focus:outline-none"
              placeholder="例如：示例-款号-01"
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-zinc-500 mb-1">尺码（用逗号或空格分隔）</label>
            <input
              type="text"
              value={newProductSizes}
              onChange={(e) => setNewProductSizes(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium focus:border-zinc-900 focus:outline-none"
            />
          </div>
          <div className="md:col-span-3">
            <button
              onClick={handleAdd}
              className="flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 font-bold text-white transition-colors hover:bg-black"
            >
              <Plus size={16} className="mr-1" /> 添加
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-zinc-900 mb-3">已存商品库（{products.length}）</h3>
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 py-8 text-center font-medium text-zinc-500">
            暂无预设商品，请先添加
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-200">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-zinc-200 bg-zinc-100 text-zinc-900">
                <tr>
                  <th className="px-4 py-3 font-bold text-xs">款号</th>
                  <th className="px-4 py-3 font-bold text-xs">款式名称</th>
                  <th className="px-4 py-3 font-bold text-xs">包含尺码</th>
                  <th className="px-4 py-3 font-bold text-xs text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products.map((p, index) => (
                  <tr key={p.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="px-4 py-3 font-medium text-zinc-500 text-xs">{p.spu || '-'}</td>
                    <td className="px-4 py-3 font-bold text-zinc-900">{p.name}</td>
                    <td className="px-4 py-3 text-zinc-600 flex flex-wrap gap-1">
                      {p.sizes.map((s, idx) => (
                        <span key={idx} className="flex h-6 items-center rounded-lg border border-zinc-200 bg-white px-2 text-xs font-bold shadow-sm">
                          {s}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="rounded-lg p-1 text-zinc-600 transition-colors hover:bg-zinc-200 disabled:opacity-30"
                          title="上移"
                        ><ArrowUp size={16} /></button>
                        <button 
                          onClick={() => handleMoveDown(index)}
                          disabled={index === products.length - 1}
                          className="rounded-lg p-1 text-zinc-600 transition-colors hover:bg-zinc-200 disabled:opacity-30"
                          title="下移"
                        ><ArrowDown size={16} /></button>
                        <div className="mx-1 my-auto h-4 w-px bg-zinc-300"></div>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-black"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
