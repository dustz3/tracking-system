const fs = require('fs');
const path = require('path');

// 監控配置
const MONITORING_CONFIG = {
  // 健康檢查間隔 (毫秒) - 改為5小時以大幅減少頻率
  healthCheckInterval: 5 * 60 * 60 * 1000, // 5小時

  // 報告生成間隔
  dailyReportTime: '08:00', // 每天早上8點
  eveningReportTime: '17:00', // 每天下午5點

  // 警報閾值
  alertThresholds: {
    errorRate: 0.05, // 5% 錯誤率
    responseTime: 2000, // 2秒響應時間
    memoryUsage: 0.8, // 80% 記憶體使用率
    cpuUsage: 0.7, // 70% CPU 使用率
  },

  // 報告儲存路徑
  reportPath: './logs/reports',

  // 記憶體管理配置
  memoryManagement: {
    maxAlerts: 50, // 最多保留50個警報
    maxReports: 10, // 最多保留10個報告
    maxRecentErrors: 20, // 最多保留20個最近錯誤
    cleanupInterval: 2 * 60 * 60 * 1000, // 2小時清理一次
  },
};

// 監控資料結構
class MonitoringSystem {
  constructor() {
    this.metrics = {
      startTime: new Date(),
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        cached: 0,
      },
      performance: {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity,
      },
      system: {
        memoryUsage: 0,
        cpuUsage: 0,
        uptime: 0,
      },
      security: {
        blockedIPs: 0,
        suspiciousRequests: 0,
        rateLimitViolations: 0,
      },
      errors: {
        total: 0,
        byType: {},
        recent: [],
      },
    };

    this.alerts = [];
    this.reports = [];
    this.lastReportCheck = new Date();

    // 確保報告目錄存在
    this.ensureReportDirectory();

