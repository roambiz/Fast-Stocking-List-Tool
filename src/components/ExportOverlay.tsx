import React from 'react';

type Props = {
  show: boolean;
  message?: string;
};

export function ExportOverlay({ show, message = '正在导出中…' }: Props) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 backdrop-blur-[2px] pointer-events-auto"
      role="alert"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="bento-overlay-card">
        <p className="text-sm font-bold text-zinc-900">{message}</p>
      </div>
    </div>
  );
}
