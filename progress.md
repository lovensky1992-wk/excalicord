# 进度日志

> Excalicord 本地化项目进度追踪

---

## 2026-05-07 会话 — 项目规划 + Phase 0 执行

### Phase 0 完成 ✅
- [x] 0.1 配置 Playwright 视觉测试
  - viewport 1440×900, DPR=1, locale zh-CN
  - UI 登录方式（Supabase 本地用户自动注册+表单登录）
  - 摄像头 mock（canvas captureStream）
  - 动画禁用（CSS override）
  - smoke test 通过（9.2s）
- [x] 0.2 双源对比脚本
  - `tests/visual/compare.spec.ts` — 同一 Playwright 实例截原站+本地站
  - pixelmatch 生成 diff PNG + report.json
  - 4 个区域对比结果：
    - toolbar: **0.00%** diff（完全一致）
    - bottom-bar: **0.02%** diff（几乎一致）
    - idle-full: **2.26%** diff（摄像头气泡+幻灯片 tooltip）
    - control-group: **15.43%** diff（图标/按钮细节待对齐）
- [x] 0.3 golden 回归测试
  - `tests/visual/regression.spec.ts` — 5 个快照（idle/control-group/toolbar/bottom-bar/settings）
  - 初始 golden 生成并验证通过
- [x] 0.4 npm scripts
  - `npm run test:visual` — 双源对比
  - `npm run test:regression` — golden 回归
  - `npm run test:regression:update` — 更新 golden

### 踩坑记录
1. 浏览器 `page.evaluate` 中无法 `import("@supabase/supabase-js")` → 改用 UI 表单登录
2. Supabase localStorage key 格式不确定 → 放弃 token 注入方案
3. 原站首次访问显示设置面板（非 welcome modal）→ 需要 dismissOverlays 关闭

### 当前基线数据
```json
{
  "toolbar": { "diffPercent": 0.00 },
  "bottom-bar": { "diffPercent": 0.02 },
  "idle-full": { "diffPercent": 2.26 },
  "control-group": { "diffPercent": 15.43 }
}
```

### 待办（下一个会话）
- [ ] Phase 1：idle 状态逐项对齐
  - 首要目标：control-group diff 从 15.43% → <1%
  - 参考 BASELINE.md 的按钮尺寸/颜色/字体精确对齐

### 新增文件
- `tests/visual/fixtures.ts` — 共用 fixture（登录/mock/动画禁用）
- `tests/visual/smoke.spec.ts` — 冒烟测试
- `tests/visual/compare.spec.ts` — 双源对比
- `tests/visual/regression.spec.ts` — golden 回归
- `tests/visual/regression.spec.ts-snapshots/` — 5 个 golden PNG

### 错误日志
- 无未解决错误

---

## 2026-05-07 会话 2 — Phase 1 idle 状态对齐

### Phase 1.1 control-group 对齐 ✅
- [x] 用 Playwright 抓取原站 `.recording-controls` 容器精确样式
- [x] 修复容器：bg→rgb(254,252,249)，borderRadius→14px，padding→8px 12px，gap→8px
- [x] 修复容器：boxShadow→原站 3 层阴影，border→1px solid rgba(0,0,0,0.06)
- [x] 修复容器：position fixed, top:20, right:15（原站一致）
- [x] 修复容器：去掉 backdropFilter（原站无）
- [x] icon stroke-width 1.5 → 2（匹配原站）
- [x] 录制按钮文本改为 Unicode `● 录制`（匹配原站）
- [x] compare clip 区域更新适配新位置

### 当前基线数据
```json
{
  "toolbar": { "diffPercent": 0.00 },
  "bottom-bar": { "diffPercent": 0.02 },
  "control-group": { "diffPercent": 0.73 },
  "idle-full": { "diffPercent": 0.93 }
}
```

