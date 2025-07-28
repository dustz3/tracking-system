const fs = require('fs');
const path = require('path');

// 讀取 WordPress HTML 文件
function generateWordPressCode() {
  console.log('🔄 生成 WordPress HTML 代碼...');

  const wordpressFile = path.join(
    __dirname,
    '..',
    'dist',
    'wordpress',
    'tracking-system.html'
  );

  if (!fs.existsSync(wordpressFile)) {
    console.error('❌ WordPress HTML 文件不存在，請先運行 npm run build');
    return;
  }

  const html = fs.readFileSync(wordpressFile, 'utf8');

  // 提取完整的 HTML 內容（包括 head 和 body）
  const fullHTMLMatch = html.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);

  if (!fullHTMLMatch) {
    console.error('❌ 無法找到完整的 HTML 內容');
    return;
  }

  const fullHTMLContent = fullHTMLMatch[0];

  // 創建部署文件
  const deployFile = path.join(
    __dirname,
    '..',
    'dist',
    'wordpress',
    'deploy-code.html'
  );
  fs.writeFileSync(deployFile, fullHTMLContent);

  console.log('✅ WordPress 部署代碼已生成');
  console.log(`📁 文件位置: ${deployFile}`);
  console.log('');
  console.log('📋 部署步驟:');
  console.log('1. 打開 WordPress 管理後台');
  console.log('2. 創建新頁面或編輯現有頁面');
  console.log('3. 添加 "Custom HTML" 元件');
  console.log('4. 複製 deploy-code.html 中的內容');
  console.log('5. 貼到 HTML 元件中');
  console.log('6. 發布頁面');
  console.log('');
  console.log('🎯 測試追蹤號碼: TM-24070101');
}

// 如果直接執行此腳本
if (require.main === module) {
  generateWordPressCode();
}

module.exports = { generateWordPressCode };
