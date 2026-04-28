import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { DocumentInfoForm } from './components/DocumentInfoForm';
import { ProductLibrary } from './components/ProductLibrary';
import { PrintSheetLayoutPanel } from './components/PrintSheetLayoutPanel';
import { TableBeautySettings } from './components/TableBeautySettings';
import { StockList } from './components/StockList';
import { PrintPreview } from './components/PrintPreview';
import { ExportOverlay } from './components/ExportOverlay';
import { DocumentInfo, Product, StockItem, DEFAULT_SIZES } from './types';
import { generateId } from './lib/utils';
import {
  APP_VERSION_STRING,
  ARCHIVE_SCHEMA_VERSION,
  createArchiveExportObject,
  createStorageSnapshotObject,
  DEFAULT_DISPLAY_PREFS,
  DEFAULT_EXPORT_PREFS,
  parseArchiveBundle,
  type DisplayPreferences,
} from './lib/archive-schema';
import {
  buildPdfBlobFromCaptures,
  capturePageImages,
  capturesToPngBlobs,
  downloadBlob,
} from './lib/exportPreview';
import {
  Package,
  ClipboardList,
  Settings,
  Download,
  Archive,
  Upload,
  LayoutGrid,
  Palette,
  type LucideIcon,
} from 'lucide-react';
import { normalizeStockItems } from './lib/stock-layout';

const STORAGE_KEY = 'stock_tool_data';

type EditTabId = 'info' | 'library' | 'list' | 'layout' | 'beauty';

const EDIT_STEPS: { tab: EditTabId; step: number; Icon: LucideIcon; label: string }[] = [
  { tab: 'info', step: 1, Icon: Settings, label: 'STEP1 · 表头' },
  { tab: 'library', step: 2, Icon: Package, label: 'STEP2 · 商品库' },
  { tab: 'list', step: 3, Icon: ClipboardList, label: 'STEP3 · 清单' },
  { tab: 'layout', step: 4, Icon: LayoutGrid, label: 'STEP4 · 页组' },
  { tab: 'beauty', step: 5, Icon: Palette, label: 'STEP5 · 美化' },
];

