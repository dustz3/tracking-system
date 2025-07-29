const fs = require('fs');
const path = require('path');

// 監控配置
const MONITORING_CONFIG = {
  // 健康檢查間隔 (毫秒)
  healthCheckInterval: 5 * 60 * 1000, // 5分鐘

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

    // 保留最近10個錯誤
    this.metrics.errors.recent.push({
      timestamp: new Date(),
      error: error.message || error,
      type: type,
    });

    if (this.metrics.errors.recent.length > 10) {
      this.metrics.errors.recent.shift();
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
      this.metrics.system.cpuUsage =
        (endUsage.user + endUsage.system) / 1000000;
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
    const errorRate =
      this.metrics.requests.total > 0
        ? this.metrics.requests.failed / this.metrics.requests.total
        : 0;

    const alerts = [];

    // 檢查錯誤率
    if (errorRate > MONITORING_CONFIG.alertThresholds.errorRate) {
      alerts.push({
        type: 'ERROR_RATE_HIGH',
        message: `錯誤率過高: ${(errorRate * 100).toFixed(2)}%`,
        severity: 'HIGH',
        timestamp: new Date(),
      });
    }

    // 檢查響應時間
    if (
      this.metrics.performance.avgResponseTime >
      MONITORING_CONFIG.alertThresholds.responseTime
    ) {
      alerts.push({
        type: 'RESPONSE_TIME_SLOW',
        message: `平均響應時間過慢: ${this.metrics.performance.avgResponseTime.toFixed(
          0
        )}ms`,
        severity: 'MEDIUM',
        timestamp: new Date(),
      });
    }

    // 檢查記憶體使用率
    if (
      this.metrics.system.memoryUsage >
      MONITORING_CONFIG.alertThresholds.memoryUsage
    ) {
      alerts.push({
        type: 'MEMORY_USAGE_HIGH',
        message: `記憶體使用率過高: ${(
          this.metrics.system.memoryUsage * 100
        ).toFixed(1)}%`,
        severity: 'HIGH',
        timestamp: new Date(),
      });
    }

    // 記錄新警報
    alerts.forEach((alert) => {
      this.alerts.push(alert);
      console.log(`🚨 警報: ${alert.message}`);
    });
  }

  // 生成日報
  generateDailyReport() {
    const report = {
      timestamp: new Date(),
      type: 'DAILY_REPORT',
      summary: {
        uptime: this.formatUptime(this.metrics.system.uptime),
        totalRequests: this.metrics.requests.total,
        successRate:
          this.metrics.requests.total > 0
            ? (
                (this.metrics.requests.successful /
                  this.metrics.requests.total) *
                100
              ).toFixed(2) + '%'
            : '0%',
        avgResponseTime:
          this.metrics.performance.avgResponseTime.toFixed(0) + 'ms',
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

    // 記錄報告
    this.reports.push(report);

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
    // 定期健康檢查
    setInterval(() => {
      this.updateSystemMetrics();
      this.checkAlerts();
    }, MONITORING_CONFIG.healthCheckInterval);

    // 定期生成報告
    this.scheduleReports();

    console.log('📊 監控系統已啟動');
  }

  // 排程報告生成
  scheduleReports() {
    const now = new Date();
    const currentTime =
      now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');

    // 檢查是否到了報告時間
    if (currentTime === MONITORING_CONFIG.dailyReportTime) {
      this.generateDailyReport();
    }

    // 每分鐘檢查一次
    setTimeout(() => this.scheduleReports(), 60 * 1000);
  }
}

// 創建監控實例
const monitoring = new MonitoringSystem();

module.exports = monitoring;
