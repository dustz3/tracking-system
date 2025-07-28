# 貨運追蹤查詢系統

一個安全的貨運追蹤查詢系統，使用 Node.js 後端代理 Airtable API，保護 API Key 安全。

## 功能特色

- 🔒 **安全**：API Key 隱藏在後端，前端無法看到
- ⚡ **快速**：10 分鐘快取機制，減少 API 請求
- 📊 **監控**：內建使用統計和快取管理
- 🎨 **美觀**：現代化響應式設計

## 技術架構

- **後端**：Node.js + Express
- **資料庫**：Airtable
- **快取**：記憶體快取（10 分鐘）
- **部署**：Render Web Service

## API 端點

- `GET /api/search-tracking?trackingId=XXX` - 搜尋貨運記錄
- `GET /api/test-connection` - 測試 API 連接
- `GET /api/stats` - 查看使用統計
- `GET /api/clear-cache` - 清除快取

## 環境變數

- `AIRTABLE_API_KEY` - Airtable API Key
- `AIRTABLE_BASE_ID` - Airtable Base ID
- `AIRTABLE_TABLE_NAME` - Airtable Table 名稱

## 本地開發

```bash
npm install
node server.js
```

訪問：http://localhost:3001

## 部署到 Render

1. 上傳到 GitHub
2. 在 Render 建立 Web Service
3. 設定環境變數
4. 部署完成

## 授權

MIT License
