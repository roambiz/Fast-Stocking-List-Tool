import React, { useEffect, useRef } from 'react';

type DialogTone = 'neutral' | 'danger';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: DialogTone;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = '确定',
  cancelText,
  tone = 'neutral',
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => confirmRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClass =
    tone === 'danger'
      ? 'border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-700'
      : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-950 hover:border-zinc-950';

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white/95 p-5 shadow-2xl backdrop-blur"
        style={{ borderRadius: 'var(--radius-bento)' }}
      >
        <div className="space-y-1">
          <div className="text-base font-black tracking-tight text-zinc-900">{title}</div>
          {description ? (
            <div className="text-sm font-medium leading-snug text-zinc-500">{description}</div>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          {cancelText ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50"
            >
              {cancelText}
            </button>
          ) : null}
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`rounded-xl border px-3 py-2 text-sm font-bold shadow-sm transition-colors ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

