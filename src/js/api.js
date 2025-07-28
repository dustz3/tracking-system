// API 相關功能

// API 端點配置
const API_CONFIG = {
  BASE_URL: 'http://localhost:3001',
  ENDPOINTS: {
    SEARCH: '/api/search-tracking',
    TEST: '/api/test-connection',
    STATS: '/api/stats',
    CLEAR_CACHE: '/api/clear-cache',
  },
};

// 搜尋追蹤號碼
async function searchTracking(trackingId) {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${
        API_CONFIG.ENDPOINTS.SEARCH
      }?trackingId=${encodeURIComponent(trackingId)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('搜尋失敗:', error);
    throw error;
  }
}

// 測試 API 連接
async function testConnection() {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEST}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('連接測試失敗:', error);
    throw error;
  }
}

// 獲取使用統計
async function getStats() {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STATS}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('獲取統計失敗:', error);
    throw error;
  }
}

// 清除快取
async function clearCache() {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLEAR_CACHE}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('清除快取失敗:', error);
    throw error;
  }
}

// 匯出 API 功能
window.TrackingAPI = {
  searchTracking,
  testConnection,
  getStats,
  clearCache,
};
