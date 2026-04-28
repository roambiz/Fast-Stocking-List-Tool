import React from 'react';

interface Props {
  strikeEmptyQtyOnPreview: boolean;
  showEmptySlotDetailOnPreview: boolean;
  onStrikeEmptyQtyChange: (value: boolean) => void;
  onShowEmptySlotDetailChange: (value: boolean) => void;
}

function BeautySwitch({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
        checked ? 'border-accent-600 bg-accent-500' : 'border-zinc-300 bg-zinc-200'
      }`}
    >
      <span
        className={`pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
        aria-hidden
      />
    </button>
  );
}

function SettingRow({
  title,
  description,
  checked,
  onChange,
  switchId,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  switchId: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-bento)] border border-zinc-200/90 bg-zinc-50/80 px-4 py-3 shadow-sm">
      <label htmlFor={switchId} className="min-w-0 flex-1 cursor-pointer pr-2">
        <div className="text-sm font-bold text-zinc-900">{title}</div>
        <p className="mt-0.5 text-xs font-medium leading-snug text-zinc-500">{description}</p>
      </label>
      <BeautySwitch id={switchId} checked={checked} onChange={onChange} />
    </div>
  );
}

export function TableBeautySettings({
  strikeEmptyQtyOnPreview,
  showEmptySlotDetailOnPreview,
  onStrikeEmptyQtyChange,
  onShowEmptySlotDetailChange,
}: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black tracking-wide text-zinc-900">STEP5 · 表格美化</h2>
        <p className="mt-1 text-sm text-zinc-500">仅影响预览与 PDF，不改备货数据。</p>
      </div>

      <div className="space-y-3">
        <SettingRow
          switchId="beauty-strike"
          title="计划为空画斜杠"
          description="计划→实际格内斜线。手写填表建议关闭。"
          checked={strikeEmptyQtyOnPreview}
          onChange={onStrikeEmptyQtyChange}
        />
        <SettingRow
          switchId="beauty-empty-slot"
          title="空位显示序号"
          description="开启：仅「预览」显示虚线与序号。导出 PDF/PNG 始终为实线空白格，无序号、无虚线。"
          checked={showEmptySlotDetailOnPreview}
          onChange={onShowEmptySlotDetailChange}
        />
      </div>
    </div>
  );
}
