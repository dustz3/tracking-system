# 部署指南

## 概述

本指南說明如何部署貨運追蹤系統到不同的平台。

## 本地開發

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

創建 `.env` 檔案：

```env
AIRTABLE_API_KEY=your_api_key_here
AIRTABLE_BASE_ID=your_base_id_here
AIRTABLE_TABLE_NAME=Shipments
PORT=3001
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

訪問：http://localhost:3001

## Render 部署

### 1. 準備專案

確保專案已經上傳到 GitHub。

### 2. 在 Render 建立服務

1. 登入 Render 控制台
2. 點擊 "New +" → "Web Service"
3. 連接 GitHub 倉庫
4. 設定服務名稱：`tracking-system`

### 3. 配置設定

**Build Command:**

```bash
npm install && npm run build
```

**Start Command:**

```bash
npm start
```

**Environment Variables:**

```
AIRTABLE_API_KEY=your_api_key_here
AIRTABLE_BASE_ID=your_base_id_here
AIRTABLE_TABLE_NAME=Shipments
```

### 4. 部署

點擊 "Create Web Service" 開始部署。

## WordPress 整合

### 1. 建置 WordPress 版本

```bash
npm run build
```

### 2. 複製檔案

將 `dist/wordpress/tracking-system.html` 的內容複製到 WordPress HTML 元件。

### 3. 嵌入到頁面

在 WordPress 頁面編輯器中：

1. 新增 HTML 元件
2. 貼上建置好的 HTML 程式碼
3. 發布頁面

## 域名設定

### 1. 子域名設定

在 DNS 提供商處新增 CNAME 記錄：

```
tracking.yourdomain.com → your-render-app.onrender.com
```

### 2. SSL 憑證

Render 自動提供 SSL 憑證。

## 監控和維護

### 1. 使用統計

訪問 `/api/stats` 端點查看使用統計。

### 2. 快取管理

訪問 `/api/clear-cache` 端點清除快取。

### 3. 日誌監控

在 Render 控制台查看應用程式日誌。

## 故障排除

### 常見問題

1. **API Key 錯誤**

   - 檢查環境變數設定
   - 確認 API Key 權限

2. **部署失敗**

   - 檢查 Build Command
   - 確認 Node.js 版本

3. **快取問題**
   - 清除快取
   - 檢查記憶體使用量

### 支援

如有問題，請檢查：

- Render 應用程式日誌
- API 端點回應
- 環境變數設定
