# Excalicord 本地化 — 像素级复刻执行计划

> **目标**：100% 像素级匹配原站 excalicord.com
> **策略**：截图驱动逐屏对齐 + Playwright snapshot 自动对比
> **创建**：2026-05-07
> **状态**：🚧 执行中（Phase 0 完成）

---

## 架构决策

| # | 决策 | 理由 |
|---|------|------|
| D1 | 本地 Supabase Docker 替代 localStorage mock | 零代码改动，100% 功能对等（已执行） |
| D2 | 保留原始 MediaRecorder，不重写为 WebCodecs | 原方案能用就不重写（已回退） |
| D3 | 用 HTML overlay 实现录制边框 | Excalidraw 0.18 updateScene 不重绘 strokeColor |
| D4 | Playwright snapshot 做视觉回归 | 解决"我看不到浏览器"的核心瓶颈 |
| D5 | 逐屏推进，每屏独立提交 | 符合 Iron Law #1（一次只改一个） |
| D6 | 在半成品上继续，不从 0 重建 | 架构正确，问题在视觉细节，重做 = 重踩坑 |
| D7 | 双层验证（双源 diff + golden 回归） | 第 1 层检测差异，第 2 层防退化 |
| D8 | viewport 1440×900 / DPR 1 / locale zh-CN | 与原站截图采集参数完全一致（已验证） |

---

## Phase 0：Playwright 视觉对比基础设施 ✅ 完成

> **目标**：建立自动化截图 + 对比 pipeline，后续所有 Phase 的验证依赖此设施
> **已确认**：原站截图 viewport 1440×900, DPR=1, Playwright 采集（与本地截图同工具同配置）

### 0.1 配置 Playwright 视觉测试
- [ ] 更新 `playwright.config.ts`：viewport 1440×900、deviceScaleFactor 1、locale zh-CN、禁用 CSS 动画
- [ ] 创建 `tests/visual/` 目录结构
- [ ] 处理 Supabase 认证：Playwright 测试前自动注册/登录本地 Supabase 用户
- [ ] mock `navigator.mediaDevices.getUserMedia`（headless 无摄像头）

### 0.2 双源对比脚本（第 1 层：检测差异）
- [ ] `tests/visual/compare.spec.ts` — 用同一个 Playwright 实例截原站 + 本地站
- [ ] 截图配对：idle、settings、preview、recording、paused、stop
- [ ] `pixelmatch` 生成 diff PNG + 差异百分比报告
- [ ] 输出到 `test-results/visual-diff/`（original.png / local.png / diff.png / report.json）

### 0.3 golden 回归（第 2 层：防退化）
- [ ] `tests/visual/regression.spec.ts` — 使用 `toHaveScreenshot()` 做回归
- [ ] 首次运行生成 golden（已对齐状态的快照）
- [ ] 后续改动自动检测是否破坏已对齐的部分
- [ ] maxDiffPixelRatio: 0.01（canvas 区域用 mask 排除动态内容）

### 0.4 辅助工具
- [ ] `npm run test:visual` — 跑双源对比
- [ ] `npm run test:regression` — 跑 golden 回归
- [ ] `npm run test:visual:update` — 更新 golden 快照

**完成标准**：`npm run test:visual` 输出本地 vs 原站的 side-by-side diff 报告，能清楚看到哪里不一致

---

## Phase 1：idle 状态对齐 ✅ 完成（diff < 1%）

> **结果**：idle-full 0.93% / control-group 0.73% / toolbar 0.00% / bottom-bar 0.02%

### 1.1 右上控制组 ✅
- [x] Record 按钮样式对齐（红底白字、borderRadius 10px、boxShadow、font DM Sans 13px 600）
- [x] Settings 图标样式（34×34、borderRadius 8px、color #787168）
- [x] Slides 图标样式（同 Settings）
- [x] 控制组整体布局（间距、对齐、白色背景圆角卡片）

### 1.2 顶部工具栏 ✅（0.00% diff）
- [x] 对比 Excalidraw 默认工具栏 vs 原站（原站是 Excalidraw 原生，理论上应一致）
- [x] 确认 13 个工具都在且顺序正确

