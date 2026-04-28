# Fast Stocking List Tool 发布前检查清单

版本：v1.2.0（发布前请按需更新）  
检测日期：2026-04-28

---

## 1. 必要检查

- [ ] 无遗留调试代码（`console.log` / `debugger` 等）
- [ ] 无未使用的 import、无死代码
- [ ] 关键交互回归（STEP1–5 编辑、预览、导出）

---

## 2. 构建与类型检查

- [ ] `npm run lint` 通过（tsc --noEmit）
- [ ] `SITE_URL=<线上地址> npm run build` 通过

---

## 3. dist/ 产物检查（站点发布包）

- [ ] `dist/index.html`：title/description/canonical/og/twitter meta 正确
- [ ] `dist/config.json`：`version/buildTime/siteUrl` 正确
- [ ] `dist/.htaccess`：SPA 路由回退、缓存、安全头
- [ ] `dist/robots.txt`：Sitemap 指向正确
- [ ] `dist/sitemap.xml`：URL、lastmod 正确
- [ ] `dist/ai.txt`：内容正确、无不当引用

---

## 4. 打包与产物

- [ ] `npm run pack` 产出扩展包：`release/fast-stocking-list-extension-v<version>.zip`
- [ ] `npm run pack:dist` 产出站点部署包：`release/fast-stocking-list-v<version>-dist.zip`
- [ ] （可选）`npm run pack:dev` 产出源码包：`release/fast-stocking-list-v<version>-dev.zip`

---

## 5. Git / Tag

- [ ] 工作区干净（无遗漏文件）
- [ ] `package.json` / `manifest.json` / `APP_VERSION_STRING` 与本次版本一致
- [ ] `CHANGELOG.md` 已更新（如启用）
- [ ] 推送到 GitHub 后创建 tag：`1.2.0`（或团队约定的 `v1.2.0`）

