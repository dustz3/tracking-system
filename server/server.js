const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 引入監控系統
const monitoring = require('./monitoring');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== 防護機制 =====
// IP 請求追蹤
const ipRequests = new Map();
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1分鐘
  maxRequests: 30, // 每分鐘最多30次請求
  blockDuration: 10 * 60 * 1000, // 違規後封鎖10分鐘
};

// 可疑 IP 黑名單
const blockedIPs = new Set();

// 請求頻率檢查中間件
function rateLimitMiddleware(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress;

  // 檢查是否在黑名單中
  if (blockedIPs.has(clientIP)) {
    console.log(`🚫 封鎖的 IP 嘗試存取: ${clientIP}`);
    return res.status(403).json({
      error: 'Access denied',
      message: 'Your IP has been blocked due to suspicious activity',
    });
  }

  const now = Date.now();
  const windowStart = now - RATE_LIMIT.windowMs;

  // 清理過期的請求記錄
  if (!ipRequests.has(clientIP)) {
    ipRequests.set(clientIP, []);
  }

  const requests = ipRequests.get(clientIP);
  const validRequests = requests.filter((time) => time > windowStart);
  ipRequests.set(clientIP, validRequests);

  // 檢查請求頻率
  if (validRequests.length >= RATE_LIMIT.maxRequests) {
    console.log(
      `🚫 IP ${clientIP} 超過請求限制，已封鎖 ${
        RATE_LIMIT.blockDuration / 1000 / 60
      } 分鐘`
    );
    blockedIPs.add(clientIP);

    // 10分鐘後自動解除封鎖
    setTimeout(() => {
      blockedIPs.delete(clientIP);
      console.log(`✅ IP ${clientIP} 已解除封鎖`);
    }, RATE_LIMIT.blockDuration);

    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  }

  // 記錄請求
  validRequests.push(now);
  ipRequests.set(clientIP, validRequests);

  next();
}

// 定期清理過期的 IP 記錄
setInterval(() => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.windowMs;

  for (const [ip, requests] of ipRequests.entries()) {
    const validRequests = requests.filter((time) => time > windowStart);
    if (validRequests.length === 0) {
      ipRequests.delete(ip);
    } else {
      ipRequests.set(ip, validRequests);
    }
  }
}, 5 * 60 * 1000); // 每5分鐘清理一次

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// 請求監控中間件
app.use((req, res, next) => {
  const startTime = Date.now();

  // 原始 send 方法
  const originalSend = res.send;

  // 重寫 send 方法來記錄響應時間
  res.send = function (data) {
    const responseTime = Date.now() - startTime;
    const success = res.statusCode < 400;

    // 記錄到監控系統
    monitoring.recordRequest(success, responseTime);

    // 更新安全指標
    monitoring.updateSecurityMetrics(
      blockedIPs.size,
      ipRequests.size,
      Array.from(ipRequests.values()).filter(
        (requests) => requests.length > RATE_LIMIT.maxRequests
      ).length
    );

    return originalSend.call(this, data);
  };

  next();
});

// 應用 Rate Limiting 到所有 API 端點
app.use('/api', rateLimitMiddleware);

// ===== 原有設定 =====
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
const MAX_CACHE_SIZE = 100; // 最大快取項目數

// 請求統計
let requestStats = {
  totalRequests: 0,
  cachedRequests: 0,
  apiRequests: 0,
  startTime: new Date(),
};

// 快取清理函數
function cleanupCache() {
  const now = Date.now();
  let deletedCount = 0;

  // 清理過期的快取項目
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
      deletedCount++;
    }
  }

  // 如果快取仍然太大，刪除最舊的項目
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toDelete = entries.slice(0, cache.size - MAX_CACHE_SIZE);
    toDelete.forEach(([key]) => {
      cache.delete(key);
      deletedCount++;
    });
  }

  if (deletedCount > 0) {
    console.log(
      `🧹 快取清理完成: 刪除 ${deletedCount} 個項目 (剩餘: ${cache.size})`
    );
  }
}

