# Excalicord 本地化

> 共享项目记忆：Claude Code 自动加载，OpenClaw (Jarvis) 按需读取。谁改谁更新。

## 项目信息
- **目标**：将 Excalicord 改造为完全本地可用（去付费、去云端依赖），像素级匹配原站
- **原站**：https://www.excalicord.com/
- **源码**：https://github.com/zhangpink-eng/excalicord
- **baseline commit**：`56515ab`（原始代码最后一个 commit，所有对比以此为准）
- **启动命令**：`make dev`（首次需 `make setup`）

## 操作规则

### Iron Laws（不可违反）

```
1. 一次只改一个东西
   改完验证通过再改下一个。禁止同时改 UI + 逻辑 + 样式。
   ✅ 自检：这个 commit 只解决一个问题吗？

2. 改之前先看原站 + 原始代码
   UI 改动前，先截图原站对应状态存到 docs/screenshots/。
   代码改动前，先 git show 56515ab:path/to/file 看原始实现。
   禁止"凭印象"修改。
   ✅ 自检：我看过原站截图和原始代码了吗？

3. 改了就要验证
   没有刚跑出的验证输出，不许说"完成了"/"修好了"。
   录制相关改动必须测完整链路（idle→preview→recording→pause→stop）。
   ✅ 自检：我手上有这一分钟内跑出来的证据吗？

4. 3 轮不对就回退
   连续 3 轮修改同一个问题还没解决 → git checkout 回退该文件。
   重新读原始代码，换思路。不在错误方向上叠补丁。
   ✅ 自检：我是在修问题还是在叠补丁？

5. 禁止顺手重构
   修 bug 时不要同时重构代码结构、提取 hook、改命名。
   重构是独立任务，单独提交。
```

### 原始代码参照

baseline = `56515ab`（HEAD，原始 160 个 commit 的最终状态）。

修改任何文件前必须执行：
```bash
git show 56515ab:path/to/file | head -100
```
对比原始实现再动手。不确定原站行为时，说"我需要看原站截图"。

### 变更隔离协议

1. 改之前 `git stash` 或新建分支，保证随时可回退
2. 一个 commit 只解决一个问题，commit message 写清改了什么 + 为什么
3. 🔴 高危文件（App.tsx / useRecordingFlow.ts / useSlides.ts）改后必须全流程验证
4. 改了 CSS → 验证亮色/暗色两个主题

### 视觉验证协议

`docs/screenshots/` 存放原站参考截图，命名规范：
```
original-{功能}-{状态}.png   — 原站截图（由用户提供）
local-{功能}-{状态}.png     — 本地截图（改完后截取对比）
```

UI 类改动的完成标准：本地截图与 original 肉眼无差异。
**没有参考截图的功能，不要开始改 UI。先截图，再动手。**

### 不做清单（从踩坑固化）

- ❌ 不用 localStorage mock 替代 Supabase — 用本地 Supabase Docker
- ❌ 不在 useEffect 里做可以同步完成的初始化 — 防止竞态/无限循环
- ❌ 不用 Playwright screenshot 调试 — 撑爆 context，用 snapshot 代替
- ❌ 不重写 MediaRecorder 为 WebCodecs — 原始方案能用就不重写
- ❌ 不用 `scrollToContent({ fitToViewport })` — 在 0.18 不生效，用 `updateScene({ appState })` 手动设置
- ❌ 不用 `updateScene({ elements })` 改 frame strokeColor — 不触发重绘，用 HTML overlay
- ❌ 不把需要持久化的数据放 ref — ref 变化不触发 effect，直接调 localStorage.setItem()

### 求助触发器

以下情况立即停下来告知用户，不要继续试：
- Excalidraw API 行为与预期不符（已踩过 3 次坑）
- 同一个文件改了 3 轮以上还不对
- 需要看原站实际交互才能判断（说"我需要看原站截图"）
- TypeScript 类型错误超过 3 个且相互关联
- 改动涉及 2 个以上高危文件的联动

## 录制状态机

权威定义。任何录制相关改动必须对照此图。

