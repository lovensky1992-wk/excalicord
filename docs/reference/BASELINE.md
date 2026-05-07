# Excalicord 原站基准参考

> 自动提取自 https://www.excalicord.com/ (zh-CN locale, 2026-05-07)
> 配合 `zh-*.png` 截图使用

## A. 控件清单

### A1. 顶部工具栏

| # | data-testid | label/title | 快捷键 |
|---|-------------|-------------|--------|
| 1 | `toolbar-lock` | 绘制后保持所选的工具栏状态 |  |
| 2 | `toolbar-hand` | 抓手（平移工具） — H |  |
| 3 | `toolbar-selection` | 选择 |  |
| 4 | `toolbar-rectangle` | 矩形 |  |
| 5 | `toolbar-diamond` | 菱形 |  |
| 6 | `toolbar-ellipse` | 椭圆 |  |
| 7 | `toolbar-arrow` | 箭头 |  |
| 8 | `toolbar-line` | 线条 |  |
| 9 | `toolbar-freedraw` | 自由书写 |  |
| 10 | `toolbar-text` | 文字 |  |
| 11 | `toolbar-image` | 插入图像 |  |
| 12 | `toolbar-eraser` | 橡皮 |  |
| 13 | `dropdown-menu-button` | 更多工具 |  |

### A2. 汉堡菜单 (左上角 ☰)

| 菜单项 | 快捷键 | data-testid |
|--------|--------|-------------|
| 打开 | Cmd+O | `load-button` |
| 保存到... |  | `json-export-button` |
| 导出图片... | Cmd+Shift+E | `image-export-button` |
| Find on canvas | Cmd+F | `search-menu-button` |
| 帮助 | ? | `help-menu-item` |
| 重置画布 |  | `clear-canvas-button` |
| **[分隔线]** |  |  |
| **Excalidraw links** (section header) |  |  |
| GitHub |  |  |
| Follow us |  |  |
| Discord chat |  |  |
| **[分隔线]** |  |  |
| **画布背景** (section header) |  |  |
| 色板选择器（7 个色块） |  |  |

### A3. 更多工具 (工具栏右侧 ⋯)

- 画框工具 F (`toolbar-frame`)
- 嵌入网页 (`toolbar-embeddable`)
- 激光笔 K (`toolbar-laser`)
- **[分隔线]**
- **Generate** (section header)
  - Mermaid 至 Excalidraw

### A4. 右键菜单

| 菜单项 | 快捷键 |
|--------|--------|
| 粘贴 | Cmd+V |
| **[分隔线]** |  |
| 复制为 PNG 到剪贴板 | Shift+Option+C |
| 复制为 SVG 到剪贴板 |  |
| **[分隔线]** |  |
| 全部选中 | Cmd+A |
| **[分隔线]** |  |
| Toggle grid | Cmd+' |
| 吸附至对象 | Option+S |
| 禅模式 | Option+Z |
| 查看模式 | Option+R |
| **[分隔线]** |  |
| Canvas & Shape properties | Option+/ |

### A5. 设置面板 (录制设置)

面板结构：`.settings-overlay > .settings-panel > .settings-content`

#### 画面比例

- 按钮: **16:9** / YouTube ✅ 
- 按钮: **4:3** / 经典  
- 按钮: **3:4** / 小红书  
- 按钮: **9:16** / 抖音  
- 按钮: **1:1** / 正方形  
- 按钮: **Custom** / 自定义  

#### 背景

- 按钮: **全部** ✅ 
- 按钮: **鲜艳**  
- 按钮: **柔和**  
- 按钮: **深色**  
- 按钮: **自然**  
- 按钮: **✨ 随机选择壁纸**  
- 壁纸缩略图网格: 4 列，每行 4 张，可滚动
- 当前选中: 第 1 张 (Cotton Candy, 左上角绿色勾)

#### 圆角半径: 16PX

