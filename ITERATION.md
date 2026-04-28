# 迭代与存档版本说明

## 应用版本（`appVersion`）

- 与 `package.json` 的 `version`、扩展 `manifest.json` 的 `version`、界面角标保持一致。
- **迭代发布时**：三者同步 bump（如 `1.0.0` → `1.1.0`），并在变更日志中简述用户可见改动。

## 存档结构版本（`schemaVersion`）

- 字段 **`schemaVersion`**（整数）表示 **JSON / localStorage 的业务结构**，与 UI 版本号独立。
- **当前值**：见 `src/lib/archive-schema.ts` 中的 `ARCHIVE_SCHEMA_VERSION`。
- **何时递增**：仅在「旧版应用无法安全忽略新字段」或「字段语义不兼容」时 +1，并在 `archive-schema.ts` 内为旧版补充归一化逻辑（若需要）。

## JSON 存档导入兼容策略

1. **无 `schemaVersion` 或值为 `1`**：视为历史备份。只要根对象是 JSON Object，且含有可识别的 `info` / `products` / `stockItems`（及可选 `settings`），即按字段合并导入；已废弃字段（如仅旧版使用的开关）由解析层交给上层忽略或兼容。
2. **`schemaVersion === ARCHIVE_SCHEMA_VERSION`**：完整读取 `info`、`products`、`stockItems`、`settings`（导出选项等）。
3. **`schemaVersion` 大于当前应用支持**：**拒绝导入**，提示用户升级应用，避免静默数据损坏。

导出文件始终写入当前 `schemaVersion`、`appVersion`、`exportedAt`（或 localStorage 使用 `savedAt`），便于排查问题。

## `settings` / 导出开关（`exportPrefs`）

- 导出 JSON 会写入 `settings.exportPdf` / `exportImage` / `exportJson`，`parseArchiveBundle` 也会解析到 `payload.exportPrefs`。
- **当前产品行为**：应用层导入后 **不** 将 `exportPrefs` 合并进 UI 状态；一键存档仍按内置默认（全选）生成。该项仅作备份与版本排查元数据。
- 若未来需要「用户可关闭某类导出」，再在 App 层增加状态并在 ZIP 生成处读取 `exportPrefs`。

## `settings.strikeEmptyQtyOnPreview`（预览斜杠）

- 布尔值，默认 **`true`**：某尺码 **计划数量未填** 时，仅在该尺码列的「计划 + 实际」合并格内画对角斜线（不划整表）；**`false`** 时便于打印后手写。
- 写入 `settings` 与本地快照；导入时由 `parseArchiveBundle` 解析到 `payload.displayPrefs`，App 会恢复该开关。

## `stockItems` 版式字段

- **`printSheet`**（整数，从 0 起）：打印页组，不同组不混排到同一物理页。
- **`printSlot`**（整数 ≥ 1）：该组内的版面序号，每 12 个序号一页；可留空洞（无对应款式的序号渲染为空位格）。
- 旧存档无上述字段时，导入后按 **清单顺序** 自动补 `printSheet=0` 与连续 `printSlot`（见 `normalizeStockItems`）。

## 维护检查清单（发版前）

- [ ] `package.json` / `public/manifest.json` / `APP_VERSION_STRING` / 界面标签一致  
- [ ] 若改存档结构：`ARCHIVE_SCHEMA_VERSION` + `parseArchiveBundle` 兼容路径  
- [ ] 用旧版导出的样例 JSON 做一次导入烟测（或运行 `npm run smoke:archive` 覆盖解析层；可选用仓库内 `fixtures/legacy-backup-no-schemaVersion.json` 在界面「导入存档」验证）  
