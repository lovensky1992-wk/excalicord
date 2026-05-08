# 当前改造架构

## 分层结构

**Layer 1+2: 已回退** — supabase.ts / AuthContext / main.tsx 恢复原始代码
- AuthContext 唯一改动：`subscriptionTier: "free"` → `"pro"`（1 行）
- 数据库 migration `004_default_pro_tier.sql`：新用户自动 Pro

**Layer 3: UI 本地化（保留）**
- `index.html`：标题 / `i18n/index.ts`：默认 zh-CN / `ExcalidrawCanvas.tsx`：langCode
- `App.tsx`：隐藏 Header、集成 TopBar/SettingsModal/TeleprompterPanel
- 设置持久化走 localStorage（与 Supabase 无关）
- `useMediaDevices.ts`：摄像头/麦克风开关持久化

**Layer 4: 录制引擎** — 已回退到原始 MediaRecorder 方案

**Layer 5: 环境配置**
- `.env.local` → 本地 Supabase / `supabase/config.toml` → 禁用邮件确认
- `Makefile`：setup / dev / stop / reset

## 功能保留清单
- ✅ Excalidraw 白板全功能（绘图/形状/文字/图片/橡皮）
- ✅ 摄像头气泡（拖拽/缩放/形状/边框）
- ✅ 录制（MediaRecorder）
- ✅ 视频导出（FFmpeg WASM → MP4/WebM）
- ✅ 美颜滤镜（face-api.js）
- ✅ 幻灯片管理（添加/删除/切换/排序）
- ✅ 多语言（中文/英文）
- ✅ 暗色/亮色主题
- ✅ 画面比例（16:9/4:3/3:4/1:1/9:16/自定义）
- ✅ 提词器
- 🟡 AI Avatar（面板在，需 D-ID/HeyGen API key）

## 原站架构备忘
- **Supabase**：认证 + 云端项目/幻灯片/导出存储
- **Stripe**：纯 placeholder（所有函数返回 null，无 feature gating）
- **PostHog**：条件初始化（无 key 时不加载）
- **核心功能 100% 客户端**：录制 / 导出 / 美颜 / 白板

## 技术栈
- React 19 + TypeScript + Vite 8
- Excalidraw 0.18（白板引擎）
- FFmpeg WASM（视频导出，纯客户端）
- face-api.js（美颜滤镜）
- Tailwind CSS + shadcn/ui（样式）
- **本地 Supabase Docker**（认证 + PostgreSQL + Storage + Realtime）
- **已去除**：Stripe（付费）、PostHog（埋点）