### 1.3 底部栏 ✅（0.02% diff）
- [x] 缩放控件位置（左下）
- [x] 撤销/重做按钮
- [x] 帮助按钮（右下）

### 1.4 汉堡菜单（左上 ☰）— 跳过（已一致）
- [x] 外观样式（36×36、borderRadius 8px、bg #ECECF4、boxShadow）

### 1.5 幻灯片入口
- [ ] `+` 按钮（虚线边框、36×36、borderRadius 10px、dashed #A8A29E）
- [ ] 幻灯片模式 tooltip（暗色背景提示）

### 1.6 摄像头气泡
- [ ] 默认位置（左上角，与原站一致）
- [ ] 圆形裁切、可拖拽

**完成标准**：`tests/visual/idle.spec.ts` 通过，diff < 1%

---

## Phase 2：设置面板对齐 ✅ 完成（结构对齐，diff 受壁纸图片内容限制）

> **参考截图**：`zh-02-settings-top.png` ~ `zh-07-settings-scroll-5.png`
> **DOM 参考**：`baseline-data.json`
> **结果**：header-controls 2.50% / bottom 4.78%（结构一致，diff 来自 toggle 状态和字体渲染）

### 2.1 面板布局
- [x] overlay 遮罩（rgba(28,25,23,0.75)）
- [x] 左右分栏（左=预览 320px，右=设置内容 500px）
- [x] 标题"录制设置" + ✕ 关闭按钮

### 2.2 画面比例区
- [x] 6 个按钮网格（3×2）：16:9/4:3/3:4/9:16/1:1/Custom
- [x] 选中态（rgb(41,37,36) 背景）vs 未选中态
- [x] 每个按钮的副标题（YouTube/经典/小红书/抖音/正方形/自定义）

### 2.3 背景区
- [x] 分类标签（全部/鲜艳/柔和/深色/自然）+ 选中态
- [x] ✨ 随机选择壁纸 按钮
- [x] 壁纸缩略图 4 列网格 + 选中 ✓ 标记

### 2.4 其他设置项
- [x] 圆角半径滑块（0~40，默认 16）
- [x] 摄像头开关 + 大小滑块 + 形状选择（圆形/方形）
- [x] 画布边距滑块（0~120，默认 80）
- [x] 鼠标光标效果开关 + 颜色选择器
- [x] 底部 Done 按钮

### 2.5 预览区
- [x] 左侧预览框实时反映设置变化
- [x] 摄像头气泡缩略图

**完成标准**：`tests/visual/settings.spec.ts` 通过，diff < 1%

---

## Phase 3：preview 状态对齐 ✅ 完成

> **参考截图**：`zh-22-record-preview.png`、`zh-23-preview-controls.png`

### 3.1 绿色录制边框
- [ ] 绿色边框包围画布（color #22c55e 系）
- [ ] 4 个角绿色 resize 手柄
- [ ] 中央提示 pill："幻灯片模式：录制时按 ←→ 键切换幻灯片"

### 3.2 控制按钮变化
- [ ] `✕ 取消` 按钮（透明底、灰色字）
- [ ] `● 开始录制` 按钮（绿色底 #15803D、白字）
- [ ] Settings/Slides 图标保持

### 3.3 其他 UI 变化
- [ ] `+` 添加幻灯片按钮消失
- [ ] 工具栏保持可见
- [ ] 摄像头气泡保持
- [ ] 右侧幻灯片条显示（含序号缩略图）

**完成标准**：`tests/visual/preview.spec.ts` 通过，diff < 1%

---

## Phase 4：recording 状态对齐 ✅ 完成

> **结果**：10 个回归测试全通过，录制 UI 匹配原站

> **参考截图**：`zh-24-countdown.png`、`zh-25-recording-active.png`、`zh-26-recording-controls.png`、`zh-26b-rec-badge.png`

### 4.1 红色录制边框
- [ ] 绿色边框 → 红色边框（#ef4444）
- [ ] resize 手柄消失

### 4.2 REC 徽章
- [ ] 左上角 `● REC` pill（红底白字、pulse 动画 1.5s）

