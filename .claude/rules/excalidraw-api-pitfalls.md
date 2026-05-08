# Excalidraw 0.18 API 限制

| 问题 | 替代方案 |
|------|----------|
| `scrollToContent({ fitToViewport })` 不生效 | 手动计算 zoom/scroll + `updateScene({ appState })` |
| `updateScene({ elements })` 改 frame strokeColor 不重绘 | HTML/CSS overlay div，位置 = `(frame.x + scrollX) * zoom` |
| `updateScene({ elements })` 不能添加新元素 | `api.getSceneElements()` + 过滤 + concat 新元素 |
| `onScrollChange` 不推送初始状态和 updateScene 触发的变更 | updateScene 后手动调用 viewport 回调 |
| `initialData` 只在组件挂载时生效 | 后续变更用 `updateScene` 手动同步 |
| DOM 结构不稳定（两种变体） | CSS 选择器覆盖 `.App-top-bar` 和 `.layer-ui__wrapper` 两种结构 |
