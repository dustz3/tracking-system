# WordPress 部署指南

## 📋 概述

這個指南將幫助您將貨運追蹤系統部署到 Bluehost 的 WordPress 網站上，使用 HTML 元件。

## 🎯 部署步驟

### 1. 準備文件

編譯完成後，您會在 `dist/wordpress/` 目錄中找到以下文件：

- `tracking-system.html` - 完整的貨運追蹤系統

### 2. 在 WordPress 中創建 HTML 元件

1. **登入 WordPress 管理後台**
2. **進入頁面編輯器**
3. **添加 HTML 元件**
   - 在頁面編輯器中，點擊 "+" 按鈕
   - 搜尋 "HTML" 或 "Custom HTML"
   - 選擇 "Custom HTML" 元件

### 3. 複製 HTML 代碼

1. **打開 `dist/wordpress/tracking-system.html` 文件**
2. **複製 `<body>` 標籤內的所有內容**
3. **貼到 WordPress HTML 元件中**

### 4. 配置 API 端點

確保 HTML 中的 API 配置指向正確的遠程服務器：

```javascript
const API_CONFIG = {
  BASE_URL: 'https://tracking-system-f6d5.onrender.com',
  ENDPOINTS: {
    SEARCH: '/api/search-tracking',
    TEST: '/api/test-connection',
    STATS: '/api/stats',
    CLEAR_CACHE: '/api/clear-cache',
  },
};
```

## 🔧 自定義配置

### 修改樣式

如果您想要修改外觀，可以編輯 `src/pug/wordpress.pug` 文件中的 `<style>` 部分，然後重新編譯：

```bash
npm run build
```

### 修改 API 端點

如果需要使用不同的 API 端點，請修改 `src/pug/wordpress.pug` 文件中的 `API_CONFIG` 部分。

## 📱 響應式設計

生成的 HTML 已經包含響應式設計，會在以下設備上正常顯示：

- 桌面電腦
- 平板電腦
- 手機

## 🎨 特色功能

- ✅ 完全自包含（無需外部依賴）
- ✅ 內嵌所有 CSS 和 JavaScript
- ✅ 響應式設計
- ✅ 美觀的深色主題
- ✅ 完整的錯誤處理
- ✅ 載入動畫
- ✅ 圖片模態框

## 🚀 測試

部署完成後，您可以測試以下功能：

1. **基本查詢** - 輸入追蹤號碼 "TM-24070101"
2. **錯誤處理** - 輸入無效的追蹤號碼
3. **響應式測試** - 在不同設備上查看

## 🔍 故障排除

### 常見問題

1. **樣式不顯示**

   - 確保 HTML 代碼完整複製
   - 檢查 WordPress 是否允許自定義 CSS

2. **API 錯誤**

   - 確認 API 端點是否正確
   - 檢查網絡連接

3. **功能不正常**
   - 檢查瀏覽器控制台是否有錯誤
   - 確認 JavaScript 代碼完整

### 獲取幫助

如果遇到問題，請檢查：

- 瀏覽器開發者工具的控制台
- 網絡請求是否成功
- WordPress 的錯誤日誌

## 📄 文件結構

```
dist/wordpress/
└── tracking-system.html    # WordPress HTML 元件文件
```

## 🎉 完成

部署完成後，您的 WordPress 網站將擁有一個功能完整的貨運追蹤查詢系統！
