# Live Monitor - 实时直播间监控系统

## 📺 项目介绍

Live Monitor 是一个专业的**实时直播间监控系统**，专为需要同时监控多个直播间的场景设计。系统基于 Vue 3 + TypeScript + Vite 构建，采用腾讯云 TRTC 技术提供低延迟的实时流媒体监控能力。

## 🚀 快速开始

### 📋 环境要求

- Node.js 16.0+ 
- npm 7.0+ (推荐) 或 npm 8.0+
- 现代浏览器（Chrome 88+, Firefox 85+, Safari 14+）

### ⚙️ 配置项目

#### 1. 前端配置 (`src/config/index.ts`)

```typescript
// 修改以下配置项
const sdkAppId = 0; // 您的腾讯云 LiveKit sdkAppId
const secretKey = "your_secret_key_here"; // sdkAppId 对应的密钥
const defaultCoverUrl = "https://your-domain.com/default-cover.png"; // 默认封面图
const concurrentMonitors = 10; // 同时监控的直播间数量
```

**如何获取 TRTC 配置：**
1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/trtc)
2. 创建 TRTC 应用，获取 `SDKAppId`
3. 在应用管理中获取密钥信息

#### 2. 服务端配置 (`server/config/.env`)

创建 `server/config/.env` 文件：

```bash
# 服务端口
PORT=3000

# TRTC 配置 
SDK_APP_ID = 0               # 您的腾讯云 LiveKit sdkAppId
SDK_SECRET_KEY = ""          # 请替换为您的应用的SDK_SECRET_KEY 不需要字符串引号
IDENTIFIER = administrator   # 用户身份必须是管理员
PROTOCOL = https://
DOMAIN = console.tim.qq.com  # rest_api 接口请求域名
```

### 🔧 安装依赖

```bash
# 安装前端依赖
npm install

# 安装服务端依赖  
cd server
npm install
cd ..
```

### ▶️ 启动项目

#### 开发环境

```bash
# 1. 启动服务端 (终端1)
cd server
npm run dev

# 2. 启动前端 (终端2) 
npm run dev
```

## 🎛️ 使用指南

### 基础操作

1. **开始监控**
- 点击绿色"开始监控"按钮
   - 系统会自动连接并显示直播间画面

2. **分组切换** 
   - 使用"上一组监控"/"下一组监控"按钮
   - 快速切换不同的直播间组合

3. **加载更多**
   - 点击"加载直播间"按钮
   - 获取更多可监控的直播间

4. **停止监控**
- 点击红色"停止监控"按钮
   - 断开所有监控连接

### 状态监控

界面顶部显示关键监控指标：
- **直播间数**：当前已加载的直播间总数
- **监控中**：正在监控的直播间数量
- **同时监控**：系统配置的最大并发监控数



### 核心依赖
- **TRTC Web SDK**：腾讯云实时音视频
- **Element Plus**：UI 组件库
- **Day.js**：日期时间处理

## 🔧 开发指南

### 项目结构

```
live-monitor-web-vite-vue3/
├── src/                    # 前端源码
│   ├── components/         # Vue 组件
│   ├── config/            # 配置文件 ⭐
│   ├── manager/           # 播放器管理
│   ├── states/            # 状态管理
│   └── styles/            # 样式文件
├── server/                # 服务端源码  
│   ├── config/            # 服务端配置 ⭐
│   ├── src/               # 服务端源码   
└── └── scripts/           # 构建脚本
```