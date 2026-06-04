// 字幕搜索与翻译 Worker
// 部署到 Cloudflare Worker

// ============ 配置 ============
const BASE_URL = "https://www.subtitlecat.com";
const GTX_URL = "https://translate.googleapis.com/translate_a/single";

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// 语言映射
const LANG_MAP = {
    "en": "English", "zh-CN": "简体中文", "zh-TW": "繁体中文",
    "ja": "Japanese", "ko": "Korean", "th": "Thai",
    "vi": "Vietnamese", "fr": "French", "de": "German",
    "es": "Spanish", "ru": "Russian", "ar": "Arabic",
    "pt": "Portuguese", "it": "Italian", "nl": "Dutch"
};

// ============ HTML UI ============
const HTML_UI = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>字幕搜索工具</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #0f0f1a;
            color: #e4e4e7;
            line-height: 1.5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 16px 24px;
        }
        header {
            text-align: center;
            padding: 24px 0 16px;
            border-bottom: 1px solid #2a2a3a;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 1.75rem;
            font-weight: 600;
            background: linear-gradient(135deg, #60a5fa, #a78bfa);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            margin-bottom: 6px;
        }
        .subtitle {
            color: #71717a;
            font-size: 0.8rem;
        }
        .search-section {
            background: #1a1a2a;
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 20px;
            border: 1px solid #2a2a3a;
        }
        .search-box {
            display: flex;
            gap: 10px;
        }
        .search-input {
            flex: 1;
            padding: 10px 14px;
            font-size: 0.95rem;
            border: 1px solid #2a2a3a;
            border-radius: 8px;
            background: #0f0f1a;
            color: #e4e4e7;
            outline: none;
            transition: all 0.2s;
        }
        .search-input:focus {
            border-color: #60a5fa;
            box-shadow: 0 0 0 2px rgba(96,165,250,0.2);
        }
        .search-input::placeholder {
            color: #52525b;
        }
        .search-btn {
            padding: 10px 24px;
            font-size: 0.875rem;
            font-weight: 500;
            border: none;
            border-radius: 8px;
            background: linear-gradient(135deg, #60a5fa, #a78bfa);
            color: white;
            cursor: pointer;
            transition: opacity 0.2s;
            white-space: nowrap;
        }
        .search-btn:hover {
            opacity: 0.9;
        }
        .search-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .help-btn {
            padding: 10px 16px;
            font-size: 0.8rem;
            font-weight: 500;
            border: 1px solid #60a5fa;
            border-radius: 8px;
            background: transparent;
            color: #93c5fd;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
        }
        .help-btn:hover {
            background: rgba(96,165,250,0.15);
            color: #e4e4e7;
        }
        /* ====== 双栏布局 ====== */
        .main-content {
            display: flex;
            gap: 20px;
            align-items: flex-start;
        }
        .results-column {
            flex: 0 0 420px;
            min-width: 0;
            max-height: calc(100vh - 200px);
            overflow-y: auto;
            padding-right: 4px;
            /* 滚动条样式 */
            scrollbar-width: thin;
            scrollbar-color: #2a2a3a transparent;
        }
        .results-column::-webkit-scrollbar {
            width: 4px;
        }
        .results-column::-webkit-scrollbar-track {
            background: transparent;
        }
        .results-column::-webkit-scrollbar-thumb {
            background: #2a2a3a;
            border-radius: 2px;
        }
        .detail-column {
            flex: 1;
            min-width: 0;
            position: sticky;
            top: 16px;
            max-height: calc(100vh - 200px);
            overflow-y: auto;
        }
        .loading {
            text-align: center;
            padding: 48px;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 2px solid #2a2a3a;
            border-top-color: #60a5fa;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .stats {
            font-size: 0.8rem;
            color: #71717a;
            margin-bottom: 16px;
        }
        .results-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .result-item {
            background: #1a1a2a;
            border-radius: 12px;
            border: 1px solid #2a2a3a;
            overflow: hidden;
            transition: border-color 0.2s;
            cursor: pointer;
        }
        .result-item:hover {
            border-color: #60a5fa;
        }
        .result-item.active {
            border-color: #60a5fa;
            background: #1f1f32;
        }
        .result-header {
            padding: 16px 20px;
        }
        .result-title {
            font-size: 1rem;
            font-weight: 500;
            color: #e4e4e7;
            margin-bottom: 8px;
            word-break: break-all;
        }
        .result-meta {
            display: flex;
            gap: 16px;
            font-size: 0.75rem;
            color: #71717a;
        }
        .result-meta span {
            background: #2a2a3a;
            padding: 2px 8px;
            border-radius: 20px;
        }
        .translated-badge {
            background: #3b3b5a !important;
            color: #a78bfa !important;
        }
        .detail-panel {
            background: #1a1a2a;
            border-radius: 12px;
            border: 1px solid #2a2a3a;
            overflow: hidden;
        }
        .detail-header {
            padding: 20px 24px;
            background: #1f1f32;
            border-bottom: 1px solid #2a2a3a;
        }
        .detail-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #60a5fa;
            margin-bottom: 8px;
        }
        .detail-id {
            font-size: 0.8rem;
            color: #71717a;
            font-family: monospace;
        }
        .detail-content {
            padding: 20px 24px;
        }
        .section-title {
            font-size: 0.875rem;
            font-weight: 500;
            color: #a1a1aa;
            margin-bottom: 12px;
            letter-spacing: 0.5px;
        }
        .lang-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 24px;
        }
        .lang-btn {
            padding: 8px 16px;
            font-size: 0.8rem;
            border: 1px solid #2a2a3a;
            border-radius: 20px;
            background: #0f0f1a;
            color: #e4e4e7;
            cursor: pointer;
            transition: all 0.2s;
        }
        .lang-btn.download {
            border-color: #10b981;
            color: #34d399;
        }
        .lang-btn.download:hover {
            background: rgba(16,185,129,0.15);
            border-color: #10b981;
        }
        .lang-btn.translate {
            border-color: #60a5fa;
            color: #93c5fd;
        }
        .lang-btn.translate:hover {
            background: rgba(96,165,250,0.15);
            border-color: #60a5fa;
        }
        .lang-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .preview-box {
            background: #0f0f1a;
            border-radius: 10px;
            padding: 16px;
            max-height: 300px;
            overflow-y: auto;
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 0.75rem;
            border: 1px solid #2a2a3a;
        }
        .preview-line {
            padding: 6px 0;
            border-bottom: 1px solid #2a2a3a;
            color: #a1a1aa;
        }
        .preview-line .line-num {
            display: inline-block;
            width: 40px;
            color: #52525b;
        }
        .preview-line .line-time {
            display: inline-block;
            width: 140px;
            color: #71717a;
        }
        .preview-line .line-text {
            color: #e4e4e7;
        }
        .progress-panel {
            background: #1f1f32;
            border-radius: 10px;
            padding: 20px;
            margin-top: 16px;
            text-align: center;
        }
        .progress-bar {
            height: 4px;
            background: #2a2a3a;
            border-radius: 2px;
            overflow: hidden;
            margin: 12px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #60a5fa, #a78bfa);
            width: 0%;
            transition: width 0.3s;
        }
        .error-message {
            background: rgba(239,68,68,0.1);
            border: 1px solid #ef4444;
            border-radius: 10px;
            padding: 12px 16px;
            color: #f87171;
            font-size: 0.875rem;
        }
        .success-message {
            background: rgba(16,185,129,0.1);
            border: 1px solid #10b981;
            border-radius: 10px;
            padding: 12px 16px;
            color: #34d399;
        }
        .empty-state {
            text-align: center;
            padding: 48px;
            color: #52525b;
        }
        footer {
            text-align: center;
            padding: 20px;
            color: #52525b;
            font-size: 0.7rem;
            border-top: 1px solid #2a2a3a;
            margin-top: 20px;
        }
        @media (max-width: 900px) {
            .main-content {
                flex-direction: column;
            }
            .results-column {
                flex: none;
                max-height: none;
                overflow-y: visible;
            }
            .detail-column {
                position: static;
                max-height: none;
                display: none;
            }
            .detail-column.mobile-show {
                display: block;
            }
            .results-column.mobile-hide {
                display: none;
            }
            .back-btn {
                display: inline-flex !important;
            }
        }
        .back-btn {
            display: none;
            align-items: center;
            gap: 4px;
            background: none;
            border: 1px solid #2a2a3a;
            color: #a1a1aa;
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 0.8rem;
            cursor: pointer;
            margin-bottom: 12px;
            transition: all 0.2s;
        }
        .back-btn:hover {
            border-color: #60a5fa;
            color: #e4e4e7;
        }
        @media (max-width: 640px) {
            .container { padding: 16px; }
            .search-box { flex-direction: column; }
            .result-header { padding: 12px 16px; }
            .detail-header { padding: 16px; }
            .detail-content { padding: 16px; }
            .preview-line .line-time { width: 100px; font-size: 0.7rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>字幕搜索</h1>
            <div class="subtitle">搜索、下载、翻译字幕</div>
        </header>

        <div class="search-section">
            <div class="search-box">
                <input type="text" class="search-input" id="searchInput" 
                       placeholder="输入关键词搜索字幕" 
                       autocomplete="off">
                <button class="search-btn" id="searchBtn">搜索</button>
                <button class="help-btn" id="helpBtn" onclick="showApiHelp()">API 说明</button>
            </div>
        </div>

        <div class="main-content">
            <div class="results-column">
                <div id="resultsArea"></div>
            </div>
            <div class="detail-column">
                <div id="detailArea"></div>
            </div>
        </div>
        <footer>Powered by subtitlecat.com | 翻译使用 Google Translate API</footer>
    </div>

    <script>
        const API_BASE = '';
        let currentResults = [];
        let activeDetailUrl = null;
        let activeDetailData = null;

        const LANG_OPTIONS = [
            { code: 'en', name: 'English' },
            { code: 'zh-CN', name: '简体中文' },
            { code: 'zh-TW', name: '繁体中文' },
            { code: 'ja', name: 'Japanese' },
            { code: 'ko', name: 'Korean' },
            { code: 'th', name: 'Thai' },
            { code: 'vi', name: 'Vietnamese' },
            { code: 'fr', name: 'French' },
            { code: 'de', name: 'German' },
            { code: 'es', name: 'Spanish' },
            { code: 'ru', name: 'Russian' },
            { code: 'ar', name: 'Arabic' }
        ];

        function showLoading(container) {
            container.innerHTML = '<div class="loading"><div class="spinner"></div><div>加载中...</div></div>';
        }

        function showError(container, message) {
            container.innerHTML = '<div class="error-message">' + escapeHtml(message) + '</div>';
        }

        async function searchSubtitles() {
            const query = document.getElementById('searchInput').value.trim();
            if (!query) {
                alert('请输入搜索关键词');
                return;
            }

            const resultsArea = document.getElementById('resultsArea');
            const detailArea = document.getElementById('detailArea');
            showLoading(resultsArea);
            detailArea.innerHTML = '';
            activeDetailUrl = null;
            activeDetailData = null;
            // 移动端：新搜索时恢复结果列表，隐藏详情
            var rc = document.querySelector('.results-column');
            var dc = document.querySelector('.detail-column');
            if (rc) rc.classList.remove('mobile-hide');
            if (dc) dc.classList.remove('mobile-show');

            try {
                const response = await fetch(API_BASE + '/api/search?q=' + encodeURIComponent(query));
                const data = await response.json();

                if (data.error) {
                    showError(resultsArea, data.error);
                    return;
                }

                currentResults = data.results || [];
                renderResults(currentResults);
            } catch (err) {
                showError(resultsArea, '网络错误: ' + err.message);
            }
        }

        function renderResults(results) {
            const container = document.getElementById('resultsArea');
            if (!results.length) {
                container.innerHTML = '<div class="empty-state">未找到相关字幕</div>';
                return;
            }

            // 构建结果列表 HTML
            let html = '<div class="stats">找到 ' + results.length + ' 条字幕，点击查看详情</div>';
            html += '<div class="results-list" id="resultsList">';
            results.forEach(function(item, idx) {
                var translatedBadge = '';
                if (item.translated_from) {
                    translatedBadge = '<span class="translated-badge">译自 ' + escapeHtml(item.translated_from) + '</span>';
                }
                // 用单引号包裹 URL，避免 & 被 HTML 实体化后影响 dataset
                html += '<div class="result-item" data-url="' + item.url.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '" data-idx="' + idx + '">' +
                    '<div class="result-header">' +
                    '<div class="result-title">' + escapeHtml(item.title) + '</div>' +
                    '<div class="result-meta">' +
                    '<span>大小 ' + (item.size || '未知') + '</span>' +
                    '<span>下载 ' + (item.downloads || '0') + '</span>' +
                    '<span>语言 ' + (item.languages || '0') + '</span>' +
                    translatedBadge +
                    '</div>' +
                    '</div>' +
                    '</div>';
            });
            html += '</div>';
            container.innerHTML = html;

            // 事件委托：在容器上监听点击
            var listEl = document.getElementById('resultsList');
            if (listEl) {
                listEl.onclick = function(e) {
                    e = e || window.event;
                    var card = e.target;
                    while (card && card !== listEl) {
                        if (card.classList && card.classList.contains('result-item')) break;
                        card = card.parentNode;
                    }
                    if (!card || card === listEl) return;
                    var url = card.getAttribute('data-url');
                    if (!url) return;

                    // 高亮当前选中
                    var items = document.querySelectorAll('.result-item');
                    for (var i = 0; i < items.length; i++) {
                        items[i].classList.remove('active');
                    }
                    card.classList.add('active');
                    loadDetail(url);
                };
            }
        }

        async function loadDetail(detailUrl) {
            const container = document.getElementById('detailArea');
            showLoading(container);

            try {
                const urlParams = new URLSearchParams(detailUrl.split('?')[1]);
                const subUrl = urlParams.get('url');
                const response = await fetch(API_BASE + '/api/detail?url=' + encodeURIComponent(subUrl));
                const data = await response.json();

                if (data.error) {
                    showError(container, data.error);
                    return;
                }

                activeDetailData = data;
                activeDetailUrl = subUrl;
                renderDetail(data);
            } catch (err) {
                showError(container, '加载详情失败: ' + err.message);
            }
        }

        function renderDetail(detail) {
            const container = document.getElementById('detailArea');
            
            let originalPreview = '';
            if (detail.original_subtitles && detail.original_subtitles.length > 0) {
                originalPreview = 
                    '<div class="section-title">原文预览</div>' +
                    '<div class="preview-box">' +
                    detail.original_subtitles.slice(0, 30).map(sub => 
                        '<div class="preview-line">' +
                        '<span class="line-num">' + sub.index + '</span>' +
                        '<span class="line-time">' + escapeHtml(sub.timeline) + '</span>' +
                        '<span class="line-text">' + escapeHtml(sub.text) + '</span>' +
                        '</div>'
                    ).join('') +
                    '</div>';
            }

            let languageButtons = '';
            if (detail.languages && detail.languages.length > 0) {
                languageButtons = 
                    '<div class="section-title">可用语言版本</div>' +
                    '<div class="lang-grid">' +
                    detail.languages.map(lang => {
                        if (lang.action === 'DOWNLOAD') {
                            return '<button class="lang-btn download" data-action="download" data-url="' + escapeHtml(lang.url) + '" data-code="' + escapeHtml(lang.code) + '">下载 ' + escapeHtml(lang.language) + '</button>';
                        } else {
                            return '<button class="lang-btn translate" data-action="translate" data-lang="' + escapeHtml(lang.code) + '" data-name="' + escapeHtml(lang.language) + '">翻译成 ' + escapeHtml(lang.language) + '</button>';
                        }
                    }).join('') +
                    '</div>';
            }

            // 翻译按钮组 (常用语言)
            let translateButtons = 
                '<div class="section-title">翻译目标语言</div>' +
                '<div class="lang-grid">' +
                LANG_OPTIONS.map(lang => 
                    '<button class="lang-btn translate" data-action="translate" data-lang="' + lang.code + '" data-name="' + lang.name + '">' + lang.name + '</button>'
                ).join('') +
                '</div>';

            container.innerHTML = 
                '<button class="back-btn" id="backBtn">← 返回搜索结果</button>' +
                '<div class="detail-panel" id="detailPanel">' +
                '<div class="detail-header">' +
                '<div class="detail-title">' + escapeHtml(detail.subtitle_id || '字幕详情') + '</div>' +
                (detail.subtitle_id ? '<div class="detail-id">ID: ' + escapeHtml(detail.subtitle_id) + '</div>' : '') +
                '</div>' +
                '<div class="detail-content" id="detailContent">' +
                languageButtons +
                translateButtons +
                originalPreview +
                '</div>' +
                '</div>';

            // 移动端：隐藏结果列，显示详情列
            var isMobile = window.innerWidth <= 900;
            if (isMobile) {
                var rc = document.querySelector('.results-column');
                var dc = document.querySelector('.detail-column');
                if (rc) rc.classList.add('mobile-hide');
                if (dc) dc.classList.add('mobile-show');
                // 滚动到顶部
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            // 返回按钮事件
            var backBtn = document.getElementById('backBtn');
            if (backBtn) {
                backBtn.onclick = function() {
                    var rc = document.querySelector('.results-column');
                    var dc = document.querySelector('.detail-column');
                    if (rc) rc.classList.remove('mobile-hide');
                    if (dc) dc.classList.remove('mobile-show');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                };
            }

            // 事件委托：在详情面板上监听按钮点击
            var panel = document.getElementById('detailPanel');
            if (panel) {
                panel.onclick = function(e) {
                    e = e || window.event;
                    var btn = e.target;
                    while (btn && btn !== panel) {
                        if (btn.classList && btn.classList.contains('lang-btn')) break;
                        btn = btn.parentNode;
                    }
                    if (!btn || btn === panel) return;
                    if (e.stopPropagation) e.stopPropagation();

                    var action = btn.getAttribute('data-action');
                    btn.disabled = true;
                    btn.style.opacity = '0.6';
                    
                    if (action === 'download') {
                        downloadSubtitle(btn.getAttribute('data-url'), btn.getAttribute('data-code')).finally(function() {
                            btn.disabled = false;
                            btn.style.opacity = '';
                        });
                    } else if (action === 'translate') {
                        translateSubtitle(activeDetailUrl, btn.getAttribute('data-lang'), btn.getAttribute('data-name')).finally(function() {
                            btn.disabled = false;
                            btn.style.opacity = '';
                        });
                    } else {
                        btn.disabled = false;
                        btn.style.opacity = '';
                    }
                };
            }
        }

        function sanitizeFilename(str) {
            // 移除不安全字符，只保留字母数字、中文、下划线、连字符、点
            return str.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_').substring(0, 100);
        }

        async function downloadSubtitle(downloadUrl, langCode) {
            try {
                const response = await fetch(downloadUrl);
                if (!response.ok) throw new Error('下载失败');
                
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                
                // 统一使用语言代码作为后缀（与翻译下载一致）
                var sid = (activeDetailData && activeDetailData.subtitle_id) || 'subtitle';
                var lcode = langCode || 'download';
                var filename = sanitizeFilename(sid) + '-' + sanitizeFilename(lcode) + '.srt';
                
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (err) {
                alert('下载失败: ' + err.message);
            }
        }

        function showTranslationProgress(title) {
            const container = document.getElementById('detailArea');
            container.innerHTML = 
                '<div class="detail-panel">' +
                '<div class="progress-panel">' +
                '<div>正在翻译: ' + escapeHtml(title) + '</div>' +
                '<div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>' +
                '<div id="progressStatus">处理中...</div>' +
                '</div>' +
                '</div>';
        }

        async function translateSubtitle(subUrl, targetLang, langName) {
            if (!subUrl) {
                alert('请先选择字幕');
                return;
            }

            showTranslationProgress(subUrl + ' → ' + langName);
            
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                if (progress <= 90) {
                    const fill = document.getElementById('progressFill');
                    if (fill) fill.style.width = progress + '%';
                }
            }, 500);
            
            try {
                const response = await fetch(API_BASE + '/api/translate?url=' + encodeURIComponent(subUrl) + '&lang=' + targetLang);
                
                clearInterval(interval);
                const fill = document.getElementById('progressFill');
                if (fill) fill.style.width = '100%';
                
                if (!response.ok) {
                    let errorMsg = '翻译失败';
                    try {
                        const error = await response.json();
                        errorMsg = error.error || errorMsg;
                    } catch (e) {}
                    throw new Error(errorMsg);
                }
                
                // 获取字幕ID作为文件名
                let filename = activeDetailData?.subtitle_id || 'subtitle';
                filename = sanitizeFilename(filename) + '-' + targetLang + '.srt';
                
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                const statusDiv = document.getElementById('progressStatus');
                if (statusDiv) {
                    statusDiv.innerHTML = '翻译完成，文件已下载';
                    statusDiv.style.color = '#34d399';
                }
                
                setTimeout(() => {
                    if (activeDetailData) {
                        renderDetail(activeDetailData);
                    }
                }, 1500);
                
            } catch (err) {
                clearInterval(interval);
                const statusDiv = document.getElementById('progressStatus');
                if (statusDiv) {
                    statusDiv.innerHTML = '翻译失败: ' + err.message;
                    statusDiv.style.color = '#f87171';
                } else {
                    alert('翻译失败: ' + err.message);
                }
            }
        }

        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/[&<>]/g, function(m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
            });
        }

        document.getElementById('searchBtn').addEventListener('click', searchSubtitles);
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchSubtitles();
        });
        function showApiHelp() {
            var baseUrl = window.location.origin;
            var msg = 'API 使用说明' + String.fromCharCode(10);
            msg += '============' + String.fromCharCode(10) + String.fromCharCode(10);
            msg += 'GET  ' + baseUrl + '/api/search?q=<关键词>' + String.fromCharCode(10);
            msg += '  搜索字幕' + String.fromCharCode(10) + String.fromCharCode(10);
            msg += 'GET  ' + baseUrl + '/api/detail?url=<字幕URL>' + String.fromCharCode(10);
            msg += '  获取字幕详情' + String.fromCharCode(10) + String.fromCharCode(10);
            msg += 'GET  ' + baseUrl + '/api/download?url=<SRT文件URL>' + String.fromCharCode(10);
            msg += '  下载原始字幕' + String.fromCharCode(10) + String.fromCharCode(10);
            msg += 'GET  ' + baseUrl + '/api/translate?url=<字幕URL>&lang=<目标语言>' + String.fromCharCode(10);
            msg += '  翻译并下载字幕' + String.fromCharCode(10) + String.fromCharCode(10);
            msg += '完整 API 文档: ' + baseUrl + '/api';
            alert(msg);
        }

        document.getElementById('helpBtn').addEventListener('click', showApiHelp);
    </script>
