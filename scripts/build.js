const fs = require('fs');
const path = require('path');
const pug = require('pug');
const stylus = require('stylus');

// 確保 dist 目錄存在
const distDir = path.join(__dirname, '..', 'dist');
const distAssetsDir = path.join(distDir, 'assets');
const distCssDir = path.join(distAssetsDir, 'css');
const distJsDir = path.join(distAssetsDir, 'js');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
if (!fs.existsSync(distAssetsDir)) {
  fs.mkdirSync(distAssetsDir, { recursive: true });
}
if (!fs.existsSync(distCssDir)) {
  fs.mkdirSync(distCssDir, { recursive: true });
}
if (!fs.existsSync(distJsDir)) {
  fs.mkdirSync(distJsDir, { recursive: true });
}

// 編譯 Pug 文件
function compilePug() {
  console.log('🔄 編譯 Pug 文件...');

  const pugDir = path.join(__dirname, '..', 'src', 'pug');
  const pugFiles = fs
    .readdirSync(pugDir)
    .filter((file) => file.endsWith('.pug'));

  pugFiles.forEach((file) => {
    const pugPath = path.join(pugDir, file);
    let htmlPath;

    // 如果是 WordPress 版本，放到 wordpress 目錄
    if (file === 'wordpress.pug') {
      const wordpressDir = path.join(distDir, 'wordpress');
      if (!fs.existsSync(wordpressDir)) {
        fs.mkdirSync(wordpressDir, { recursive: true });
      }
      htmlPath = path.join(wordpressDir, 'tracking-system.html');
    } else {
      htmlPath = path.join(distDir, file.replace('.pug', '.html'));
    }

    try {
      const html = pug.renderFile(pugPath, {
        pretty: true,
      });
      fs.writeFileSync(htmlPath, html);
      console.log(`✅ 編譯完成: ${file} -> ${path.basename(htmlPath)}`);
    } catch (error) {
      console.error(`❌ 編譯失敗: ${file}`, error.message);
    }
  });
}

// 為 WordPress 版本生成內嵌 CSS
function generateWordPressCSS() {
  console.log('🔄 生成 WordPress 內嵌 CSS...');

  // 讀取 WordPress Pug 模板
  const wordpressPugPath = path.join(
    __dirname,
    '..',
    'src',
    'pug',
    'wordpress.pug'
  );

  if (!fs.existsSync(wordpressPugPath)) {
    console.error('❌ WordPress Pug 模板不存在');
    return;
  }

  try {
    const pugContent = fs.readFileSync(wordpressPugPath, 'utf8');

    // 提取 style 標籤中的 CSS
    const styleMatch = pugContent.match(/style\.\s*([\s\S]*?)(?=\s*body|$)/);

    if (styleMatch) {
      const css = styleMatch[1].trim();

      // 直接更新編譯後的 HTML 文件
      const wordpressHTMLPath = path.join(
        distDir,
        'wordpress',
        'tracking-system.html'
      );

      if (fs.existsSync(wordpressHTMLPath)) {
        let html = fs.readFileSync(wordpressHTMLPath, 'utf8');

        // 替換 style 標籤中的內容
        const styleRegex = /<style>[\s\S]*?<\/style>/;
        const newStyle = `<style>\n      ${css}\n    </style>`;

        html = html.replace(styleRegex, newStyle);
        fs.writeFileSync(wordpressHTMLPath, html);

        console.log('✅ WordPress CSS 更新完成');
      }
    } else {
      console.error('❌ 無法找到 style 標籤');
    }
  } catch (error) {
    console.error('❌ 讀取 WordPress Pug 模板失敗:', error.message);
  }
}

// 更新 WordPress HTML 文件中的 CSS
function updateWordPressHTML(css) {
  const wordpressHTMLPath = path.join(
    distDir,
    'wordpress',
    'tracking-system.html'
  );

  if (fs.existsSync(wordpressHTMLPath)) {
    try {
      let html = fs.readFileSync(wordpressHTMLPath, 'utf8');

      // 替換 style 標籤中的內容
      const styleRegex = /<style>[\s\S]*?<\/style>/;
      const newStyle = `<style>\n      ${css}\n    </style>`;

      html = html.replace(styleRegex, newStyle);
      fs.writeFileSync(wordpressHTMLPath, html);

      console.log('✅ WordPress CSS 更新完成');
    } catch (error) {
      console.error('❌ 更新 WordPress HTML 失敗:', error.message);
    }
  }
}

// 編譯 Stylus 文件
function compileStylus() {
  console.log('🔄 編譯 Stylus 文件...');

  const stylusDir = path.join(__dirname, '..', 'src', 'stylus');
  const stylusFiles = fs
    .readdirSync(stylusDir)
    .filter((file) => file.endsWith('.styl'));

  stylusFiles.forEach((file) => {
    const stylusPath = path.join(stylusDir, file);
    const cssPath = path.join(distCssDir, file.replace('.styl', '.css'));

    try {
      const stylusCode = fs.readFileSync(stylusPath, 'utf8');
      stylus(stylusCode).render((err, css) => {
        if (err) {
          console.error(`❌ 編譯失敗: ${file}`, err.message);
        } else {
          fs.writeFileSync(cssPath, css);
          console.log(`✅ 編譯完成: ${file} -> ${path.basename(cssPath)}`);
        }
      });
    } catch (error) {
      console.error(`❌ 讀取失敗: ${file}`, error.message);
    }
  });
}

// 複製 JavaScript 文件
function copyJavaScript() {
  console.log('🔄 複製 JavaScript 文件...');

  const jsDir = path.join(__dirname, '..', 'src', 'js');
  const jsFiles = fs.readdirSync(jsDir).filter((file) => file.endsWith('.js'));

  jsFiles.forEach((file) => {
    const srcPath = path.join(jsDir, file);
    const destPath = path.join(distJsDir, file);

    try {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ 複製完成: ${file}`);
    } catch (error) {
      console.error(`❌ 複製失敗: ${file}`, error.message);
    }
  });
}

// 複製服務器文件
function copyServerFiles() {
  console.log('🔄 複製服務器文件...');

  const serverFiles = ['package.json'];

  serverFiles.forEach((file) => {
    const srcPath = path.join(__dirname, '..', file);
    const destPath = path.join(distDir, file);

    if (fs.existsSync(srcPath)) {
      try {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ 複製完成: ${file}`);
      } catch (error) {
        console.error(`❌ 複製失敗: ${file}`, error.message);
      }
    }
  });

  // 複製 server.js 從 server 目錄
  const serverJsSrc = path.join(__dirname, '..', 'server', 'server.js');
  const serverJsDest = path.join(distDir, 'server.js');

  if (fs.existsSync(serverJsSrc)) {
    try {
      fs.copyFileSync(serverJsSrc, serverJsDest);
      console.log(`✅ 複製完成: server.js`);
    } catch (error) {
      console.error(`❌ 複製失敗: server.js`, error.message);
    }
  }
}

// 主編譯函數
function build() {
  console.log('🚀 開始編譯專案...');

  try {
    compilePug();
    compileStylus();
    copyJavaScript();
    copyServerFiles();

    console.log('✅ 編譯完成！');
    console.log(`📁 輸出目錄: ${distDir}`);
  } catch (error) {
    console.error('❌ 編譯失敗:', error.message);
    process.exit(1);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  build();
}

module.exports = { build };
