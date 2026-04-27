import React from 'react';
import { DocumentInfo } from '../types';

interface Props {
  info: DocumentInfo;
  onChange: (info: DocumentInfo) => void;
}

export function DocumentInfoForm({ info, onChange }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...info, [e.target.name]: e.target.value });
  };

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/95 p-6 shadow-sm backdrop-blur">
      <h2 className="text-lg font-black mb-4 text-zinc-900 tracking-wide">基本信息设置</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-bold text-zinc-500 mb-2">平台</label>
          <input
            type="text"
            name="platform"
            value={info.platform}
            onChange={handleChange}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 font-medium focus:border-zinc-900 focus:outline-none"
            placeholder="例如：国内电商、海外平台"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 mb-2">店铺</label>
          <input
            type="text"
            name="store"
            value={info.store}
            onChange={handleChange}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 font-medium focus:border-zinc-900 focus:outline-none"
            placeholder="例如: XX专卖店"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 mb-2">负责人</label>
          <input
            type="text"
            name="personInCharge"
            value={info.personInCharge}
            onChange={handleChange}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 font-medium focus:border-zinc-900 focus:outline-none"
            placeholder="张三"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 mb-2">发货方式</label>
          <input
            type="text"
            name="shippingMethod"
            value={info.shippingMethod}
            onChange={handleChange}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 font-medium focus:border-zinc-900 focus:outline-none"
            placeholder="例如: 海运, 空运, 快递..."
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 mb-2">日期</label>
          <input
            type="date"
            name="date"
            value={info.date}
            onChange={handleChange}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 font-medium focus:border-zinc-900 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
