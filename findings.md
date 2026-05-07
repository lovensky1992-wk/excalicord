# 调研发现

> Excalicord 本地化项目调研记录

---

## 2026-05-07：项目现状盘点

### 已完成的工作

1. **架构迁移**：localStorage mock → 本地 Supabase Docker（已完成并验证）
   - AuthContext 唯一改动：`subscriptionTier: "free"` → `"pro"`
   - 数据库 migration `004_default_pro_tier.sql` 确保新用户自动 Pro
   - `onAuthStateChange` 统一处理 INITIAL_SESSION / SIGNED_IN / TOKEN_REFRESHED

2. **Layer 3 UI 本地化**（保留）
   - 新增组件：`TopBar.tsx`、`SettingsModal.tsx`、`TeleprompterPanel.tsx`
   - `index.html` 标题 / `i18n` 默认 zh-CN
   - 设置持久化走 localStorage（与 Supabase 无关）
   - 摄像头/麦克风开关持久化

3. **Layer 4 录制引擎**：已回退到原始 MediaRecorder 方案

4. **Layer 1+2 回退**：supabase.ts / main.tsx 恢复原始代码

5. **Baseline 参考资料**（今晚梳理完成）
   - 45 张中文原站截图（docs/reference/zh-*.png）
   - BASELINE.md：完整控件清单、按钮样式、色值、z-index、CSS token
   - UI-SPEC.md：录制状态机、各状态 UI 对照
   - baseline-data.json：Settings 面板 DOM 结构
   - 提取脚本 11 个（docs/reference/scripts/）

### 当前代码差异

16 个文件被修改，+582 -682 行（净减少 100 行）。核心变化：

| 文件 | 行数变化 | 说明 |
|------|---------|------|
| `App.tsx` | 968→769 行 | 提取了 TopBar/Settings/Teleprompter 组件 + 录制边框 overlay |
| `useSlides.ts` | +112 行 | 改比例同步更新所有 slide frameDimensions + 直接写 localStorage |
| `ExcalidrawCanvas.tsx` | +116 行 | updateScene 同步 frame 属性、手动 zoom-to-fit、viewport 推送 |
| `AuthContext.tsx` | -31/+21 行 | subscriptionTier: pro + onAuthStateChange 统一处理 |

### 关键技术约束

1. **Excalidraw 0.18 API 坑**（来自 CLAUDE.md 不做清单）
   - `scrollToContent({ fitToViewport })` 不生效 → 手动计算 zoom/scroll
   - `updateScene({ elements })` 改 frame strokeColor 不重绘 → HTML overlay
   - `onScrollChange` 不推送初始状态 → 手动调 viewport 回调

2. **Playwright 已有配置**
   - `@playwright/test` 1.58.2 已安装
   - `playwright.config.ts` 基本配置已有（viewport 未固定、未禁用动画）
   - 现有测试 `tests/app.spec.ts` 内容过时（测的是登录页，不适用于当前本地 Supabase 架构）

3. **原站截图 viewport**
   - 原站截图是 1440×900（从 BASELINE.md body 宽高确认）
   - 需要 Playwright 也固定 1440×900 viewport

### 视觉对比方案评估

| 方案 | 优点 | 缺点 |
|------|------|------|
| Playwright `toHaveScreenshot()` | 内置、简单、自动生成 golden | golden 需从本地截图生成，原站截图尺寸可能不完全匹配 |
| `pixelmatch` 自定义对比 | 灵活，可指定对比区域 | 需额外代码 |
| Playwright 截图 + 人工对比 | 最灵活 | 不自动化 |

**选定方案**：Playwright `toHaveScreenshot()` + 局部区域裁剪。原因：
- 原站截图作为视觉参考（人看），Playwright 生成的 golden 作为回归基准（机器比）
- 第一次跑时生成 golden，后续改动检测回归
- 关键区域（控制组、按钮）单独截图对比，避免 canvas 内容干扰

### 需要解决的前置问题

1. **Supabase 登录流程**：Playwright 测试需要自动登录，或 mock auth 状态
2. **摄像头 mock**：headless 模式无摄像头，需要 `navigator.mediaDevices.getUserMedia` mock
3. **Canvas 不确定性**：Excalidraw canvas 内容（元素 ID、渲染时序）可能导致截图不稳定

---

## 2026-05-07：Viewport 配置确认

### 原站截图采集参数（从 `docs/reference/scripts/capture-zh.mjs` 确认）
- **viewport**: `{ width: 1440, height: 900 }`
- **deviceScaleFactor**: 未设置（Playwright 默认 = 1）
- **实际像素尺寸**：1440×900（`identify zh-09-canvas-idle.png` 验证）
- **工具**：Playwright chromium

### Playwright 本地配置方案
```ts
use: {
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: 'zh-CN',
}
```
与原站截图完全一致，无 DPR 偏差问题。

### 双源对比方案（核心创新）
用同一个 Playwright 实例 + 同一配置，分别截原站和本地站，生成 pixel-level diff。
完全消除工具差异，diff 只反映 UI 差异。

---

## 2026-05-07：半成品 vs 从 0 开始评估

### 结论：在半成品上继续

| 已有改动 | 复用价值 |
|---------|---------|
| 本地 Supabase Docker 架构 | 核心基座，重做成本高 |
| AuthContext subscriptionTier: pro | 必须保留 |
| onAuthStateChange 统一处理 | 修复了原版竞态 bug |
| App.tsx 组件提取 | 结构合理，提取本身没问题 |
| ExcalidrawCanvas zoom-to-fit workaround | 规避 0.18 API 限制，已验证 |
| useSlides 比例同步 | 功能正确 |

从 0 开始意味着重做以上所有 + 重踩 Excalidraw 0.18 的坑。
当前的问题是「视觉细节没对齐」，不是「架构走错了」。
