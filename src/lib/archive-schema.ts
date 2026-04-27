import type { DocumentInfo, Product, StockItem } from '../types';

/** 存档 JSON / localStorage 业务结构版本；仅在不兼容时递增并写迁移 */
export const ARCHIVE_SCHEMA_VERSION = 2;

/** 与 package.json、扩展 manifest 对齐，迭代时同步 bump */
export const APP_VERSION_STRING = '1.0.0';

export type ExportPreferences = {
  exportPdf: boolean;
  exportImage: boolean;
  exportJson: boolean;
};

export const DEFAULT_EXPORT_PREFS: ExportPreferences = {
  exportPdf: true,
  exportImage: true,
  exportJson: true,
};

export type ArchiveImportPayload = {
  info?: Partial<DocumentInfo>;
  products?: Product[];
  stockItems?: StockItem[];
  exportPrefs?: Partial<ExportPreferences>;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function readSchemaVersion(raw: Record<string, unknown>): number {
  const v = raw.schemaVersion;
  if (typeof v === 'number' && Number.isFinite(v) && v >= 1) {
    return Math.floor(v);
  }
  return 1;
}

function parseExportPrefs(
  settings: Record<string, unknown> | undefined,
): Partial<ExportPreferences> | undefined {
  if (!settings || !isPlainObject(settings)) return undefined;
  const out: Partial<ExportPreferences> = {};
  if (typeof settings.exportPdf === 'boolean') out.exportPdf = settings.exportPdf;
  if (typeof settings.exportImage === 'boolean') out.exportImage = settings.exportImage;
  if (typeof settings.exportJson === 'boolean') out.exportJson = settings.exportJson;
  return Object.keys(out).length ? out : undefined;
}

export type ParseArchiveResult =
  | { ok: true; payload: ArchiveImportPayload; sourceSchemaVersion: number }
  | { ok: false; error: string };

/**
 * 统一解析：浏览器导出的 .json、localStorage 快照、旧版无 schemaVersion 的备份。
 */
export function parseArchiveBundle(raw: unknown): ParseArchiveResult {
  if (!isPlainObject(raw)) {
    return { ok: false, error: '数据不是有效的 JSON 对象。' };
  }

  const sourceSchemaVersion = readSchemaVersion(raw);

  if (sourceSchemaVersion > ARCHIVE_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `存档结构版本为 ${sourceSchemaVersion}，高于当前应用支持的 ${ARCHIVE_SCHEMA_VERSION}。请升级应用后再导入。`,
    };
  }

  const payload: ArchiveImportPayload = {};

  if (isPlainObject(raw.info)) {
    payload.info = raw.info as Partial<DocumentInfo>;
  }
  if (Array.isArray(raw.products)) {
    payload.products = raw.products as Product[];
  }
  if (Array.isArray(raw.stockItems)) {
    payload.stockItems = raw.stockItems as StockItem[];
  }

  if (isPlainObject(raw.settings)) {
    const prefs = parseExportPrefs(raw.settings);
    if (prefs) payload.exportPrefs = prefs;
  }

  const hasData =
    payload.info !== undefined ||
    payload.products !== undefined ||
    payload.stockItems !== undefined ||
    payload.exportPrefs !== undefined;

  if (!hasData) {
    return { ok: false, error: '未找到可导入的业务数据（表头、商品库、备货清单等）。' };
  }

  return { ok: true, payload, sourceSchemaVersion };
}

export function createArchiveExportObject(params: {
  info: DocumentInfo;
  products: Product[];
  stockItems: StockItem[];
  exportPrefs: ExportPreferences;
}): Record<string, unknown> {
  return {
    schemaVersion: ARCHIVE_SCHEMA_VERSION,
    appVersion: APP_VERSION_STRING,
    exportedAt: new Date().toISOString(),
    info: params.info,
    products: params.products,
    stockItems: params.stockItems,
    settings: {
      exportPdf: params.exportPrefs.exportPdf,
      exportImage: params.exportPrefs.exportImage,
      exportJson: params.exportPrefs.exportJson,
    },
  };
}

export function createStorageSnapshotObject(params: {
  info: DocumentInfo;
  products: Product[];
  stockItems: StockItem[];
  exportPrefs: ExportPreferences;
}): Record<string, unknown> {
  return {
    schemaVersion: ARCHIVE_SCHEMA_VERSION,
    appVersion: APP_VERSION_STRING,
    savedAt: new Date().toISOString(),
    info: params.info,
    products: params.products,
    stockItems: params.stockItems,
    settings: {
      exportPdf: params.exportPrefs.exportPdf,
      exportImage: params.exportPrefs.exportImage,
      exportJson: params.exportPrefs.exportJson,
    },
  };
}

