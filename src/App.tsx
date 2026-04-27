import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { DocumentInfoForm } from './components/DocumentInfoForm';
import { ProductLibrary } from './components/ProductLibrary';
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
  DEFAULT_EXPORT_PREFS,
  parseArchiveBundle,
} from './lib/archive-schema';
import {
  buildPdfBlobFromCaptures,
  capturePageImages,
  capturesToPngBlobs,
  downloadBlob,
} from './lib/exportPreview';
import { Package, ClipboardList, Settings, Download, Archive, Upload } from 'lucide-react';

const STORAGE_KEY = 'stock_tool_data';

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
  const [editTab, setEditTab] = useState<'info' | 'library' | 'list'>('list');
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
          setStockItems(payload.stockItems);
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
        }),
      ),
    );
  }, [info, products, stockItems]);

  const handleClearList = () => {
    if (confirm('确定要清空当前的备货清单吗？该操作不可恢复。')) {
      setStockItems([]);
    }
  };

  const handleImportJsonFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      alert('仅支持导入扩展名为 json 的配置备份文件。');
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
        setStockItems(payload.stockItems);
      }
      const note = sourceSchemaVersion < 2 ? '（已兼容旧版存档格式）' : '';
      alert(`配置已成功导入！${note}`);
    } catch (err) {
      alert('导入失败，请检查文件格式是否正确。');
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
      alert('请先添加备货款式后再导出。');
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
      alert('请先添加备货款式后再存档。');
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
    <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-white to-zinc-200 flex flex-col font-sans text-zinc-900">
      <ExportOverlay show={exporting} />

      <header className="no-print sticky top-0 z-10 px-4 pt-4">
        <div className="mx-auto max-w-7xl rounded-2xl border border-zinc-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2 shrink-0">
            <div className="rounded-xl bg-zinc-900 text-white p-2 shadow-sm">
              <ClipboardList size={20} />
            </div>
            <h1 className="text-xl font-black tracking-tight text-zinc-900">备货清单工具</h1>
            <span
              className="rounded-full border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600"
              title={`应用版本 ${APP_VERSION_STRING}，存档结构版本 ${ARCHIVE_SCHEMA_VERSION}`}
            >
              {APP_VERSION_STRING} 版
            </span>
            <a
              href="https://roambiz.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
            >
              作者：Singa
            </a>
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-center gap-2 lg:flex-1">
            <div className="flex space-x-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'edit' ? 'border border-zinc-200 bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                编辑模式
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('print')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'print' ? 'border border-zinc-200 bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                预览模式
              </button>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 shrink-0">
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
              title="导出备货清单为 PDF，便于打印核对"
              onClick={() => void handleExportPdfOnly()}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-black disabled:pointer-events-none disabled:opacity-50"
            >
              <Download size={18} /> 导出 PDF
            </button>
            <button
              type="button"
              disabled={exporting}
              title="打包 PDF、分页图与配置备份为压缩包"
              onClick={() => void handleFullArchiveZip()}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-bold text-zinc-900 shadow-sm transition-colors hover:border-zinc-500 hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50"
            >
              <Archive size={18} /> 一键存档
            </button>
            <button
              type="button"
              disabled={exporting}
              title="从配置备份文件恢复数据"
              onClick={() => importInputRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-bold text-zinc-900 shadow-sm transition-colors hover:border-zinc-500 hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50"
            >
              <Upload size={18} /> 导入存档
            </button>
          </div>
        </div>
        </div>
      </header>

      <main className="no-print mx-auto w-full max-w-7xl flex-1 p-4 lg:p-6">
        {activeTab === 'edit' && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-64 shrink-0 space-y-2">
              <button
                type="button"
                onClick={() => setEditTab('list')}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left font-bold transition-all ${editTab === 'list' ? 'border-zinc-300 bg-white text-zinc-900 shadow-sm' : 'border-zinc-200 bg-white/80 text-zinc-500 hover:bg-white hover:text-zinc-900'}`}
              >
                <ClipboardList size={18} /> 备货清单编辑
              </button>
              <button
                type="button"
                onClick={() => setEditTab('library')}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left font-bold transition-all ${editTab === 'library' ? 'border-zinc-300 bg-white text-zinc-900 shadow-sm' : 'border-zinc-200 bg-white/80 text-zinc-500 hover:bg-white hover:text-zinc-900'}`}
              >
                <Package size={18} /> 商品与尺码库
              </button>
              <button
                type="button"
                onClick={() => setEditTab('info')}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left font-bold transition-all ${editTab === 'info' ? 'border-zinc-300 bg-white text-zinc-900 shadow-sm' : 'border-zinc-200 bg-white/80 text-zinc-500 hover:bg-white hover:text-zinc-900'}`}
              >
                <Settings size={18} /> 设置表头信息
              </button>

              <div className="pt-6 mt-6 border-t-2 border-zinc-200">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('print');
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 font-bold text-white shadow-sm transition-colors hover:bg-black"
                >
                  <ClipboardList size={18} /> 清单预览
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

            <div className="flex-1 min-w-0">
              {editTab === 'info' && <DocumentInfoForm info={info} onChange={setInfo} />}
              {editTab === 'library' && <ProductLibrary products={products} setProducts={setProducts} />}
              {editTab === 'list' && <StockList products={products} stockItems={stockItems} setStockItems={setStockItems} />}
            </div>
          </div>
        )}

        {activeTab === 'print' && (
          <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-sm">
            <div className="mb-8 border-b border-zinc-200 pb-6 text-center">
              <h2 className="text-2xl font-black tracking-tight text-zinc-900">预览</h2>
            </div>
            <PrintPreview info={info} stockItems={stockItems} />
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
        <PrintPreview info={info} stockItems={stockItems} />
      </div>
    </div>
  );
}