```
idle ──[点击录制]──→ preview ──[点击开始]──→ countdown(3s) ──→ recording
                     │                                         │    ↑
                     │[点击取消]                        [点击暂停]  [点击继续]
                     ↓                                         ↓    │
                    idle                                     paused──┘
                                                               │
                                              recording ──[点击停止]──→ exporting
```

各状态 UI 表现：
| 状态 | UI 表现 |
|------|---------|
| idle | 红色圆形录制按钮，工具栏正常 |
| preview | 预览框（绿色边框），"开始录制"+"取消"按钮 |
| countdown | 3-2-1 倒计时覆盖层 |
| recording | 红色脉冲指示灯，计时器运行，**工具栏保持可见** |
| paused | 计时器暂停，暂停图标 |
| exporting | 导出进度条 |

## 文件风险分级

🔴 **高危**（改前 git stash，改后全流程验证）：
- `src/App.tsx` — 全局状态中枢
- `src/hooks/useRecordingFlow.ts` — 录制状态机
- `src/hooks/useSlides.ts` — 幻灯片数据层

🟡 **中等**（改后验证对应功能）：
- `src/components/canvas/ExcalidrawCanvas.tsx`
- `src/components/recording/DraggableRecordingControls.tsx`
- `src/components/canvas/CameraBubble.tsx`

🟢 **低风险**（改后视觉检查即可）：
- `src/index.css`、`src/services/i18n/*`、纯展示组件

## 技术栈
- React 19 + TypeScript + Vite 8
- Excalidraw 0.18（白板引擎）
- FFmpeg WASM（视频导出，纯客户端）
- face-api.js（美颜滤镜）
- Tailwind CSS + shadcn/ui（样式）
- **本地 Supabase Docker**（认证 + PostgreSQL + Storage + Realtime）
- **已去除**：Stripe（付费）、PostHog（埋点）

## 当前状态
- **最后更新**：2026-05-07
- **进展**：架构迁移到本地 Supabase 完成，localStorage mock（Layer 1+2）已回退，WebCodecs 重写（Layer 4）已回退
- **未提交改动**：
  - `useSlides.ts`：改比例同步更新所有 slide 的 frameDimensions + 直接写 localStorage
  - `ExcalidrawCanvas.tsx`：`updateScene` 同步 frame 属性；手动 zoom-to-fit；viewport 推送
  - `App.tsx`：录制时 HTML overlay 绿色边框；viewport 追踪
  - `index.css`：移除错误的 focus-mode 隐藏工具栏 CSS
- **待验证**：
  1. 绿色边框 overlay 在实际浏览器中的效果
  2. zoom-to-fit 聚焦效果
  3. 取消录制后绿色边框消失
  4. 改比例 → 创建 slide → 刷新 → 比例保持的完整流程
  5. `recording-border-*` 元素清理（取消录制场景）

## 当前改造分层

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

## Excalidraw 0.18 API 限制

| 问题 | 替代方案 |
|------|----------|
| `scrollToContent({ fitToViewport })` 不生效 | 手动计算 zoom/scroll + `updateScene({ appState })` |
| `updateScene({ elements })` 改 frame strokeColor 不重绘 | HTML/CSS overlay div，位置 = `(frame.x + scrollX) * zoom` |
| `updateScene({ elements })` 不能添加新元素 | `api.getSceneElements()` + 过滤 + concat 新元素 |
| `onScrollChange` 不推送初始状态和 updateScene 触发的变更 | updateScene 后手动调用 viewport 回调 |
| `initialData` 只在组件挂载时生效 | 后续变更用 `updateScene` 手动同步 |
| DOM 结构不稳定（两种变体） | CSS 选择器覆盖 `.App-top-bar` 和 `.layer-ui__wrapper` 两种结构 |

## 原站架构备忘
- **Supabase**：认证 + 云端项目/幻灯片/导出存储
- **Stripe**：纯 placeholder（所有函数返回 null，无 feature gating）
- **PostHog**：条件初始化（无 key 时不加载）
- **核心功能 100% 客户端**：录制 / 导出 / 美颜 / 白板