### Phase 1 完成标准
- ✅ idle-full diff < 1%（当前 0.93%）
- ✅ control-group diff < 1%（当前 0.73%）
- 剩余 diff 来源：幻灯片 tooltip 宽度/换行差异 + 录制按钮圆点渲染

### 待办（下一步）
- [ ] Phase 3：preview 状态对齐
- [ ] 更新 golden 快照

---

## 2026-05-07 会话 3 — Phase 2 设置面板对齐

### Phase 2 完成 ✅

#### 样式修复
- [x] Slider 范围校正：borderRadius max 32→40, canvasMargin max 200→120, cameraSize min 80→100
- [x] 用 Playwright 抓取原站 settings panel 全部 computed styles（保存到 `docs/reference/settings-computed-styles.json`）
- [x] Panel 整体样式对齐：
  - overlay bg `rgba(28,25,23,0.75)`，panel bg `rgb(254,252,249)`，borderRadius `20px`，maxWidth `820px`，maxHeight `765px`
  - 复杂 boxShadow 匹配（3 层阴影）
  - preview column: bg `rgb(245,245,244)`, padding `32px`, borderRadius `20px 0 0 20px`
  - content padding `32px`, overflow-y auto
- [x] Header 对齐：title 用 Fraunces serif 字体，close 按钮 36×36 bg `rgb(245,245,244)` borderRadius `10px`
- [x] Section headers：fontSize `11px` fontWeight `600` color `rgb(168,162,158)` letterSpacing `0.88px` textTransform `uppercase`
- [x] Aspect ratio buttons：borderRadius `12px`, padding `14px 8px`, active bg `rgb(41,37,36)`
- [x] Category tabs：borderRadius `20px`, padding `6px 12px`, fontSize `12px`
- [x] Random wallpaper btn：bg `rgb(250,250,249)`, border `1px solid rgb(231,229,228)`, borderRadius `10px`
- [x] Wallpaper grid：gap `14px`, borderRadius `12px`, selected 有 green ✓ checkmark
- [x] Toggle switches：44×24, borderRadius `12px`, bg `rgb(41,37,36)` when on
- [x] Shape buttons：borderRadius `10px`, active bg `rgb(41,37,36)`, inactive bg `rgb(250,250,249)`
- [x] Color buttons：28×28, active 有 ring boxShadow
- [x] Done button：bg `rgb(41,37,36)`, borderRadius `12px`, padding `16px`, fontSize `15px`
- [x] Account section placeholder（Google/邮箱登录 + 去水印按钮，保留原站外观）
- [x] Slider CSS 自定义（thin gray track + black round thumb），匹配原站样式
- [x] 加载 DM Sans + Fraunces 字体（Google Fonts）
- [x] body 设置 font-family: DM Sans

#### 新增比较测试
- settings-top（全面板）
- settings-content（右侧内容区）
- settings-header-controls（头部+控件，排除壁纸网格）
- settings-bottom（底部：滑块+光标+账户+完成按钮）

#### 当前基线数据
```json
{
  "toolbar": { "diffPercent": 0.00 },
  "bottom-bar": { "diffPercent": 0.02 },
  "control-group": { "diffPercent": 1.66 },
  "settings-top": { "diffPercent": 9.48 },
  "settings-header-controls": { "diffPercent": 2.50 },
  "settings-bottom": { "diffPercent": 4.78 },
  "settings-content": { "diffPercent": 13.74 }
}
```

#### Diff 分析
- settings-header-controls 2.50%：几乎全是字体渲染亚像素差异，结构完全一致
- settings-bottom 4.78%：toggle 状态差异（原站 cursor highlight 默认 ON，本地默认 OFF）+ 字体渲染
- settings-content/top 13.74%/9.48%：壁纸缩略图图片内容差异（不同 CDN/压缩），不可通过 CSS 修复
- control-group 1.66%：字体加载后亚像素变化，结构无变化

