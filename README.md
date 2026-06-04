# cloudflare-worker-subtitle-search
基于 Cloudflare Worker 的字幕搜索、下载与翻译工具。聚合字幕资源，支持多语言下载和 Google Translate 自动翻译，无需后端服务器。

## ✨ 功能特性

- 🔍 **字幕搜索** - 搜索并浏览可用字幕
- 📥 **多语言下载** - 支持多种语言版本的字幕下载
- 🌐 **自动翻译** - 使用 Google Translate API 将字幕翻译成目标语言
- 📱 **响应式界面** - 自适应桌面端和移动端
- 🚀 **无服务器** - 部署在 Cloudflare Worker，无需维护后端

## 🚀 一键部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dlushu/cloudflare-subtitle-search)

### 自定义域名

在 Worker 管理页面 → 触发器 → 自定义域，添加你的域名。

## 📖 使用方法

### 网页界面

直接访问 Worker 域名即可使用图形界面。

### API 接口

所有接口返回 JSON 格式。

#### 搜索字幕

```
GET /api/search?q=关键词
```

#### 获取字幕详情

```
GET /api/detail?url=字幕URL
```

#### 下载字幕

```
GET /api/download?url=文件URL
```

#### 翻译字幕

```
GET /api/translate?url=字幕URL&lang=目标语言代码
```

支持的语言代码：`en`, `zh-CN`, `zh-TW`, `ja`, `ko`, `th`, `vi`, `fr`, `de`, `es`, `ru`, `ar`, `pt`, `it`, `nl`

## 📁 项目结构

```
subtitle-search-worker/
└── _worker.js    # 单文件，包含 UI + API
```

## ⚠️ 注意事项

- 字幕数据来源于 subtitlecat.com
- 翻译使用 Google Translate 公共 API，可能有请求限制
- 建议自建使用，避免被限流

## 📄 License

MIT
```
