# 開發指南

## 專案結構

```
trackingSystem/
├── src/                    # 原始碼目錄
│   ├── components/         # 可重用的 UI 元件
│   ├── styles/            # 樣式檔案
│   │   ├── main.css       # 主要樣式
│   │   ├── components.css # 元件樣式
│   │   └── themes/        # 主題樣式
│   ├── scripts/           # JavaScript 檔案
│   │   ├── api.js         # API 相關功能
│   │   ├── utils.js       # 工具函數
│   │   └── tracking.js    # 主要追蹤功能
│   └── pages/             # 頁面檔案
│       ├── customer.html  # 客戶端頁面
│       ├── admin.html     # 管理員頁面
│       └── test.html      # 測試頁面
├── dist/                  # 編譯後的檔案
├── server/                # 後端伺服器
├── docs/                  # 文件
├── tests/                 # 測試檔案
└── scripts/               # 建置腳本
```

## 開發環境設定

### 1. 安裝依賴

```bash
npm install
```

### 2. 開發模式

```bash
# 啟動後端伺服器
npm run dev

# 監控檔案變更並自動建置
npm run build:watch

# 啟動本地伺服器預覽
npm run serve
```

## 開發工作流程

### 1. 修改樣式

編輯 `src/styles/` 目錄下的 CSS 檔案：

- `main.css` - 主要樣式
- `components.css` - 元件樣式

### 2. 修改 JavaScript

編輯 `src/scripts/` 目錄下的 JS 檔案：

- `api.js` - API 相關功能
- `utils.js` - 工具函數
- `tracking.js` - 主要追蹤功能

### 3. 修改頁面

編輯 `src/pages/` 目錄下的 HTML 檔案。

### 4. 建置專案

```bash
npm run build
```

## 程式碼規範

### CSS 規範

- 使用 BEM 命名規範
- 按功能分組樣式
- 使用 CSS 變數管理顏色

### JavaScript 規範

- 使用 ES6+ 語法
- 模組化設計
- 錯誤處理
- 註解說明

### HTML 規範

- 語義化標籤
- 無障礙設計
- 響應式設計

## 測試

### 1. 單元測試

```bash
npm test
```

### 2. 手動測試

1. 啟動開發伺服器
2. 訪問 http://localhost:3001
3. 測試追蹤功能
4. 檢查響應式設計

## 部署

### 1. 建置生產版本

```bash
npm run build
```

### 2. 部署到 Render

1. 推送到 GitHub
2. 在 Render 重新部署

### 3. 更新 WordPress

1. 複製 `dist/wordpress/tracking-system.html` 內容
2. 更新 WordPress HTML 元件

## 故障排除

### 常見問題

1. **建置失敗**

   - 檢查檔案路徑
   - 確認檔案存在

2. **樣式不生效**

   - 檢查 CSS 檔案路徑
   - 清除瀏覽器快取

3. **JavaScript 錯誤**
   - 檢查瀏覽器控制台
   - 確認模組載入順序

### 除錯技巧

1. 使用瀏覽器開發者工具
2. 檢查網路請求
3. 查看伺服器日誌
4. 使用 console.log 除錯

## 貢獻指南

1. Fork 專案
2. 建立功能分支
3. 提交變更
4. 發起 Pull Request

## 版本控制

使用語義化版本控制：

- MAJOR.MINOR.PATCH
- 例如：1.0.0

## 支援

如有問題，請：

1. 檢查文件
2. 搜尋 Issues
3. 建立新的 Issue