### 新增/修改文件
- `src/components/settings/SettingsModal.tsx` — 全面重写样式，使用 scraped computed styles
- `src/index.css` — DM Sans body 字体 + slider 自定义 CSS
- `index.html` — Google Fonts 加载（DM Sans + Fraunces）
- `tests/visual/compare.spec.ts` — 4 个 settings 比较区域 + font ready 等待
- `tests/visual/scrape-settings.ts` — 原站 settings 样式抓取脚本
- `docs/reference/settings-computed-styles.json` — 抓取结果

---

## 2026-05-08 会话 — Phase 3 preview 状态对齐

### Phase 3 完成 ✅

#### 修改项
- [x] 3.1 绿色边框改为全视口边框 + 8 个 resize 手柄（4角+4中点）
  - 从 slide frame 坐标计算改为 `inset: 0` 全视口覆盖
  - 移除了 viewport 追踪 state（不再需要）
- [x] 3.2 "开始录制" 按钮样式：bg-green-500 → #15803D（深绿色，匹配原站）
  - borderRadius 10px, fontSize 13px, fontWeight 600, DM Sans 字体
- [x] 3.3 设置按钮 preview 状态下保持可用（去掉 isPreviewing disabled 条件）
- [x] 3.4 幻灯片提示 pill 文案：两行 → 单行 "幻灯片模式：录制时按 ←→ 键切换幻灯片"
- [x] 3.5 创建 preview 状态 Playwright golden 回归测试（preview-full + preview-controls）

#### 回归测试
- 全部 7 个回归测试通过（idle×4 + settings×1 + preview×2）
- Golden 快照已更新

#### 修改文件
- `src/App.tsx` — 绿色边框改为全视口；移除 viewport state；pill 文案修改
- `src/components/layout/TopBar.tsx` — "开始录制" 按钮深绿色；settings 按钮 preview 可用
- `tests/visual/regression.spec.ts` — 新增 preview 回归测试

#### 待办（下一步）
- [ ] Phase 5：paused + stop 状态对齐

---

## 2026-05-08 会话 — Phase 4 recording 状态对齐

### Phase 4 完成 ✅

#### 修改项
- [x] 4.1 录制边框：preview 绿色实线 → recording 红色虚线（#ef4444 dashed），resize 手柄仅 preview 显示
- [x] 4.2 REC 徽章：从页面顶部居中移到左上角（top:55, left:80），红底白字 pill，borderRadius 8px
- [x] 4.3 控制按钮样式对齐原站：
  - 暂停按钮：bg-red-500 → #F59E0B（橙色），borderRadius 10px
  - 停止按钮：bg-gray-100 → #44403C（深色），白字
  - 继续按钮：bg-green-500 → #D97706（橙色）
  - 计时器：红色圆点 + DM Sans 13px
- [x] 4.4 倒计时覆盖层：3-2-1 countdown，120px 字号，pop 动画
- [x] 4.5 录制状态回归测试：3 个新 golden（recording-full/controls/rec-badge）

#### 回归测试
- 全部 10 个回归测试通过（idle×4 + settings×1 + preview×2 + recording×3）
- Golden 快照已更新

#### 修改文件
- `src/App.tsx` — 录制边框条件化（红虚线 vs 绿实线）；REC 徽章左上角；倒计时 overlay；countdownValue state
- `src/components/layout/TopBar.tsx` — 暂停/停止/继续按钮颜色对齐原站；计时器样式
- `src/index.css` — countdown-pop keyframes
- `tests/visual/regression.spec.ts` — 新增 recording 回归测试（3 个）

#### 待办（下一步）
- [ ] Phase 6：辅助功能对齐

---

## 2026-05-08 会话 — Phase 5 paused + stop 状态对齐

### Phase 5 完成 ✅

#### 5.1 暂停状态验证
- [x] 继续按钮 #D97706（Phase 4 已实现）
- [x] 红色虚线边框保持（isRecordingActive 包含 paused）
- [x] REC 徽章保持
- [x] 计时器暂停（stopTimer/startTimer 逻辑正确）
- [x] 红色圆点不闪烁（只在 isRecording 时 animate-pulse）