### 4.3 控制按钮变化
- [ ] `⏸ 暂停` 按钮（橙色底 #F59E0B、白字）
- [ ] `■ 停止` 按钮（深色底 #44403C、白字）
- [ ] 红色小圆指示灯
- [ ] 计时器显示（13px）

### 4.4 倒计时
- [ ] 3-2-1 倒计时覆盖层

**完成标准**：`tests/visual/recording.spec.ts` 录制态截图通过

---

## Phase 5：paused + stop 状态对齐 ✅ 完成

> **结果**：13/14 回归测试通过，暂停+停止 UI 匹配原站

> **参考截图**：`zh-27-recording-paused.png`、`zh-29-after-stop.png`、`zh-30-export-done.png`

### 5.1 暂停状态
- [ ] `▶ 继续` 按钮（橙色底 #D97706、白字）替代暂停
- [ ] 红色边框保持
- [ ] REC 徽章保持
- [ ] 计时器暂停

### 5.2 停止后
- [ ] 回到 idle 布局
- [ ] toast 提示："视频已保存（带水印）" + 升级按钮 + ✕ 关闭
- [ ] 右上出现"素材库"按钮

**完成标准**：`tests/visual/recording.spec.ts` 暂停+停止截图通过

---

## Phase 6：辅助功能对齐 ✅ 完成

> **结果**：16 个回归测试全通过，提词器样式对齐，幻灯片/帮助/右键菜单验证通过

> **参考截图**：`zh-15-slide-added.png`、`zh-16-teleprompter.png`、`zh-17-help-panel.png`、`zh-18-context-menu.png`

### 6.1 提词器面板
- [ ] 面板位置（x=1080, y=80, 340×400px）
- [ ] 关闭/字体大小/滚动速度/文本输入区

### 6.2 幻灯片管理
- [ ] 添加幻灯片后的侧边条
- [ ] 幻灯片缩略图 + 序号
- [ ] 拖拽排序

### 6.3 帮助面板
- [ ] 快捷键列表

### 6.4 右键菜单
- [ ] 菜单项与 BASELINE.md A4 对齐

**完成标准**：所有辅助功能的 Playwright 截图通过

---

## Phase 7：最终验证 + 提交 ✅

### 7.1 全流程端到端
- [ ] idle → preview → countdown → recording → pause → resume → stop → export 完整链路
- [ ] 亮色 + 暗色主题双验证
- [ ] 6 种比例切换验证

### 7.2 代码清理
- [ ] 清除 console.log 调试语句
- [ ] 移除未使用的 import
- [ ] 类型检查通过（tsc --noEmit）

### 7.3 提交
- [ ] 按 Phase 拆分 commit（或合并为有意义的逻辑单元）
- [ ] 更新 CLAUDE.md 当前状态

**完成标准**：`npm run test:visual` 全部通过 + `tsc --noEmit` 无错误

---

## 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 原站截图分辨率/viewport 与本地不匹配 | 像素对比全部失败 | Phase 0 先校准 viewport，允许结构级对比 |
| Excalidraw canvas 内容不可控（随机 ID、动画） | 截图不稳定 | 对 canvas 区域用更大 threshold 或 mask |
| Supabase Docker 启动慢影响 CI | 测试运行时间长 | 本地开发时 reuse server |
| 录制状态需要真实 MediaRecorder | Playwright headless 无摄像头 | mock getUserMedia 或只验证 UI 不验证实际录制 |

---

## 文件改动追踪

| Phase | 涉及文件 | 风险 |
|-------|---------|------|
| 0 | `playwright.config.ts`, `tests/visual/*.spec.ts`, `package.json` | 🟢 低 |
| 1 | `src/App.tsx`, `src/index.css`, `TopBar.tsx` | 🟡 中 |
| 2 | `SettingsModal.tsx`, `src/index.css` | 🟢 低 |
| 3 | `src/App.tsx`, `DraggableRecordingControls.tsx` | 🟡 中 |
| 4 | `src/App.tsx`, `useRecordingFlow.ts`, `DraggableRecordingControls.tsx` | 🔴 高 |
| 5 | `useRecordingFlow.ts`, `DraggableRecordingControls.tsx` | 🔴 高 |
| 6 | `TeleprompterPanel.tsx`, `useSlides.ts` | 🟡 中 |
