import React, { useState } from 'react';
import { Product, DEFAULT_SIZES } from '../types';
import { generateId } from '../lib/utils';
import { SIZE_PRESETS } from '../lib/size-presets';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface Props {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export function ProductLibrary({ products, setProducts }: Props) {
  const [newProductName, setNewProductName] = useState('');
  const [newProductSpu, setNewProductSpu] = useState('');
  const [newProductSizes, setNewProductSizes] = useState(DEFAULT_SIZES.join(', '));
  const [presetSelectKey, setPresetSelectKey] = useState(0);
  const [dialog, setDialog] = useState<{ open: boolean; title: string; description?: string }>({
    open: false,
    title: '',
  });

  const handleAdd = () => {
    if (!newProductName.trim()) {
      setDialog({
        open: true,
        title: '请输入名称',
        description: '商品模板需要名称才能保存。',
      });
      return;
    }

    const sizes = newProductSizes
      .split(/[,，\s\\/]+/)
      .map((s) => s.trim())
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
    setProducts(products.filter((p) => p.id !== id));
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

  const inputClass =
    'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium transition-colors focus:border-accent-500 focus:outline-none';

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-black tracking-wide text-zinc-900">STEP2 · 商品库</h2>

      <div className="rounded-[var(--radius-bento)] border border-zinc-200/80 bg-zinc-50/80 p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-zinc-900">新建模板</h3>
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-bold text-zinc-500">名称</label>
            <input
              type="text"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              className={inputClass}
              placeholder="如：针织长裤"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-bold text-zinc-500">款号</label>
            <input
              type="text"
              value={newProductSpu}
              onChange={(e) => setNewProductSpu(e.target.value)}
              className={inputClass}
              placeholder="可选"
            />
          </div>
          <div className="md:col-span-4">
            <label className="mb-1 block text-xs font-bold text-zinc-500">尺码（逗号或空格分隔）</label>
            <div className="mb-2">
              <select
                key={presetSelectKey}
                defaultValue=""
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) return;
                  const preset = SIZE_PRESETS.find((p) => p.id === id);
                  if (preset) {
                    setNewProductSizes(preset.sizes.join(', '));
                  }
                  setPresetSelectKey((k) => k + 1);
                }}
                className={`${inputClass} font-bold text-zinc-800`}
              >
                <option value="">尺码预设</option>
                {SIZE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.labelZh}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={newProductSizes}
              onChange={(e) => setNewProductSizes(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="button"
              onClick={handleAdd}
              className="flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 font-bold text-white transition-colors hover:bg-zinc-950"
            >
              <Plus size={16} className="mr-1" /> 添加
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-zinc-900">已存（{products.length}）</h3>
        {products.length === 0 ? (
          <div className="rounded-[var(--radius-bento)] border border-dashed border-zinc-300 bg-zinc-50/50 py-8 text-center font-medium text-zinc-500">
            暂无商品，请在上方添加
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-bento)] border border-zinc-200/90 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-100/90 text-zinc-900">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold">款号</th>
                  <th className="px-4 py-3 text-xs font-bold">名称</th>
                  <th className="px-4 py-3 text-xs font-bold">尺码</th>
                  <th className="px-4 py-3 text-right text-xs font-bold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products.map((p, index) => (
                  <tr
                    key={p.id}
                    className="group transition-shadow hover:bg-zinc-50/90 hover:shadow-[inset_0_0_0_1px_rgba(37,99,235,0.12)]"
                  >
                    <td className="px-4 py-3 text-xs font-medium text-zinc-500">{p.spu || '-'}</td>
                    <td className="px-4 py-3 font-bold text-zinc-900">{p.name}</td>
                    <td className="flex flex-wrap gap-1 px-4 py-3 text-zinc-600">
                      {p.sizes.map((s, idx) => (
                        <span
                          key={idx}
                          className="flex h-6 items-center rounded-lg border border-zinc-200 bg-white px-2 text-xs font-bold shadow-sm"
                        >
                          {s}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
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
                          disabled={index === products.length - 1}
                          className="rounded-lg p-1 text-zinc-600 transition-colors hover:bg-zinc-200 disabled:opacity-30"
                          title="下移"
                        >
                          <ArrowDown size={16} />
                        </button>
                        <div className="mx-1 my-auto h-4 w-px bg-zinc-300"></div>
                        <button
                          type="button"
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

      <ConfirmDialog
        open={dialog.open}
        title={dialog.title}
        description={dialog.description}
        confirmText="知道了"
        onCancel={() => setDialog({ open: false, title: '' })}
        onConfirm={() => setDialog({ open: false, title: '' })}
      />
    </div>
  );
}
