import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { EXPORT_PIXEL_RATIO } from './exportImageConfig';

const raf = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** 与 CatalogMaker 一致：等两帧再截图，减少布局与换行差异 */
const rafDouble = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

const A4_LANDSCAPE_RATIO = 297 / 210;

const baseCaptureOptions = {
  pixelRatio: EXPORT_PIXEL_RATIO,
  backgroundColor: '#ffffff',
  cacheBust: true,
  style: { transform: 'none', boxShadow: 'none', margin: '0px' } as const,
};

export interface PageImageCapture {
  dataUrl: string;
  /** jsPDF addImage 使用的格式名 */
  imageFormat: 'PNG' | 'JPEG';
}

function getStablePageSize(el: HTMLElement): { width: number; height: number } {
  const rect = el.getBoundingClientRect();
  const height = Math.max(1, Math.round(rect.height));
  const width = Math.max(1, Math.round(height * A4_LANDSCAPE_RATIO));
  return { width, height };
}

export async function capturePageImages(root: HTMLElement): Promise<PageImageCapture[]> {
  const pages = root.querySelectorAll('.page');
  if (pages.length === 0) {
    throw new Error('未找到可导出的预览页（.page）。');
  }
  const initialCount = pages.length;

  await rafDouble();

  const out: PageImageCapture[] = [];

  for (let i = 0; i < initialCount; i++) {
    const fresh = root.querySelectorAll('.page');
    if (fresh.length !== initialCount) {
      throw new Error('导出过程中页数已变化，请重试。');
    }

    const el = fresh[i] as HTMLElement;
    const stableSize = getStablePageSize(el);
    const originalTransform = el.style.transform;
    const originalBoxShadow = el.style.boxShadow;
    el.style.transform = 'none';
    el.style.boxShadow = 'none';

    try {
      const dataUrl = await toPng(el, {
        ...baseCaptureOptions,
        width: stableSize.width,
        height: stableSize.height,
        canvasWidth: stableSize.width,
        canvasHeight: stableSize.height,
      });
      out.push({ dataUrl, imageFormat: 'PNG' });
    } catch (e) {
      throw new Error(`第 ${i + 1} 页截图失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      el.style.transform = originalTransform;
      el.style.boxShadow = originalBoxShadow;
    }
    await raf();
  }

  return out;
}

function buildPdfFromCaptures(captures: PageImageCapture[]): jsPDF {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = 297;
  const pageH = 210;

  for (let i = 0; i < captures.length; i++) {
    if (i > 0) {
      pdf.addPage(undefined, 'landscape');
    }
    const { dataUrl, imageFormat } = captures[i];
    pdf.addImage(dataUrl, imageFormat, 0, 0, pageW, pageH, undefined, 'FAST');
  }

  return pdf;
}

export function buildPdfBlobFromCaptures(captures: PageImageCapture[]): Blob {
  return buildPdfFromCaptures(captures).output('blob');
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function capturesToPngBlobs(captures: PageImageCapture[]): Promise<Blob[]> {
  const blobs: Blob[] = [];
  for (let i = 0; i < captures.length; i++) {
    const res = await fetch(captures[i].dataUrl);
    const blob = await res.blob();
    blobs.push(blob);
    await raf();
  }
  return blobs;
}
