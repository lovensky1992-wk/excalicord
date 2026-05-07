# Excalicord 原站 UI 参考规范

> 截图来源：https://www.excalicord.com/ (2026-05-07 自动截取)
> 截图目录：docs/reference/*.png

## 录制状态机

```
idle ──→ click "● Record" ──→ preview
preview ──→ click "● Start Recording" ──→ recording
preview ──→ click "✕ Cancel" ──→ idle
recording ──→ click "⏸ Pause" ──→ paused
paused ──→ click "▶ Resume" ──→ recording
recording/paused ──→ click "■ Stop" ──→ idle (自动下载 + watermark toast)
```

## 各状态 UI 对照

### 1. idle 状态 → `03-canvas-idle.png`
- 顶部中央：Excalidraw 标准工具栏
- 右上角控制组：⚙ Settings | 📋 Slides | `● Record`(红色按钮）
- 左上角：摄像头气泡（圆形，可拖拽）
- 左下角：缩放 `- 100% +` + 撤销/重做
- 右下角：`?` 帮助图标
- 右侧边缘：`+` 添加幻灯片按钮（虚线圆角框）
- 左上角：☰ 汉堡菜单
- **无录制边框**

### 2. preview 状态 → `06-after-record-click.png`, `11-recording-preview.png`
- **绿色边框**包围画布区域，4 个角有绿色方形 resize 手柄
- 中央提示：`Drag to move · Corners to resize`（暗色半透明 pill）
- 右上角控制组变化：⚙ | 📋 | `✕ Cancel` | `● Start Recording`（绿色按钮）
- 工具栏保持可见
- 摄像头气泡保持可见
- `+` 按钮和 Library 按钮消失

### 3. recording 状态 → `12-countdown-or-starting.png`, `13-recording-active.png`
- **红色边框**替换绿色边框，无 resize 手柄
- 左上角新增 `● REC` 红色徽章（pill 形，白字红底）
- 右上角控制组：⚙(灰色) | 📋 | ⊙(红色小圆) | `⏸ Pause`(橙色) | `■ Stop`(深色) | `● 00:01`(计时器)
- Excalidraw 工具栏保持可见
- `Drag to move` 提示消失
- 底部缩放控件保持

### 4. paused 状态 → `14-recording-paused.png`
- 与 recording 相同，但 Pause 按钮变为 `▶ Resume`（橙色）
- 红色边框保持
- `● REC` 徽章保持
- 计时器暂停（显示停止时的时间）

### 5. after-stop 状态 → `15-after-stop.png`
- 回到 idle 布局
- 顶部中央弹出 toast：`Video saved with watermark` + `Upgrade` 按钮 + ✕ 关闭
- 右上角出现 `Library` 按钮

## Recording Settings 面板 → `02-settings-overlay-top.png`

全屏半透明 overlay，分左右两区：

### 左侧
- `PREVIEW` 标签
- 预览框（显示当前画面 + 摄像头气泡缩略图）

### 右侧
- 标题：**Recording Settings**，右上角 ✕ 关闭按钮
- **ASPECT RATIO**：6 个按钮网格（3×2）
  - `16:9 YouTube`（默认选中，深色背景）
  - `4:3 Classic`
  - `3:4 RedNote`
  - `9:16 TikTok`
  - `1:1 Square`
  - `Custom Your size`
- **BACKGROUND**：
  - 分类标签：All | Vibrant | Pastel | Dark | Nature（All 默认选中）
  - `✨ Pick random wallpaper` 按钮
  - 4 列壁纸缩略图网格，选中的有 ✓ 标记
- **CORNER RADIUS: 16PX**
- **CAMERA SHAPE**：Circle | Square（按钮组）
- 底部：
  - `Sign in with Google` / `Sign in with Email`
  - `Remove watermark — $20 once`
  - `Done` 按钮

## 布局固定元素

| 位置 | 元素 | CSS class (从按钮扫描) |
|------|------|----------------------|
| 右上角控制组 | 设置+幻灯片+录制 | `control-button`, `record-button` |
| 比例按钮 | 16:9/4:3/3:4/9:16/1:1/Custom | `aspect-btn`, `active` |
| 壁纸类别 | All/Vibrant/Pastel/Dark/Nature | `bg-category-tab`, `active` |
| 摄像头形状 | Circle/Square | `shape-option`, `active` |
| 设置关闭 | Done | `done-btn` |
| 设置关闭 | ✕ | `close-btn` |
| 录制 | Pause | `control-button pause-button` |
| 录制 | Stop | `control-button stop-button stop-recording-btn` |

## 色值参考

| 用途 | 颜色 |
|------|------|
| 录制边框（preview） | 绿色 `#22c55e` 系 |
| 录制边框（recording） | 红色 `#ef4444` 系 |
| Record 按钮 | 红色背景白字 |
| Start Recording 按钮 | 绿色背景白字 |
| Pause 按钮 | 橙色背景白字 |
| Stop 按钮 | 深灰/黑色背景白字 |
| Resume 按钮 | 橙色背景白字 |
| REC 徽章 | 红色背景白字 |
| 页面背景 | 暖白 `#faf8f5` 系 |
| Settings overlay 背景 | 白色卡片 + 半透明遮罩 |
