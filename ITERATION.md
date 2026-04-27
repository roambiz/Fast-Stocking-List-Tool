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

## 维护检查清单（发版前）

- [ ] `package.json` / `public/manifest.json` / `APP_VERSION_STRING` / 界面标签一致  
- [ ] 若改存档结构：`ARCHIVE_SCHEMA_VERSION` + `parseArchiveBundle` 兼容路径  
- [ ] 用旧版导出的样例 JSON 做一次导入烟测  