</body>
</html>`;

// ============ API 功能函数 ============

async function searchSubtitles(query, apiBase) {
    const url = BASE_URL + "/index.php?search=" + encodeURIComponent(query);
    
    const response = await fetch(url, { headers: HEADERS });
    if (!response.ok) {
        throw new Error("HTTP " + response.status);
    }
    
    const html = await response.text();
    const results = [];
    
    const rows = html.match(/<td>(.*?)<\/tr>/gs) || [];
    for (const row of rows) {
        const aMatch = row.match(/<a\s+href="(subs\/\d+\/[^"]*)"[^>]*>(.*?)<\/a>/);
        if (!aMatch) continue;
        
        const href = aMatch[1];
        const titleHtml = aMatch[2];
        const title = titleHtml.replace(/<[^>]+>/g, '').trim();
        
        const sizeMatch = row.match(/sub-table__metric-value[^>]*>\s*([\d.]+\s*KB|[\d.]+\s*B)/);
        const downloadsMatch = row.match(/(\d+)\s*download/);
        const languagesMatch = row.match(/(\d+)\s*language/);
        
        // 提取 translated_from
        let translatedFrom = "";
        const tMatch = row.match(/\(translated from ([^)]+)\)/);
        if (tMatch) {
            translatedFrom = tMatch[1];
        }
        
        results.push({
            title: title,
            url: apiBase + "/api/detail?url=" + encodeURIComponent(href),
            size: sizeMatch ? sizeMatch[1] : "",
            downloads: downloadsMatch ? downloadsMatch[1] : "",
            languages: languagesMatch ? languagesMatch[1] : "",
            translated_from: translatedFrom
        });
    }
    
    return { query: query, count: results.length, results: results };
}

async function getSubtitleDetail(subUrl, apiBase) {
    let fullUrl = subUrl;
    if (subUrl.startsWith('/')) {
        fullUrl = BASE_URL + subUrl;
    } else if (!subUrl.startsWith('http')) {
        fullUrl = BASE_URL + '/' + subUrl;
    }
    
    const response = await fetch(fullUrl, { headers: HEADERS });
    if (!response.ok) {
        throw new Error("HTTP " + response.status);
    }
    
    const html = await response.text();
    
    // 提取原始 SRT URL 和字幕ID（从文件名中去掉 -orig.srt 后缀）
    let subId = "";
    let origSrtUrl = "";
    const pathMatch = html.match(/onclick="translate_from_server_folder\([^,]+,\s*'([^']+)',\s*'([^']+)'\)"/);
    if (pathMatch) {
        const filename = pathMatch[1];
        const folder = pathMatch[2];
        origSrtUrl = BASE_URL + (folder.startsWith('/') ? folder : '/' + folder) + filename;
        subId = filename.replace(/-orig\.srt$/i, '').trim();
    }
    
    // 提取语言列表
    const languages = [];
    const langBlocks = html.match(/<div class="sub-single">(.*?)<\/div>\s*<!--/gs) || [];
    
    for (const block of langBlocks) {
        const spans = block.match(/<span>(.*?)<\/span>/g) || [];
        let langName = "";
        for (const span of spans) {
            const clean = span.replace(/<[^>]+>/g, '').trim();
            if (clean && !clean.startsWith('/') && !clean.startsWith('assets')) {
                langName = clean;
                break;
            }
        }
        if (!langName) continue;
        
        const codeMatch = block.match(/id="(?:download_)?([a-z]{2}(?:-[A-Z]{2})?)"/);
        const dlMatch = block.match(/<a[^>]*href="(\/subs\/\d+\/[^"]+\.srt)"[^>]*>/);
        
        if (dlMatch) {
            languages.push({
                language: langName,
                code: codeMatch ? codeMatch[1] : "",
                action: "DOWNLOAD",
                url: apiBase + "/api/download?url=" + encodeURIComponent(dlMatch[1])
            });
        } else {
            languages.push({
                language: langName,
                code: codeMatch ? codeMatch[1] : "",
                action: "TRANSLATE",
                url: apiBase + "/api/translate?url=" + encodeURIComponent(subUrl) + "&lang=" + (codeMatch ? codeMatch[1] : "en")
            });
        }
    }
    
    // 提取原文预览
    const originalSubtitles = [];
    const subLines = html.match(/(\d+)\s*\n(\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3})\s*\n([^\n]+)/g) || [];
    for (let i = 0; i < Math.min(subLines.length, 30); i++) {
        const match = subLines[i].match(/(\d+)\s*\n(\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3})\s*\n([^\n]+)/);
        if (match) {
            originalSubtitles.push({
                index: parseInt(match[1]),
                timeline: match[2],
                text: match[3].replace(/<[^>]+>/g, '').trim()
            });
        }
    }
    
    return {
        subtitle_id: subId,
        url: fullUrl,
        original_srt_url: origSrtUrl,
        languages_count: languages.length,
        languages: languages,
        original_subtitles: originalSubtitles
    };
}

async function translateSubtitles(subUrl, targetLang) {
    // 获取详情以得到原始 SRT URL
    let detail;
    try {
        detail = await getSubtitleDetail(subUrl, "");
    } catch (err) {
        return { error: "获取字幕详情失败: " + err.message };
    }
    
    let origSrtUrl = detail.original_srt_url;
    
    // 尝试从 URL 推导
    if (!origSrtUrl) {
        let pathMatch = subUrl.match(/(subs\/\d+\/)([^/]+)\.html$/);
        if (pathMatch) {
            origSrtUrl = BASE_URL + "/" + pathMatch[1] + pathMatch[2] + "-orig.srt";
        }
    }
    
    if (!origSrtUrl) {
        return { error: "无法找到原始字幕文件" };
    }
    
    // 下载原始 SRT
    let srtResponse;
    try {
        srtResponse = await fetch(origSrtUrl, { headers: HEADERS });
        if (!srtResponse.ok) {
            throw new Error("HTTP " + srtResponse.status);
        }
    } catch (err) {
        return { error: "下载原始字幕失败: " + err.message };
    }
    
    const rawSrt = await srtResponse.text();
    const lines = rawSrt.split('\n');
    
    // 找出需要翻译的文本行
    const textLineIndices = [];
    for (let i = 0; i < lines.length; i++) {
        const stripped = lines[i].trim();
        const isTimestamp = /^\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,\.]\d{3}/.test(stripped);
        const isNumber = /^\d+$/.test(stripped);
        if (!isTimestamp && !isNumber && stripped !== '') {
            textLineIndices.push(i);
        }
    }
    
    // 分批翻译
    const textsToTranslate = textLineIndices.map(i => lines[i]);
    const translatedTexts = {};
    
    const batches = [];
    const batchIndices = [];
    let currentBatch = '';
    let currentBatchIndices = [];
    let currentChars = 0;
    const MAX_BATCH_CHARS = 300;
    
    for (let idx = 0; idx < textsToTranslate.length; idx++) {
        const text = textsToTranslate[idx];
        if (currentChars + text.length + 1 < MAX_BATCH_CHARS) {
            if (currentBatch) currentBatch += '\n';
            currentBatch += text;
            currentChars += text.length + 1;
            currentBatchIndices.push(textLineIndices[idx]);
        } else {
            if (currentBatch) {
                batches.push(currentBatch);
                batchIndices.push(currentBatchIndices);
            }
            currentBatch = text;
            currentChars = text.length + 1;
            currentBatchIndices = [textLineIndices[idx]];
        }
    }
    if (currentBatch) {
        batches.push(currentBatch);
        batchIndices.push(currentBatchIndices);
    }
    
    // 翻译每一批
    let sourceLang = "";
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        if (!batch.trim()) continue;
        
        const translated = await googleTranslate(batch, targetLang);
        if (translated) {
            const translatedLines = translated.split('\n');
            for (let j = 0; j < Math.min(translatedLines.length, batchIndices[i].length); j++) {
                translatedTexts[batchIndices[i][j]] = translatedLines[j];
            }
        }
        
        // 获取源语言
        if (i === 0 && !sourceLang) {
            try {
                const detectResp = await fetch(
                    GTX_URL + "?client=gtx&sl=auto&tl=" + targetLang + "&dt=t&q=" + encodeURIComponent(batch.slice(0, 100)),
                    { headers: HEADERS }
                );
                const data = await detectResp.json();
                if (data && data[2]) sourceLang = data[2];
            } catch (e) {}
        }
        
        if (i < batches.length - 1) {
            await new Promise(r => setTimeout(r, 500));
        }
    }
    
    // 构建输出
    const outputLines = [...lines];
    for (const [idx, translated] of Object.entries(translatedTexts)) {
        outputLines[parseInt(idx)] = translated;
    }
    
    return {
        srt: outputLines.join('\n'),
        source_lang: sourceLang || "unknown",
        target_lang: targetLang,
        subtitle_id: detail.subtitle_id || "subtitle",
        line_count: textLineIndices.length,
        translated_count: Object.keys(translatedTexts).length
    };
}

async function googleTranslate(text, targetLang, retries = 3) {
    const params = new URLSearchParams({
        client: 'gtx',
        sl: 'auto',
        tl: targetLang,
        dt: 't',
        q: text
    });
    
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await fetch(GTX_URL + "?" + params.toString(), {
                headers: HEADERS,
                cf: { cacheTtl: 0 }
            });
            
            if (response.status === 429 && attempt < retries - 1) {
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                continue;
            }
            
            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }
            
            const data = await response.json();
            let translated = "";
            if (data && data[0]) {
                for (const segment of data[0]) {
                    if (segment[0]) translated += segment[0];
                }
            }
            return translated;
        } catch (err) {
            if (attempt === retries - 1) return null;
            await new Promise(r => setTimeout(r, 500));
        }
    }
    return null;
}

// ============ Worker 主入口 ============

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        const apiBase = url.protocol + "//" + url.host;
        
        // CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': '*',
                }
            });
        }
        
        // UI 界面
        if (path === '/' || path === '/ui') {
            return new Response(HTML_UI, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }
        
        // API 路由
        try {
            if (path === '/api/search') {
                const query = url.searchParams.get('q');
                if (!query) {
                    return jsonResponse({ error: '缺少 q 参数' }, 400);
                }
                const result = await searchSubtitles(query, apiBase);
                return jsonResponse(result);
            }
            
            if (path === '/api/detail') {
                const subUrl = url.searchParams.get('url');
                if (!subUrl) {
                    return jsonResponse({ error: '缺少 url 参数' }, 400);
                }
                const result = await getSubtitleDetail(subUrl, apiBase);
                return jsonResponse(result);
            }
            
            if (path === '/api/download') {
                const fileUrl = url.searchParams.get('url');
                if (!fileUrl) {
                    return jsonResponse({ error: '缺少 url 参数' }, 400);
                }
                
                let fullUrl = fileUrl;
                if (fileUrl.startsWith('/')) {
                    fullUrl = BASE_URL + fileUrl;
                } else if (!fileUrl.startsWith('http')) {
                    fullUrl = BASE_URL + '/' + fileUrl;
                }
                
                const response = await fetch(fullUrl, { headers: HEADERS });
                if (!response.ok) {
                    return jsonResponse({ error: '下载失败' }, response.status);
                }
                
                // 提取干净的文件名
                let filename = fileUrl.split('/').pop().split('?')[0];
                filename = filename.replace(/[\\/:*?"<>|]/g, '').substring(0, 100);
                if (!filename.endsWith('.srt')) filename += '.srt';
                
                return new Response(response.body, {
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8',
                        'Content-Disposition': 'attachment; filename="' + filename + '"',
                        'Access-Control-Allow-Origin': '*',
                    }
                });
            }
            
            if (path === '/api/translate') {
                const subUrl = url.searchParams.get('url');
                const lang = url.searchParams.get('lang');
                if (!subUrl || !lang) {
                    return jsonResponse({ error: '缺少 url 或 lang 参数' }, 400);
                }
                
                const result = await translateSubtitles(subUrl, lang);
                if (result.error) {
                    return jsonResponse(result, 502);
                }
                
                // 使用字幕ID作为文件名
                let filename = result.subtitle_id || 'subtitle';
                filename = filename.replace(/[\\/:*?"<>|]/g, '').substring(0, 100) + '-' + lang + '.srt';
                
                return new Response(result.srt, {
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8',
                        'Content-Disposition': 'attachment; filename="' + filename + '"',
                        'Access-Control-Allow-Origin': '*',
                        'X-Source-Language': result.source_lang,
                        'X-Lines-Translated': String(result.translated_count),
                    }
                });
            }
            
            // API 文档
            if (path === '/api') {
                return jsonResponse({
                    name: "字幕搜索 API",
                    endpoints: {
                        "GET /api/search?q=<query>": "搜索字幕",
                        "GET /api/detail?url=<sub_url>": "字幕详情",
                        "GET /api/download?url=<file_url>": "下载字幕",
                        "GET /api/translate?url=<sub_url>&lang=<code>": "翻译字幕",
                    },
                    ui: "/ 或 /ui"
                });
            }
            
            return jsonResponse({ error: '404 Not Found' }, 404);
            
        } catch (err) {
            return jsonResponse({ error: err.message }, 500);
        }
    }
};

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
        }
    });
}
