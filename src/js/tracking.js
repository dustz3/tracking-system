// 主要追蹤功能

// 搜尋追蹤號碼
async function searchTracking() {
  const trackingInput = document.getElementById('trackingInput');
  const trackingId = trackingInput ? trackingInput.value.trim() : '';

  // 驗證輸入
  const validation = TrackingUtils.validateTrackingId(trackingId);
  if (!validation.valid) {
    TrackingUtils.showMessage(validation.message, 'error');
    return;
  }

  // 清除之前的訊息和結果
  TrackingUtils.clearMessage();
  TrackingUtils.clearResults();

  // 顯示載入狀態
  TrackingUtils.showLoading();

  try {
    // 呼叫 API
    const data = await TrackingAPI.searchTracking(trackingId);

    // 顯示結果
    displayShipments(data.records || []);

    if (data.records && data.records.length > 0) {
      TrackingUtils.showMessage(
        `找到 ${data.records.length} 筆記錄`,
        'success'
      );
    } else {
      TrackingUtils.showMessage('未找到相關記錄', 'info');
    }
  } catch (error) {
    console.error('搜尋失敗:', error);

    let errorMessage = '查詢失敗，請稍後再試';
    if (error.message.includes('401')) {
      errorMessage = 'API 認證失敗，請聯繫管理員';
    } else if (error.message.includes('404')) {
      errorMessage = '未找到相關記錄';
    } else if (error.message.includes('500')) {
      errorMessage = '伺服器錯誤，請稍後再試';
    }

    TrackingUtils.showMessage(errorMessage, 'error');
    TrackingUtils.clearResults();
  }
}

// 顯示貨運記錄
function displayShipments(records) {
  const resultsDiv = document.getElementById('results');
  if (!resultsDiv) return;

  if (!records || records.length === 0) {
    resultsDiv.innerHTML = `
            <div class="no-result">
                <p>未找到相關的貨運記錄</p>
                <p>請確認追蹤號碼是否正確</p>
            </div>
        `;
    return;
  }

  let html = '';

  records.forEach((record) => {
    const fields = record.fields;
    html += `<div class="shipment-card">`;

    // 顯示追蹤號碼
    if (fields['Tracking ID']) {
      html += `<div class="tracking-id">Tracking ID: ${fields['Tracking ID']}</div>`;
    }

    // 顯示所有欄位
    html += `<div class="shipment-details">`;
    Object.keys(fields).forEach((key) => {
      const value = fields[key];
      let displayValue = value;

      // 格式化日期
      if (
        key.toLowerCase().includes('date') ||
        key.toLowerCase().includes('time')
      ) {
        displayValue = TrackingUtils.formatDate(value);
      }

      // 處理附件欄位（Airtable 的圖片/檔案）
      if (Array.isArray(value) && value.length > 0 && value[0].type) {
        // 這是 Airtable 的附件欄位
        displayValue = '';
        value.forEach((attachment, index) => {
          if (attachment.type && attachment.type.startsWith('image/')) {
            // 圖片附件
            displayValue += `
              <div class="attachment-item">
                <img src="${attachment.url}" alt="${attachment.name || '附件'}" 
                     class="attachment-image" onclick="openImageModal('${
                       attachment.url
                     }', '${attachment.name || '附件'}')">
              </div>
            `;
          } else if (attachment.url) {
            // 其他類型附件
            displayValue += `
              <div class="attachment-item">
                <a href="${
                  attachment.url
                }" target="_blank" class="attachment-link">
                  📎 ${attachment.name || '附件'}
                </a>
              </div>
            `;
          }
        });

        if (!displayValue) {
          displayValue = '無附件';
        }
      }

      html += `
                <div class="detail-item">
                    <div class="detail-label">${key}</div>
                    <div class="detail-value">${
                      displayValue ? displayValue : '無資料'
                    }</div>
                </div>
            `;
    });
    html += `</div>`;

    // 顯示狀態（如果有）
    if (fields['Status']) {
      const status = fields['Status'].toLowerCase();
      let statusClass = 'status';

      if (status.includes('shipped') || status.includes('已出貨')) {
        statusClass += ' shipped';
      } else if (status.includes('transit') || status.includes('運送中')) {
        statusClass += ' in-transit';
      } else if (status.includes('delivered') || status.includes('已送達')) {
        statusClass += ' delivered';
      } else {
        statusClass += ' error';
      }

      html += `<div class="${statusClass}">${fields['Status']}</div>`;
    }

    html += `</div>`;
  });

  resultsDiv.innerHTML = html;
}

// 頁面載入時的初始化
function initializeTrackingPage() {
  // 綁定搜尋按鈕事件
  const searchButton = document.querySelector('.search-button');
  if (searchButton) {
    searchButton.addEventListener('click', searchTracking);
  }

  // 綁定輸入框事件
  const trackingInput = document.getElementById('trackingInput');
  if (trackingInput) {
    trackingInput.addEventListener('keypress', TrackingUtils.handleKeyPress);
    trackingInput.focus();
  }

  // 顯示歡迎訊息
  TrackingUtils.showMessage('歡迎使用貨運追蹤查詢系統', 'info');
}

// 開啟圖片模態框
function openImageModal(imageUrl, imageName) {
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeImageModal()"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h3>${imageName}</h3>
        <button class="modal-close" onclick="closeImageModal()">&times;</button>
      </div>
      <div class="modal-body">
        <img src="${imageUrl}" alt="${imageName}" class="modal-image">
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

// 關閉圖片模態框
function closeImageModal() {
  const modal = document.querySelector('.image-modal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = 'auto';
  }
}

// 清除所有內容
function clearAll() {
  const trackingInput = document.getElementById('trackingInput');
  if (trackingInput) {
    trackingInput.value = '';
  }

  TrackingUtils.clearMessage();
  TrackingUtils.clearResults();

  // 顯示清除訊息
  TrackingUtils.showMessage('已清除所有內容', 'info');
}

// 匯出主要功能
window.TrackingSystem = {
  searchTracking,
  displayShipments,
  initializeTrackingPage,
  openImageModal,
  closeImageModal,
};

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function () {
  initializeTrackingPage();
});