- 滑块 (range): 默认 `16` [0~40]
- 端点标签: 直角 ← → 圆角

#### 摄像头

- 开关: 录制时显示摄像头画面 (toggle, 默认 ON)
- 大小: 180px — 滑块 (range) [100~300], 端点标签: 小 ← → 大
- 形状: **圆形** ✅ / **方形**

#### 画布边距: 80PX

- 滑块 (range): 默认 `80` [0~120]
- 端点标签: 无 ← → 大

#### 鼠标光标效果

- 开关: 录制时显示光标高亮 (toggle, 默认 ON)
- 光标颜色: 7 色圆形选择器 — 红 ✅ / 橙 / 黄 / 绿 / 蓝 / 紫 / 粉

#### 账户

- 按钮: **使用 Google 登录**
- 按钮: **使用邮箱登录**
- 按钮: **去除水印 — $20 一次性付款** (淡黄色背景)

#### Footer

- 按钮: **完成**  

### A6. 右上控制组

| 按钮 | class | 位置 |
|------|-------|------|
| Record | `record-btn` | 74.7188px × 38px |
| Settings | `settings-btn` | 34px × 34px |
| Teleprompter | `teleprompter-btn` | 34px × 34px |
| Hamburger | `hamburger-btn` | 36px × 36px |
| Help | `help-btn` | 36px × 36px |
| AddSlide | `addslide-btn` | 36px × 36px |

### A7. 提词器面板

- 面板 class: `teleprompter  `
- 位置: x=1080, y=80, 340×400px

控件：
- `button` (submit): ×
- `button` (submit): 
- `input` (range): 
- `input` (range): 
- `textarea` (textarea): 在此粘贴你的脚本...

此文本仅对你可见，不会出现在录制中。

### A8. 底部栏

- 缩小
- 重置缩放
- 放大
- 撤销
- 重做
- 帮助
- 退出禅模式

### A9. 帮助面板 / 快捷键


### A10. 幻灯片面板

- 文本: 幻灯片模式创建幻灯片进行分页演示。每张幻灯片是一个固定画框，只有画框内的内容会被录制。
- 按钮: 添加幻灯片 (class: `slide-add-btn entry-point`)

### A11. 属性面板（选中元素后左侧）

*（从截图 zh-19/zh-22 提取）*

| 区域 | 选项 |
|------|------|
| 描边 (Stroke) | 黑/红/绿 + 更多颜色 |
| 背景 (Fill) | 透明/浅色/纯色 |
| 描边宽度 | 细/中/粗 |
| 边框样式 | 实线/虚线/点线 |
| 线条风格 | 曲线/折线/直线 |
| 边角 | 直角/圆角 |
| 透明度 | 滑块 0-100 |
| 图层 | 下移/下移一层/上移一层/上移 |
| 操作 | 复制/删除/链接 |

## B. 交互状态

### B1. 录制流程各状态按钮

#### preview

| 按钮 | class | 背景色 | 文字色 |
|------|-------|--------|--------|
|  | `icon-btn` | `rgba(0, 0, 0, 0)` | `rgb(120, 113, 108)` |
|  | `icon-btn` | `rgb(41, 37, 36)` | `rgb(255, 255, 255)` |
| ✕ 取消 | `control-button` | `rgba(0, 0, 0, 0)` | `rgb(120, 113, 108)` |
| ● 开始录制 | `control-button` | `rgb(21, 128, 61)` | `rgb(255, 255, 255)` |
|  | `dropdown-menu-button` | `rgba(0, 0, 0, 0)` | `rgb(27, 27, 31)` |

#### active

