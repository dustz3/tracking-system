// 工具函數

// 顯示訊息
function showMessage(message, type = 'info') {
  const messageDiv = document.getElementById('message');
  if (messageDiv) {
    messageDiv.innerHTML = `<div class="message ${type}">${message}</div>`;
  }
}

// 清除訊息
function clearMessage() {
  const messageDiv = document.getElementById('message');
  if (messageDiv) {
    messageDiv.innerHTML = '';
  }
}

// 處理按鍵事件
function handleKeyPress(event) {
  if (event.key === 'Enter') {
    const searchButton = document.querySelector('.search-button');
    if (searchButton) {
      searchButton.click();
    }
  }
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '無資料';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
}

// 驗證追蹤號碼格式
function validateTrackingId(trackingId) {
  if (!trackingId || trackingId.trim() === '') {
    return { valid: false, message: '請輸入追蹤號碼' };
  }

  if (trackingId.length < 3) {
    return { valid: false, message: '追蹤號碼至少需要 3 個字元' };
  }

  return { valid: true, message: '' };
}

// 顯示載入狀態
function showLoading() {
  const resultsDiv = document.getElementById('results');
  if (resultsDiv) {
    resultsDiv.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                正在查詢中...
            </div>
        `;
  }
}

// 清除結果
function clearResults() {
  const resultsDiv = document.getElementById('results');
  if (resultsDiv) {
    resultsDiv.innerHTML = '';
  }
}

// 本地儲存工具
const Storage = {
  // 儲存資料
  set: function (key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('儲存失敗:', error);
      return false;
    }
  },

  // 讀取資料
  get: function (key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('讀取失敗:', error);
      return null;
    }
  },

  // 移除資料
  remove: function (key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('移除失敗:', error);
      return false;
    }
  },

  // 清除所有資料
  clear: function () {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('清除失敗:', error);
      return false;
    }
  },
};

// 匯出工具函數
window.TrackingUtils = {
  showMessage,
  clearMessage,
  handleKeyPress,
  formatDate,
  validateTrackingId,
  showLoading,
  clearResults,
  Storage,
};
