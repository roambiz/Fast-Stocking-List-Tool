import {
  ARCHIVE_SCHEMA_VERSION,
  parseArchiveBundle,
} from '../src/lib/archive-schema';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

// 无 schemaVersion：视为 v1 历史备份
const legacyNoSchema = {
  info: { platform: '烟测', store: '', personInCharge: '', shippingMethod: '', date: '2026-01-01' },
  products: [{ id: 'p1', name: '示例', sizes: ['M'] }],
  stockItems: [],
};
const r1 = parseArchiveBundle(legacyNoSchema);
assert(r1.ok === true, 'legacy bundle should parse');
assert(r1.sourceSchemaVersion === 1, 'missing schemaVersion => 1');
assert(r1.payload.products?.length === 1, 'products merged');

// 当前 schema 完整对象
const current = {
  schemaVersion: ARCHIVE_SCHEMA_VERSION,
  appVersion: '1.0.0',
  info: { platform: 'x', store: '', personInCharge: '', shippingMethod: '', date: '2026-01-01' },
  products: [],
  stockItems: [],
};
const r2 = parseArchiveBundle(current);
assert(r2.ok === true, 'current schema should parse');
assert(r2.sourceSchemaVersion === ARCHIVE_SCHEMA_VERSION, 'schema version');

// 未来 schema：拒绝
const future = {
  schemaVersion: ARCHIVE_SCHEMA_VERSION + 99,
  info: {},
  products: [],
  stockItems: [],
};
const r3 = parseArchiveBundle(future);
assert(r3.ok === false, 'future schema should fail');

// settings 可解析为 exportPrefs，但不影响 parse 成功
const withSettings = {
  schemaVersion: 2,
  info: {},
  products: [],
  stockItems: [],
  settings: { exportPdf: false, exportImage: true, exportJson: true },
};
const r4 = parseArchiveBundle(withSettings);
assert(r4.ok === true, 'settings should parse');
assert(r4.payload.exportPrefs?.exportPdf === false, 'exportPrefs.exportPdf');

// displayPrefs：未填数量斜杠开关
const withDisplay = {
  schemaVersion: 2,
  info: {},
  products: [],
  stockItems: [],
  settings: { exportPdf: true, exportImage: true, exportJson: true, strikeEmptyQtyOnPreview: false },
};
const r5 = parseArchiveBundle(withDisplay);
assert(r5.ok === true, 'display settings parse');
assert(r5.payload.displayPrefs?.strikeEmptyQtyOnPreview === false, 'strikeEmptyQtyOnPreview');

const withEmptySlot = {
  schemaVersion: 2,
  info: {},
  products: [],
  stockItems: [],
  settings: {
    exportPdf: true,
    exportImage: true,
    exportJson: true,
    strikeEmptyQtyOnPreview: true,
    showEmptySlotDetailOnPreview: false,
  },
};
const r6 = parseArchiveBundle(withEmptySlot);
assert(r6.ok === true, 'empty slot pref parse');
assert(r6.payload.displayPrefs?.showEmptySlotDetailOnPreview === false, 'showEmptySlotDetailOnPreview');

console.log('smoke:archive OK');