| 按钮 | class | 背景色 | 文字色 |
|------|-------|--------|--------|
|  | `icon-btn` | `rgba(0, 0, 0, 0)` | `rgb(120, 113, 108)` |
|  | `icon-btn` | `rgb(41, 37, 36)` | `rgb(255, 255, 255)` |
|  | `icon-btn` | `rgba(0, 0, 0, 0)` | `rgb(239, 68, 68)` |
| ⏸ 暂停 | `control-button` | `rgb(245, 158, 11)` | `rgb(255, 255, 255)` |
| ■ 停止 | `control-button` | `rgb(68, 64, 60)` | `rgb(255, 255, 255)` |
|  | `dropdown-menu-button` | `rgba(0, 0, 0, 0)` | `rgb(27, 27, 31)` |

录制边框: `rgb(239, 68, 68)` 0px

REC 指示灯: text=`● REC`, bg=`rgb(220, 38, 38)`, animation=`1.5s ease-in-out infinite pulse-badge`

计时器: fontSize=`13px`, class=``

#### paused

| 按钮 | class | 背景色 | 文字色 |
|------|-------|--------|--------|
|  | `icon-btn` | `rgba(0, 0, 0, 0)` | `` |
|  | `icon-btn` | `rgb(41, 37, 36)` | `` |
|  | `icon-btn` | `rgba(0, 0, 0, 0)` | `` |
| ▶ 继续 | `control-button` | `rgb(217, 119, 6)` | `` |
| ■ 停止 | `control-button` | `rgb(68, 64, 60)` | `` |
|  | `dropdown-menu-button` | `rgba(0, 0, 0, 0)` | `` |

### B2. 关键按钮样式

| 按钮 | 背景色 | 文字色 | 圆角 | 尺寸 |
|------|--------|--------|------|------|
| Record | `rgb(220, 38, 38)` | `rgb(255, 255, 255)` | `10px` | 74.7188px×38px |
| Settings | `rgba(0, 0, 0, 0)` | `rgb(120, 113, 108)` | `8px` | 34px×34px |
| Teleprompter | `rgba(0, 0, 0, 0)` | `rgb(120, 113, 108)` | `8px` | 34px×34px |
| Hamburger | `rgb(236, 236, 244)` | `rgb(27, 27, 31)` | `8px` | 36px×36px |
| Help | `rgb(236, 236, 244)` | `rgb(27, 27, 31)` | `8px` | 36px×36px |
| AddSlide | `rgba(0, 0, 0, 0)` | `rgb(168, 162, 158)` | `10px` | 36px×36px |

### B3. 过渡与动画

#### Transitions

- `all`
- `0.15s`
- `transform 0.5s ease-in-out`
- `box-shadow 0.5s ease-in-out`
- `visibility linear, opacity 0.5s`
- `transform 0.2s`

#### Animations

- `slide-strip-enter: 0.25s ease-out 1`
- `popover-enter: 0.3s ease-out 1`

#### Keyframes