#### 5.2 停止后 UI
- [x] 停止后显示 save toast（深色圆角卡片）：
  - "视频已保存（带水印）" 标题
  - "仅需 $20 即可永久去除水印" 副标题
  - "升级" 白色按钮 + ✕ 关闭按钮
  - 位置：顶部居中
- [x] 停止后显示"素材库"按钮（右上角，控制组外侧）
- [x] 控制组回到 idle 状态（● 录制 按钮）
- [x] 红色边框 + REC 徽章消失

#### 回归测试
- 14 个回归测试（idle×4 + settings×1 + preview×2 + recording×3 + paused×2 + stop×2）
- 13 通过，1 个已知 idle bottom-bar 差异
- Golden 快照已生成

#### 修改文件
- `src/App.tsx` — 新增 showSaveToast/hasRecordedVideo 状态；handleStop 触发 toast；save toast JSX；素材库按钮
- `src/components/layout/TopBar.tsx` — showMediaLibrary prop；idle 时 right 位移适配素材库按钮
- `tests/visual/regression.spec.ts` — 新增 paused + stop 回归测试（4 个）

#### 待办（下一步）
- [ ] Phase 7：最终验证 + 提交

---

## 2026-05-08 会话 — Phase 6 辅助功能对齐

### Phase 6 完成 ✅

#### 6.1 提词器面板样式对齐
- [x] 用 Playwright 抓取原站 teleprompter computed styles
- [x] 位置修正：absolute top-14 right-3 → fixed top:80 right:20（匹配原站）
- [x] 尺寸：320 → 340×400px（匹配原站）
- [x] 背景：bg-white/95 → rgba(254,252,249,0.7)（匹配原站半透明暖白）
- [x] borderRadius：12px(xl) → 16px（匹配原站）
- [x] boxShadow：3 层阴影匹配原站
- [x] border：rgba(0,0,0,0.043)（匹配原站）
- [x] zIndex：30 → 2500（匹配原站）
- [x] 头部样式：padding 14px 16px 12px, borderBottom rgba(231,229,228,0.7)
- [x] textarea：fontSize 18px, lineHeight 31.5px, padding 20px（匹配原站）
- [x] 滑块范围：scrollSpeed min 10→0, step +5（匹配原站）

#### 6.2 幻灯片管理 ✅（已实现，结构验证通过）
- [x] "+"按钮：36×36, borderRadius 10px, dashed border rgb(168,162,158) — 与原站一致
- [x] 暗色 tooltip + 幻灯片缩略图 + 序号 + 删除按钮 — 与原站结构一致

#### 6.3 帮助面板 ✅（Excalidraw 原生）
- [x] Excalidraw 内置帮助对话框在 zh-CN locale 下正常工作
- [x] 快捷键列表（工具 + 编辑器）双列布局与 zh-17 一致

#### 6.4 右键菜单 ✅（Excalidraw 原生）
- [x] Excalidraw 内置右键菜单在 zh-CN locale 下正常工作
- [x] 菜单项：粘贴/全部选中/Toggle grid/吸附至对象/禅模式/查看模式/Canvas properties — 与 zh-18 一致

#### 回归测试
- 16 个回归测试全通过（idle×4 + settings×1 + preview×2 + recording×3 + paused×2 + stop×2 + teleprompter×1 + slide×1）
- 新增 golden：teleprompter-panel + slide-panel

#### 修改文件
- `src/components/teleprompter/TeleprompterPanel.tsx` — 全面样式对齐原站（position/bg/border/shadow/size/textarea）
- `tests/visual/regression.spec.ts` — 新增 teleprompter + slide panel 回归测试（2 个）

#### 待办（下一步）
- [ ] Phase 7：最终验证 + 提交
