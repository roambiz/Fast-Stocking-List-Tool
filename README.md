<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Fast Stocking List Tool

快速备货清单工具，支持编辑备货数据、导出 PDF、打包 ZIP（PDF + 分页 PNG + JSON）。

## 功能概览

- 商品与尺码库管理
- 备货清单编辑（按尺码填写数量）
- 打印预览（A4 横版）
- 导出 PDF
- 一键存档 ZIP（PDF + 分页图 + JSON 配置）
- 导入 JSON 存档恢复数据

## 环境要求

- Node.js 18+（建议 LTS）
- npm 9+

## 本地开发

1. 安装依赖  
   `npm install`
2. 启动开发服务  
   `npm run dev`
3. 本地预览（生产构建后）  
   `npm run build`  
   `npm run preview`

## 常用命令

- `npm run lint`：TypeScript 类型检查
- `npm run build`：构建网站发布产物到 `dist/`
- `npm run pack`：清理旧产物并打包浏览器扩展 zip 到 `release/`
- `npm run clean`：清理 `dist/` 和 `release/`

## 如何使用

1. 打开应用后先在「商品与尺码库」维护商品模板。  
2. 在「备货清单编辑」将商品加入清单并填写数量。  
3. 在「设置表头信息」填写平台、店铺、负责人、发货方式、日期。  
4. 切到「预览模式」核对版式与数据。  
5. 使用「导出 PDF」或「一键存档」。  

## 网站部署（静态站点）

本项目是 Vite 静态站点，部署 `dist/` 目录即可。

### 步骤

1. 执行构建  
   `npm run build`
2. 将 `dist/` 目录上传到任意静态托管平台（例如 Nginx、GitHub Pages、Netlify、Vercel 静态模式）。
3. 确保站点根路径可访问 `index.html` 与 `assets/*`。

## 浏览器扩展使用（开发者模式）

### 方式 A：直接加载 `dist/`

1. 构建  
   `npm run build`
2. 打开 Chrome 扩展管理页：`chrome://extensions/`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择项目下的 `dist/` 目录（目录内需有 `manifest.json`）

### 方式 B：使用 zip 安装包

1. 打包  
   `npm run pack`
2. 解压 `release/fast-stocking-list-extension-vX.Y.Z.zip`
3. 在 `chrome://extensions/` 里「加载已解压的扩展程序」
4. 选择解压后的目录

## 版本说明

- 应用版本：`package.json` 的 `version`
- 扩展版本：`public/manifest.json` 的 `version`
- 建议发版时两者保持一致