    // 啟動監控
    this.startMonitoring();
  }

  // 確保報告目錄存在
  ensureReportDirectory() {
    if (!fs.existsSync(MONITORING_CONFIG.reportPath)) {
      fs.mkdirSync(MONITORING_CONFIG.reportPath, { recursive: true });
    }
  }

  // 記憶體清理機制
  cleanupMemory() {
    // 限制警報數量
    if (this.alerts.length > MONITORING_CONFIG.memoryManagement.maxAlerts) {
      this.alerts = this.alerts.slice(
        -MONITORING_CONFIG.memoryManagement.maxAlerts
      );
    }

    // 限制報告數量
    if (this.reports.length > MONITORING_CONFIG.memoryManagement.maxReports) {
      this.reports = this.reports.slice(
        -MONITORING_CONFIG.memoryManagement.maxReports
      );
    }

    // 限制最近錯誤數量
    if (
      this.metrics.errors.recent.length >
      MONITORING_CONFIG.memoryManagement.maxRecentErrors
    ) {
      this.metrics.errors.recent = this.metrics.errors.recent.slice(
        -MONITORING_CONFIG.memoryManagement.maxRecentErrors
      );
    }

    // 強制垃圾回收（如果可用）
    if (global.gc) {
      global.gc();
    }

    console.log('🧹 記憶體清理完成');
  }

  // 記錄請求
  recordRequest(success, responseTime, cached = false) {
    this.metrics.requests.total++;

    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    if (cached) {
      this.metrics.requests.cached++;
    }

    // 更新效能指標
    this.updatePerformanceMetrics(responseTime);

    // 檢查是否需要警報
    this.checkAlerts();
  }

  // 更新效能指標
  updatePerformanceMetrics(responseTime) {
    const perf = this.metrics.performance;
    perf.avgResponseTime = (perf.avgResponseTime + responseTime) / 2;
    perf.maxResponseTime = Math.max(perf.maxResponseTime, responseTime);
    perf.minResponseTime = Math.min(perf.minResponseTime, responseTime);
  }

  // 記錄錯誤
  recordError(error, type = 'unknown') {
    this.metrics.errors.total++;

    if (!this.metrics.errors.byType[type]) {
      this.metrics.errors.byType[type] = 0;
    }
    this.metrics.errors.byType[type]++;

    // 添加最近錯誤（限制數量）
    this.metrics.errors.recent.push({
      timestamp: new Date().toISOString(),
      type: type,
      message: error.message || error.toString(),
    });

    // 限制最近錯誤數量
    if (
      this.metrics.errors.recent.length >
      MONITORING_CONFIG.memoryManagement.maxRecentErrors
    ) {
      this.metrics.errors.recent = this.metrics.errors.recent.slice(
        -MONITORING_CONFIG.memoryManagement.maxRecentErrors
      );
    }
  }

  // 更新系統指標
  updateSystemMetrics() {
    const usage = process.memoryUsage();
    this.metrics.system.memoryUsage = usage.heapUsed / usage.heapTotal;
    this.metrics.system.uptime = process.uptime();

    // 簡化的 CPU 使用率計算
    const startUsage = process.cpuUsage();
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage);
      const totalUsage = endUsage.user + endUsage.system;
      this.metrics.system.cpuUsage = totalUsage / 1000000; // 轉換為秒
    }, 100);
  }

  // 更新安全指標
  updateSecurityMetrics(blockedIPs, suspiciousRequests, rateLimitViolations) {
    this.metrics.security.blockedIPs = blockedIPs;
    this.metrics.security.suspiciousRequests = suspiciousRequests;
    this.metrics.security.rateLimitViolations = rateLimitViolations;
  }

  // 檢查警報
  checkAlerts() {
    const alerts = [];
    const now = new Date();

    // 檢查記憶體使用率
    if (
      this.metrics.system.memoryUsage >
      MONITORING_CONFIG.alertThresholds.memoryUsage
    ) {
      alerts.push({
        type: 'memory_high',
        message: `記憶體使用率過高: ${(
          this.metrics.system.memoryUsage * 100
        ).toFixed(1)}%`,
        timestamp: now.toISOString(),
        severity: 'warning',
      });
    }

    // 檢查錯誤率
    if (this.metrics.requests.total > 0) {
      const errorRate =
        this.metrics.requests.failed / this.metrics.requests.total;
      if (errorRate > MONITORING_CONFIG.alertThresholds.errorRate) {
        alerts.push({
          type: 'error_rate_high',
          message: `錯誤率過高: ${(errorRate * 100).toFixed(1)}%`,
          timestamp: now.toISOString(),
          severity: 'error',
        });
      }
    }

    // 檢查響應時間
    if (
      this.metrics.performance.avgResponseTime >
      MONITORING_CONFIG.alertThresholds.responseTime
    ) {
      alerts.push({
        type: 'response_time_slow',
        message: `平均響應時間過慢: ${this.metrics.performance.avgResponseTime.toFixed(
          0
        )}ms`,
        timestamp: now.toISOString(),
        severity: 'warning',
      });
    }

    // 添加新警報
    this.alerts.push(...alerts);

    // 限制警報數量
    if (this.alerts.length > MONITORING_CONFIG.memoryManagement.maxAlerts) {
      this.alerts = this.alerts.slice(
        -MONITORING_CONFIG.memoryManagement.maxAlerts
      );
    }

    // 記錄警報
    alerts.forEach((alert) => {
      console.log(`🚨 ${alert.severity.toUpperCase()}: ${alert.message}`);
    });
  }

  // 生成日報
  generateDailyReport() {
    this.updateSystemMetrics();

    const report = {
      timestamp: new Date().toISOString(),
      period: 'daily',
      summary: {
        uptime: this.formatUptime(this.metrics.system.uptime),
        totalRequests: this.metrics.requests.total,
        successRate:
          this.metrics.requests.total > 0
            ? (
                (this.metrics.requests.successful /
                  this.metrics.requests.total) *
                100
              ).toFixed(1) + '%'
            : '0%',
        avgResponseTime:
          this.metrics.performance.avgResponseTime.toFixed(0) + 'ms',
        memoryUsage: (this.metrics.system.memoryUsage * 100).toFixed(1) + '%',
      },
      requests: {
        total: this.metrics.requests.total,
        successful: this.metrics.requests.successful,
        failed: this.metrics.requests.failed,
        cached: this.metrics.requests.cached,
        cacheHitRate:
          this.metrics.requests.total > 0
            ? (
                (this.metrics.requests.cached / this.metrics.requests.total) *
                100
              ).toFixed(1) + '%'
            : '0%',
      },
      performance: {
        avgResponseTime: this.metrics.performance.avgResponseTime,
        maxResponseTime: this.metrics.performance.maxResponseTime,
        minResponseTime: this.metrics.performance.minResponseTime,
      },
      security: {
        blockedIPs: this.metrics.security.blockedIPs,
        suspiciousRequests: this.metrics.security.suspiciousRequests,
        rateLimitViolations: this.metrics.security.rateLimitViolations,
      },
      errors: {
        total: this.metrics.errors.total,
        byType: this.metrics.errors.byType,
        recent: this.metrics.errors.recent.slice(-5), // 最近5個錯誤
      },
      alerts: this.alerts.slice(-10), // 最近10個警報
    };

    // 儲存報告
    const filename = `daily_report_${
      new Date().toISOString().split('T')[0]
    }.json`;
    const filepath = path.join(MONITORING_CONFIG.reportPath, filename);

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

    // 記錄報告（限制數量）
    this.reports.push(report);
    if (this.reports.length > MONITORING_CONFIG.memoryManagement.maxReports) {
      this.reports = this.reports.slice(
        -MONITORING_CONFIG.memoryManagement.maxReports
      );
    }

    console.log(`📊 日報已生成: ${filepath}`);

    return report;
  }

  // 格式化運行時間
  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小時 ${minutes}分鐘`;
  }

  // 獲取系統狀態
  getSystemStatus() {
    this.updateSystemMetrics();

    return {
      status: 'healthy',
      uptime: this.formatUptime(this.metrics.system.uptime),
      memoryUsage: (this.metrics.system.memoryUsage * 100).toFixed(1) + '%',
      requests: this.metrics.requests,
      performance: this.metrics.performance,
      security: this.metrics.security,
      recentErrors: this.metrics.errors.recent.slice(-3),
      recentAlerts: this.alerts.slice(-3),
    };
  }

  // 啟動監控
  startMonitoring() {
    // 定期健康檢查（使用 setInterval 替代 setTimeout）
    setInterval(() => {
      this.updateSystemMetrics();
      this.checkAlerts();
    }, MONITORING_CONFIG.healthCheckInterval);

    // 定期記憶體清理
    setInterval(() => {
      this.cleanupMemory();
    }, MONITORING_CONFIG.memoryManagement.cleanupInterval);

    // 定期檢查報告生成（每小時檢查一次）
    setInterval(() => {
      this.checkAndGenerateReports();
    }, 60 * 60 * 1000); // 每小時

    console.log('📊 監控系統已啟動（優化版）');
  }

  // 檢查並生成報告
  checkAndGenerateReports() {
    const now = new Date();
    const currentTime =
      now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');

    // 避免重複生成報告
    const timeSinceLastCheck = now - this.lastReportCheck;
    if (timeSinceLastCheck < 60 * 60 * 1000) {
      // 至少間隔1小時
      return;
    }

    // 檢查是否到了報告時間
    if (
      currentTime === MONITORING_CONFIG.dailyReportTime ||
      currentTime === MONITORING_CONFIG.eveningReportTime
    ) {
      this.generateDailyReport();
      this.lastReportCheck = now;
    }
  }
}

// 創建監控實例
const monitoring = new MonitoringSystem();

module.exports = monitoring;
