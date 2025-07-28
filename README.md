# 貨運追蹤系統

一個基於 Node.js 的貨運追蹤查詢系統，使用 Pug 和 Stylus 進行前端開發。

## 🏗️ 專案結構

```
trackingSystem/
├── src/                    # 源代碼目錄
│   ├── pug/               # Pug 模板文件
│   │   └── index.pug      # 主頁面模板
│   ├── stylus/            # Stylus 樣式文件
│   │   ├── main.styl      # 主要樣式
│   │   └── components.styl # 組件樣式
│   └── js/                # JavaScript 文件
│       ├── api.js         # API 相關功能
│       ├── utils.js       # 工具函數
│       └── tracking.js    # 追蹤功能
├── dist/                   # 編譯輸出目錄
│   ├── index.html         # 編譯後的 HTML
│   ├── assets/            # 靜態資源
│   │   ├── css/          # 編譯後的 CSS
│   │   └── js/           # JavaScript 文件
│   └── server.js         # 服務器文件
├── server/                # 服務器源代碼
├── scripts/               # 構建腳本
└── package.json
```

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

這會：

1. 編譯 Pug 和 Stylus 文件
2. 啟動開發服務器
3. 監聽文件變更並自動重新編譯

### 構建生產版本

```bash
npm run build
```

### 啟動生產服務器

```bash
npm start
```

## 🛠️ 開發指南

### 修改 HTML 結構

- 編輯 `src/pug/index.pug`
- 使用 Pug 語法編寫模板
- 運行 `npm run build` 重新編譯

### 修改樣式

- 編輯 `src/stylus/main.styl` 或 `src/stylus/components.styl`
- 使用 Stylus 語法編寫樣式
- 運行 `npm run build` 重新編譯

### 修改 JavaScript

- 編輯 `src/js/` 目錄下的文件
- 運行 `npm run build` 重新編譯

### 監聽文件變更

```bash
npm run build:watch
```

這會監聽 `src/` 目錄下的所有 `.pug`、`.styl`、`.js` 文件變更並自動重新編譯。

## 📁 文件說明

### Pug 文件

- `src/pug/index.pug` - 主頁面模板，包含完整的 HTML 結構

### Stylus 文件

- `src/stylus/main.styl` - 主要樣式，包含基礎樣式和響應式設計
- `src/stylus/components.styl` - 組件樣式，包含所有 UI 組件的樣式

### JavaScript 文件

- `src/js/api.js` - API 相關功能，處理與後端的通信
- `src/js/utils.js` - 工具函數，包含通用功能
- `src/js/tracking.js` - 追蹤功能，處理追蹤查詢邏輯

## 🌐 API 端點

- `GET /api/search-tracking?trackingId=XXX` - 搜尋追蹤號碼
- `GET /api/test-connection` - 測試 API 連接
- `GET /api/stats` - 查看使用統計
- `GET /api/clear-cache` - 清除快取

## 🎨 特色功能

- ✅ 使用 Pug 進行 HTML 模板化
- ✅ 使用 Stylus 進行 CSS 預處理
- ✅ 自動編譯和構建流程
- ✅ 開發模式熱重載
- ✅ 響應式設計
- ✅ 快取機制
- ✅ 錯誤處理

## 📝 技術棧

- **後端**: Node.js, Express
- **前端**: Pug, Stylus, JavaScript
- **構建工具**: 自定義構建腳本
- **開發工具**: Nodemon, Live-server

## 🔧 配置

### 環境變數

創建 `.env` 文件：

```
AIRTABLE_API_KEY=your_api_key
AIRTABLE_BASE_ID=your_base_id
AIRTABLE_TABLE_NAME=your_table_name
PORT=3001
```

## 📄 授權

MIT License