// 定期清理快取（每30分鐘）
setInterval(cleanupCache, 30 * 60 * 1000);

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

// 搜尋 Tracking ID 的 API 端點
app.get('/api/search-tracking', async (req, res) => {
  try {
    const { trackingId } = req.query;
    const clientIP = req.ip || req.connection.remoteAddress;

    // ===== 輸入驗證和防護 =====
    if (!trackingId) {
      console.log(`❌ 缺少 Tracking ID: ${clientIP}`);
      return res.status(400).json({
        error: '請提供 Tracking ID',
      });
    }

    // 檢查 Tracking ID 格式（防止暴力破解）
    // 支援多種常見格式：
    // - XX-YYYYMMDD (例如: TM-20250729)
    // - XX-YYYYMMDD-XXX (例如: TM-20250729-001)
    // - XX-YYYYMMDDXXX (例如: TM-20250729001)
    // - 純數字格式 (例如: 123456789)
    // - 字母數字混合 (例如: ABC123456)
    const trackingIdPattern = /^[A-Z0-9\-]{3,20}$/;
    if (!trackingIdPattern.test(trackingId)) {
      console.log(
        `⚠️ 可疑的 Tracking ID 格式: ${trackingId} (IP: ${clientIP})`
      );
      return res.status(400).json({
        error: '無效的 Tracking ID 格式',
        message: 'Tracking ID 應為 3-20 個字元的字母、數字或連字號組合',
      });
    }

    // 檢查是否為明顯的測試或攻擊模式
    const suspiciousPatterns = [
      /^test/i, // 測試開頭
      /^admin/i, // 管理員開頭
      /^123+$/, // 純數字重複
      /^abc+$/i, // 純字母重複
      /^[0-9]{1,3}$/, // 太短的純數字
      /^[a-z]{1,3}$/i, // 太短的純字母
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(trackingId)) {
        console.log(
          `🚫 可疑的 Tracking ID 模式: ${trackingId} (IP: ${clientIP})`
        );
        return res.status(400).json({
          error: '無效的 Tracking ID',
          message: 'Tracking ID 格式不符合要求',
        });
      }
    }

    // 檢查 Tracking ID 長度（防止過長輸入）
    if (trackingId.length > 20) {
      console.log(`🚫 過長的 Tracking ID: ${trackingId} (IP: ${clientIP})`);
      return res.status(400).json({
        error: 'Tracking ID 過長',
      });
    }

    // 檢查是否包含可疑字元
    const suspiciousChars = /[<>\"'&]/;
    if (suspiciousChars.test(trackingId)) {
      console.log(
        `🚫 包含可疑字元的 Tracking ID: ${trackingId} (IP: ${clientIP})`
      );
      return res.status(400).json({
        error: 'Tracking ID 包含無效字元',
      });
    }

    requestStats.totalRequests++;

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
      console.log(`❌ API Key 無效 (IP: ${clientIP})`);
      return res.status(401).json({
        error: 'API Key 無效',
      });
    }

    if (response.status === 403) {
      console.log(`❌ 權限不足 (IP: ${clientIP})`);
      return res.status(403).json({
        error: '權限不足',
      });
    }

    if (!response.ok) {
      console.log(`❌ Airtable API 錯誤: ${response.status} (IP: ${clientIP})`);
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
    console.error('❌ 搜尋 Tracking ID 時發生錯誤:', error);
    res.status(500).json({
      error: '伺服器內部錯誤',
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
    // 新增防護狀態
    security: {
      blockedIPs: blockedIPs.size,
      activeIPs: ipRequests.size,
      rateLimit: {
        windowMs: RATE_LIMIT.windowMs / 1000 + '秒',
        maxRequests: RATE_LIMIT.maxRequests + '次',
        blockDuration: RATE_LIMIT.blockDuration / 1000 / 60 + '分鐘',
      },
    },
  });
});

// 新增：防護狀態端點
app.get('/api/security-status', (req, res) => {
  res.json({
    blockedIPs: Array.from(blockedIPs),
    activeIPs: Array.from(ipRequests.keys()),
    rateLimitConfig: RATE_LIMIT,
    recentViolations: Array.from(ipRequests.entries())
      .filter(([ip, requests]) => requests.length > RATE_LIMIT.maxRequests)
      .map(([ip, requests]) => ({
        ip: ip,
        requestCount: requests.length,
        lastRequest: new Date(Math.max(...requests)),
      })),
  });
});

// 新增：系統監控狀態端點
app.get('/api/monitoring/status', (req, res) => {
  res.json(monitoring.getSystemStatus());
});

// 新增：手動生成報告端點
app.get('/api/monitoring/generate-report', (req, res) => {
  try {
    const report = monitoring.generateDailyReport();
    res.json({
      success: true,
      message: '報告已生成',
      report: report,
    });
  } catch (error) {
    monitoring.recordError(error, 'REPORT_GENERATION_ERROR');
    res.status(500).json({
      success: false,
      error: '報告生成失敗',
      message: error.message,
    });
  }
});

// 新增：監控儀表板端點
app.get('/api/monitoring/dashboard', (req, res) => {
  const status = monitoring.getSystemStatus();

  res.json({
    system: {
      status: status.status,
      uptime: status.uptime,
      memoryUsage: status.memoryUsage,
    },
    performance: {
      avgResponseTime: status.performance.avgResponseTime.toFixed(0) + 'ms',
      maxResponseTime: status.performance.maxResponseTime.toFixed(0) + 'ms',
      minResponseTime: status.performance.minResponseTime.toFixed(0) + 'ms',
    },
    requests: {
      total: status.requests.total,
      successRate:
        status.requests.total > 0
          ? (
              (status.requests.successful / status.requests.total) *
              100
            ).toFixed(2) + '%'
          : '0%',
      cacheHitRate:
        status.requests.total > 0
          ? ((status.requests.cached / status.requests.total) * 100).toFixed(
              1
            ) + '%'
          : '0%',
    },
    security: {
      blockedIPs: status.security.blockedIPs,
      suspiciousRequests: status.security.suspiciousRequests,
      rateLimitViolations: status.security.rateLimitViolations,
    },
    alerts: status.recentAlerts,
    errors: status.recentErrors,
  });
});

// 新增：清除快取端點
app.get('/api/clear-cache', (req, res) => {
  const cacheSize = cache.size;
  cache.clear();
  console.log(`🗑️ 快取已清除 (原本大小: ${cacheSize})`);
  res.json({
    success: true,
    message: `快取已清除 (原本大小: ${cacheSize})`,
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
  console.log(`🛡️ 防護機制已啟用:`);
  console.log(
    `   - Rate Limiting: ${RATE_LIMIT.maxRequests}次/${
      RATE_LIMIT.windowMs / 1000
    }秒`
  );
  console.log(
    `   - IP 封鎖: 違規後封鎖 ${RATE_LIMIT.blockDuration / 1000 / 60} 分鐘`
  );
  console.log(`   - 輸入驗證: Tracking ID 格式檢查`);
  console.log(`📊 監控系統已啟用:`);
  console.log(`   - 自動健康檢查: 每5分鐘`);
  console.log(`   - 自動報告生成: 每天早上8點`);
  console.log(`   - 即時警報系統`);
  console.log(`📊 可用的 API 端點:`);
  console.log(`   - GET /api/search-tracking?trackingId=XXX`);
  console.log(`   - GET /api/test-connection`);
  console.log(`   - GET /api/stats (查看使用統計)`);
  console.log(`   - GET /api/security-status (防護狀態)`);
  console.log(`   - GET /api/clear-cache (清除快取)`);
  console.log(`📈 監控 API 端點:`);
  console.log(`   - GET /api/monitoring/status (系統狀態)`);
  console.log(`   - GET /api/monitoring/dashboard (監控儀表板)`);
  console.log(`   - GET /api/monitoring/generate-report (手動生成報告)`);
});

module.exports = app;
