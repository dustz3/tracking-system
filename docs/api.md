# API 文件

## 概述

貨運追蹤系統提供 RESTful API 來查詢貨運狀態。所有 API 端點都通過安全的後端代理來保護 Airtable API Key。

## 基礎 URL

```
https://tracking-system-f6d5.onrender.com
```

## 認證

所有 API 請求都不需要認證，因為 API Key 已經安全地配置在後端。

## 端點

### 1. 搜尋追蹤號碼

**端點:** `GET /api/search-tracking`

**參數:**

- `trackingId` (string, required) - 追蹤號碼

**範例請求:**

```bash
curl "https://tracking-system-f6d5.onrender.com/api/search-tracking?trackingId=AK-24071009"
```

**成功回應:**

```json
{
  "records": [
    {
      "id": "rec123456789",
      "fields": {
        "Tracking ID": "AK-24071009",
        "Status": "已出貨",
        "Customer": "張三",
        "Product": "電子產品",
        "Shipping Date": "2024-01-15"
      }
    }
  ],
  "totalFound": 1
}
```

**錯誤回應:**

```json
{
  "error": "請提供 Tracking ID"
}
```

### 2. 測試 API 連接

**端點:** `GET /api/test-connection`

**範例請求:**

```bash
curl "https://tracking-system-f6d5.onrender.com/api/test-connection"
```

**成功回應:**

```json
{
  "status": "success",
  "message": "API 連接正常",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. 獲取使用統計

**端點:** `GET /api/stats`

**範例請求:**

```bash
curl "https://tracking-system-f6d5.onrender.com/api/stats"
```

**成功回應:**

```json
{
  "totalRequests": 150,
  "cachedRequests": 45,
  "apiRequests": 105,
  "startTime": "2024-01-15T08:00:00Z",
  "cacheSize": 12
}
```

### 4. 清除快取

**端點:** `GET /api/clear-cache`

**範例請求:**

```bash
curl "https://tracking-system-f6d5.onrender.com/api/clear-cache"
```

**成功回應:**

```json
{
  "status": "success",
  "message": "快取已清除",
  "clearedItems": 12
}
```

## 錯誤碼

| 狀態碼 | 說明         |
| ------ | ------------ |
| 200    | 成功         |
| 400    | 請求參數錯誤 |
| 401    | API Key 無效 |
| 404    | 未找到記錄   |
| 500    | 伺服器錯誤   |

## 快取機制

- 快取時間：10 分鐘
- 快取策略：記憶體快取
- 快取鍵：追蹤號碼

## 使用限制

- 免費方案：每月 1,200 次 API 請求
- 建議：使用快取機制減少 API 呼叫
