const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 設定靜態檔案
app.use(
  '/assets',
  express.static(path.join(__dirname, '..', 'dist', 'assets'))
);
app.use(express.json());
app.use(cors());

// 快取機制
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10分鐘快取

// 請求統計
let requestStats = {
  totalRequests: 0,
  cachedRequests: 0,
  apiRequests: 0,
  startTime: new Date(),
};

// API Key 和 Base ID（從環境變數讀取）
const API_KEY =
  process.env.AIRTABLE_API_KEY ||
  'patnJQd1eoNDR8yOF.98fd34bfb806a4dc8dbd68eb3b72598ef7cf5d7531ff2c29c163c304902ebf41';
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appznhirfyiLbdpJJ';
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Shipments';

// 關聯表格配置
const RELATED_TABLES = {
  所屬客戶: 'Customers', // 客戶表格名稱是 'Customers'
  // 可以新增更多關聯表格
  // '其他欄位': 'OtherTable',
};

// 解析關聯欄位的函數
async function resolveRelatedFields(records) {
  const resolvedRecords = [];

  for (const record of records) {
    const resolvedRecord = { ...record };
    const fields = { ...record.fields };

    // 處理每個可能的關聯欄位
    for (const [fieldName, relatedTableName] of Object.entries(
      RELATED_TABLES
    )) {
      console.log(`🔍 檢查關聯欄位: ${fieldName} -> ${relatedTableName}`);

      if (fields[fieldName] && Array.isArray(fields[fieldName])) {
        console.log(`📋 找到關聯記錄: ${fieldName} = ${fields[fieldName]}`);

        try {
          // 取得關聯記錄的詳細資料
          const relatedRecordIds = fields[fieldName];
          const relatedRecords = [];

          for (const recordId of relatedRecordIds) {
            console.log(`🔗 解析記錄 ID: ${recordId}`);

            const relatedResponse = await fetch(
              `https://api.airtable.com/v0/${BASE_ID}/${relatedTableName}/${recordId}`,
              {
                headers: {
                  Authorization: `Bearer ${API_KEY}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (relatedResponse.ok) {
              const relatedData = await relatedResponse.json();
              console.log(`✅ 取得關聯資料:`, relatedData.fields);

              // 使用第一個可用的欄位作為顯示名稱（優先使用中文欄位）
              const displayField =
                relatedData.fields['公司名稱'] ||
                relatedData.fields['客戶名稱'] ||
                relatedData.fields.Name ||
                relatedData.fields.Title ||
                relatedData.fields['名稱'] ||
                '未命名';

              console.log(`🏷️ 顯示名稱: ${displayField}`);

              relatedRecords.push({
                id: recordId,
                name: displayField,
                fields: relatedData.fields,
              });
            } else {
              console.error(
                `❌ 無法取得關聯記錄 ${recordId}: ${relatedResponse.status}`
              );
            }
          }

          // 更新欄位值為解析後的名稱
          if (relatedRecords.length === 1) {
            fields[fieldName] = relatedRecords[0].name;
            console.log(`✅ 更新欄位 ${fieldName}: ${relatedRecords[0].name}`);
          } else if (relatedRecords.length > 1) {
            fields[fieldName] = relatedRecords.map((r) => r.name).join(', ');
            console.log(`✅ 更新欄位 ${fieldName}: ${fields[fieldName]}`);
          }
        } catch (error) {
          console.error(`❌ 解析關聯欄位 ${fieldName} 時發生錯誤:`, error);
          // 如果解析失敗，保持原始值
        }
      } else {
        console.log(`⚠️ 欄位 ${fieldName} 不是陣列或不存在`);
      }
    }

    resolvedRecord.fields = fields;
    resolvedRecords.push(resolvedRecord);
  }

  return resolvedRecords;
}

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// 搜尋 Tracking ID 的 API 端點
app.get('/api/search-tracking', async (req, res) => {
  try {
    const { trackingId } = req.query;
    requestStats.totalRequests++;

    if (!trackingId) {
      return res.status(400).json({
        error: '請提供 Tracking ID',
      });
    }

    // 檢查快取
    if (cache.has(trackingId)) {
      const cached = cache.get(trackingId);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        requestStats.cachedRequests++;
        console.log(`✅ 使用快取: ${trackingId}`);
        return res.json(cached.data);
      } else {
        // 快取過期，移除
        cache.delete(trackingId);
      }
    }

    // 如果沒有快取，呼叫 Airtable API
    requestStats.apiRequests++;
    console.log(
      `🔄 API 請求: ${trackingId} (總計: ${requestStats.apiRequests})`
    );

    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 401) {
      return res.status(401).json({
        error: 'API Key 無效',
      });
    }

    if (response.status === 403) {
      return res.status(403).json({
        error: '權限不足',
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Airtable API 錯誤: ${response.status} ${response.statusText}`,
      });
    }

    const data = await response.json();

    // 解析關聯欄位
    const resolvedData = await resolveRelatedFields(data.records);

    // 在後端篩選 Tracking ID
    const matchingRecords = resolvedData.filter((record) => {
      const fields = record.fields;
      return fields['Tracking ID'] === trackingId;
    });

    const result = {
      success: true,
      records: matchingRecords,
      totalFound: matchingRecords.length,
    };

    // 儲存到快取
    cache.set(trackingId, {
      data: result,
      timestamp: Date.now(),
    });

    console.log(`💾 儲存快取: ${trackingId} (快取大小: ${cache.size})`);

    res.json(result);
  } catch (error) {
    console.error('API 錯誤:', error);
    res.status(500).json({
      error: '伺服器錯誤: ' + error.message,
    });
  }
});

// 測試 API 連接的端點
app.get('/api/test-connection', async (req, res) => {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      res.json({
        success: true,
        message: 'API 連接正常',
      });
    } else {
      res.status(response.status).json({
        error: `連接失敗: ${response.status} ${response.statusText}`,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: '連接錯誤: ' + error.message,
    });
  }
});

// 新增：查看使用統計的端點
app.get('/api/stats', (req, res) => {
  const uptime = Date.now() - requestStats.startTime.getTime();
  const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
  const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

  res.json({
    totalRequests: requestStats.totalRequests,
    cachedRequests: requestStats.cachedRequests,
    apiRequests: requestStats.apiRequests,
    cacheSize: cache.size,
    uptime: `${uptimeHours}小時 ${uptimeMinutes}分鐘`,
    cacheHitRate:
      requestStats.totalRequests > 0
        ? (
            (requestStats.cachedRequests / requestStats.totalRequests) *
            100
          ).toFixed(1) + '%'
        : '0%',
  });
});

// 新增：清除快取的端點
app.get('/api/clear-cache', (req, res) => {
  const cacheSize = cache.size;
  cache.clear();
  res.json({
    message: `快取已清除 (原本有 ${cacheSize} 個項目)`,
    cacheSize: 0,
  });
});

// 首頁路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 追蹤系統伺服器已啟動`);
  console.log(`📍 本地網址: http://localhost:${PORT}`);
  console.log(`🔒 API Key 已安全隱藏在後端`);
  console.log(`💾 快取機制已啟用 (10分鐘)`);
  console.log(`📊 可用的 API 端點:`);
  console.log(`   - GET /api/search-tracking?trackingId=XXX`);
  console.log(`   - GET /api/test-connection`);
  console.log(`   - GET /api/stats (查看使用統計)`);
  console.log(`   - GET /api/clear-cache (清除快取)`);
});

module.exports = app;