function archiveBaseNames(date: string) {
  return {
    pdf: `备货清单-${date}.pdf`,
    json: `备货清单-${date}.配置备份.json`,
    zip: `备货清单存档-${date}.zip`,
    png: (pageIndex: number) => `备货清单-${date}-第${pageIndex + 1}页.png`,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'edit' | 'print'>('edit');
  const [editTab, setEditTab] = useState<EditTabId>('info');
  const exportRootRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [info, setInfo] = useState<DocumentInfo>(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      platform: '',
      store: '',
      personInCharge: '',
      shippingMethod: '',
      date: today,
    };
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [exporting, setExporting] = useState(false);
  const [displayPrefs, setDisplayPrefs] = useState<DisplayPreferences>(() => ({
    ...DEFAULT_DISPLAY_PREFS,
  }));

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as unknown;
        const parsed = parseArchiveBundle(data);
        if (parsed.ok === false) {
          console.warn('本地存储解析：', parsed.error);
          return;
        }
        const { payload } = parsed;
        if (payload.info) {
          setInfo((prev) => ({ ...prev, ...payload.info }));
        }
        if (payload.products) {
          setProducts(payload.products);
        }
        if (payload.stockItems) {
          setStockItems(normalizeStockItems(payload.stockItems));
        }
        if (payload.displayPrefs) {
          setDisplayPrefs({ ...DEFAULT_DISPLAY_PREFS, ...payload.displayPrefs });
        }
      } else {
        setProducts([{ id: generateId(), name: '男童针织长裤示例', spu: '示例-01', sizes: DEFAULT_SIZES }]);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        createStorageSnapshotObject({
          info,
          products,
          stockItems,
          exportPrefs: DEFAULT_EXPORT_PREFS,
          displayPrefs,
        }),
      ),
    );
  }, [info, products, stockItems, displayPrefs]);

  const handleClearList = () => {
    if (confirm('确定要清空当前的备货清单吗？该操作不可恢复。')) {
      setStockItems([]);
    }
  };

  const handleImportJsonFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      alert('请导入 .json 备份文件。');
      return;
    }
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
      const parsed = parseArchiveBundle(raw);
      if (parsed.ok === false) {
        alert(parsed.error);
        return;
      }
      const { payload, sourceSchemaVersion } = parsed;
      if (payload.info) {
        setInfo((prev) => ({ ...prev, ...payload.info }));
      }
      if (payload.products) {
        setProducts(payload.products);
      }
      if (payload.stockItems) {
        setStockItems(normalizeStockItems(payload.stockItems));
      }
      if (payload.displayPrefs) {
        setDisplayPrefs({ ...DEFAULT_DISPLAY_PREFS, ...payload.displayPrefs });
      }
      const note =
        sourceSchemaVersion < ARCHIVE_SCHEMA_VERSION ? '（旧版已兼容）' : '';
      alert(`已导入${note}`);
    } catch (err) {
      alert('导入失败，请检查文件。');
      console.error(err);
    }
  };

  const runCapture = async () => {
    const root = exportRootRef.current;
    if (!root) {
      throw new Error('导出区域未就绪，请稍后重试。');
    }
    return capturePageImages(root);
  };

  const handleExportPdfOnly = async () => {
    if (stockItems.length === 0) {
      alert('请先添加款式。');
      return;
    }
    setExporting(true);
    const date = new Date().toISOString().slice(0, 10);
    const names = archiveBaseNames(date);
    try {
      const captures = await runCapture();
      const blob = buildPdfBlobFromCaptures(captures);
      downloadBlob(blob, names.pdf);
    } catch (e) {
      alert(e instanceof Error ? e.message : '导出失败');
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const handleFullArchiveZip = async () => {
    if (stockItems.length === 0) {
      alert('请先添加款式。');
      return;
    }
    setExporting(true);
    const date = new Date().toISOString().slice(0, 10);
    const names = archiveBaseNames(date);
    try {
      const captures = await runCapture();
      const pdfBlob = buildPdfBlobFromCaptures(captures);
      const zip = new JSZip();
      zip.file(names.pdf, pdfBlob);

      const pngBlobs = await capturesToPngBlobs(captures);
      pngBlobs.forEach((blob, i) => {
        zip.file(names.png(i), blob);
      });

      const jsonData = createArchiveExportObject({
        info,
        products,
        stockItems,
        exportPrefs: DEFAULT_EXPORT_PREFS,
        displayPrefs,
      });
      zip.file(names.json, JSON.stringify(jsonData, null, 2));

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, names.zip);
    } catch (e) {
      alert(e instanceof Error ? e.message : '打包失败');
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-200/50 via-zinc-50 to-white font-sans text-zinc-900">
      <ExportOverlay show={exporting} />

      <header className="no-print sticky top-0 z-10 px-4 pt-4">
        <div
          className="mx-auto max-w-7xl border border-zinc-200/80 bg-white/90 px-4 py-3 shadow-[var(--shadow-bento)] backdrop-blur-md"
          style={{ borderRadius: 'var(--radius-shell)' }}
        >
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 shrink-0 items-center gap-2">
              <div className="rounded-xl bg-zinc-900 p-2 text-white shadow-sm">
                <ClipboardList size={20} />
              </div>
              <h1 className="text-xl font-black tracking-tight text-zinc-900">备货清单</h1>
              <span
                className="rounded-full border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600"
                title={`${APP_VERSION_STRING} · 存档 v${ARCHIVE_SCHEMA_VERSION}`}
              >
                {APP_VERSION_STRING} 版
              </span>
              <a
                href="https://roambiz.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-600 transition-colors hover:border-accent-300 hover:text-zinc-900"
              >
                作者：Singa
              </a>
            </div>

            <div className="flex min-w-0 flex-wrap items-center justify-center gap-2 lg:flex-1">
              <div className="bento-header-strip flex space-x-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                    activeTab === 'edit'
                      ? 'border border-zinc-200/80 bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('print')}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                    activeTab === 'print'
                      ? 'border border-zinc-200/80 bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  预览
                </button>
              </div>
            </div>

            <div className="bento-export-dock shrink-0 justify-end">
              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    await handleImportJsonFile(file);
                  }
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                disabled={exporting}
                title="导出 PDF"
                onClick={() => void handleExportPdfOnly()}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:border-accent-600 hover:bg-zinc-950 disabled:pointer-events-none disabled:opacity-50"
              >
                <Download size={18} /> 导出 PDF
              </button>
              <button
                type="button"
                disabled={exporting}
                title="PDF + 图 + JSON 打包"
                onClick={() => void handleFullArchiveZip()}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-900 shadow-sm transition-colors hover:border-accent-300 hover:bg-accent-50/40 disabled:pointer-events-none disabled:opacity-50"
              >
                <Archive size={18} /> 一键存档
              </button>
              <button
                type="button"
                disabled={exporting}
                title="从 JSON 恢复"
                onClick={() => importInputRef.current?.click()}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-900 shadow-sm transition-colors hover:border-accent-300 hover:bg-accent-50/40 disabled:pointer-events-none disabled:opacity-50"
              >
                <Upload size={18} /> 导入存档
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="no-print mx-auto w-full max-w-7xl flex-1 p-4 lg:p-6">
        {activeTab === 'edit' && (
          <div className="bento-tray">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="w-full shrink-0 space-y-2 lg:w-64">
                {EDIT_STEPS.map(({ tab, step, Icon, label }) => {
                  const active = editTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setEditTab(tab)}
                      className={`relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all ${
                        active
                          ? 'border-zinc-300/90 bg-white text-zinc-900 shadow-md ring-1 ring-zinc-200/60'
                          : 'border-zinc-200/80 bg-white/70 text-zinc-500 hover:border-zinc-300 hover:bg-white hover:text-zinc-900'
                      }`}
                    >
                      <span
                        className={`pointer-events-none absolute inset-y-2.5 left-0 w-0.5 rounded-full transition-opacity ${
                          active ? 'bg-accent-600 opacity-100' : 'bg-accent-600 opacity-0'
                        }`}
                        aria-hidden
                      />
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-black tabular-nums ${
                          active
                            ? 'bg-accent-100 text-accent-800 ring-1 ring-accent-200/80'
                            : 'bg-zinc-200/90 text-zinc-600'
                        }`}
                      >
                        {step}
                      </span>
                      <Icon size={18} className="shrink-0 text-zinc-600" />
                      <span className="leading-snug">{label}</span>
                    </button>
                  );
                })}

                <div className="mt-6 border-t border-zinc-200/80 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('print');
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 font-bold text-white shadow-sm transition-colors hover:bg-zinc-950"
                  >
                    <ClipboardList size={18} /> 去预览
                  </button>
                  {stockItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearList}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      清空当前清单
                    </button>
                  )}
                </div>
              </div>

              <div className="bento-main-tile min-w-0 flex-1">
                {editTab === 'info' && <DocumentInfoForm info={info} onChange={setInfo} />}
                {editTab === 'library' && <ProductLibrary products={products} setProducts={setProducts} />}
                {editTab === 'list' && (
                  <StockList products={products} stockItems={stockItems} setStockItems={setStockItems} />
                )}
                {editTab === 'layout' && (
                  <PrintSheetLayoutPanel stockItems={stockItems} setStockItems={setStockItems} />
                )}
                {editTab === 'beauty' && (
                  <TableBeautySettings
                    strikeEmptyQtyOnPreview={displayPrefs.strikeEmptyQtyOnPreview}
                    showEmptySlotDetailOnPreview={displayPrefs.showEmptySlotDetailOnPreview}
                    onStrikeEmptyQtyChange={(v) =>
                      setDisplayPrefs((p) => ({ ...p, strikeEmptyQtyOnPreview: v }))
                    }
                    onShowEmptySlotDetailChange={(v) =>
                      setDisplayPrefs((p) => ({ ...p, showEmptySlotDetailOnPreview: v }))
                    }
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'print' && (
          <div className="bento-tray">
            <div className="bento-main-tile space-y-6">
              <div className="flex flex-col gap-1 border-b border-zinc-200/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-zinc-900">预览</h2>
                  <p className="mt-1 max-w-xl text-sm text-zinc-500">
                    空位装饰仅本页预览；PDF 与分页图为正式稿面（无占序虚线）。
                  </p>
                </div>
              </div>
              <PrintPreview
                info={info}
                stockItems={stockItems}
                strikeEmptyQtyOnPreview={displayPrefs.strikeEmptyQtyOnPreview}
                showEmptySlotDetailOnPreview={displayPrefs.showEmptySlotDetailOnPreview}
              />
            </div>
          </div>
        )}
      </main>

      <div
        ref={exportRootRef}
        className="no-print"
        style={{
          position: 'fixed',
          top: 0,
          left: -10000,
          width: 'max-content',
          minWidth: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundColor: '#ffffff',
          color: '#000000',
          isolation: 'isolate',
          margin: 0,
          padding: 0,
          transform: 'none',
        }}
        aria-hidden
        data-export-root
      >
        <PrintPreview
          info={info}
          stockItems={stockItems}
          strikeEmptyQtyOnPreview={displayPrefs.strikeEmptyQtyOnPreview}
          showEmptySlotDetailOnPreview={displayPrefs.showEmptySlotDetailOnPreview}
          forExportCapture
        />
      </div>
    </div>
  );
}
