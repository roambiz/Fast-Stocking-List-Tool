import React, { useState } from 'react';
import { DocumentInfo } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

interface Props {
  info: DocumentInfo;
  onChange: (info: DocumentInfo) => void;
  onResetHeader: () => void;
}

export function DocumentInfoForm({ info, onChange, onResetHeader }: Props) {
  const [resetOpen, setResetOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...info, [e.target.name]: e.target.value });
  };

  const fieldClass =
    'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-900 transition-colors focus:border-accent-500 focus:outline-none';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black tracking-wide text-zinc-900">STEP1 · 表头</h2>
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          重置表头
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-[var(--radius-bento)] border border-zinc-200/80 bg-zinc-50/70 p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">基础</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-500">平台</label>
              <input
                type="text"
                name="platform"
                value={info.platform}
                onChange={handleChange}
                className={fieldClass}
                placeholder="如：国内电商"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-500">店铺</label>
              <input
                type="text"
                name="store"
                value={info.store}
                onChange={handleChange}
                className={fieldClass}
                placeholder="店铺名"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold text-zinc-500">负责人</label>
              <input
                type="text"
                name="personInCharge"
                value={info.personInCharge}
                onChange={handleChange}
                className={fieldClass}
                placeholder="张三"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-[var(--radius-bento)] border border-zinc-200/80 bg-zinc-50/70 p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">物流 · 日期</p>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-500">发货方式</label>
              <input
                type="text"
                name="shippingMethod"
                value={info.shippingMethod}
                onChange={handleChange}
                className={fieldClass}
                placeholder="如：快递"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-500">日期</label>
              <input type="date" name="date" value={info.date} onChange={handleChange} className={fieldClass} />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="重置表头？"
        description="将清空平台、店铺、负责人、发货方式，并把日期设为今天。"
        confirmText="重置"
        cancelText="取消"
        tone="neutral"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          onResetHeader();
          setResetOpen(false);
        }}
      />
    </div>
  );
}