- `rotate`: @keyframes rotate { 
  100% { transform: rotate(360deg); }
}...
- `dash`: @keyframes dash { 
  0% { stroke-dasharray: 1, 300; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 150, 300; stroke-d...
- `Modal__background__fade-in`: @keyframes Modal__background__fade-in { 
  0% { opacity: 0; }
  100% { opacity: 1; }
}...
- `Modal__content_fade-in`: @keyframes Modal__content_fade-in { 
  0% { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1...
- `library-unit__adder-animation`: @keyframes library-unit__adder-animation { 
  0% { transform: scale(0.85); }
  50% { transform: scale(1); }
  100% { tra...
- `library-unit__skeleton-opacity-animation`: @keyframes library-unit__skeleton-opacity-animation { 
  0% { opacity: 0; }
  75% { opacity: 0; }
  100% { opacity: 0.5;...
- `successStatusAnimation`: @keyframes successStatusAnimation { 
  0% { transform: scale(0.35); }
  50% { transform: scale(1.25); }
  100% { transfo...
- `speaking-indicator-anim`: @keyframes speaking-indicator-anim { 
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(2); }
}...
- `warning-pulse`: @keyframes warning-pulse { 
  0% { opacity: 1; }
  100% { opacity: 0.6; }
}...
- `pulse`: @keyframes pulse { 
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.9); }
}...
- `checkPop`: @keyframes checkPop { 
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}...
- `fadeIn`: @keyframes fadeIn { 
  0% { opacity: 0; }
  100% { opacity: 1; }
}...
- `slideUp`: @keyframes slideUp { 
  0% { opacity: 0; transform: translateY(20px) scale(0.98); }
  100% { opacity: 1; transform: tran...
- `toast-slide-down`: @keyframes toast-slide-down { 
  0% { opacity: 0; transform: translate(-50%) translateY(-20px); }
  100% { opacity: 1; t...
- `slide-strip-enter`: @keyframes slide-strip-enter { 
  0% { opacity: 0; transform: translateY(-50%) translate(12px); }
  100% { opacity: 1; t...
- `popover-enter`: @keyframes popover-enter { 
  0% { opacity: 0; transform: translateY(-50%) translate(8px); }
  100% { opacity: 1; transf...
- `overlay-fade-in`: @keyframes overlay-fade-in { 
  0% { opacity: 0; }
  100% { opacity: 1; }
}...
- `modal-scale-in`: @keyframes modal-scale-in { 
  0% { opacity: 0; transform: scale(0.95) translateY(10px); }
  100% { opacity: 1; transfor...
- `fade-in`: @keyframes fade-in { 
  0% { opacity: 0; }
  100% { opacity: 1; }
}...
- `spin`: @keyframes spin { 
  100% { transform: rotate(360deg); }
}...

## C. CSS 设计 Token

### C1. CSS 自定义属性

| 变量名 | 值 |
|--------|-----|
| `--color-danger` | `#ef4444` |
| `--color-dark` | `#1a1a2e` |
| `--color-primary` | `#3b82f6` |
| `--sab` | `env(safe-area-inset-bottom)` |
| `--sal` | `env(safe-area-inset-left)` |
| `--sar` | `env(safe-area-inset-right)` |
| `--sat` | `env(safe-area-inset-top)` |
| `--zIndex-canvas` | `1` |
| `--zIndex-canvasButtons` | `3` |
| `--zIndex-eyeDropperBackdrop` | `5` |
| `--zIndex-eyeDropperPreview` | `6` |
| `--zIndex-hyperlinkContainer` | `7` |
| `--zIndex-interactiveCanvas` | `2` |
| `--zIndex-layerUI` | `4` |
| `--zIndex-modal` | `1000` |
| `--zIndex-popup` | `1001` |
| `--zIndex-svgLayer` | `3` |
| `--zIndex-toast` | `999999` |
| `--zIndex-wysiwyg` | `3` |

### C2. 色值表（按使用频率）

| 色值 | 使用次数 |
|------|----------|
| `rgb(27, 27, 31)` | 325 |
| `rgb(0, 0, 0)` | 120 |
| `rgb(184, 184, 184)` | 30 |
| `rgb(120, 113, 108)` | 22 |
| `rgb(3, 0, 100)` | 14 |
| `rgb(236, 236, 244)` | 8 |
| `rgb(168, 162, 158)` | 8 |
| `rgb(255, 255, 255)` | 6 |
| `rgb(250, 250, 249)` | 5 |
| `rgba(16, 16, 16, 0.3)` | 4 |
| `rgb(241, 240, 255)` | 3 |
| `rgb(254, 252, 249)` | 2 |
| `rgba(0, 0, 0, 0.06)` | 2 |
| `rgb(214, 211, 209)` | 2 |
| `rgb(245, 245, 244)` | 1 |
| `rgb(220, 38, 38)` | 1 |
| `rgb(224, 223, 255)` | 1 |
| `rgb(41, 37, 36)` | 1 |
| `rgba(0, 0, 0, 0) rgb(250, 250, 249) rgba(0, 0, 0, 0) rgb(41, 37, 36)` | 1 |

### C3. 关键元素样式

#### body

| 属性 | 值 |
|------|-----|
| fontFamily | `"SF Pro Display", -apple-system, "system-ui", "Segoe UI", Roboto, sans-serif` |
| fontSize | `16px` |
| fontWeight | `400` |
| lineHeight | `24px` |
| color | `rgb(0, 0, 0)` |
| backgroundColor | `rgba(0, 0, 0, 0)` |
| borderRadius | `0px` |
| boxShadow | `none` |
| padding | `0px` |
| margin | `0px` |
| border | `0px none rgb(0, 0, 0)` |
| gap | `normal` |
| width | `1440px` |
| height | `900px` |

#### excalidraw-root

| 属性 | 值 |
|------|-----|
| fontFamily | `Assistant, system-ui, "system-ui", -apple-system, "Segoe UI", Roboto, Helvetica,` |
| fontSize | `16px` |
| fontWeight | `400` |
| lineHeight | `24px` |
| color | `rgb(27, 27, 31)` |
| backgroundColor | `rgba(0, 0, 0, 0)` |
| borderRadius | `0px` |
| boxShadow | `none` |
| padding | `0px` |
| margin | `0px` |
| border | `0px none rgb(27, 27, 31)` |
| gap | `normal` |
| width | `1440px` |
| height | `900px` |

#### toolbar

| 属性 | 值 |
|------|-----|
| fontFamily | `Assistant, system-ui, "system-ui", -apple-system, "Segoe UI", Roboto, Helvetica,` |
| fontSize | `16px` |
| fontWeight | `400` |
| lineHeight | `24px` |
| color | `rgb(27, 27, 31)` |
| backgroundColor | `rgb(255, 255, 255)` |
| borderRadius | `8px` |
| boxShadow | `rgba(0, 0, 0, 0.17) 0px 0px 0.931014px 0px, rgba(0, 0, 0, 0.08) 0px 0px 3.12708p` |
| padding | `4px` |
| margin | `0px` |
| border | `0px none rgb(27, 27, 31)` |
| gap | `normal` |
| width | `550px` |
| height | `44px` |

#### island-panel

| 属性 | 值 |
|------|-----|
| fontFamily | `Assistant, system-ui, "system-ui", -apple-system, "Segoe UI", Roboto, Helvetica,` |
| fontSize | `16px` |
| fontWeight | `400` |
| lineHeight | `24px` |
| color | `rgb(27, 27, 31)` |
| backgroundColor | `rgb(255, 255, 255)` |
| borderRadius | `8px` |
| boxShadow | `rgba(0, 0, 0, 0.17) 0px 0px 0.931014px 0px, rgba(0, 0, 0, 0.08) 0px 0px 3.12708p` |
| padding | `4px` |
| margin | `0px` |
| border | `0px none rgb(27, 27, 31)` |
| gap | `normal` |
| width | `550px` |
| height | `44px` |

#### record-button

| 属性 | 值 |
|------|-----|
| fontFamily | `"DM Sans", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", -apple-system, sans` |
| fontSize | `13px` |
| fontWeight | `600` |
| lineHeight | `normal` |
| color | `rgb(255, 255, 255)` |
| backgroundColor | `rgb(220, 38, 38)` |
| borderRadius | `10px` |
| boxShadow | `rgba(220, 38, 38, 0.3) 0px 2px 8px 0px` |
| padding | `10px 16px` |
| margin | `0px` |
| border | `0px none rgb(255, 255, 255)` |
| gap | `6px` |
| width | `74.7188px` |
| height | `38px` |

#### settings-icon

| 属性 | 值 |
|------|-----|
| fontFamily | `Arial` |
| fontSize | `13.3333px` |
| fontWeight | `400` |
| lineHeight | `normal` |
| color | `rgb(120, 113, 108)` |
| backgroundColor | `rgba(0, 0, 0, 0)` |
| borderRadius | `8px` |
| boxShadow | `none` |
| padding | `8px` |
| margin | `0px` |
| border | `0px none rgb(120, 113, 108)` |
| gap | `normal` |
| width | `34px` |
| height | `34px` |

#### teleprompter-icon

| 属性 | 值 |
|------|-----|
| fontFamily | `Arial` |
| fontSize | `13.3333px` |
| fontWeight | `400` |
| lineHeight | `normal` |
| color | `rgb(120, 113, 108)` |
| backgroundColor | `rgba(0, 0, 0, 0)` |
| borderRadius | `8px` |
| boxShadow | `none` |
| padding | `8px` |
| margin | `0px` |
| border | `0px none rgb(120, 113, 108)` |
| gap | `normal` |
| width | `34px` |
| height | `34px` |

#### hamburger

| 属性 | 值 |
|------|-----|
| fontFamily | `Assistant, system-ui, "system-ui", -apple-system, "Segoe UI", Roboto, Helvetica,` |
| fontSize | `13.3333px` |
| fontWeight | `400` |
| lineHeight | `normal` |
| color | `rgb(27, 27, 31)` |
| backgroundColor | `rgb(236, 236, 244)` |
| borderRadius | `8px` |
| boxShadow | `rgb(255, 255, 255) 0px 0px 0px 1px` |
| padding | `10px` |
| margin | `0px` |
| border | `0px none rgb(27, 27, 31)` |
| gap | `normal` |
| width | `36px` |
| height | `36px` |

#### help-icon

| 属性 | 值 |
|------|-----|
| fontFamily | `Assistant, system-ui, "system-ui", -apple-system, "Segoe UI", Roboto, Helvetica,` |
| fontSize | `13.3333px` |
| fontWeight | `400` |
| lineHeight | `normal` |
| color | `rgb(27, 27, 31)` |
| backgroundColor | `rgb(236, 236, 244)` |
| borderRadius | `8px` |
| boxShadow | `rgb(255, 255, 255) 0px 0px 0px 1px` |
| padding | `10px` |
| margin | `0px` |
| border | `0px none rgb(27, 27, 31)` |
| gap | `normal` |
| width | `36px` |
| height | `36px` |

#### add-slide

| 属性 | 值 |
|------|-----|
| fontFamily | `"DM Sans", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", -apple-system, sans` |
| fontSize | `18px` |
| fontWeight | `400` |
| lineHeight | `normal` |
| color | `rgb(168, 162, 158)` |
| backgroundColor | `rgba(0, 0, 0, 0)` |
| borderRadius | `10px` |
| boxShadow | `none` |
| padding | `0px` |
| margin | `0px` |
| border | `1px dashed rgb(168, 162, 158)` |
| gap | `normal` |
| width | `36px` |
| height | `36px` |

#### footer

| 属性 | 值 |
|------|-----|
| fontFamily | `Assistant, system-ui, "system-ui", -apple-system, "Segoe UI", Roboto, Helvetica,` |
| fontSize | `16px` |
| fontWeight | `400` |
| lineHeight | `24px` |
| color | `rgb(27, 27, 31)` |
| backgroundColor | `rgba(0, 0, 0, 0)` |
| borderRadius | `0px` |
| boxShadow | `none` |
| padding | `0px 16px` |
| margin | `0px` |
| border | `0px none rgb(27, 27, 31)` |
| gap | `normal` |
| width | `1440px` |
| height | `36px` |

### C4. Z-index 层级

| z-index | 元素 |
|---------|------|
| 2000 | `div.recording-controls.` |
| 1000 | `div.webcam-bubble.` |
| 950 | `div.slide-strip` |
| 100 | `div.layer-ui__wrapper__footer-right.zen-mode-transition` |
| 5 | `div.excalidraw-eye-dropper-container` |
| 4 | `div.layer-ui__wrapper` |
| 3 | `div.SVGLayer` |
| 2 | `canvas.excalidraw__canvas.interactive` |
| 1 | `canvas.excalidraw__canvas.static` |
